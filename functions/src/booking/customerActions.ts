import { getFirestore } from 'firebase-admin/firestore'
import { HttpsError, onCall } from 'firebase-functions/v2/https'

import { functionsRegion, getSalonId } from '../config'
import { isSlotAvailable } from '../domain/availability'
import { isObject } from '../schemas'
import { notifyCustomerCancelled, notifyCustomerRescheduled } from './customerNotify'
import { findReservationByManagementToken, toPublicReservationView } from './findByToken'
import { lockIdForStart } from './reservationWrite'
import { syncReservationToGoogleCalendar } from '../googleCalendar/sync'
import { recordActivityLog } from '../logging/activityLog'
import { loadSalonContext } from './salonContext'

function requireToken(data: Record<string, unknown>): string {
  if (typeof data.token !== 'string' || data.token.trim().length < 16) {
    throw new HttpsError('invalid-argument', 'Valid management token is required.')
  }
  return data.token.trim()
}

const ACTIVE = new Set(['PENDING', 'CONFIRMED'])

export const manageReservation = onCall({ region: functionsRegion }, async (request) => {
  if (!isObject(request.data)) {
    throw new HttpsError('invalid-argument', 'Invalid payload.')
  }
  const token = requireToken(request.data)
  const doc = await findReservationByManagementToken(token)
  if (!doc) {
    throw new HttpsError('not-found', 'Reservation not found or token invalid.')
  }
  await recordActivityLog({
    request,
    action: 'reservation_viewed',
    source: 'server',
    path: '/manage',
    details: { reservationId: doc.id },
  })
  return { reservation: toPublicReservationView(doc) }
})

export const cancelReservation = onCall({ region: functionsRegion }, async (request) => {
  if (!isObject(request.data)) {
    throw new HttpsError('invalid-argument', 'Invalid payload.')
  }
  const token = requireToken(request.data)
  const db = getFirestore()
  const salonId = getSalonId()
  const doc = await findReservationByManagementToken(token, db, salonId)
  if (!doc) {
    throw new HttpsError('not-found', 'Reservation not found or token invalid.')
  }

  const beforeData = doc.data()
  if (!ACTIVE.has(String(beforeData.status))) {
    throw new HttpsError('failed-precondition', 'Reservation cannot be cancelled.')
  }

  const startAt = new Date(String(beforeData.startAt))
  const cancelEmpId = typeof beforeData.employeeId === 'string' ? beforeData.employeeId : null
  const lockRef = db
    .collection('salons')
    .doc(salonId)
    .collection('slotLocks')
    .doc(lockIdForStart(startAt, cancelEmpId))
  const updatedAt = new Date().toISOString()

  await db.runTransaction(async (tx) => {
    const fresh = await tx.get(doc.ref)
    const lockSnap = await tx.get(lockRef)
    if (!fresh.exists) throw new Error('NOT_FOUND')
    const status = String(fresh.data()?.status)
    if (!ACTIVE.has(status)) throw new Error('INACTIVE')
    tx.update(doc.ref, { status: 'CANCELLED', updatedAt })
    if (lockSnap.exists && lockSnap.data()?.reservationId === doc.id) {
      tx.delete(lockRef)
    }
  })

  await syncReservationToGoogleCalendar(doc.id, db, salonId)
  await recordActivityLog({
    request,
    action: 'reservation_cancelled',
    source: 'server',
    path: '/manage',
    details: { reservationId: doc.id },
    db,
    salonId,
  })
  const salon = await loadSalonContext(db, salonId)
  await notifyCustomerCancelled({
    reservationId: doc.id,
    data: beforeData,
    salon,
    managementToken: token,
  })
  const after = await doc.ref.get()
  return {
    reservation: toPublicReservationView({
      id: after.id,
      data: () => after.data()!,
    } as typeof doc),
  }
})

