import { getAuth } from 'firebase-admin/auth'
import { getFirestore } from 'firebase-admin/firestore'
import { HttpsError, onCall } from 'firebase-functions/v2/https'

import {
  assertAdmin,
  assertAdminOrEmployeeSelf,
  assertEmployee,
  assertPrimaryAdmin,
} from '../authz'
import { functionsRegion, getSalonId, isEmployeeManagementEnabled } from '../config'
import { assertValidIntervals, type TimeInterval } from '../domain/workingHoursValidation'
import type { Weekday } from '../domain/types'
import { isObject } from '../schemas'
import { assertEmployeeManagementFeatureEnabled } from './users'

const WEEKDAYS = new Set<Weekday>([
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
])

export type BookableEmployeeProjection = {
  id: string
  displayName: string
  serviceIds: string[]
}

function employeesCol() {
  return getFirestore().collection('salons').doc(getSalonId()).collection('employees')
}

function nowIso(): string {
  return new Date().toISOString()
}

function requireString(value: unknown, field: string, max = 80): string {
  if (typeof value !== 'string') {
    throw new HttpsError('invalid-argument', `${field} is required.`)
  }
  const trimmed = value.trim()
  if (!trimmed || trimmed.length > max) {
    throw new HttpsError('invalid-argument', `${field} is invalid.`)
  }
  return trimmed
}

function requireUid(value: unknown, field = 'employeeUid'): string {
  return requireString(value, field, 128)
}

function isWeekday(value: string): value is Weekday {
  return WEEKDAYS.has(value as Weekday)
}

export function isBookableEmployeeRecord(data: Record<string, unknown>): boolean {
  const removedAt = data.removedAt
  const removed = removedAt !== undefined && removedAt !== null && String(removedAt).length > 0
  return data.active === true && data.authDisabled !== true && !removed
}

export function toBookableProjection(
  id: string,
  data: Record<string, unknown>,
): BookableEmployeeProjection {
  const serviceIds = Array.isArray(data.serviceIds)
    ? data.serviceIds.filter((id): id is string => typeof id === 'string')
    : []
  return {
    id,
    displayName: String(data.displayName ?? ''),
    serviceIds,
  }
}

export function filterBookableProjections(
  docs: { id: string; data: Record<string, unknown> }[],
): BookableEmployeeProjection[] {
  return docs
    .filter((doc) => isBookableEmployeeRecord(doc.data))
    .map((doc) => toBookableProjection(doc.id, doc.data))
    .sort((a, b) => a.displayName.localeCompare(b.displayName))
}

export function assertCanSetEmployeeBookable(
  employee: { authDisabled?: unknown },
  active: boolean,
): void {
  if (active && employee.authDisabled === true) {
    throw new HttpsError(
      'failed-precondition',
      'Cannot mark an Auth-disabled employee as bookable.',
    )
  }
}

export function authDisableEmployeePatch(
  at: string,
  removedAt?: string,
): {
  authDisabled: true
  active: false
  updatedAt: string
  removedAt?: string
} {
  return {
    authDisabled: true,
    active: false,
    updatedAt: at,
    ...(removedAt !== undefined ? { removedAt } : {}),
  }
}

export function authEnableEmployeePatch(at: string): {
  authDisabled: false
  updatedAt: string
} {
  return { authDisabled: false, updatedAt: at }
}

function parseIntervals(data: unknown): TimeInterval[] {
  if (!isObject(data) || !Array.isArray(data.intervals)) {
    throw new HttpsError('invalid-argument', 'Invalid intervals payload.')
  }
  const intervals: TimeInterval[] = []
  for (const item of data.intervals) {
    if (!isObject(item) || typeof item.start !== 'string' || typeof item.end !== 'string') {
      throw new HttpsError('invalid-argument', 'Each interval needs start and end.')
    }
    intervals.push({ start: item.start, end: item.end })
  }
  assertValidIntervals(intervals)
  return intervals
}

