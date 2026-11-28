import { randomUUID } from 'node:crypto'

import { getFirestore, type Firestore } from 'firebase-admin/firestore'

import { getDefaultTimezone, getSalonId } from '../config'
import { extractCustomerNameFromCalendarTitle } from '../customers/matching'
import { seedCustomersFromCalendarEvents } from '../customers/store'
import {
  createChannelToken,
  deleteEvent,
  getCalendarListEntry,
  getGoogleWebhookUrl,
  getServiceAccountAccessToken,
  GoogleApiError,
  insertEvent,
  isWritableAccessRole,
  listEventsInWindow,
  patchEvent,
  stopChannel,
  watchEvents,
  type FetchLike,
} from './client'
import {
  blockedSlotDocIdForGoogleEvent,
  googleEventIdForReservation,
  googleEventToBlockedSlot,
  hasBlockedSlotSyncedFieldsChanged,
  reservationToGoogleEvent,
  resolveEffectivePrivacy,
  type SyncedBlockedSlotComparable,
} from './mapping'

const FIRESTORE_BATCH_LIMIT = 450
const MS_PER_DAY = 24 * 60 * 60_000

/** Lightweight rolling sync window: 7 days past through 6 months (180 days) future. */
export const ROLLING_SYNC_PAST_DAYS = 7
export const ROLLING_SYNC_FUTURE_DAYS = 180

/** One-time historical import window: 2 years (730 days) into the past. */
export const HISTORY_IMPORT_PAST_DAYS = 730

async function commitInChunks(
  db: Firestore,
  ops: Array<(batch: FirebaseFirestore.WriteBatch) => void>,
): Promise<void> {
  for (let i = 0; i < ops.length; i += FIRESTORE_BATCH_LIMIT) {
    const batch = db.batch()
    for (const op of ops.slice(i, i + FIRESTORE_BATCH_LIMIT)) {
      op(batch)
    }
    await batch.commit()
  }
}

export type GoogleCalendarIntegrationDoc = {
  employeeId: string | null
  connected: boolean
  calendarId: string | null
  calendarSummary: string | null
  accessRole: string | null
  lastSyncAt: string | null
  lastSyncStatus: 'OK' | 'ERROR' | null
  lastSyncError: string | null
  lastHistoryImportAt?: string | null
  lastHistoryImportCount?: number | null
  watchChannelId: string | null
  watchResourceId: string | null
  watchChannelToken: string | null
  watchExpiration: string | null
  updatedAt: string
}

export function normalizeEmployeeId(employeeId?: string | null): string | null {
  if (typeof employeeId !== 'string') return null
  const trimmed = employeeId.trim()
  return trimmed.length > 0 ? trimmed : null
}

export function integrationDocId(employeeId?: string | null): string {
  const emp = normalizeEmployeeId(employeeId)
  return emp ? `googleCalendar_${emp}` : 'googleCalendar'
}

export function integrationDocRef(db: Firestore, salonId: string, employeeId?: string | null) {
  return db
    .collection('salons')
    .doc(salonId)
    .collection('integrations')
    .doc(integrationDocId(employeeId))
}

async function loadSalonTimezone(db: Firestore, salonId: string): Promise<string> {
  const snap = await db.collection('salons').doc(salonId).get()
  const tz = snap.exists ? snap.data()?.timezone : undefined
  return typeof tz === 'string' && tz.trim() ? tz.trim() : getDefaultTimezone()
}

export async function getValidAccessToken(
  db: Firestore,
  salonId: string,
  employeeId?: string | null,
  fetchFn: FetchLike = fetch,
): Promise<{ accessToken: string; integration: GoogleCalendarIntegrationDoc } | null> {
  const ref = integrationDocRef(db, salonId, employeeId)
  const snap = await ref.get()
  if (!snap.exists) return null
  const data = snap.data() as Partial<GoogleCalendarIntegrationDoc>
  if (!data.connected || !data.calendarId) return null

  const token = await getServiceAccountAccessToken(process.env, fetchFn)
  if (!token) return null

  return {
    accessToken: token.accessToken,
    integration: data as GoogleCalendarIntegrationDoc,
  }
}

