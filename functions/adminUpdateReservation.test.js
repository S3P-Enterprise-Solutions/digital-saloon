import assert from 'node:assert/strict'
import test from 'node:test'

import { initializeApp, getApps } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'

const EMULATOR_HOST = process.env.FIRESTORE_EMULATOR_HOST ?? '127.0.0.1:8180'

async function emulatorReachable() {
  process.env.FIRESTORE_EMULATOR_HOST = EMULATOR_HOST
  process.env.GCLOUD_PROJECT = process.env.GCLOUD_PROJECT ?? 'demo-react-firebase-template'
  if (getApps().length === 0) {
    initializeApp({ projectId: 'demo-react-firebase-template' })
  }
  try {
    await getFirestore().collection('_health').limit(1).get()
    return true
  } catch {
    return false
  }
}

test('admin update changes services and startAt for an active reservation', async (t) => {
  const reachable = await emulatorReachable()
  if (!reachable) {
    t.skip('Firestore emulator not reachable; start with pnpm emulators')
    return
  }

  const { createReservationTransactional, updateReservationTransactional, lockIdForStart } =
    await import('./lib/booking/reservationWrite.js')
  const { seedSalonData, salonSeedConfig } = await import('../scripts/seed-salon-data.mjs')
  const { zonedLocalToUtc } = await import('./lib/domain/timezone.js')

  const db = getFirestore()
  const config = salonSeedConfig()
  await seedSalonData(db, config)

  const servicesSnap = await db
    .collection('salons')
    .doc(config.salonId)
    .collection('services')
    .where('active', '==', true)
    .limit(2)
    .get()
  assert.ok(servicesSnap.size >= 2, 'need at least two active services')
  const [serviceA, serviceB] = servicesSnap.docs

  const startAt = zonedLocalToUtc(2027, 3, 5, 10, 0, config.timezone)
  const created = await createReservationTransactional(
    {
      firstName: 'Edit',
      lastName: 'Me',
      phone: '+43 660 1111111',
      email: null,
      serviceId: serviceA.id,
      serviceIds: [serviceA.id],
      startAt,
      source: 'MANUAL',
      internalNote: null,
      idempotencyKey: `admin-update-${Date.now()}`,
      enforceAdvanceRestrictions: false,
      now: new Date('2026-04-01T08:00:00.000Z'),
    },
    db,
    config.salonId,
  )
  assert.equal(created.ok, true)
  if (!created.ok) return

  const newStart = zonedLocalToUtc(2027, 3, 5, 14, 0, config.timezone)
  const updated = await updateReservationTransactional(
    {
      reservationId: created.reservationId,
      firstName: 'Edited',
      lastName: 'Customer',
      phone: '+43 660 2222222',
      email: 'edited@example.com',
      serviceId: serviceB.id,
      serviceIds: [serviceA.id, serviceB.id],
      startAt: newStart,
      internalNote: 'moved',
      enforceAdvanceRestrictions: false,
      now: new Date('2026-04-01T08:00:00.000Z'),
    },
    db,
    config.salonId,
  )
  assert.equal(updated.ok, true)
  if (!updated.ok) return

  const after = await db
    .collection('salons')
    .doc(config.salonId)
    .collection('reservations')
    .doc(created.reservationId)
    .get()
  const data = after.data()
  assert.equal(data.firstName, 'Edited')
  assert.equal(data.phone, '+43 660 2222222')
  assert.deepEqual(data.serviceIds, [serviceA.id, serviceB.id])
  assert.equal(data.startAt, newStart.toISOString())
  assert.equal(data.internalNote, 'moved')

  const oldLock = await db
    .collection('salons')
    .doc(config.salonId)
    .collection('slotLocks')
    .doc(lockIdForStart(startAt))
    .get()
  const newLock = await db
    .collection('salons')
    .doc(config.salonId)
    .collection('slotLocks')
    .doc(lockIdForStart(newStart))
    .get()
  assert.equal(oldLock.exists, false)
  assert.equal(newLock.exists, true)
  assert.equal(newLock.data()?.reservationId, created.reservationId)
})

test('admin update rejects completed reservations', async (t) => {
  const reachable = await emulatorReachable()
  if (!reachable) {
    t.skip('Firestore emulator not reachable; start with pnpm emulators')
    return
  }

  const { createReservationTransactional, updateReservationTransactional } =
    await import('./lib/booking/reservationWrite.js')
  const { seedSalonData, salonSeedConfig } = await import('../scripts/seed-salon-data.mjs')
  const { zonedLocalToUtc } = await import('./lib/domain/timezone.js')

  const db = getFirestore()
  const config = salonSeedConfig()
  await seedSalonData(db, config)

  const serviceSnap = await db
    .collection('salons')
    .doc(config.salonId)
    .collection('services')
    .where('active', '==', true)
    .limit(1)
    .get()
  const serviceId = serviceSnap.docs[0].id
  const startAt = zonedLocalToUtc(2027, 3, 6, 11, 0, config.timezone)
  const created = await createReservationTransactional(
    {
      firstName: 'Done',
      lastName: 'Already',
      phone: '+43 660 3333333',
      email: null,
      serviceId,
      serviceIds: [serviceId],
      startAt,
      source: 'MANUAL',
      internalNote: null,
      idempotencyKey: `admin-update-done-${Date.now()}`,
      enforceAdvanceRestrictions: false,
      now: new Date('2026-04-01T08:00:00.000Z'),
    },
    db,
    config.salonId,
  )
  assert.equal(created.ok, true)
  if (!created.ok) return

  await db
    .collection('salons')
    .doc(config.salonId)
    .collection('reservations')
    .doc(created.reservationId)
    .update({ status: 'COMPLETED' })

  const updated = await updateReservationTransactional(
    {
      reservationId: created.reservationId,
      firstName: 'Nope',
      lastName: 'Nope',
      phone: '+43 660 3333333',
      email: null,
      serviceId,
      serviceIds: [serviceId],
      startAt,
      internalNote: null,
      enforceAdvanceRestrictions: false,
      now: new Date('2026-04-01T08:00:00.000Z'),
    },
    db,
    config.salonId,
  )
  assert.equal(updated.ok, false)
  if (!updated.ok) assert.equal(updated.code, 'INACTIVE')
})