export const createEmployeeProfileForAdmin = onCall(
  { region: functionsRegion },
  async (request) => {
    await assertAdmin(request)
    assertEmployeeManagementFeatureEnabled()
    if (!isObject(request.data)) {
      throw new HttpsError('invalid-argument', 'Invalid payload.')
    }
    const adminUid = requireUid(request.data.adminUid, 'adminUid')
    const firstName = requireString(request.data.firstName, 'firstName')
    const lastName = requireString(request.data.lastName, 'lastName')
    const displayName = `${firstName} ${lastName}`.trim()

    const db = getFirestore()
    const userSnap = await db.collection('users').doc(adminUid).get()
    if (!userSnap.exists || userSnap.data()?.role !== 'admin') {
      throw new HttpsError('failed-precondition', 'Target user must be an admin.')
    }
    const email = String(userSnap.data()?.email ?? '')
    if (!email) {
      throw new HttpsError('failed-precondition', 'Admin user must have an email.')
    }

    const empRef = employeesCol().doc(adminUid)
    const existing = await empRef.get()
    if (existing.exists) {
      throw new HttpsError('already-exists', 'Employee profile already exists for this user.')
    }

    let authDisabled = false
    try {
      const authUser = await getAuth().getUser(adminUid)
      authDisabled = authUser.disabled === true
    } catch {
      throw new HttpsError('not-found', 'Auth user not found.')
    }

    const createdAt = nowIso()
    await empRef.set({
      firstName,
      lastName,
      displayName,
      email,
      active: !authDisabled,
      authDisabled,
      serviceIds: [],
      createdAt,
      updatedAt: createdAt,
    })

    return { uid: adminUid, displayName, role: 'admin' as const }
  },
)

export const updateEmployeeProfile = onCall({ region: functionsRegion }, async (request) => {
  await assertAdmin(request)
  assertEmployeeManagementFeatureEnabled()
  if (!isObject(request.data)) {
    throw new HttpsError('invalid-argument', 'Invalid payload.')
  }
  const employeeUid = requireUid(request.data.employeeUid)
  const updates: Record<string, unknown> = { updatedAt: nowIso() }

  if (request.data.firstName !== undefined) {
    updates.firstName = requireString(request.data.firstName, 'firstName')
  }
  if (request.data.lastName !== undefined) {
    updates.lastName = requireString(request.data.lastName, 'lastName')
  }
  if (request.data.firstName !== undefined || request.data.lastName !== undefined) {
    const snap = await employeesCol().doc(employeeUid).get()
    const current = snap.data() ?? {}
    const firstName =
      typeof updates.firstName === 'string' ? updates.firstName : String(current.firstName ?? '')
    const lastName =
      typeof updates.lastName === 'string' ? updates.lastName : String(current.lastName ?? '')
    updates.displayName = `${firstName} ${lastName}`.trim()
  }
  if (request.data.photoUrl !== undefined) {
    if (request.data.photoUrl !== null && typeof request.data.photoUrl !== 'string') {
      throw new HttpsError('invalid-argument', 'photoUrl must be a string or null.')
    }
    updates.photoUrl = request.data.photoUrl
  }
  if (request.data.serviceIds !== undefined) {
    if (!Array.isArray(request.data.serviceIds)) {
      throw new HttpsError('invalid-argument', 'serviceIds must be an array.')
    }
    updates.serviceIds = request.data.serviceIds.map((id, index) =>
      requireString(id, `serviceIds[${index}]`, 128),
    )
  }

  if (Object.keys(updates).length === 1) {
    throw new HttpsError('invalid-argument', 'No profile fields to update.')
  }

  const empRef = employeesCol().doc(employeeUid)
  const existing = await empRef.get()
  if (!existing.exists) {
    throw new HttpsError('not-found', 'Employee not found.')
  }
  await empRef.update(updates)
  return { ok: true as const }
})

export const setEmployeeBookable = onCall({ region: functionsRegion }, async (request) => {
  await assertAdmin(request)
  assertEmployeeManagementFeatureEnabled()
  if (!isObject(request.data)) {
    throw new HttpsError('invalid-argument', 'Invalid payload.')
  }
  const employeeUid = requireUid(request.data.employeeUid)
  if (typeof request.data.active !== 'boolean') {
    throw new HttpsError('invalid-argument', 'active must be a boolean.')
  }
  const active = request.data.active

  const empRef = employeesCol().doc(employeeUid)
  const snap = await empRef.get()
  if (!snap.exists) {
    throw new HttpsError('not-found', 'Employee not found.')
  }
  assertCanSetEmployeeBookable(snap.data() ?? {}, active)
  await empRef.update({ active, updatedAt: nowIso() })
  return { ok: true as const, active }
})

