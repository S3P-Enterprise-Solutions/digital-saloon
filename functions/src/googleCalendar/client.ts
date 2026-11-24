import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto'

import { functionsRegion } from '../config'
import type { GoogleCalendarEvent, GoogleCalendarEventPayload } from './mapping'

export type FetchLike = typeof fetch

export type GoogleOAuthConfig = {
  clientId: string
  clientSecret: string
  redirectUri: string
  stateSecret: string
}

export type GoogleOAuthStatePayload = {
  salonId: string
  uid: string
  employeeId?: string | null
  returnUrl: string
  nonce: string
  exp: number
}

export type GoogleCalendarListItem = {
  id: string
  summary: string
  primary?: boolean
  accessRole?: string
}

export type GoogleTokenResponse = {
  accessToken: string
  refreshToken: string | null
  expiresInSeconds: number
}

const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth'
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token'
const GOOGLE_USERINFO_URL = 'https://www.googleapis.com/oauth2/v2/userinfo'
const GOOGLE_CALENDAR_API = 'https://www.googleapis.com/calendar/v3'
const GOOGLE_CALENDAR_SCOPE =
  'https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/userinfo.email'

function envString(env: Record<string, string | undefined>, name: string): string | null {
  const value = env[name]?.trim()
  return value ? value : null
}

export function defaultOAuthRedirectUri(
  env: Record<string, string | undefined> = process.env,
): string | null {
  const explicit = envString(env, 'GOOGLE_OAUTH_REDIRECT_URI')
  if (explicit) return explicit
  const projectId = envString(env, 'GCLOUD_PROJECT') ?? envString(env, 'GCP_PROJECT')
  if (!projectId) return null
  if (env.FUNCTIONS_EMULATOR === 'true') {
    return `http://127.0.0.1:5101/${projectId}/${functionsRegion}/googleCalendarOAuthCallback`
  }
  return `https://${functionsRegion}-${projectId}.cloudfunctions.net/googleCalendarOAuthCallback`
}

export function getGoogleOAuthConfig(
  env: Record<string, string | undefined> = process.env,
): GoogleOAuthConfig | null {
  const clientId = envString(env, 'GOOGLE_OAUTH_CLIENT_ID')
  const clientSecret = envString(env, 'GOOGLE_OAUTH_CLIENT_SECRET')
  const redirectUri = defaultOAuthRedirectUri(env)
  if (!clientId || !clientSecret || !redirectUri) return null
  const stateSecret =
    envString(env, 'GOOGLE_OAUTH_STATE_SECRET') ??
    (env.FUNCTIONS_EMULATOR === 'true' ? clientSecret : null)
  if (!stateSecret) return null
  return { clientId, clientSecret, redirectUri, stateSecret }
}

export function getGoogleWebhookUrl(
  env: Record<string, string | undefined> = process.env,
): string | null {
  const explicit = envString(env, 'GOOGLE_CALENDAR_WEBHOOK_URL')
  if (explicit && explicit.startsWith('https://')) return explicit
  if (env.FUNCTIONS_EMULATOR === 'true') return null
  const projectId = envString(env, 'GCLOUD_PROJECT') ?? envString(env, 'GCP_PROJECT')
  if (!projectId) return null
  return `https://${functionsRegion}-${projectId}.cloudfunctions.net/googleCalendarWebhook`
}

export function signOAuthState(payload: GoogleOAuthStatePayload, secret: string): string {
  const encoded = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url')
  const sig = createHmac('sha256', secret).update(encoded).digest('base64url')
  return `${encoded}.${sig}`
}

export function verifyOAuthState(
  token: string,
  secret: string,
  nowMs: number = Date.now(),
): GoogleOAuthStatePayload | null {
  const dot = token.indexOf('.')
  if (dot <= 0) return null
  const encoded = token.slice(0, dot)
  const sig = token.slice(dot + 1)
  if (!encoded || !sig) return null

  const expected = createHmac('sha256', secret).update(encoded).digest('base64url')
  const sigBuf = Buffer.from(sig, 'utf8')
  const expectedBuf = Buffer.from(expected, 'utf8')
  if (sigBuf.length !== expectedBuf.length || !timingSafeEqual(sigBuf, expectedBuf)) {
    return null
  }

  try {
    const parsed = JSON.parse(
      Buffer.from(encoded, 'base64url').toString('utf8'),
    ) as Partial<GoogleOAuthStatePayload>
    if (
      typeof parsed.salonId !== 'string' ||
      typeof parsed.uid !== 'string' ||
      typeof parsed.returnUrl !== 'string' ||
      typeof parsed.nonce !== 'string' ||
      typeof parsed.exp !== 'number'
    ) {
      return null
    }
    if (parsed.exp < nowMs) return null
    return parsed as GoogleOAuthStatePayload
  } catch {
    return null
  }
}

