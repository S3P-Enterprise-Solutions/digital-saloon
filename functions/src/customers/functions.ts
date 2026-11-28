import { getFirestore } from 'firebase-admin/firestore'
import { HttpsError, onCall } from 'firebase-functions/v2/https'

import { assertAdmin } from '../authz'
import { functionsRegion, getSalonId } from '../config'
import { isObject } from '../schemas'
import {
  doesCalendarTitleMatchCustomer,
  nameOrderInsensitiveKey,
  normalizeCustomerEmail,
  normalizeCustomerName,
} from './matching'
import { customersCollection, type CustomerDoc, type CustomerWithId } from './store'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function toCustomerWithId(id: string, data: FirebaseFirestore.DocumentData): CustomerWithId {
  const firstName = String(data.firstName ?? '')
  const lastName = String(data.lastName ?? '')
  const normalizedFullName =
    typeof data.normalizedFullName === 'string' && data.normalizedFullName
      ? data.normalizedFullName
      : normalizeCustomerName(firstName, lastName)
  return {
    id,
    firstName,
    lastName,
    normalizedFullName,
    nameKey:
      typeof data.nameKey === 'string' && data.nameKey
        ? data.nameKey
        : nameOrderInsensitiveKey(normalizedFullName),
    email: typeof data.email === 'string' && data.email.trim() ? data.email.trim() : null,
    phone: typeof data.phone === 'string' && data.phone.trim() ? data.phone.trim() : null,
    stylistNotes:
      typeof data.stylistNotes === 'string' && data.stylistNotes.trim()
        ? data.stylistNotes.trim()
        : null,
    source:
      data.source === 'ONLINE' || data.source === 'MANUAL' || data.source === 'GOOGLE_CALENDAR'
        ? data.source
        : 'MANUAL',
    visitCount: typeof data.visitCount === 'number' ? data.visitCount : 0,
    lastVisitAt: typeof data.lastVisitAt === 'string' ? data.lastVisitAt : null,
    archived: Boolean(data.archived),
    createdAt: String(data.createdAt ?? ''),
    updatedAt: String(data.updatedAt ?? ''),
  }
}

export type CustomerHistoryItem =
  | {
      kind: 'reservation'
      id: string
      reservationId: string
      startAt: string
      endAt: string
      durationMinutes: number
      serviceName: string
      status: string
      employeeName: string | null
      notes: string | null
      internalNote: string | null
    }
  | {
      kind: 'googleCalendar'
      id: string
      startAt: string
      endAt: string
      durationMinutes: number
      title: string
      description: string | null
      employeeId: string | null
    }

function minutesBetween(startAt: string, endAt: string): number {
  const diff = new Date(endAt).getTime() - new Date(startAt).getTime()
  if (!Number.isFinite(diff) || diff <= 0) return 0
  return Math.round(diff / 60_000)
}

export const listCustomers = onCall({ region: functionsRegion }, async (request) => {
  await assertAdmin(request)
  const search =
    isObject(request.data) && typeof request.data.search === 'string'
      ? request.data.search.trim().toLowerCase()
      : ''

  const db = getFirestore()
  const salonId = getSalonId()
  const snap = await customersCollection(db, salonId).get()

  let customers = snap.docs
    .map((doc) => toCustomerWithId(doc.id, doc.data()))
    .filter((customer) => !customer.archived)

  if (search) {
    customers = customers.filter(
      (customer) =>
        customer.normalizedFullName.includes(search) ||
        (customer.email?.toLowerCase().includes(search) ?? false) ||
        (customer.phone?.toLowerCase().includes(search) ?? false) ||
        (customer.stylistNotes?.toLowerCase().includes(search) ?? false),
    )
  }

  customers.sort((a, b) => {
    const aTime = a.lastVisitAt ? new Date(a.lastVisitAt).getTime() : 0
    const bTime = b.lastVisitAt ? new Date(b.lastVisitAt).getTime() : 0
    if (bTime !== aTime) return bTime - aTime
    return a.normalizedFullName.localeCompare(b.normalizedFullName)
  })

  return { customers }
})