export const setEmployeeAuthDisabled = onCall({ region: functionsRegion }, async (request) => {
  await assertPrimaryAdmin(request)
  assertEmployeeManagementFeatureEnabled()
  if (!isObject(request.data)) {
    throw new HttpsError('invalid-argument', 'Invalid payload.')
  }
  const employeeUid = requireUid(request.data.employeeUid)
  if (typeof request.data.disabled !== 'boolean') {
    throw new HttpsError('invalid-argument', 'disabled must be a boolean.')
  }
  const disabled = request.data.disabled

  const empRef = employeesCol().doc(employeeUid)
  const snap = await empRef.get()
  if (!snap.exists) {
    throw new HttpsError('not-found', 'Employee not found.')
  }

  const at = nowIso()
  if (disabled) {
    await getAuth().updateUser(employeeUid, { disabled: true })
    await empRef.update(authDisableEmployeePatch(at))
  } else {
    await getAuth().updateUser(employeeUid, { disabled: false })
    await empRef.update(authEnableEmployeePatch(at))
  }
  return { ok: true as const, disabled }
})

export const setEmployeePassword = onCall({ region: functionsRegion }, async (request) => {
  await assertPrimaryAdmin(request)
  assertEmployeeManagementFeatureEnabled()
  if (!isObject(request.data)) {
    throw new HttpsError('invalid-argument', 'Invalid payload.')
  }
  const employeeUid = requireUid(request.data.employeeUid)
  const password = typeof request.data.password === 'string' ? request.data.password : ''
  if (password.length < 8) {
    throw new HttpsError('invalid-argument', 'Password must be at least 8 characters.')
  }
  await getAuth().updateUser(employeeUid, { password })
  return { ok: true as const }
})

export const softRemoveEmployee = onCall({ region: functionsRegion }, async (request) => {
  await assertPrimaryAdmin(request)
  assertEmployeeManagementFeatureEnabled()
  if (!isObject(request.data)) {
    throw new HttpsError('invalid-argument', 'Invalid payload.')
  }
  const employeeUid = requireUid(request.data.employeeUid)

  const empRef = employeesCol().doc(employeeUid)
  const snap = await empRef.get()
  if (!snap.exists) {
    throw new HttpsError('not-found', 'Employee not found.')
  }

  const at = nowIso()
  await getAuth().updateUser(employeeUid, { disabled: true })
  await empRef.update(authDisableEmployeePatch(at, at))
  return { ok: true as const }
})

export const saveEmployeeWorkingHours = onCall({ region: functionsRegion }, async (request) => {
  if (!isObject(request.data)) {
    throw new HttpsError('invalid-argument', 'Invalid payload.')
  }
  const employeeUid = requireUid(request.data.employeeUid)
  await assertAdminOrEmployeeSelf(request, employeeUid)
  assertEmployeeManagementFeatureEnabled()

  const weekdayRaw = requireString(request.data.weekday, 'weekday', 16)
  if (!isWeekday(weekdayRaw)) {
    throw new HttpsError('invalid-argument', 'Invalid weekday.')
  }
  const intervals = parseIntervals({ intervals: request.data.intervals })

  const empRef = employeesCol().doc(employeeUid)
  if (!(await empRef.get()).exists) {
    throw new HttpsError('not-found', 'Employee not found.')
  }

  await empRef.collection('workingHours').doc(weekdayRaw).set({ intervals })
  return { ok: true as const }
})

