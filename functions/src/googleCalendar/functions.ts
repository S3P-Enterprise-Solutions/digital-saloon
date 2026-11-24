import { getFirestore } from 'firebase-admin/firestore'
import { HttpsError, onCall, onRequest } from 'firebase-functions/v2/https'
import { onSchedule } from 'firebase-functions/v2/scheduler'

import { assertAdmin } from '../authz'
import { functionsRegion, getSalonId } from '../config'
import { isObject } from '../schemas'
import {
  buildGoogleOAuthUrl,
  createOAuthNonce,
  exchangeCodeForTokens,
  fetchGoogleUserEmail,
  getCalendar,
  getGoogleOAuthConfig,
  listCalendars,
  signOAuthState,
  stopChannel,
  verifyOAuthState,
  type GoogleCalendarListItem,
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
  oauthConfigured: boolean
  connected: boolean
  accountEmail: string | null
  calendarId: string | null
  calendarSummary: string | null
  availableCalendars: GoogleCalendarListItem[]
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
  oauthConfigured: boolean,
  data: Partial<GoogleCalendarIntegrationDoc> | undefined,
): GoogleCalendarStatusResponse {
  return {
    employeeId,
    oauthConfigured,
    connected: Boolean(data?.connected),
    accountEmail: data?.accountEmail ?? null,
    calendarId: data?.calendarId ?? null,
    calendarSummary: data?.calendarSummary ?? null,
    availableCalendars: Array.isArray(data?.availableCalendars) ? data.availableCalendars : [],
    lastSyncAt: data?.lastSyncAt ?? null,
    lastSyncStatus:
      data?.lastSyncStatus === 'OK' || data?.lastSyncStatus === 'ERROR'
        ? data.lastSyncStatus
        : null,
    lastSyncError: data?.lastSyncError ?? null,
  }
}

function isAllowedReturnOrigin(url: URL): boolean {
  const publicUrl = process.env.PUBLIC_APP_URL?.trim()
  if (publicUrl) {
    try {
      if (new URL(publicUrl).origin === url.origin) return true
    } catch {
      // ignore invalid PUBLIC_APP_URL
    }
  }
  if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') {
    return url.protocol === 'http:' || url.protocol === 'https:'
  }
  if (
    url.protocol === 'https:' &&
    (url.hostname.endsWith('.web.app') || url.hostname.endsWith('.firebaseapp.com'))
  ) {
    return true
  }
  return false
}

function resolveReturnUrl(raw: unknown): string {
  const fallbackBase = process.env.PUBLIC_APP_URL?.trim() || 'http://127.0.0.1:3100'
  const fallback = `${fallbackBase.replace(/\/+$/, '')}/admin/settings`
  if (typeof raw !== 'string' || !raw.trim()) return fallback
  try {
    const parsed = new URL(raw.trim())
    if (!isAllowedReturnOrigin(parsed)) return fallback
    return parsed.toString()
  } catch {
    return fallback
  }
}

function appendQueryParam(urlStr: string, key: string, value: string): string {
  const url = new URL(urlStr)
  url.searchParams.set(key, value)
  return url.toString()
}

export const getGoogleCalendarStatus = onCall({ region: functionsRegion }, async (request) => {
  await assertAdmin(request)
  const employeeId = readEmployeeId(request.data)
  const db = getFirestore()
  const salonId = getSalonId()
  const oauthConfigured = getGoogleOAuthConfig() !== null
  const snap = await integrationDocRef(db, salonId, employeeId).get()
  const data = snap.exists ? (snap.data() as Partial<GoogleCalendarIntegrationDoc>) : undefined
  return toStatusResponse(employeeId, oauthConfigured, data)
})

export const startGoogleCalendarOAuth = onCall({ region: functionsRegion }, async (request) => {
  const uid = await assertAdmin(request)
  const oauth = getGoogleOAuthConfig()
  if (!oauth) {
    throw new HttpsError(
      'failed-precondition',
      'Google Calendar OAuth is not configured on the server.',
    )
  }

  const employeeId = readEmployeeId(request.data)
  const returnUrl = isObject(request.data)
    ? resolveReturnUrl(request.data.returnUrl)
    : resolveReturnUrl(undefined)

  const state = signOAuthState(
    {
      salonId: getSalonId(),
      uid,
      employeeId,
      returnUrl,
      nonce: createOAuthNonce(),
      exp: Date.now() + 15 * 60_000,
    },
    oauth.stateSecret,
  )

  return {
    authUrl: buildGoogleOAuthUrl({
      clientId: oauth.clientId,
      redirectUri: oauth.redirectUri,
      state,
    }),
  }
})