async function loadCustomerHistory(
  db: FirebaseFirestore.Firestore,
  salonId: string,
  target: {
    customerId: string | null
    firstName: string
    lastName: string
    email: string | null
    nameKey: string
    excludeReservationId?: string | null
  },
): Promise<CustomerHistoryItem[]> {
  const [resSnap, blocksSnap] = await Promise.all([
    db.collection('salons').doc(salonId).collection('reservations').get(),
    db
      .collection('salons')
      .doc(salonId)
      .collection('blockedSlots')
      .where('source', '==', 'GOOGLE_CALENDAR')
      .get(),
  ])

  const history: CustomerHistoryItem[] = []
  for (const doc of resSnap.docs) {
    if (target.excludeReservationId && doc.id === target.excludeReservationId) continue
    const data = doc.data()
    const matchesId = Boolean(target.customerId && data.customerId === target.customerId)
    const resEmail = normalizeCustomerEmail(typeof data.email === 'string' ? data.email : null)
    const matchesEmail = Boolean(target.email && resEmail && resEmail === target.email)
    const resNameKey = nameOrderInsensitiveKey(
      normalizeCustomerName(String(data.firstName ?? ''), String(data.lastName ?? '')),
    )
    const matchesName = Boolean(target.nameKey && resNameKey === target.nameKey)
    if (!matchesId && !matchesEmail && !matchesName) continue

    const startAt = String(data.startAt ?? '')
    const endAt = String(data.endAt ?? '')
    history.push({
      kind: 'reservation',
      id: `res:${doc.id}`,
      reservationId: doc.id,
      startAt,
      endAt,
      durationMinutes:
        typeof data.durationMinutes === 'number'
          ? data.durationMinutes
          : minutesBetween(startAt, endAt),
      serviceName: String(data.serviceName ?? ''),
      status: String(data.status ?? ''),
      employeeName: typeof data.employeeName === 'string' ? data.employeeName : null,
      notes: typeof data.notes === 'string' ? data.notes : null,
      internalNote: typeof data.internalNote === 'string' ? data.internalNote : null,
    })
  }

  // Strictly exclude private Google Calendar events from customer history.
  for (const doc of blocksSnap.docs) {
    const data = doc.data()
    if (data.isPrivate === true || data.allDay === true) continue
    const title = typeof data.title === 'string' ? data.title : ''
    if (!doesCalendarTitleMatchCustomer(title, target.firstName, target.lastName)) continue

    const startAt = String(data.startAt ?? '')
    const endAt = String(data.endAt ?? '')
    history.push({
      kind: 'googleCalendar',
      id: `gcal:${doc.id}`,
      startAt,
      endAt,
      durationMinutes: minutesBetween(startAt, endAt),
      title,
      description: typeof data.description === 'string' ? data.description : null,
      employeeId: typeof data.employeeId === 'string' ? data.employeeId : null,
    })
  }

  history.sort((a, b) => new Date(b.startAt).getTime() - new Date(a.startAt).getTime())
  return history
}

export const getCustomerDetail = onCall({ region: functionsRegion }, async (request) => {
  await assertAdmin(request)
  if (!isObject(request.data) || typeof request.data.customerId !== 'string') {
    throw new HttpsError('invalid-argument', 'customerId is required.')
  }
  const customerId = request.data.customerId.trim()
  if (!customerId) {
    throw new HttpsError('invalid-argument', 'customerId is required.')
  }

  const db = getFirestore()
  const salonId = getSalonId()
  const customerSnap = await customersCollection(db, salonId).doc(customerId).get()
  if (!customerSnap.exists) {
    throw new HttpsError('not-found', 'Customer not found.')
  }

  const customer = toCustomerWithId(customerSnap.id, customerSnap.data()!)
  const history = await loadCustomerHistory(db, salonId, {
    customerId: customer.id,
    firstName: customer.firstName,
    lastName: customer.lastName,
    email: customer.email,
    nameKey: customer.nameKey,
  })

  return { customer, history }
})

export const lookupCustomerContext = onCall({ region: functionsRegion }, async (request) => {
  await assertAdmin(request)
  if (!isObject(request.data)) {
    throw new HttpsError('invalid-argument', 'Invalid payload.')
  }

  const customerId =
    typeof request.data.customerId === 'string' && request.data.customerId.trim()
      ? request.data.customerId.trim()
      : null
  const firstName = typeof request.data.firstName === 'string' ? request.data.firstName.trim() : ''
  const lastName = typeof request.data.lastName === 'string' ? request.data.lastName.trim() : ''
  const email = normalizeCustomerEmail(
    typeof request.data.email === 'string' ? request.data.email : null,
  )
  const excludeReservationId =
    typeof request.data.excludeReservationId === 'string' &&
    request.data.excludeReservationId.trim()
      ? request.data.excludeReservationId.trim()
      : null

  const db = getFirestore()
  const salonId = getSalonId()
  const col = customersCollection(db, salonId)

  let customer: CustomerWithId | null = null
  if (customerId) {
    const snap = await col.doc(customerId).get()
    if (snap.exists && snap.data()?.archived !== true) {
      customer = toCustomerWithId(snap.id, snap.data()!)
    }
  }
  if (!customer && email) {
    const byEmail = await col.where('email', '==', email).limit(1).get()
    if (!byEmail.empty && byEmail.docs[0]!.data().archived !== true) {
      customer = toCustomerWithId(byEmail.docs[0]!.id, byEmail.docs[0]!.data())
    }
  }
  const inputNameKey = nameOrderInsensitiveKey(normalizeCustomerName(firstName, lastName))
  if (!customer && inputNameKey.length >= 2) {
    const byName = await col.where('nameKey', '==', inputNameKey).limit(3).get()
    const match = byName.docs.find((doc) => doc.data().archived !== true)
    if (match) {
      customer = toCustomerWithId(match.id, match.data())
    }
  }

  const effectiveFirstName = customer?.firstName ?? firstName
  const effectiveLastName = customer?.lastName ?? lastName
  const effectiveEmail = customer?.email ?? email
  const effectiveNameKey =
    customer?.nameKey ??
    nameOrderInsensitiveKey(normalizeCustomerName(effectiveFirstName, effectiveLastName))

  if (!customer && !effectiveEmail && effectiveNameKey.length < 2) {
    return { customer: null, history: [] as CustomerHistoryItem[] }
  }

  const history = await loadCustomerHistory(db, salonId, {
    customerId: customer?.id ?? null,
    firstName: effectiveFirstName,
    lastName: effectiveLastName,
    email: effectiveEmail,
    nameKey: effectiveNameKey,
    excludeReservationId,
  })

  return { customer, history }
})

