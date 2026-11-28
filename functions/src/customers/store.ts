import { getFirestore, type Firestore } from 'firebase-admin/firestore'

import { getSalonId } from '../config'
import { normalizeEmployeeId } from '../googleCalendar/sync'
import {
  extractRecurringCalendarCustomers,
  nameOrderInsensitiveKey,
  normalizeCustomerEmail,
  normalizeCustomerName,
} from './matching'

export type CustomerSource = 'ONLINE' | 'MANUAL' | 'GOOGLE_CALENDAR'

export type CustomerDoc = {
  firstName: string
  lastName: string
  normalizedFullName: string
  nameKey: string
  email: string | null
  phone: string | null
  stylistNotes: string | null
  source: CustomerSource
  visitCount: number
  lastVisitAt: string | null
  archived: boolean
  createdAt: string
  updatedAt: string
}

export type CustomerWithId = CustomerDoc & { id: string }

export function customersCollection(db: Firestore, salonId: string) {
  return db.collection('salons').doc(salonId).collection('customers')
}

export type UpsertCustomerForBookingInput = {
  firstName: string
  lastName: string
  email: string | null
  phone: string | null
  startAtIso: string
  source: 'ONLINE' | 'MANUAL'
}

/**
 * Finds or creates a customer document for a new reservation:
 * 1. Match by normalized `email` first (unique per customer).
 * 2. Fall back to `nameKey` (order-insensitive normalized full name) when email is absent or unmatched.
 * 3. Create a new customer document if no match exists.
 */
export async function upsertCustomerForBooking(
  input: UpsertCustomerForBookingInput,
  db: Firestore = getFirestore(),
  salonId: string = getSalonId(),
): Promise<string> {
  const col = customersCollection(db, salonId)
  const firstName = input.firstName.trim()
  const lastName = input.lastName.trim()
  const normalizedFullName = normalizeCustomerName(firstName, lastName)
  const nameKey = nameOrderInsensitiveKey(normalizedFullName)
  const normalizedEmail = normalizeCustomerEmail(input.email)
  const phone = input.phone?.trim() || null
  const nowIso = new Date().toISOString()

  let matchedDoc: FirebaseFirestore.QueryDocumentSnapshot | null = null

  if (normalizedEmail) {
    const byEmail = await col.where('email', '==', normalizedEmail).limit(1).get()
    if (!byEmail.empty) {
      matchedDoc = byEmail.docs[0]!
    }
  }

  if (!matchedDoc && nameKey) {
    const byNameKey = await col.where('nameKey', '==', nameKey).limit(5).get()
    const nonArchived = byNameKey.docs.find((doc) => doc.data().archived !== true)
    if (nonArchived) {
      const existingEmail = normalizeCustomerEmail(
        typeof nonArchived.data().email === 'string' ? nonArchived.data().email : null,
      )
      // Link by name when existing record has no email (e.g. seeded from Google Calendar)
      // or when incoming booking has no email.
      if (!existingEmail || !normalizedEmail) {
        matchedDoc = nonArchived
      }
    }
  }

  if (matchedDoc) {
    const prev = matchedDoc.data() as Partial<CustomerDoc>
    const prevLastVisitMs = prev.lastVisitAt ? new Date(prev.lastVisitAt).getTime() : 0
    const nextLastVisitMs = new Date(input.startAtIso).getTime()
    const lastVisitAt =
      Number.isFinite(nextLastVisitMs) && nextLastVisitMs >= prevLastVisitMs
        ? input.startAtIso
        : (prev.lastVisitAt ?? input.startAtIso)

    await matchedDoc.ref.update({
      firstName: firstName || prev.firstName || '',
      lastName: lastName || prev.lastName || '',
      normalizedFullName: normalizedFullName || prev.normalizedFullName || '',
      nameKey: nameKey || prev.nameKey || '',
      ...(normalizedEmail && !prev.email ? { email: normalizedEmail } : {}),
      ...(phone && !prev.phone ? { phone } : {}),
      visitCount: (typeof prev.visitCount === 'number' ? prev.visitCount : 0) + 1,
      lastVisitAt,
      archived: false,
      updatedAt: nowIso,
    })
    return matchedDoc.id
  }

  const createdRef = col.doc()
  const doc: CustomerDoc = {
    firstName,
    lastName,
    normalizedFullName,
    nameKey,
    email: normalizedEmail,
    phone,
    stylistNotes: null,
    source: input.source,
    visitCount: 1,
    lastVisitAt: input.startAtIso,
    archived: false,
    createdAt: nowIso,
    updatedAt: nowIso,
  }
  await createdRef.set(doc)
  return createdRef.id
}

