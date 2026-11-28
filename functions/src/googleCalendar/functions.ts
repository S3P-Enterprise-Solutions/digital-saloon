import { getFirestore } from 'firebase-admin/firestore'
import { HttpsError, onCall, onRequest } from 'firebase-functions/v2/https'
import { onSchedule } from 'firebase-functions/v2/scheduler'

import { assertAdmin } from '../authz'
import { functionsRegion, getSalonId } from '../config'
import { isObject } from '../schemas'
import {
  getServiceAccountAccessToken,
  getServiceAccountEmail,
  GoogleApiError,
  stopChannel,
  subscribeToCalendar,
} from './client'
import {
  deleteAllSyncedBlockedSlots,
  ensureWatchChannel,
  getValidAccessToken,
  integrationDocRef,
  normalizeEmployeeId,
  syncGoogleCalendarForSalon,
  type GoogleCalendarIntegrationDoc,
} from './sync'

export type GoogleCalendarStatusResponse = {
  employeeId: string | null
  configured: boolean
  serviceAccountEmail: string | null
  connected: boolean
  calendarId: string | null
  calendarSummary: string | null
  accessRole: string | null
  lastSyncAt: string | null
  lastSyncStatus: 'OK' | 'ERROR' | null
  lastSyncError: string | null
}

function readEmployeeId(data: unknown): string | null {
  if (!isObject(data)) return null
  return normalizeEmployeeId(typeof data.employeeId === 'string' ? data.employeeId : null)
}

function toStatusResponse(
  employeeId: string | null,
  serviceAccountEmail: string | null,
  data: Partial<GoogleCalendarIntegrationDoc> | undefined,
): GoogleCalendarStatusResponse {
  return {
    employeeId,
    configured: serviceAccountEmail !== null,
    serviceAccountEmail,
    connected: Boolean(data?.connected),
    calendarId: data?.calendarId ?? null,
    calendarSummary: data?.calendarSummary ?? null,
    accessRole: data?.accessRole ?? null,
    lastSyncAt: data?.lastSyncAt ?? null,
    lastSyncStatus:
      data?.lastSyncStatus === 'OK' || data?.lastSyncStatus === 'ERROR'
        ? data.lastSyncStatus
        : null,
    lastSyncError: data?.lastSyncError ?? null,
  }
}

export const getGoogleCalendarStatus = onCall({ region: functionsRegion }, async (request) => {
  await assertAdmin(request)
  const employeeId = readEmployeeId(request.data)
  const db = getFirestore()
  const salonId = getSalonId()
  const [serviceAccountEmail, snap] = await Promise.all([
    getServiceAccountEmail(),
    integrationDocRef(db, salonId, employeeId).get(),
  ])
  const data = snap.exists ? (snap.data() as Partial<GoogleCalendarIntegrationDoc>) : undefined
  return toStatusResponse(employeeId, serviceAccountEmail, data)
})

export const connectGoogleCalendar = onCall({ region: functionsRegion }, async (request) => {
  await assertAdmin(request)
  if (!isObject(request.data) || typeof request.data.calendarId !== 'string') {
    throw new HttpsError('invalid-argument', 'calendarId is required.')
  }
  const calendarId = request.data.calendarId.trim()
  if (!calendarId) {
    throw new HttpsError('invalid-argument', 'calendarId is required.')
  }
  const employeeId = readEmployeeId(request.data)

  const token = await getServiceAccountAccessToken()
  if (!token) {
    throw new HttpsError(
      'failed-precondition',
      'Google Calendar service account is not configured on the server.',
    )
  }

  let calendar: { id: string; summary: string; accessRole?: string }
  try {
    calendar = await subscribeToCalendar(token.accessToken, calendarId)
  } catch (err) {
    if (err instanceof GoogleApiError && (err.status === 404 || err.status === 403)) {
      throw new HttpsError(
        'failed-precondition',
        `Calendar "${calendarId}" could not be accessed. Make sure it is shared with ${token.serviceAccountEmail} and the Google Calendar API is enabled.`,
      )
    }
    throw err
  }

  const db = getFirestore()
  const salonId = getSalonId()
  const ref = integrationDocRef(db, salonId, employeeId)
  const prevSnap = await ref.get()
  const prev = prevSnap.exists
    ? (prevSnap.data() as Partial<GoogleCalendarIntegrationDoc>)
    : undefined

  if (prev?.calendarId && prev.calendarId !== calendar.id) {
    await deleteAllSyncedBlockedSlots(db, salonId, employeeId)
  }

  const nowIso = new Date().toISOString()
  await ref.set({
    employeeId,
    connected: true,
    calendarId: calendar.id,
    calendarSummary: calendar.summary,
    accessRole: calendar.accessRole ?? null,
    lastSyncAt: prev?.lastSyncAt ?? null,
    lastSyncStatus: prev?.lastSyncStatus ?? null,
    lastSyncError: null,
    watchChannelId: prev?.watchChannelId ?? null,
    watchResourceId: prev?.watchResourceId ?? null,
    watchChannelToken: prev?.watchChannelToken ?? null,
    watchExpiration: prev?.watchExpiration ?? null,
    updatedAt: nowIso,
  } satisfies GoogleCalendarIntegrationDoc)

  try {
    await ensureWatchChannel(db, salonId, token.accessToken, calendar.id, employeeId, prev)
  } catch (err) {
    console.warn('[googleCalendar] watch registration skipped', err)
  }

  await syncGoogleCalendarForSalon(db, salonId, employeeId)
  const after = await ref.get()
  return toStatusResponse(
    employeeId,
    token.serviceAccountEmail,
    after.data() as Partial<GoogleCalendarIntegrationDoc> | undefined,
  )
})