export const googleCalendarOAuthCallback = onRequest(
  { region: functionsRegion },
  async (req, res) => {
    const oauth = getGoogleOAuthConfig()
    if (!oauth) {
      res.status(500).send('Google Calendar OAuth is not configured.')
      return
    }

    const stateParam = typeof req.query.state === 'string' ? req.query.state : ''
    const state = verifyOAuthState(stateParam, oauth.stateSecret)
    if (!state) {
      res.status(400).send('Invalid or expired OAuth state.')
      return
    }

    const errorParam = typeof req.query.error === 'string' ? req.query.error : ''
    if (errorParam) {
      res.redirect(302, appendQueryParam(state.returnUrl, 'gcal', 'error'))
      return
    }

    const code = typeof req.query.code === 'string' ? req.query.code : ''
    if (!code) {
      res.redirect(302, appendQueryParam(state.returnUrl, 'gcal', 'error'))
      return
    }

    const employeeId = normalizeEmployeeId(state.employeeId)

    try {
      const tokens = await exchangeCodeForTokens({
        code,
        clientId: oauth.clientId,
        clientSecret: oauth.clientSecret,
        redirectUri: oauth.redirectUri,
      })

      const db = getFirestore()
      const ref = integrationDocRef(db, state.salonId, employeeId)
      const prevSnap = await ref.get()
      const prev = prevSnap.exists
        ? (prevSnap.data() as Partial<GoogleCalendarIntegrationDoc>)
        : undefined
      const refreshToken = tokens.refreshToken ?? prev?.refreshToken ?? null

      if (!refreshToken) {
        res.redirect(302, appendQueryParam(state.returnUrl, 'gcal', 'error'))
        return
      }

      const [accountEmail, calendars] = await Promise.all([
        fetchGoogleUserEmail(tokens.accessToken),
        listCalendars(tokens.accessToken),
      ])

      const primary = calendars.find((c) => c.primary) ?? calendars[0] ?? null
      const selectedCalendarId = prev?.calendarId ?? primary?.id ?? null
      const selectedSummary =
        calendars.find((c) => c.id === selectedCalendarId)?.summary ??
        prev?.calendarSummary ??
        primary?.summary ??
        null

      const nowIso = new Date().toISOString()
      const expiresAt = new Date(Date.now() + tokens.expiresInSeconds * 1000).toISOString()

      await ref.set({
        employeeId,
        connected: true,
        accountEmail,
        refreshToken,
        accessToken: tokens.accessToken,
        accessTokenExpiresAt: expiresAt,
        calendarId: selectedCalendarId,
        calendarSummary: selectedSummary,
        availableCalendars: calendars,
        lastSyncAt: prev?.lastSyncAt ?? null,
        lastSyncStatus: prev?.lastSyncStatus ?? null,
        lastSyncError: null,
        watchChannelId: prev?.watchChannelId ?? null,
        watchResourceId: prev?.watchResourceId ?? null,
        watchChannelToken: prev?.watchChannelToken ?? null,
        watchExpiration: prev?.watchExpiration ?? null,
        updatedAt: nowIso,
      } satisfies GoogleCalendarIntegrationDoc)

      if (selectedCalendarId) {
        try {
          await ensureWatchChannel(
            db,
            state.salonId,
            tokens.accessToken,
            selectedCalendarId,
            employeeId,
            prev,
          )
        } catch (err) {
          console.warn('[googleCalendar] watch registration skipped', err)
        }
        await syncGoogleCalendarForSalon(db, state.salonId, employeeId)
      }

      res.redirect(302, appendQueryParam(state.returnUrl, 'gcal', 'connected'))
    } catch (error) {
      console.error('[googleCalendar] OAuth callback failed', error)
      res.redirect(302, appendQueryParam(state.returnUrl, 'gcal', 'error'))
    }
  },
)

export const selectGoogleCalendar = onCall({ region: functionsRegion }, async (request) => {
  await assertAdmin(request)
  if (!isObject(request.data) || typeof request.data.calendarId !== 'string') {
    throw new HttpsError('invalid-argument', 'calendarId is required.')
  }
  const calendarId = request.data.calendarId.trim()
  if (!calendarId) {
    throw new HttpsError('invalid-argument', 'calendarId is required.')
  }
  const employeeId = readEmployeeId(request.data)

  const db = getFirestore()
  const salonId = getSalonId()
  const auth = await getValidAccessToken(db, salonId, employeeId)
  if (!auth) {
    throw new HttpsError('failed-precondition', 'Google Calendar is not connected.')
  }

  const calendar = await getCalendar(auth.accessToken, calendarId)
  const calendars = await listCalendars(auth.accessToken).catch(
    () => auth.integration.availableCalendars ?? [],
  )
  const mergedCalendars = calendars.some((c) => c.id === calendar.id)
    ? calendars
    : [...calendars, calendar]

  const ref = integrationDocRef(db, salonId, employeeId)
  await ref.update({
    calendarId: calendar.id,
    calendarSummary: calendar.summary,
    availableCalendars: mergedCalendars,
    updatedAt: new Date().toISOString(),
  })

  try {
    await ensureWatchChannel(
      db,
      salonId,
      auth.accessToken,
      calendar.id,
      employeeId,
      auth.integration,
    )
  } catch (err) {
    console.warn('[googleCalendar] watch registration skipped', err)
  }

  await syncGoogleCalendarForSalon(db, salonId, employeeId)
  const after = await ref.get()
  return toStatusResponse(
    employeeId,
    getGoogleOAuthConfig() !== null,
    after.data() as Partial<GoogleCalendarIntegrationDoc>,
  )
})

export const syncGoogleCalendar = onCall({ region: functionsRegion }, async (request) => {
  await assertAdmin(request)
  const employeeId = readEmployeeId(request.data)
  const db = getFirestore()
  const salonId = getSalonId()
  const result = await syncGoogleCalendarForSalon(db, salonId, employeeId)
  const after = await integrationDocRef(db, salonId, employeeId).get()
  return {
    ...result,
    status: toStatusResponse(
      employeeId,
      getGoogleOAuthConfig() !== null,
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

  return toStatusResponse(employeeId, getGoogleOAuthConfig() !== null, undefined)
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