export async function ensureWatchChannel(
  db: Firestore,
  salonId: string,
  accessToken: string,
  calendarId: string,
  employeeId?: string | null,
  existing?: Partial<GoogleCalendarIntegrationDoc>,
  fetchFn: FetchLike = fetch,
): Promise<void> {
  const webhookUrl = getGoogleWebhookUrl()
  if (!webhookUrl) return

  const ref = integrationDocRef(db, salonId, employeeId)
  if (existing?.watchChannelId && existing?.watchResourceId) {
    try {
      await stopChannel(
        accessToken,
        { channelId: existing.watchChannelId, resourceId: existing.watchResourceId },
        fetchFn,
      )
    } catch {
      // Best-effort cleanup of previous watch channel.
    }
  }

  const channelId = randomUUID()
  const channelToken = createChannelToken()
  const watch = await watchEvents(
    accessToken,
    calendarId,
    { channelId, address: webhookUrl, token: channelToken },
    fetchFn,
  )

  await ref.update({
    watchChannelId: channelId,
    watchResourceId: watch.resourceId,
    watchChannelToken: channelToken,
    watchExpiration: watch.expirationIso,
    updatedAt: new Date().toISOString(),
  })
}

export async function deleteAllSyncedBlockedSlots(
  db: Firestore,
  salonId: string,
  employeeId?: string | null,
): Promise<void> {
  const emp = normalizeEmployeeId(employeeId)
  const blocksSnap = await db
    .collection('salons')
    .doc(salonId)
    .collection('blockedSlots')
    .where('source', '==', 'GOOGLE_CALENDAR')
    .get()

  const targets = blocksSnap.docs.filter((doc) => {
    const docEmp = normalizeEmployeeId(
      typeof doc.data().employeeId === 'string' ? doc.data().employeeId : null,
    )
    return docEmp === emp
  })
  if (targets.length === 0) return

  await commitInChunks(
    db,
    targets.map((doc) => (batch) => batch.delete(doc.ref)),
  )
}