export function createOAuthNonce(): string {
  return randomBytes(16).toString('base64url')
}

export function buildGoogleOAuthUrl(input: {
  clientId: string
  redirectUri: string
  state: string
}): string {
  const params = new URLSearchParams({
    client_id: input.clientId,
    redirect_uri: input.redirectUri,
    response_type: 'code',
    scope: GOOGLE_CALENDAR_SCOPE,
    access_type: 'offline',
    prompt: 'consent',
    include_granted_scopes: 'true',
    state: input.state,
  })
  return `${GOOGLE_AUTH_URL}?${params.toString()}`
}

export class GoogleApiError extends Error {
  readonly status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

async function parseJsonOrThrow<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new GoogleApiError(res.status, `Google API error ${res.status}: ${text.slice(0, 300)}`)
  }
  return (await res.json()) as T
}

export async function exchangeCodeForTokens(
  input: {
    code: string
    clientId: string
    clientSecret: string
    redirectUri: string
  },
  fetchFn: FetchLike = fetch,
): Promise<GoogleTokenResponse> {
  const body = new URLSearchParams({
    code: input.code,
    client_id: input.clientId,
    client_secret: input.clientSecret,
    redirect_uri: input.redirectUri,
    grant_type: 'authorization_code',
  })
  const res = await fetchFn(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  })
  const data = await parseJsonOrThrow<{
    access_token: string
    refresh_token?: string
    expires_in?: number
  }>(res)
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token ?? null,
    expiresInSeconds: Number(data.expires_in ?? 3600),
  }
}

export async function refreshAccessToken(
  input: {
    refreshToken: string
    clientId: string
    clientSecret: string
  },
  fetchFn: FetchLike = fetch,
): Promise<{ accessToken: string; expiresInSeconds: number }> {
  const body = new URLSearchParams({
    refresh_token: input.refreshToken,
    client_id: input.clientId,
    client_secret: input.clientSecret,
    grant_type: 'refresh_token',
  })
  const res = await fetchFn(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  })
  const data = await parseJsonOrThrow<{ access_token: string; expires_in?: number }>(res)
  return {
    accessToken: data.access_token,
    expiresInSeconds: Number(data.expires_in ?? 3600),
  }
}

export async function fetchGoogleUserEmail(
  accessToken: string,
  fetchFn: FetchLike = fetch,
): Promise<string | null> {
  const res = await fetchFn(GOOGLE_USERINFO_URL, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!res.ok) return null
  const data = (await res.json()) as { email?: string }
  return typeof data.email === 'string' && data.email.trim() ? data.email.trim() : null
}