export const syncGoogleCalendar = onCall({ region: functionsRegion }, async (request) => {
  await assertAdmin(request)
  const employeeId = readEmployeeId(request.data)
  const db = getFirestore()
  const salonId = getSalonId()
  const result = await syncGoogleCalendarForSalon(db, salonId, employeeId)
  const [serviceAccountEmail, after] = await Promise.all([
    getServiceAccountEmail(),
    integrationDocRef(db, salonId, employeeId).get(),
  ])
  return {
    ...result,
    status: toStatusResponse(
      employeeId,
      serviceAccountEmail,
      after.data() as Partial<GoogleCalendarIntegrationDoc> | undefined,
    ),
  }
})

export const disconnectGoogleCalendar = onCall({ region: functionsRegion }, async (request) => {
  await assertAdmin(request)
  const employeeId = readEmployeeId(request.data)
  const db = getFirestore()
  const salonId = getSalonId()
  const ref = integrationDocRef(db, salonId, employeeId)
  const auth = await getValidAccessToken(db, salonId, employeeId).catch(() => null)

  if (auth?.integration.watchChannelId && auth?.integration.watchResourceId) {
    try {
      await stopChannel(auth.accessToken, {
        channelId: auth.integration.watchChannelId,
        resourceId: auth.integration.watchResourceId,
      })
    } catch {
      // Best-effort channel stop.
    }
  }

  await deleteAllSyncedBlockedSlots(db, salonId, employeeId)
  await ref.delete()

  const serviceAccountEmail = await getServiceAccountEmail()
  return toStatusResponse(employeeId, serviceAccountEmail, undefined)
})

export const googleCalendarWebhook = onRequest({ region: functionsRegion }, async (req, res) => {
  const channelId = req.header('x-goog-channel-id') ?? ''
  const channelToken = req.header('x-goog-channel-token') ?? ''
  if (!channelId || !channelToken) {
    res.status(400).send('Missing channel headers.')
    return
  }

  const db = getFirestore()
  const salonId = getSalonId()
  const snap = await db
    .collection('salons')
    .doc(salonId)
    .collection('integrations')
    .where('watchChannelId', '==', channelId)
    .limit(1)
    .get()

  if (snap.empty) {
    res.status(200).send('OK')
    return
  }

  const doc = snap.docs[0]
  const data = doc.data() as Partial<GoogleCalendarIntegrationDoc>
  if (!data.connected || data.watchChannelToken !== channelToken) {
    res.status(403).send('Invalid channel.')
    return
  }

  const employeeId = normalizeEmployeeId(data.employeeId)
  const resourceState = req.header('x-goog-resource-state') ?? ''
  if (resourceState !== 'sync') {
    try {
      await syncGoogleCalendarForSalon(db, salonId, employeeId)
    } catch (error) {
      console.error('[googleCalendar] webhook sync failed', error)
    }
  }

  res.status(200).send('OK')
})

export const syncGoogleCalendarSchedule = onSchedule(
  { region: functionsRegion, schedule: 'every 10 minutes' },
  async () => {
    const db = getFirestore()
    const salonId = getSalonId()
    const integrationsSnap = await db
      .collection('salons')
      .doc(salonId)
      .collection('integrations')
      .where('connected', '==', true)
      .get()

    for (const doc of integrationsSnap.docs) {
      const data = doc.data() as Partial<GoogleCalendarIntegrationDoc>
      const employeeId = normalizeEmployeeId(
        data.employeeId ??
          (doc.id.startsWith('googleCalendar_') ? doc.id.slice('googleCalendar_'.length) : null),
      )
      const auth = await getValidAccessToken(db, salonId, employeeId).catch(() => null)
      if (!auth || !auth.integration.calendarId) continue

      const expMs = auth.integration.watchExpiration
        ? new Date(auth.integration.watchExpiration).getTime()
        : 0
      if (!expMs || expMs < Date.now() + 12 * 60 * 60_000) {
        try {
          await ensureWatchChannel(
            db,
            salonId,
            auth.accessToken,
            auth.integration.calendarId,
            employeeId,
            auth.integration,
          )
        } catch (err) {
          console.warn('[googleCalendar] scheduled watch renewal skipped', err)
        }
      }

      await syncGoogleCalendarForSalon(db, salonId, employeeId).catch((err) => {
        console.error('[googleCalendar] scheduled sync failed', { employeeId, err })
      })
    }
  },
)