async function syncWindowEventsToBlockedSlots(input: {
  db: Firestore
  salonId: string
  employeeId: string | null
  accessToken: string
  calendarId: string
  timeZone: string
  timeMinIso: string
  timeMaxIso: string
  nowIso: string
  fetchFn: FetchLike
}): Promise<{ syncedCount: number; writtenCount: number; skippedUnchanged: number }> {
  const {
    db,
    salonId,
    employeeId: emp,
    accessToken,
    calendarId,
    timeZone,
    timeMinIso,
    timeMaxIso,
    nowIso,
    fetchFn,
  } = input

  const events = await listEventsInWindow(
    accessToken,
    calendarId,
    { timeMinIso, timeMaxIso },
    fetchFn,
  )

  const blocksCol = db.collection('salons').doc(salonId).collection('blockedSlots')
  // Query only docs whose startAt falls inside this sync window (single-field index)
  // rather than loading the entire multi-year calendar mirror on every rolling sync.
  const existingSnap = await blocksCol
    .where('startAt', '>=', timeMinIso)
    .where('startAt', '<=', timeMaxIso)
    .get()
  const existingForEmployee = existingSnap.docs.filter((doc) => {
    const data = doc.data()
    if (data.source !== 'GOOGLE_CALENDAR') return false
    const docEmp = normalizeEmployeeId(typeof data.employeeId === 'string' ? data.employeeId : null)
    return docEmp === emp
  })
  const existingById = new Map<string, FirebaseFirestore.DocumentSnapshot>(
    existingForEmployee.map((doc) => [doc.id, doc]),
  )

  const mappedEvents = events
    .map((event) => {
      const mapped = googleEventToBlockedSlot(event, timeZone)
      if (!mapped) return null
      return { event, mapped, docId: blockedSlotDocIdForGoogleEvent(event.id, emp) }
    })
    .filter((entry): entry is NonNullable<typeof entry> => entry !== null)

  // Batch-fetch any incoming events that moved into this window from outside so
  // `createdAt` and `privateOverride` are preserved.
  const missingDocIds = mappedEvents
    .map((entry) => entry.docId)
    .filter((docId) => !existingById.has(docId))
  if (missingDocIds.length > 0) {
    const fetched = await db.getAll(...missingDocIds.map((id) => blocksCol.doc(id)))
    for (const snap of fetched) {
      if (snap.exists) {
        existingById.set(snap.id, snap)
      }
    }
  }

  const activeIds = new Set<string>()
  let syncedCount = 0
  let writtenCount = 0
  let skippedUnchanged = 0

  const ops: Array<(batch: FirebaseFirestore.WriteBatch) => void> = []
  for (const { event, mapped, docId } of mappedEvents) {
    activeIds.add(docId)
    const prev = existingById.get(docId)
    const prevData = prev?.data() as SyncedBlockedSlotComparable | undefined
    const privateOverride =
      typeof prevData?.privateOverride === 'boolean' ? prevData.privateOverride : null
    const isPrivate = resolveEffectivePrivacy(mapped.visibility, privateOverride)
    const customerNameKey =
      !isPrivate && !mapped.allDay
        ? (extractCustomerNameFromCalendarTitle(mapped.title)?.orderInsensitiveKey ?? null)
        : null

    const nextComparable: Required<SyncedBlockedSlotComparable> = {
      title: mapped.title,
      reason: mapped.title,
      description: mapped.description,
      startAt: mapped.startAt,
      endAt: mapped.endAt,
      allDay: mapped.allDay,
      visibility: mapped.visibility,
      isPrivate,
      privateOverride,
      customerNameKey,
    }

    syncedCount += 1
    if (!hasBlockedSlotSyncedFieldsChanged(prevData, nextComparable)) {
      skippedUnchanged += 1
      continue
    }

    writtenCount += 1
    ops.push((batch) =>
      batch.set(blocksCol.doc(docId), {
        source: 'GOOGLE_CALENDAR',
        employeeId: emp,
        googleEventId: event.id,
        title: mapped.title,
        reason: mapped.title,
        description: mapped.description,
        startAt: mapped.startAt,
        endAt: mapped.endAt,
        allDay: mapped.allDay,
        visibility: mapped.visibility,
        isPrivate,
        privateOverride,
        customerNameKey,
        createdAt: prev ? String(prev.data()?.createdAt ?? nowIso) : nowIso,
        updatedAt: nowIso,
      }),
    )
  }

  // Only prune missing docs that were loaded from this sync window.
  for (const doc of existingForEmployee) {
    if (!activeIds.has(doc.id)) {
      ops.push((batch) => batch.delete(doc.ref))
    }
  }

  await commitInChunks(db, ops)
  return { syncedCount, writtenCount, skippedUnchanged }
}

export async function importGoogleCalendarHistory(
  db: Firestore = getFirestore(),
  salonId: string = getSalonId(),
  employeeId?: string | null,
  fetchFn: FetchLike = fetch,
  now: Date = new Date(),
): Promise<{
  importedEvents: number
  writtenEvents: number
  skippedUnchanged: number
  seededCustomers: number
}> {
  const emp = normalizeEmployeeId(employeeId)
  const ref = integrationDocRef(db, salonId, emp)
  const auth = await getValidAccessToken(db, salonId, emp, fetchFn)
  if (!auth || !auth.integration.calendarId) {
    return { importedEvents: 0, writtenEvents: 0, skippedUnchanged: 0, seededCustomers: 0 }
  }

  const timeZone = await loadSalonTimezone(db, salonId)
  const nowIso = now.toISOString()
  const timeMinIso = new Date(now.getTime() - HISTORY_IMPORT_PAST_DAYS * MS_PER_DAY).toISOString()
  const timeMaxIso = nowIso

  const result = await syncWindowEventsToBlockedSlots({
    db,
    salonId,
    employeeId: emp,
    accessToken: auth.accessToken,
    calendarId: auth.integration.calendarId,
    timeZone,
    timeMinIso,
    timeMaxIso,
    nowIso,
    fetchFn,
  })

  let seededCustomers = 0
  try {
    const seeded = await seedCustomersFromCalendarEvents(db, salonId, emp)
    seededCustomers = seeded.createdCount
  } catch (err) {
    console.warn('[customers] seedCustomersFromCalendarEvents failed after history import', err)
  }

  await ref.update({
    lastHistoryImportAt: nowIso,
    lastHistoryImportCount: result.syncedCount,
    updatedAt: nowIso,
  })

  return {
    importedEvents: result.syncedCount,
    writtenEvents: result.writtenCount,
    skippedUnchanged: result.skippedUnchanged,
    seededCustomers,
  }
}

