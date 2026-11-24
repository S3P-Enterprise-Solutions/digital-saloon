import { getFirestore } from 'firebase-admin/firestore'
import { onCall } from 'firebase-functions/v2/https'
import { onSchedule } from 'firebase-functions/v2/scheduler'

import { assertAdmin } from '../authz'
import { functionsRegion, getSalonId } from '../config'
import { lockIdForStart } from './reservationWrite'
import { syncReservationToGoogleCalendar } from '../googleCalendar/sync'
import { loadSalonContext } from './salonContext'

export async function processPendingReservationsOnce(input?: {
  salonId?: string
  now?: Date
  limit?: number
}): Promise<{ expired: number; scanned: number }> {
  const db = getFirestore()
  const salonId = input?.salonId ?? getSalonId()
  const now = input?.now ?? new Date()
  const context = await loadSalonContext(db, salonId)
  const cutoffMs = context.settings.pendingExpirationHours * 60 * 60 * 1000
  const cutoffIso = new Date(now.getTime() - cutoffMs).toISOString()
  const limit = input?.limit ?? 50

  const snap = await db
    .collection('salons')
    .doc(salonId)
    .collection('reservations')
    .where('status', '==', 'PENDING')
    .where('createdAt', '<=', cutoffIso)
    .limit(limit)
    .get()

  let expired = 0

  for (const doc of snap.docs) {
    const data = doc.data()
    const startAt = new Date(String(data.startAt))
    const empId = typeof data.employeeId === 'string' ? data.employeeId : null
    const lockRef = db
      .collection('salons')
      .doc(salonId)
      .collection('slotLocks')
      .doc(lockIdForStart(startAt, empId))

    const didExpire = await db.runTransaction(async (tx) => {
      const fresh = await tx.get(doc.ref)
      if (!fresh.exists) return false
      const data = fresh.data()!
      if (String(data.status) !== 'PENDING') return false
      if (String(data.createdAt) > cutoffIso) return false

      const lockSnap = await tx.get(lockRef)
      const updatedAt = now.toISOString()
      tx.update(doc.ref, { status: 'EXPIRED', updatedAt })
      if (lockSnap.exists && lockSnap.data()?.reservationId === doc.id) {
        tx.delete(lockRef)
      }
      return true
    })

    if (didExpire) {
      expired += 1
      await syncReservationToGoogleCalendar(doc.id, db, salonId)
    }
  }

  return { expired, scanned: snap.size }
}

export const processPendingReservations = onCall({ region: functionsRegion }, async (request) => {
  await assertAdmin(request)
  return processPendingReservationsOnce()
})

export const processPendingReservationsSchedule = onSchedule(
  { region: functionsRegion, schedule: 'every 5 minutes' },
  async () => {
    await processPendingReservationsOnce()
  },
)