/**
 * Smart import: scans synced Google Calendar events in `blockedSlots` and auto-creates
 * customer entries for recurring non-private names (2+ occurrences) not yet in Firestore.
 */
export async function seedCustomersFromCalendarEvents(
  db: Firestore = getFirestore(),
  salonId: string = getSalonId(),
  employeeId?: string | null,
): Promise<{ createdCount: number; totalCandidates: number }> {
  const emp = normalizeEmployeeId(employeeId)
  const blocksSnap = await db
    .collection('salons')
    .doc(salonId)
    .collection('blockedSlots')
    .where('source', '==', 'GOOGLE_CALENDAR')
    .get()

  const events = blocksSnap.docs
    .map((doc) => doc.data())
    .filter((data) => {
      if (employeeId === undefined) return true
      const docEmp = normalizeEmployeeId(
        typeof data.employeeId === 'string' ? data.employeeId : null,
      )
      return docEmp === emp
    })
    .map((data) => ({
      title: typeof data.title === 'string' ? data.title : null,
      startAt: String(data.startAt ?? ''),
      allDay: Boolean(data.allDay),
      isPrivate: Boolean(data.isPrivate),
    }))
    .filter((event) => Boolean(event.startAt))

  const candidates = extractRecurringCalendarCustomers(events, 2)
  if (candidates.length === 0) {
    return { createdCount: 0, totalCandidates: 0 }
  }

  const col = customersCollection(db, salonId)
  const existingSnap = await col.get()
  const existingKeys = new Set<string>()
  for (const doc of existingSnap.docs) {
    const data = doc.data() as Partial<CustomerDoc>
    if (typeof data.nameKey === 'string' && data.nameKey) {
      existingKeys.add(data.nameKey)
    } else if (typeof data.normalizedFullName === 'string' && data.normalizedFullName) {
      existingKeys.add(nameOrderInsensitiveKey(data.normalizedFullName))
    }
  }

  const nowIso = new Date().toISOString()
  let createdCount = 0
  const batchLimit = 450
  let batch = db.batch()
  let opsInBatch = 0

  for (const candidate of candidates) {
    if (existingKeys.has(candidate.orderInsensitiveKey)) continue
    existingKeys.add(candidate.orderInsensitiveKey)

    const ref = col.doc()
    const doc: CustomerDoc = {
      firstName: candidate.firstName,
      lastName: candidate.lastName,
      normalizedFullName: candidate.normalizedFullName,
      nameKey: candidate.orderInsensitiveKey,
      email: null,
      phone: null,
      stylistNotes: null,
      source: 'GOOGLE_CALENDAR',
      visitCount: candidate.visitCount,
      lastVisitAt: candidate.lastVisitAt,
      archived: false,
      createdAt: nowIso,
      updatedAt: nowIso,
    }
    batch.set(ref, doc)
    opsInBatch += 1
    createdCount += 1

    if (opsInBatch >= batchLimit) {
      await batch.commit()
      batch = db.batch()
      opsInBatch = 0
    }
  }

  if (opsInBatch > 0) {
    await batch.commit()
  }

  return { createdCount, totalCandidates: candidates.length }
}