export async function syncGoogleCalendarForSalon(
  db: Firestore = getFirestore(),
  salonId: string = getSalonId(),
  employeeId?: string | null,
  fetchFn: FetchLike = fetch,
): Promise<{ syncedBlockedSlots: number; pushedReservations: number }> {
  const emp = normalizeEmployeeId(employeeId)
  const ref = integrationDocRef(db, salonId, emp)
  const auth = await getValidAccessToken(db, salonId, emp, fetchFn)
  if (!auth || !auth.integration.calendarId) {
    return { syncedBlockedSlots: 0, pushedReservations: 0 }
  }

  const calendarId = auth.integration.calendarId
  const now = new Date()
  const nowIso = now.toISOString()
  const timeZone = await loadSalonTimezone(db, salonId)
  const timeMinIso = new Date(now.getTime() - ROLLING_SYNC_PAST_DAYS * MS_PER_DAY).toISOString()
  const timeMaxIso = new Date(now.getTime() + ROLLING_SYNC_FUTURE_DAYS * MS_PER_DAY).toISOString()

  try {
    // Refresh accessRole (and summary) from calendarList so permission upgrades or legacy
    // OAuth docs without a stored accessRole are picked up without requiring a reconnect.
    let effectiveAccessRole: string | null = auth.integration.accessRole ?? null
    let refreshedSummary: string | null = null
    try {
      const listEntry = await getCalendarListEntry(auth.accessToken, calendarId, fetchFn)
      if (listEntry.accessRole) {
        effectiveAccessRole = listEntry.accessRole
      }
      if (listEntry.summary) {
        refreshedSummary = listEntry.summary
      }
    } catch {
      // Best-effort refresh; fall back to stored accessRole (null is treated as read-only).
    }

    const { syncedCount: syncedBlockedSlots } = await syncWindowEventsToBlockedSlots({
      db,
      salonId,
      employeeId: emp,
      accessToken: auth.accessToken,
      calendarId,
      timeZone,
      timeMinIso,
      timeMaxIso,
      nowIso,
      fetchFn,
    })

    // Backfill upcoming active reservations for this employee (or salon-wide when emp is null).
    // Treat missing/unknown accessRole conservatively as read-only until verified as writer/owner.
    let pushedReservations = 0
    if (isWritableAccessRole(effectiveAccessRole)) {
      const resSnap = await db
        .collection('salons')
        .doc(salonId)
        .collection('reservations')
        .where('endAt', '>=', nowIso)
        .get()

      for (const doc of resSnap.docs) {
        const data = doc.data()
        const status = String(data.status)
        if (status !== 'PENDING' && status !== 'CONFIRMED') continue
        const resEmp = normalizeEmployeeId(
          typeof data.employeeId === 'string' ? data.employeeId : null,
        )
        if (emp !== null && resEmp !== emp) continue
        if (emp === null && resEmp !== null) continue
        if (typeof data.googleCalendarEventId === 'string' && data.googleCalendarEventId) continue

        const payload = reservationToGoogleEvent({
          reservationId: doc.id,
          salonId,
          firstName: String(data.firstName ?? ''),
          lastName: String(data.lastName ?? ''),
          phone: String(data.phone ?? ''),
          email: typeof data.email === 'string' ? data.email : null,
          serviceName: String(data.serviceName ?? ''),
          startAt: String(data.startAt),
          endAt: String(data.endAt),
          status,
          notes: typeof data.notes === 'string' ? data.notes : null,
          internalNote: typeof data.internalNote === 'string' ? data.internalNote : null,
          timeZone,
        })
        const deterministicId = googleEventIdForReservation(salonId, doc.id)
        try {
          const created = await insertEvent(auth.accessToken, calendarId, payload, fetchFn)
          await doc.ref.update({ googleCalendarEventId: created.id })
        } catch (err) {
          if (err instanceof GoogleApiError && err.status === 409) {
            await patchEvent(auth.accessToken, calendarId, deterministicId, payload, fetchFn)
            await doc.ref.update({ googleCalendarEventId: deterministicId })
          } else {
            throw err
          }
        }
        pushedReservations += 1
      }
    }

    await ref.update({
      accessRole: effectiveAccessRole,
      ...(refreshedSummary ? { calendarSummary: refreshedSummary } : {}),
      lastSyncAt: nowIso,
      lastSyncStatus: 'OK',
      lastSyncError: null,
      updatedAt: nowIso,
    })

    return { syncedBlockedSlots, pushedReservations }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Google Calendar sync failed.'
    await ref.update({
      lastSyncAt: now.toISOString(),
      lastSyncStatus: 'ERROR',
      lastSyncError: message.slice(0, 500),
      updatedAt: now.toISOString(),
    })
    throw error
  }
}

