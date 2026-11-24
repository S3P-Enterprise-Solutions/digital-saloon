import { getApps, initializeApp } from 'firebase-admin/app'
import { getFirestore, type Firestore } from 'firebase-admin/firestore'

import { demoProjectId, emulatorHost, emulatorPorts } from '../src/data/emulatorPorts'

let db: Firestore | null = null

/** Admin SDK against the local Firestore emulator (Playwright Node process). */
export function emulatorFirestore(): Firestore {
  process.env.FIRESTORE_EMULATOR_HOST = `${emulatorHost}:${emulatorPorts.firestore}`
  if (!getApps().length) {
    initializeApp({ projectId: demoProjectId })
  }
  if (!db) {
    db = getFirestore()
  }
  return db
}

export const seededBookingSettings = {
  confirmationMode: 'AUTOMATIC',
  slotIntervalMinutes: 15,
  minAdvanceBookingMinutes: 60,
  maxAdvanceBookingDays: 60,
  pendingExpirationHours: 24,
} as const

export const seededSalonDetails = {
  name: 'KIMM Hair',
  address: 'Via Piave 71, 39012 Meran',
  phone: '+39 0473 449267',
  email: 'hello@kimm-hair.local',
  vatId: '01732550213',
} as const

function salonDoc(salonId: string) {
  return emulatorFirestore().collection('salons').doc(salonId)
}

export async function getBookingSettings(salonId = 'pilot'): Promise<Record<string, unknown>> {
  const snap = await salonDoc(salonId).collection('settings').doc('booking').get()
  return snap.data() ?? {}
}

export async function getSalonDetails(salonId = 'pilot'): Promise<Record<string, unknown>> {
  return (await salonDoc(salonId).get()).data() ?? {}
}

/** Restore seeded settings and contact data so later specs see the defaults. */
export async function restoreSeededSettings(salonId = 'pilot'): Promise<void> {
  await salonDoc(salonId).collection('settings').doc('booking').set(seededBookingSettings)
  await salonDoc(salonId).set(seededSalonDetails, { merge: true })
}

export type DemoReservation = {
  id: string
  firstName: string
  lastName: string
  startAt: string
}

/** First seeded demo reservation in the future with the given status. */
export async function findFutureDemoReservation(
  status: 'PENDING' | 'CONFIRMED',
  salonId = 'pilot',
): Promise<DemoReservation> {
  const snap = await emulatorFirestore()
    .collection('salons')
    .doc(salonId)
    .collection('reservations')
    .where('seededDemo', '==', true)
    .where('status', '==', status)
    .get()
  const nowIso = new Date().toISOString()
  const match = snap.docs
    .map((doc) => ({ id: doc.id, ...(doc.data() as Omit<DemoReservation, 'id'>) }))
    .filter((item) => item.startAt > nowIso)
    .sort((a, b) => a.startAt.localeCompare(b.startAt))[0]
  if (!match) throw new Error(`No future ${status} demo reservation seeded`)
  return {
    id: match.id,
    firstName: match.firstName,
    lastName: match.lastName,
    startAt: match.startAt,
  }
}

export async function getReservationStatus(
  reservationId: string,
  salonId = 'pilot',
): Promise<string | null> {
  const snap = await emulatorFirestore()
    .collection('salons')
    .doc(salonId)
    .collection('reservations')
    .doc(reservationId)
    .get()
  if (!snap.exists) return null
  return String(snap.data()?.status ?? '')
}

/** Newest reservation for a customer last name (unique per test run). */
export async function findReservationByLastName(
  lastName: string,
  salonId = 'pilot',
): Promise<DemoReservation & { status: string }> {
  const snap = await emulatorFirestore()
    .collection('salons')
    .doc(salonId)
    .collection('reservations')
    .where('lastName', '==', lastName)
    .get()
  const doc = snap.docs[0]
  if (!doc) throw new Error(`No reservation for ${lastName}`)
  const data = doc.data()
  return {
    id: doc.id,
    firstName: String(data.firstName),
    lastName: String(data.lastName),
    startAt: String(data.startAt),
    status: String(data.status),
  }
}

export type ServiceSnapshot = Map<string, Record<string, unknown>>

function servicesCollection(salonId: string) {
  return emulatorFirestore().collection('salons').doc(salonId).collection('services')
}

/** Current services, to put back after a spec edits them. */
export async function snapshotServices(salonId = 'pilot'): Promise<ServiceSnapshot> {
  const snap = await servicesCollection(salonId).get()
  return new Map(snap.docs.map((doc) => [doc.id, doc.data()]))
}

/** Restores snapshotted services and removes any created since. */
export async function restoreServices(snapshot: ServiceSnapshot, salonId = 'pilot'): Promise<void> {
  const current = await servicesCollection(salonId).get()
  for (const doc of current.docs) {
    const original = snapshot.get(doc.id)
    if (original) await doc.ref.set(original)
    else await doc.ref.delete()
  }
}

export async function getService(
  serviceId: string,
  salonId = 'pilot',
): Promise<Record<string, unknown> | null> {
  const snap = await servicesCollection(salonId).doc(serviceId).get()
  return snap.exists ? (snap.data() ?? null) : null
}

export async function findServiceByName(
  nameDe: string,
  salonId = 'pilot',
): Promise<(Record<string, unknown> & { id: string }) | null> {
  const snap = await servicesCollection(salonId).where('nameDe', '==', nameDe).limit(1).get()
  const doc = snap.docs[0]
  return doc ? { id: doc.id, ...doc.data() } : null
}

/** First future PENDING or CONFIRMED reservation of a single service (ignores multi-service bookings). */
export async function findFutureReservationOfService(
  serviceId: string,
  salonId = 'pilot',
): Promise<DemoReservation & { priceCents: number; serviceName: string }> {
  const snap = await emulatorFirestore()
    .collection('salons')
    .doc(salonId)
    .collection('reservations')
    .where('serviceId', '==', serviceId)
    .get()
  const nowIso = new Date().toISOString()
  const match = snap.docs
    .map((doc) => ({ id: doc.id, ...doc.data() }) as Record<string, unknown> & { id: string })
    .filter((item) => {
      if (String(item.startAt) <= nowIso) return false
      if (item.status !== 'CONFIRMED' && item.status !== 'PENDING') return false
      const serviceIds = Array.isArray(item.serviceIds)
        ? item.serviceIds.map(String)
        : [String(item.serviceId)]
      return serviceIds.length === 1 && serviceIds[0] === serviceId
    })
    .sort((a, b) => {
      const seededDelta = Number(Boolean(b.seededDemo)) - Number(Boolean(a.seededDemo))
      if (seededDelta !== 0) return seededDelta
      return String(a.startAt).localeCompare(String(b.startAt))
    })[0]
  if (!match) throw new Error(`No future single-service reservation for ${serviceId}`)
  return {
    id: match.id,
    firstName: String(match.firstName),
    lastName: String(match.lastName),
    startAt: String(match.startAt),
    priceCents: Number(match.priceCents),
    serviceName: String(match.serviceName),
  }
}

export async function getReservation(
  reservationId: string,
  salonId = 'pilot',
): Promise<Record<string, unknown> | null> {
  const snap = await emulatorFirestore()
    .collection('salons')
    .doc(salonId)
    .collection('reservations')
    .doc(reservationId)
    .get()
  return snap.exists ? (snap.data() ?? null) : null
}
