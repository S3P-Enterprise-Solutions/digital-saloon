import { createSign, randomBytes } from 'node:crypto'
import { readFileSync, statSync } from 'node:fs'

import { functionsRegion } from '../config'
import type { GoogleCalendarEvent, GoogleCalendarEventPayload } from './mapping'

export type FetchLike = typeof fetch

export type ServiceAccountCredentials = {
  clientEmail: string
  privateKey: string
}

export type GoogleCalendarListItem = {
  id: string
  summary: string
  primary?: boolean
  accessRole?: string
}

const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token'
const GOOGLE_CALENDAR_API = 'https://www.googleapis.com/calendar/v3'
const METADATA_BASE_URL =
  'http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default'
export const GOOGLE_CALENDAR_SCOPE = 'https://www.googleapis.com/auth/calendar'
const DEFAULT_TOKEN_TTL_SECONDS = 3000
const TOKEN_EXPIRY_MARGIN_MS = 120_000

type CachedToken = {
  accessToken: string
  expiresAtMs: number
  serviceAccountEmail: string
}

type CachedFileCredentials = {
  path: string
  mtimeMs: number
  credentials: ServiceAccountCredentials
}

let cachedToken: CachedToken | null = null
let cachedMetadataEmail: string | null = null
let cachedFileCredentials: CachedFileCredentials | null = null

export function clearServiceAccountTokenCache(): void {
  cachedToken = null
  cachedMetadataEmail = null
  cachedFileCredentials = null
}

/** Only `writer` and `owner` roles can create/update/delete events on a shared calendar. */
export function isWritableAccessRole(accessRole: string | null | undefined): boolean {
  return accessRole === 'writer' || accessRole === 'owner'
}

function envString(env: Record<string, string | undefined>, name: string): string | null {
  const value = env[name]?.trim()
  return value ? value : null
}

function parseJsonCredentials(raw: string): ServiceAccountCredentials | null {
  const candidates = [raw]
  if (!raw.startsWith('{')) {
    try {
      candidates.push(Buffer.from(raw, 'base64').toString('utf8'))
    } catch {
      // ignore invalid base64
    }
  }
  for (const candidate of candidates) {
    try {
      const parsed = JSON.parse(candidate) as {
        client_email?: unknown
        private_key?: unknown
      }
      if (
        typeof parsed.client_email === 'string' &&
        parsed.client_email.trim() &&
        typeof parsed.private_key === 'string' &&
        parsed.private_key.trim()
      ) {
        return {
          clientEmail: parsed.client_email.trim(),
          privateKey: parsed.private_key.replace(/\\n/g, '\n'),
        }
      }
    } catch {
      // try next candidate
    }
  }
  return null
}

export function parseServiceAccountCredentials(
  env: Record<string, string | undefined> = process.env,
): ServiceAccountCredentials | null {
  const inlineJson = envString(env, 'GOOGLE_SERVICE_ACCOUNT_JSON')
  if (inlineJson) {
    const parsed = parseJsonCredentials(inlineJson)
    if (parsed) return parsed
  }

  const email = envString(env, 'GOOGLE_SERVICE_ACCOUNT_EMAIL')
  const privateKey = envString(env, 'GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY')
  if (email && privateKey) {
    return {
      clientEmail: email,
      privateKey: privateKey.replace(/\\n/g, '\n'),
    }
  }

  const credentialsPath = envString(env, 'GOOGLE_APPLICATION_CREDENTIALS')
  if (credentialsPath) {
    try {
      const mtimeMs = statSync(credentialsPath).mtimeMs
      if (
        cachedFileCredentials &&
        cachedFileCredentials.path === credentialsPath &&
        cachedFileCredentials.mtimeMs === mtimeMs
      ) {
        return cachedFileCredentials.credentials
      }
      const fileContents = readFileSync(credentialsPath, 'utf8')
      const parsed = parseJsonCredentials(fileContents)
      if (parsed) {
        cachedFileCredentials = { path: credentialsPath, mtimeMs, credentials: parsed }
        return parsed
      }
    } catch {
      // ignore unreadable file
    }
  }

  return null
}

export function createServiceAccountJwt(
  credentials: ServiceAccountCredentials,
  scope: string = GOOGLE_CALENDAR_SCOPE,
  nowSeconds: number = Math.floor(Date.now() / 1000),
): string {
  const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' }), 'utf8').toString(
    'base64url',
  )
  const payload = Buffer.from(
    JSON.stringify({
      iss: credentials.clientEmail,
      scope,
      aud: GOOGLE_TOKEN_URL,
      iat: nowSeconds,
      exp: nowSeconds + 3600,
    }),
    'utf8',
  ).toString('base64url')
  const unsigned = `${header}.${payload}`
  const signature = createSign('RSA-SHA256')
    .update(unsigned)
    .end()
    .sign(credentials.privateKey, 'base64url')
  return `${unsigned}.${signature}`
}

async function exchangeJwtForAccessToken(
  jwt: string,
  fetchFn: FetchLike = fetch,
): Promise<{ accessToken: string; expiresInSeconds: number }> {
  const body = new URLSearchParams({
    grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
    assertion: jwt,
  })
  const res = await fetchFn(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  })
  const data = await parseJsonOrThrow<{ access_token: string; expires_in?: number }>(res)
  return {
    accessToken: data.access_token,
    expiresInSeconds: Number(data.expires_in ?? DEFAULT_TOKEN_TTL_SECONDS),
  }
}