/**
 * Best-effort outbound sync of a single reservation to the assigned employee's
 * connected Google Calendar (or salon-wide calendar if unassigned).
 */
export async function syncReservationToGoogleCalendar(
  reservationId: string,
  db: Firestore = getFirestore(),
  salonId: string = getSalonId(),
  fetchFn: FetchLike = fetch,
): Promise<void> {
  try {
    const resRef = db
      .collection('salons')
      .doc(salonId)
      .collection('reservations')
      .doc(reservationId)
    const resSnap = await resRef.get()
    if (!resSnap.exists) return
    const data = resSnap.data()!
    const empId = normalizeEmployeeId(typeof data.employeeId === 'string' ? data.employeeId : null)

    const auth = await getValidAccessToken(db, salonId, empId, fetchFn)
    if (!auth || !auth.integration.calendarId) return
    if (!isWritableAccessRole(auth.integration.accessRole)) {
      return
    }
    const calendarId = auth.integration.calendarId

    const status = String(data.status)
    const existingEventId =
      typeof data.googleCalendarEventId === 'string' && data.googleCalendarEventId.trim()
        ? data.googleCalendarEventId.trim()
        : null

    if (status === 'CANCELLED' || status === 'DECLINED' || status === 'EXPIRED') {
      if (existingEventId) {
        await deleteEvent(auth.accessToken, calendarId, existingEventId, fetchFn)
        await resRef.update({ googleCalendarEventId: null })
      }
      return
    }

    if (status !== 'PENDING' && status !== 'CONFIRMED' && status !== 'COMPLETED') return

    const timeZone = await loadSalonTimezone(db, salonId)
    const payload = reservationToGoogleEvent({
      reservationId,
      salonId,
      firstName: String(data.firstName ?? ''),
      lastName: String(data.lastName ?? ''),
      phone: String(data.phone ?? ''),
      email: typeof data.email === 'string' ? data.email : null,
      serviceName: String(data.serviceName ?? ''),
      startAt: String(data.startAt),
      endAt: String(data.endAt),
      status,
      notes: typeof data.notes === 'string' ? data.notes : null,
      internalNote: typeof data.internalNote === 'string' ? data.internalNote : null,
      timeZone,
    })

    if (existingEventId) {
      try {
        await patchEvent(auth.accessToken, calendarId, existingEventId, payload, fetchFn)
        return
      } catch (error) {
        if (!(error instanceof GoogleApiError && (error.status === 404 || error.status === 410))) {
          throw error
        }
      }
    }

    const deterministicId = googleEventIdForReservation(salonId, reservationId)
    try {
      const created = await insertEvent(auth.accessToken, calendarId, payload, fetchFn)
      await resRef.update({ googleCalendarEventId: created.id })
    } catch (error) {
      if (error instanceof GoogleApiError && error.status === 409) {
        await patchEvent(auth.accessToken, calendarId, deterministicId, payload, fetchFn)
        await resRef.update({ googleCalendarEventId: deterministicId })
      } else {
        throw error
      }
    }
  } catch (error) {
    console.error('[googleCalendar] syncReservationToGoogleCalendar failed', {
      reservationId,
      salonId,
      error: error instanceof Error ? error.message : String(error),
    })
  }
}