export async function listCalendars(
  accessToken: string,
  fetchFn: FetchLike = fetch,
): Promise<GoogleCalendarListItem[]> {
  const res = await fetchFn(`${GOOGLE_CALENDAR_API}/users/me/calendarList?minAccessRole=reader`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  const data = await parseJsonOrThrow<{
    items?: Array<{
      id?: string
      summary?: string
      summaryOverride?: string
      primary?: boolean
      accessRole?: string
    }>
  }>(res)
  return (data.items ?? [])
    .filter((item): item is typeof item & { id: string } => typeof item.id === 'string')
    .map((item) => ({
      id: item.id,
      summary: (item.summaryOverride || item.summary || item.id).trim(),
      primary: item.primary === true,
      accessRole: item.accessRole,
    }))
}

export async function getCalendar(
  accessToken: string,
  calendarId: string,
  fetchFn: FetchLike = fetch,
): Promise<GoogleCalendarListItem> {
  const encodedId = encodeURIComponent(calendarId)
  const res = await fetchFn(`${GOOGLE_CALENDAR_API}/calendars/${encodedId}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  const data = await parseJsonOrThrow<{ id?: string; summary?: string }>(res)
  return {
    id: data.id || calendarId,
    summary: (data.summary || calendarId).trim(),
  }
}

export async function listEventsInWindow(
  accessToken: string,
  calendarId: string,
  input: { timeMinIso: string; timeMaxIso: string },
  fetchFn: FetchLike = fetch,
): Promise<GoogleCalendarEvent[]> {
  const encodedId = encodeURIComponent(calendarId)
  const events: GoogleCalendarEvent[] = []
  let pageToken: string | undefined

  do {
    const params = new URLSearchParams({
      singleEvents: 'true',
      timeMin: input.timeMinIso,
      timeMax: input.timeMaxIso,
      maxResults: '250',
      orderBy: 'startTime',
    })
    if (pageToken) params.set('pageToken', pageToken)

    const res = await fetchFn(
      `${GOOGLE_CALENDAR_API}/calendars/${encodedId}/events?${params.toString()}`,
      { headers: { Authorization: `Bearer ${accessToken}` } },
    )
    const data = await parseJsonOrThrow<{
      items?: GoogleCalendarEvent[]
      nextPageToken?: string
    }>(res)
    if (Array.isArray(data.items)) {
      events.push(...data.items)
    }
    pageToken = data.nextPageToken
  } while (pageToken)

  return events
}

export async function insertEvent(
  accessToken: string,
  calendarId: string,
  payload: GoogleCalendarEventPayload,
  fetchFn: FetchLike = fetch,
): Promise<{ id: string }> {
  const encodedId = encodeURIComponent(calendarId)
  const res = await fetchFn(`${GOOGLE_CALENDAR_API}/calendars/${encodedId}/events`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })
  const data = await parseJsonOrThrow<{ id: string }>(res)
  return { id: data.id }
}

export async function patchEvent(
  accessToken: string,
  calendarId: string,
  eventId: string,
  payload: GoogleCalendarEventPayload,
  fetchFn: FetchLike = fetch,
): Promise<{ id: string }> {
  const encodedCal = encodeURIComponent(calendarId)
  const encodedEvent = encodeURIComponent(eventId)
  const res = await fetchFn(
    `${GOOGLE_CALENDAR_API}/calendars/${encodedCal}/events/${encodedEvent}`,
    {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    },
  )
  const data = await parseJsonOrThrow<{ id: string }>(res)
  return { id: data.id }
}

export async function deleteEvent(
  accessToken: string,
  calendarId: string,
  eventId: string,
  fetchFn: FetchLike = fetch,
): Promise<void> {
  const encodedCal = encodeURIComponent(calendarId)
  const encodedEvent = encodeURIComponent(eventId)
  const res = await fetchFn(
    `${GOOGLE_CALENDAR_API}/calendars/${encodedCal}/events/${encodedEvent}`,
    {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${accessToken}` },
    },
  )
  if (res.status === 404 || res.status === 410) return
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new GoogleApiError(res.status, `Google API error ${res.status}: ${text.slice(0, 300)}`)
  }
}

export async function watchEvents(
  accessToken: string,
  calendarId: string,
  input: { channelId: string; address: string; token: string },
  fetchFn: FetchLike = fetch,
): Promise<{ resourceId: string; expirationIso: string | null }> {
  const encodedId = encodeURIComponent(calendarId)
  const res = await fetchFn(`${GOOGLE_CALENDAR_API}/calendars/${encodedId}/events/watch`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      id: input.channelId,
      type: 'web_hook',
      address: input.address,
      token: input.token,
    }),
  })
  const data = await parseJsonOrThrow<{ resourceId?: string; expiration?: string }>(res)
  const expirationMs = data.expiration ? Number(data.expiration) : NaN
  return {
    resourceId: data.resourceId ?? '',
    expirationIso: Number.isFinite(expirationMs) ? new Date(expirationMs).toISOString() : null,
  }
}

export async function stopChannel(
  accessToken: string,
  input: { channelId: string; resourceId: string },
  fetchFn: FetchLike = fetch,
): Promise<void> {
  const res = await fetchFn(`${GOOGLE_CALENDAR_API}/channels/stop`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      id: input.channelId,
      resourceId: input.resourceId,
    }),
  })
  if (res.status === 404 || res.status === 410) return
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new GoogleApiError(res.status, `Google API error ${res.status}: ${text.slice(0, 300)}`)
  }
}