async function fetchMetadataServiceAccountEmail(
  fetchFn: FetchLike = fetch,
): Promise<string | null> {
  if (cachedMetadataEmail) return cachedMetadataEmail
  try {
    const res = await fetchFn(`${METADATA_BASE_URL}/email`, {
      headers: { 'Metadata-Flavor': 'Google' },
    })
    if (!res.ok) return null
    const email = (await res.text()).trim()
    if (!email) return null
    cachedMetadataEmail = email
    return email
  } catch {
    return null
  }
}

async function fetchMetadataAccessToken(
  fetchFn: FetchLike = fetch,
): Promise<{ accessToken: string; expiresInSeconds: number } | null> {
  try {
    const url = `${METADATA_BASE_URL}/token?scopes=${encodeURIComponent(GOOGLE_CALENDAR_SCOPE)}`
    const res = await fetchFn(url, {
      headers: { 'Metadata-Flavor': 'Google' },
    })
    if (!res.ok) return null
    const data = (await res.json()) as { access_token?: string; expires_in?: number }
    if (typeof data.access_token !== 'string' || !data.access_token) return null
    return {
      accessToken: data.access_token,
      expiresInSeconds: Number(data.expires_in ?? DEFAULT_TOKEN_TTL_SECONDS),
    }
  } catch {
    return null
  }
}

export async function getServiceAccountEmail(
  env: Record<string, string | undefined> = process.env,
  fetchFn: FetchLike = fetch,
): Promise<string | null> {
  const creds = parseServiceAccountCredentials(env)
  if (creds) return creds.clientEmail
  if (env.FUNCTIONS_EMULATOR === 'true') return null
  return fetchMetadataServiceAccountEmail(fetchFn)
}

export async function getServiceAccountAccessToken(
  env: Record<string, string | undefined> = process.env,
  fetchFn: FetchLike = fetch,
  nowMs: number = Date.now(),
): Promise<{ accessToken: string; serviceAccountEmail: string } | null> {
  if (cachedToken && cachedToken.expiresAtMs > nowMs + TOKEN_EXPIRY_MARGIN_MS) {
    return {
      accessToken: cachedToken.accessToken,
      serviceAccountEmail: cachedToken.serviceAccountEmail,
    }
  }

  const creds = parseServiceAccountCredentials(env)
  if (creds) {
    const jwt = createServiceAccountJwt(creds, GOOGLE_CALENDAR_SCOPE, Math.floor(nowMs / 1000))
    const token = await exchangeJwtForAccessToken(jwt, fetchFn)
    cachedToken = {
      accessToken: token.accessToken,
      expiresAtMs: nowMs + token.expiresInSeconds * 1000,
      serviceAccountEmail: creds.clientEmail,
    }
    return {
      accessToken: token.accessToken,
      serviceAccountEmail: creds.clientEmail,
    }
  }

  if (env.FUNCTIONS_EMULATOR === 'true') return null

  const [email, token] = await Promise.all([
    fetchMetadataServiceAccountEmail(fetchFn),
    fetchMetadataAccessToken(fetchFn),
  ])
  if (!email || !token) return null

  cachedToken = {
    accessToken: token.accessToken,
    expiresAtMs: nowMs + token.expiresInSeconds * 1000,
    serviceAccountEmail: email,
  }
  return {
    accessToken: token.accessToken,
    serviceAccountEmail: email,
  }
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

export function createChannelToken(): string {
  return randomBytes(16).toString('base64url')
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
    if (res.status === 401) {
      cachedToken = null
    }
    const text = await res.text().catch(() => '')
    throw new GoogleApiError(res.status, `Google API error ${res.status}: ${text.slice(0, 300)}`)
  }
  return (await res.json()) as T
}

export async function getCalendarListEntry(
  accessToken: string,
  calendarId: string,
  fetchFn: FetchLike = fetch,
): Promise<GoogleCalendarListItem> {
  const encodedId = encodeURIComponent(calendarId)
  const res = await fetchFn(`${GOOGLE_CALENDAR_API}/users/me/calendarList/${encodedId}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  const data = await parseJsonOrThrow<{
    id?: string
    summary?: string
    summaryOverride?: string
    accessRole?: string
  }>(res)
  return {
    id: data.id || calendarId,
    summary: (data.summaryOverride || data.summary || calendarId).trim(),
    accessRole: data.accessRole,
  }
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

/**
 * Adds a shared calendar to the service account's calendar list so we can read its
 * summary and accessRole (e.g. 'writer', 'owner', 'reader'). On 409 (already subscribed)
 * or other non-auth insert errors, reads the existing calendarList entry first so
 * accessRole is preserved before falling back to getCalendar.
 */
export async function subscribeToCalendar(
  accessToken: string,
  calendarId: string,
  fetchFn: FetchLike = fetch,
): Promise<GoogleCalendarListItem> {
  const res = await fetchFn(`${GOOGLE_CALENDAR_API}/users/me/calendarList`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ id: calendarId }),
  })
  if (res.ok) {
    const data = (await res.json()) as {
      id?: string
      summary?: string
      summaryOverride?: string
      accessRole?: string
    }
    return {
      id: data.id || calendarId,
      summary: (data.summaryOverride || data.summary || calendarId).trim(),
      accessRole: data.accessRole,
    }
  }
  if (res.status === 401) {
    cachedToken = null
  }
  if (res.status === 404 || res.status === 403 || res.status === 401) {
    const text = await res.text().catch(() => '')
    throw new GoogleApiError(res.status, `Google API error ${res.status}: ${text.slice(0, 300)}`)
  }
  try {
    return await getCalendarListEntry(accessToken, calendarId, fetchFn)
  } catch (err) {
    if (
      err instanceof GoogleApiError &&
      (err.status === 404 || err.status === 403 || err.status === 401)
    ) {
      throw err
    }
    return getCalendar(accessToken, calendarId, fetchFn)
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