export const rescheduleReservation = onCall({ region: functionsRegion }, async (request) => {
  if (!isObject(request.data)) {
    throw new HttpsError('invalid-argument', 'Invalid payload.')
  }
  const token = requireToken(request.data)
  if (typeof request.data.startAt !== 'string') {
    throw new HttpsError('invalid-argument', 'startAt is required.')
  }
  const newStartAt = new Date(request.data.startAt)
  if (Number.isNaN(newStartAt.getTime())) {
    throw new HttpsError('invalid-argument', 'startAt must be an ISO timestamp.')
  }

  const db = getFirestore()
  const salonId = getSalonId()
  const doc = await findReservationByManagementToken(token, db, salonId)
  if (!doc) {
    throw new HttpsError('not-found', 'Reservation not found or token invalid.')
  }

  const beforeData = doc.data()
  if (!ACTIVE.has(String(beforeData.status))) {
    throw new HttpsError('failed-precondition', 'Reservation cannot be rescheduled.')
  }

  const durationMinutes = Number(beforeData.durationMinutes)
  const newEndAt = new Date(newStartAt.getTime() + durationMinutes * 60_000)
  const oldStartAt = new Date(String(beforeData.startAt))
  const empId =
    typeof beforeData.employeeId === 'string' && beforeData.employeeId.trim()
      ? beforeData.employeeId.trim()
      : null
  const context = await loadSalonContext(db, salonId)
  const now = new Date()
  const oldLockRef = db
    .collection('salons')
    .doc(salonId)
    .collection('slotLocks')
    .doc(lockIdForStart(oldStartAt, empId))
  const newLockRef = db
    .collection('salons')
    .doc(salonId)
    .collection('slotLocks')
    .doc(lockIdForStart(newStartAt, empId))

  try {
    await db.runTransaction(async (tx) => {
      const fresh = await tx.get(doc.ref)
      if (!fresh.exists) throw new Error('NOT_FOUND')
      const freshData = fresh.data()!
      if (!ACTIVE.has(String(freshData.status))) throw new Error('INACTIVE')

      const newLockSnap = await tx.get(newLockRef)
      if (newLockSnap.exists && newLockSnap.data()?.reservationId !== doc.id) {
        throw new Error('UNAVAILABLE')
      }

      const overlapSnap = await tx.get(
        db
          .collection('salons')
          .doc(salonId)
          .collection('reservations')
          .where('startAt', '<', newEndAt.toISOString()),
      )
      const busyFromReservations = overlapSnap.docs
        .filter((item) => {
          if (item.id === doc.id) return false
          const row = item.data()
          if (row.status !== 'PENDING' && row.status !== 'CONFIRMED') return false
          if (empId && row.employeeId && String(row.employeeId) !== empId) return false
          return new Date(String(row.endAt)).getTime() > newStartAt.getTime()
        })
        .map((item) => ({
          startAt: new Date(String(item.data().startAt)),
          endAt: new Date(String(item.data().endAt)),
        }))

      const blocksSnap = await tx.get(
        db
          .collection('salons')
          .doc(salonId)
          .collection('blockedSlots')
          .where('startAt', '<', newEndAt.toISOString()),
      )
      const busyFromBlocks = blocksSnap.docs
        .filter((item) => {
          const row = item.data()
          if (empId && row.employeeId && String(row.employeeId) !== empId) return false
          return new Date(String(row.endAt)).getTime() > newStartAt.getTime()
        })
        .map((item) => ({
          startAt: new Date(String(item.data().startAt)),
          endAt: new Date(String(item.data().endAt)),
        }))

      const oldLockSnap = await tx.get(oldLockRef)

      const available = isSlotAvailable({
        startAt: newStartAt,
        durationMinutes,
        timeZone: context.timeZone,
        weekly: context.weekly,
        holidays: context.holidays,
        dayExceptions: context.dayExceptions,
        busy: [...busyFromReservations, ...busyFromBlocks],
        settings: context.settings,
        now,
        enforceAdvanceRestrictions: true,
      })
      if (!available) throw new Error('UNAVAILABLE')

      const updatedAt = now.toISOString()
      tx.update(doc.ref, {
        startAt: newStartAt.toISOString(),
        endAt: newEndAt.toISOString(),
        updatedAt,
      })

      if (oldLockSnap.exists && oldLockSnap.data()?.reservationId === doc.id) {
        tx.delete(oldLockRef)
      }
      tx.set(newLockRef, {
        reservationId: doc.id,
        startAt: newStartAt.toISOString(),
        endAt: newEndAt.toISOString(),
        createdAt: updatedAt,
      })
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAVAILABLE') {
      throw new HttpsError('failed-precondition', 'New timeslot is not available.')
    }
    if (error instanceof Error && error.message === 'NOT_FOUND') {
      throw new HttpsError('not-found', 'Reservation not found.')
    }
    if (error instanceof Error && error.message === 'INACTIVE') {
      throw new HttpsError('failed-precondition', 'Reservation cannot be rescheduled.')
    }
    throw error
  }

  await syncReservationToGoogleCalendar(doc.id, db, salonId)
  await recordActivityLog({
    request,
    action: 'reservation_rescheduled',
    source: 'server',
    path: '/manage',
    details: { reservationId: doc.id, newStartAt: newStartAt.toISOString() },
    db,
    salonId,
  })
  const after = await doc.ref.get()
  const afterData = after.data() ?? {}
  await notifyCustomerRescheduled({
    reservationId: doc.id,
    before: beforeData,
    after: afterData,
    salon: context,
    managementToken: token,
  })
  return {
    reservation: toPublicReservationView({
      id: after.id,
      data: () => afterData,
    } as typeof doc),
  }
})