export const saveEmployeeDayException = onCall({ region: functionsRegion }, async (request) => {
  if (!isObject(request.data)) {
    throw new HttpsError('invalid-argument', 'Invalid payload.')
  }
  const employeeUid = requireUid(request.data.employeeUid)
  await assertAdminOrEmployeeSelf(request, employeeUid)
  assertEmployeeManagementFeatureEnabled()

  const exceptionId = requireString(request.data.exceptionId, 'exceptionId', 64)
  const date = requireString(request.data.date, 'date', 10)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw new HttpsError('invalid-argument', 'date must be YYYY-MM-DD.')
  }
  if (typeof request.data.closed !== 'boolean') {
    throw new HttpsError('invalid-argument', 'closed must be a boolean.')
  }
  const closed = request.data.closed
  const intervals = closed ? [] : parseIntervals({ intervals: request.data.intervals })

  const empRef = employeesCol().doc(employeeUid)
  if (!(await empRef.get()).exists) {
    throw new HttpsError('not-found', 'Employee not found.')
  }

  await empRef.collection('dayExceptions').doc(exceptionId).set({ date, closed, intervals })
  return { ok: true as const }
})

export const deleteEmployeeDayException = onCall({ region: functionsRegion }, async (request) => {
  if (!isObject(request.data)) {
    throw new HttpsError('invalid-argument', 'Invalid payload.')
  }
  const employeeUid = requireUid(request.data.employeeUid)
  await assertAdminOrEmployeeSelf(request, employeeUid)
  assertEmployeeManagementFeatureEnabled()

  const exceptionId = requireString(request.data.exceptionId, 'exceptionId', 64)

  const empRef = employeesCol().doc(employeeUid)
  if (!(await empRef.get()).exists) {
    throw new HttpsError('not-found', 'Employee not found.')
  }

  await empRef.collection('dayExceptions').doc(exceptionId).delete()
  return { ok: true as const }
})

export const listBookableEmployees = onCall({ region: functionsRegion }, async () => {
  if (!isEmployeeManagementEnabled()) {
    return { employees: [] as BookableEmployeeProjection[] }
  }
  const snap = await employeesCol().get()
  const employees = filterBookableProjections(
    snap.docs.map((doc) => ({ id: doc.id, data: doc.data() as Record<string, unknown> })),
  )
  return { employees }
})

export type EmployeeReservationProjection = {
  id: string
  firstName: string
  lastName: string
  phone: string
  email: string | null
  serviceName: string
  startAt: string
  endAt: string
  status: string
  notes: string | null
}

export function toEmployeeReservationProjection(
  id: string,
  data: Record<string, unknown>,
): EmployeeReservationProjection {
  return {
    id,
    firstName: String(data.firstName ?? ''),
    lastName: String(data.lastName ?? ''),
    phone: String(data.phone ?? ''),
    email: data.email === null || typeof data.email === 'string' ? data.email : null,
    serviceName: String(data.serviceName ?? ''),
    startAt: String(data.startAt ?? ''),
    endAt: String(data.endAt ?? ''),
    status: String(data.status ?? ''),
    notes: data.notes === null || typeof data.notes === 'string' ? data.notes : null,
  }
}

export function filterReservationsForEmployee(
  employeeUid: string,
  docs: { id: string; data: Record<string, unknown> }[],
): EmployeeReservationProjection[] {
  return docs
    .filter((doc) => doc.data.employeeId === employeeUid)
    .map((doc) => toEmployeeReservationProjection(doc.id, doc.data))
    .sort((a, b) => a.startAt.localeCompare(b.startAt))
}

export const listMyEmployeeReservations = onCall({ region: functionsRegion }, async (request) => {
  const employeeUid = await assertEmployee(request)
  assertEmployeeManagementFeatureEnabled()
  if (!isObject(request.data)) {
    throw new HttpsError('invalid-argument', 'Invalid payload.')
  }
  const rangeStartIso = requireString(request.data.rangeStartIso, 'rangeStartIso', 40)
  const rangeEndIso = requireString(request.data.rangeEndIso, 'rangeEndIso', 40)

  const snap = await getFirestore()
    .collection('salons')
    .doc(getSalonId())
    .collection('reservations')
    .where('startAt', '>=', rangeStartIso)
    .where('startAt', '<', rangeEndIso)
    .orderBy('startAt', 'asc')
    .get()

  const reservations = filterReservationsForEmployee(
    employeeUid,
    snap.docs.map((doc) => ({ id: doc.id, data: doc.data() as Record<string, unknown> })),
  )
  return { reservations }
})
