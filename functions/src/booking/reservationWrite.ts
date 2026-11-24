import { randomBytes } from 'node:crypto'

import { getFirestore, type Firestore } from 'firebase-admin/firestore'

import { isSlotAvailable, listAvailableSlots } from '../domain/availability'
import {
  loadActiveEmployees,
  loadBusyIntervals,
  loadSalonContext,
  type ActiveEmployee,
  type SalonContext,
} from './salonContext'
import { hashManagementToken } from './tokens'

export type CreateReservationInput = {
  firstName: string
  lastName: string
  phone: string
  email: string | null
  notes?: string | null
  serviceId: string
  serviceIds?: string[]
  employeeId?: string | null
  startAt: Date
  source: 'ONLINE' | 'MANUAL'
  internalNote: string | null
  idempotencyKey: string | null
  /** Manual bookings set this false; online bookings keep true. */
  enforceAdvanceRestrictions: boolean
  now?: Date
}

export type CreateReservationResult =
  | {
      ok: true
      reservationId: string
      status: 'PENDING' | 'CONFIRMED'
      managementToken: string | null
      reused: boolean
      serviceName?: string
      durationMinutes?: number
      timeZone?: string
      salonName?: string
      salonAddress?: string
      salonPhone?: string
    }
  | { ok: false; code: 'UNAVAILABLE' | 'SERVICE_INACTIVE' | 'NOT_FOUND'; message: string }

export function lockIdForStart(startAt: Date, employeeId?: string | null): string {
  const base = startAt.toISOString().replace(/[:.]/g, '-')
  return employeeId ? `${employeeId}_${base}` : base
}

/** Snapshot label for a booking: bilingual when DE/IT differ, with legacy `name` fallback. */
function bilingualLabel(service: Record<string, unknown>): string {
  const nameDe = String(service.nameDe ?? '').trim()
  const nameIt = String(service.nameIt ?? '').trim()
  if (nameDe && nameIt && nameDe !== nameIt) return `${nameDe} / ${nameIt}`
  if (nameDe || nameIt) return nameDe || nameIt
  return String(service.name ?? '').trim()
}

type ResolvedBookingServices =
  | {
      ok: true
      serviceIds: string[]
      serviceName: string
      durationMinutes: number
      priceCents: number
    }
  | { ok: false; code: 'NOT_FOUND' | 'SERVICE_INACTIVE'; message: string }

export const MAX_BOOKING_SERVICES = 15

async function loadActiveServicesForBooking(
  db: Firestore,
  salonId: string,
  rawIds: string[],
): Promise<ResolvedBookingServices> {
  const uniqueIds = Array.from(new Set(rawIds.map((id) => id.trim()).filter(Boolean)))
  if (uniqueIds.length === 0) {
    return { ok: false, code: 'NOT_FOUND', message: 'Service not found.' }
  }
  if (uniqueIds.length > MAX_BOOKING_SERVICES) {
    return {
      ok: false,
      code: 'NOT_FOUND',
      message: `At most ${MAX_BOOKING_SERVICES} services can be booked at once.`,
    }
  }

  const snaps = await Promise.all(
    uniqueIds.map((id) =>
      db.collection('salons').doc(salonId).collection('services').doc(id).get(),
    ),
  )

  let durationMinutes = 0
  let priceCents = 0
  const labels: string[] = []

  for (const snap of snaps) {
    if (!snap.exists) {
      return { ok: false, code: 'NOT_FOUND', message: 'Service not found.' }
    }
    const data = snap.data()!
    if (!data.active) {
      return { ok: false, code: 'SERVICE_INACTIVE', message: 'Service is not active.' }
    }
    const minDuration = Number(data.durationMinutes)
    const maxDuration = Number(data.durationMaxMinutes ?? minDuration)
    durationMinutes += Math.max(minDuration, maxDuration)
    priceCents += Number(data.priceCents)
    labels.push(bilingualLabel(data))
  }

  return {
    ok: true,
    serviceIds: uniqueIds,
    serviceName: labels.join(' + '),
    durationMinutes,
    priceCents,
  }
}

/**
 * Transactional create shared by online and manual booking.
 * Revalidates availability inside the transaction and takes a slot lock
 * so concurrent overlapping creates cannot both succeed.
 */