export const saveCustomer = onCall({ region: functionsRegion }, async (request) => {
  await assertAdmin(request)
  if (!isObject(request.data)) {
    throw new HttpsError('invalid-argument', 'Invalid payload.')
  }

  const customerId =
    typeof request.data.customerId === 'string' && request.data.customerId.trim()
      ? request.data.customerId.trim()
      : null
  const firstName = typeof request.data.firstName === 'string' ? request.data.firstName.trim() : ''
  const lastName = typeof request.data.lastName === 'string' ? request.data.lastName.trim() : ''

  if (!firstName || firstName.length > 80) {
    throw new HttpsError('invalid-argument', 'firstName is required (max 80 chars).')
  }
  if (lastName.length > 80) {
    throw new HttpsError('invalid-argument', 'lastName must be at most 80 chars.')
  }

  const email = normalizeCustomerEmail(
    typeof request.data.email === 'string' ? request.data.email : null,
  )
  if (email && (email.length > 254 || !EMAIL_PATTERN.test(email))) {
    throw new HttpsError('invalid-argument', 'email must be a valid email address.')
  }

  const phone =
    typeof request.data.phone === 'string' && request.data.phone.trim()
      ? request.data.phone.trim().slice(0, 40)
      : null

  const stylistNotes =
    typeof request.data.stylistNotes === 'string' && request.data.stylistNotes.trim()
      ? request.data.stylistNotes.trim().slice(0, 4000)
      : null

  const db = getFirestore()
  const salonId = getSalonId()
  const col = customersCollection(db, salonId)

  if (email) {
    const dupSnap = await col.where('email', '==', email).limit(2).get()
    const conflict = dupSnap.docs.find(
      (doc) => doc.id !== customerId && doc.data().archived !== true,
    )
    if (conflict) {
      throw new HttpsError('already-exists', 'A customer with this email address already exists.')
    }
  }

  const normalizedFullName = normalizeCustomerName(firstName, lastName)
  const nameKey = nameOrderInsensitiveKey(normalizedFullName)
  const nowIso = new Date().toISOString()

  if (customerId) {
    const ref = col.doc(customerId)
    const existing = await ref.get()
    if (!existing.exists) {
      throw new HttpsError('not-found', 'Customer not found.')
    }
    await ref.update({
      firstName,
      lastName,
      normalizedFullName,
      nameKey,
      email,
      phone,
      stylistNotes,
      updatedAt: nowIso,
    })
    const after = await ref.get()
    return { customer: toCustomerWithId(after.id, after.data()!) }
  }

  const ref = col.doc()
  const doc: CustomerDoc = {
    firstName,
    lastName,
    normalizedFullName,
    nameKey,
    email,
    phone,
    stylistNotes,
    source: 'MANUAL',
    visitCount: 0,
    lastVisitAt: null,
    archived: false,
    createdAt: nowIso,
    updatedAt: nowIso,
  }
  await ref.set(doc)
  return { customer: { id: ref.id, ...doc } }
})

export const archiveCustomer = onCall({ region: functionsRegion }, async (request) => {
  await assertAdmin(request)
  if (!isObject(request.data) || typeof request.data.customerId !== 'string') {
    throw new HttpsError('invalid-argument', 'customerId is required.')
  }
  const customerId = request.data.customerId.trim()
  if (!customerId) {
    throw new HttpsError('invalid-argument', 'customerId is required.')
  }

  const db = getFirestore()
  const salonId = getSalonId()
  const ref = customersCollection(db, salonId).doc(customerId)
  const snap = await ref.get()
  if (!snap.exists) {
    throw new HttpsError('not-found', 'Customer not found.')
  }

  await ref.update({
    archived: true,
    updatedAt: new Date().toISOString(),
  })

  return { ok: true as const }
})