export async function createReservationTransactional(
  input: CreateReservationInput,
  db: Firestore = getFirestore(),
  salonId?: string,
): Promise<CreateReservationResult> {
  const context = await loadSalonContext(db, salonId)
  const now = input.now ?? new Date()
  const requestedServiceIds =
    input.serviceIds && input.serviceIds.length > 0 ? input.serviceIds : [input.serviceId]
  const resolvedServices = await loadActiveServicesForBooking(
    db,
    context.salonId,
    requestedServiceIds,
  )

  if (!resolvedServices.ok) {
    return resolvedServices
  }

  const { durationMinutes, priceCents, serviceName, serviceIds } = resolvedServices
  const endAt = new Date(input.startAt.getTime() + durationMinutes * 60_000)

  if (input.idempotencyKey) {
    const existing = await db
      .collection('salons')
      .doc(context.salonId)
      .collection('reservations')
      .where('idempotencyKey', '==', input.idempotencyKey)
      .limit(1)
      .get()
    if (!existing.empty) {
      const doc = existing.docs[0]
      return {
        ok: true,
        reservationId: doc.id,
        status: doc.data().status === 'PENDING' ? 'PENDING' : 'CONFIRMED',
        managementToken: null,
        reused: true,
      }
    }
  }

  const activeEmployees = await loadActiveEmployees(db, context.salonId)
  const requestedEmployeeId =
    typeof input.employeeId === 'string' && input.employeeId.trim() ? input.employeeId.trim() : null

  let candidateEmployees: Array<ActiveEmployee | null>
  if (requestedEmployeeId) {
    const matched = activeEmployees.find((emp) => emp.id === requestedEmployeeId)
    if (!matched) {
      return { ok: false, code: 'NOT_FOUND', message: 'Selected employee not found.' }
    }
    candidateEmployees = [matched]
  } else if (activeEmployees.length > 0) {
    candidateEmployees = activeEmployees
  } else {
    candidateEmployees = [null]
  }

  const reservationRef = db
    .collection('salons')
    .doc(context.salonId)
    .collection('reservations')
    .doc()
  const slotLocksCol = db.collection('salons').doc(context.salonId).collection('slotLocks')

  const managementToken = randomBytes(32).toString('base64url')
  const managementTokenHash = hashManagementToken(managementToken)
  const status =
    input.source === 'MANUAL' || context.settings.confirmationMode === 'AUTOMATIC'
      ? 'CONFIRMED'
      : 'PENDING'
  const createdAt = now.toISOString()

  try {
    await db.runTransaction(async (tx) => {
      const lockRefs = candidateEmployees.map((emp) =>
        slotLocksCol.doc(lockIdForStart(input.startAt, emp?.id ?? null)),
      )
      const lockSnaps = await Promise.all(lockRefs.map((ref) => tx.get(ref)))

      // Re-read blocking reservations overlapping this window inside the transaction.
      const overlapQuery = db
        .collection('salons')
        .doc(context.salonId)
        .collection('reservations')
        .where('startAt', '<', endAt.toISOString())
      const overlapSnap = await tx.get(overlapQuery)
      const overlappingReservations = overlapSnap.docs
        .filter((doc) => {
          const data = doc.data()
          if (data.status !== 'PENDING' && data.status !== 'CONFIRMED') return false
          const existingEnd = new Date(String(data.endAt))
          return existingEnd.getTime() > input.startAt.getTime()
        })
        .map((doc) => ({
          employeeId: typeof doc.data().employeeId === 'string' ? doc.data().employeeId : null,
          startAt: new Date(String(doc.data().startAt)),
          endAt: new Date(String(doc.data().endAt)),
        }))

      const blocksSnap = await tx.get(
        db
          .collection('salons')
          .doc(context.salonId)
          .collection('blockedSlots')
          .where('startAt', '<', endAt.toISOString()),
      )
      const overlappingBlocks = blocksSnap.docs
        .filter((doc) => new Date(String(doc.data().endAt)).getTime() > input.startAt.getTime())
        .map((doc) => ({
          employeeId: typeof doc.data().employeeId === 'string' ? doc.data().employeeId : null,
          startAt: new Date(String(doc.data().startAt)),
          endAt: new Date(String(doc.data().endAt)),
        }))

      let chosenEmployee: ActiveEmployee | null = null
      let chosenLockRef = lockRefs[0]
      let foundAvailable = false

      for (let i = 0; i < candidateEmployees.length; i += 1) {
        if (lockSnaps[i].exists) continue
        const candidate = candidateEmployees[i]
        const empId = candidate?.id ?? null
        const busy = [
          ...overlappingReservations.filter(
            (r) => !empId || !r.employeeId || r.employeeId === empId,
          ),
          ...overlappingBlocks.filter((b) => !empId || !b.employeeId || b.employeeId === empId),
        ].map((item) => ({ startAt: item.startAt, endAt: item.endAt }))

        const available = isSlotAvailable({
          startAt: input.startAt,
          durationMinutes,
          timeZone: context.timeZone,
          weekly: context.weekly,
          holidays: context.holidays,
          dayExceptions: context.dayExceptions,
          busy,
          settings: context.settings,
          now,
          enforceAdvanceRestrictions: input.enforceAdvanceRestrictions,
        })
        if (available) {
          chosenEmployee = candidate
          chosenLockRef = lockRefs[i]
          foundAvailable = true
          break
        }
      }

      if (!foundAvailable) {
        throw new Error('UNAVAILABLE')
      }

      tx.set(chosenLockRef, {
        reservationId: reservationRef.id,
        employeeId: chosenEmployee?.id ?? null,
        startAt: input.startAt.toISOString(),
        endAt: endAt.toISOString(),
        createdAt,
      })

      tx.set(reservationRef, {
        firstName: input.firstName,
        lastName: input.lastName,
        phone: input.phone,
        email: input.email,
        notes: input.notes ?? null,
        serviceId: serviceIds[0],
        serviceIds,
        serviceName,
        durationMinutes,
        priceCents,
        employeeId: chosenEmployee?.id ?? null,
        employeeName: chosenEmployee?.displayName ?? null,
        startAt: input.startAt.toISOString(),
        endAt: endAt.toISOString(),
        status,
        source: input.source,
        managementTokenHash,
        internalNote: input.internalNote,
        idempotencyKey: input.idempotencyKey,
        createdAt,
        updatedAt: createdAt,
      })
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAVAILABLE') {
      return { ok: false, code: 'UNAVAILABLE', message: 'Timeslot is not available.' }
    }
    throw error
  }

  return {
    ok: true,
    reservationId: reservationRef.id,
    status,
    managementToken,
    reused: false,
    serviceName,
    durationMinutes,
    timeZone: context.timeZone,
    salonName: context.salonName,
    salonAddress: context.salonAddress,
    salonPhone: context.salonPhone,
  }
}

export async function previewAvailableSlots(input: {
  serviceId?: string
  serviceIds?: string[]
  employeeId?: string | null
  fromDateYmd: string
  toDateYmd: string
  now?: Date
  db?: Firestore
  salonId?: string
  context?: SalonContext
  enforceAdvanceRestrictions?: boolean
  /**
   * Moving an existing booking: use its stored duration (the service may have
   * changed or been deactivated since) and ignore its own time as busy.
   */
  reschedule?: { reservationId: string; durationMinutes: number }
}): Promise<{ startAt: string; endAt: string }[]> {
  const db = input.db ?? getFirestore()
  const context = input.context ?? (await loadSalonContext(db, input.salonId))
  let durationMinutes: number
  if (input.reschedule) {
    durationMinutes = input.reschedule.durationMinutes
  } else {
    const requestedIds =
      input.serviceIds && input.serviceIds.length > 0
        ? input.serviceIds
        : input.serviceId
          ? [input.serviceId]
          : []
    const resolved = await loadActiveServicesForBooking(db, context.salonId, requestedIds)
    if (!resolved.ok) {
      return []
    }
    durationMinutes = resolved.durationMinutes
  }
  const rangeStart = new Date(`${input.fromDateYmd}T00:00:00.000Z`)
  const rangeEnd = new Date(`${input.toDateYmd}T23:59:59.999Z`)
  const activeEmployees = await loadActiveEmployees(db, context.salonId)
  const requestedEmployeeId =
    typeof input.employeeId === 'string' && input.employeeId.trim() ? input.employeeId.trim() : null

  const employeeIdsToCheck: Array<string | null> = requestedEmployeeId
    ? [requestedEmployeeId]
    : activeEmployees.length > 0
      ? activeEmployees.map((emp) => emp.id)
      : [null]

  const slotMap = new Map<string, { startAt: string; endAt: string }>()
  for (const empId of employeeIdsToCheck) {
    const busy = await loadBusyIntervals(
      db,
      context.salonId,
      rangeStart,
      rangeEnd,
      input.reschedule?.reservationId,
      empId,
    )
    const slots = listAvailableSlots({
      timeZone: context.timeZone,
      weekly: context.weekly,
      holidays: context.holidays,
      dayExceptions: context.dayExceptions,
      busy,
      durationMinutes,
      settings: context.settings,
      now: input.now ?? new Date(),
      fromDateYmd: input.fromDateYmd,
      toDateYmd: input.toDateYmd,
      enforceAdvanceRestrictions: input.enforceAdvanceRestrictions !== false,
    })
    for (const slot of slots) {
      const startIso = slot.startAt.toISOString()
      if (!slotMap.has(startIso)) {
        slotMap.set(startIso, { startAt: startIso, endAt: slot.endAt.toISOString() })
      }
    }
  }

  return Array.from(slotMap.values()).sort((a, b) => a.startAt.localeCompare(b.startAt))
}
