import { getFirestore, type Firestore } from 'firebase-admin/firestore'
import * as logger from 'firebase-functions/logger'
import { HttpsError, onCall, type CallableRequest } from 'firebase-functions/v2/https'

import { assertAdmin } from '../authz'
import { functionsRegion, getSalonId } from '../config'
import { isObject } from '../schemas'

export const CLIENT_ACTIVITY_ACTIONS = ['page_view', 'admin_login', 'admin_logout'] as const

export const ADMIN_CLIENT_ACTIVITY_ACTIONS: ReadonlySet<string> = new Set([
  'admin_login',
  'admin_logout',
])

export const SERVER_ACTIVITY_ACTIONS = [
  'reservation_created',
  'reservation_viewed',
  'reservation_cancelled',
  'reservation_rescheduled',
  'admin_login',
  'admin_login_failed',
  'admin_reservation_created',
  'admin_reservation_confirmed',
  'admin_reservation_declined',
  'admin_reservation_cancelled',
  'admin_reservation_updated',
  'admin_reservation_completed',
  'admin_demo_mode_toggled',
  'admin_staff_created',
] as const

export type ClientActivityAction = (typeof CLIENT_ACTIVITY_ACTIONS)[number]
export type ServerActivityAction = (typeof SERVER_ACTIVITY_ACTIONS)[number]
export type ActivityAction = ClientActivityAction | ServerActivityAction
export type ActivitySource = 'client' | 'server'
export type ActivityActorType = 'anonymous' | 'user' | 'admin' | 'operator'
export type ActivityDetailValue = string | number | boolean | null
export type ActivityDetails = Record<string, ActivityDetailValue>

export type ActivityLogEntry = {
  createdAt: string
  action: ActivityAction
  source: ActivitySource
  ip: string
  userAgent: string
  browser: string
  path: string | null
  sessionId: string | null
  actorType: ActivityActorType
  actorUid: string | null
  actorEmail: string | null
  details: ActivityDetails | null
}

type RequestLike = {
  headers?: Record<string, string | string[] | undefined>
  ip?: string
  socket?: { remoteAddress?: string }
}

export type RoleLookup = (uid: string) => Promise<string | null>
export type AdminVerifier = (request: CallableRequest<unknown>) => Promise<string>

const CLIENT_ACTION_SET: ReadonlySet<string> = new Set(CLIENT_ACTIVITY_ACTIONS)
const MAX_UA_LENGTH = 512
const MAX_PATH_LENGTH = 256
const MAX_SESSION_ID_LENGTH = 64
const MAX_DETAILS_KEYS = 10
const MAX_DETAIL_STRING_LENGTH = 160

const PAGE_VIEW_WINDOW_MS = 60_000
const PAGE_VIEW_MAX_PER_WINDOW = 60
const PAGE_VIEW_MAX_TRACKED_IPS = 1000
const pageViewRateBuckets = new Map<string, { count: number; resetAt: number }>()

export function isPageViewRateLimited(ip: string, nowMs = Date.now()): boolean {
  if (pageViewRateBuckets.size > PAGE_VIEW_MAX_TRACKED_IPS) {
    for (const [key, bucket] of pageViewRateBuckets.entries()) {
      if (bucket.resetAt <= nowMs) {
        pageViewRateBuckets.delete(key)
      }
    }
  }
  const existing = pageViewRateBuckets.get(ip)
  if (!existing || existing.resetAt <= nowMs) {
    pageViewRateBuckets.set(ip, { count: 1, resetAt: nowMs + PAGE_VIEW_WINDOW_MS })
    return false
  }
  existing.count += 1
  return existing.count > PAGE_VIEW_MAX_PER_WINDOW
}

export function resetPageViewRateLimiter(): void {
  pageViewRateBuckets.clear()
}

function firstHeaderValue(
  headers: Record<string, string | string[] | undefined> | undefined,
  name: string,
): string | null {
  if (!headers) return null
  const raw = headers[name] ?? headers[name.toLowerCase()]
  if (typeof raw === 'string') {
    const trimmed = raw.trim()
    return trimmed.length > 0 ? trimmed : null
  }
  if (Array.isArray(raw)) {
    for (const item of raw) {
      if (typeof item === 'string' && item.trim().length > 0) {
        return item.trim()
      }
    }
  }
  return null
}

function normalizeIp(raw: string): string {
  const first = raw.split(',')[0]?.trim() ?? ''
  if (!first) return 'unknown'
  const stripped = first.startsWith('::ffff:') ? first.slice(7) : first
  return stripped.slice(0, 128) || 'unknown'
}

export function extractClientIp(rawRequest?: RequestLike): string {
  if (!rawRequest) return 'unknown'
  const forwarded = firstHeaderValue(rawRequest.headers, 'x-forwarded-for')
  if (forwarded) return normalizeIp(forwarded)
  const fastly = firstHeaderValue(rawRequest.headers, 'fastly-client-ip')
  if (fastly) return normalizeIp(fastly)
  const realIp = firstHeaderValue(rawRequest.headers, 'x-real-ip')
  if (realIp) return normalizeIp(realIp)
  if (typeof rawRequest.ip === 'string' && rawRequest.ip.trim().length > 0) {
    return normalizeIp(rawRequest.ip)
  }
  const socketIp = rawRequest.socket?.remoteAddress
  if (typeof socketIp === 'string' && socketIp.trim().length > 0) {
    return normalizeIp(socketIp)
  }
  return 'unknown'
}

export function extractUserAgent(rawRequest?: RequestLike): string {
  const ua = firstHeaderValue(rawRequest?.headers, 'user-agent')
  if (!ua) return 'unknown'
  return ua.slice(0, MAX_UA_LENGTH)
}

function detectBrowserName(ua: string): string {
  if (/bot|crawler|spider|slurp|bingpreview|facebookexternalhit|whatsapp/i.test(ua)) {
    return 'Bot / Crawler'
  }
  const edge = /Edg(?:A|iOS)?\/(\d+)/.exec(ua)
  if (edge) return `Edge ${edge[1]}`
  const opera = /(?:OPR|Opera)\/(\d+)/.exec(ua)
  if (opera) return `Opera ${opera[1]}`
  const firefox = /(?:Firefox|FxiOS)\/(\d+)/.exec(ua)
  if (firefox) return `Firefox ${firefox[1]}`
  const chrome = /(?:Chrome|CriOS)\/(\d+)/.exec(ua)
  if (chrome) return `Chrome ${chrome[1]}`
  const safari = /Version\/(\d+).*Safari/.exec(ua)
  if (safari) return `Safari ${safari[1]}`
  if (/Safari\//.test(ua)) return 'Safari'
  return 'Unknown browser'
}

function detectOsName(ua: string): string | null {
  if (/iPhone|iPad|iPod/.test(ua)) return 'iOS'
  if (/Android/.test(ua)) return 'Android'
  if (/Windows NT/.test(ua)) return 'Windows'
  if (/Mac OS X/.test(ua)) return 'macOS'
  if (/CrOS/.test(ua)) return 'ChromeOS'
  if (/Linux/.test(ua)) return 'Linux'
  return null
}

export function parseBrowserSummary(userAgent: string): string {
  if (!userAgent || userAgent === 'unknown') return 'Unknown'
  const browser = detectBrowserName(userAgent)
  const os = detectOsName(userAgent)
  return os ? `${browser} · ${os}` : browser
}

export function sanitizePath(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  if (!trimmed) return null
  // Strip query string and hash so sensitive tokens (e.g. ?token=...) are never logged.
  const withoutQuery = trimmed.split(/[?#]/)[0] ?? ''
  if (!withoutQuery.startsWith('/')) return null
  return withoutQuery.slice(0, MAX_PATH_LENGTH)
}

export function sanitizeSessionId(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  if (!trimmed || trimmed.length > MAX_SESSION_ID_LENGTH) return null
  if (!/^[A-Za-z0-9_-]+$/.test(trimmed)) return null
  return trimmed
}

export function sanitizeDetails(value: unknown): ActivityDetails | null {
  if (!isObject(value)) return null
  const result: ActivityDetails = {}
  let count = 0
  for (const [rawKey, rawVal] of Object.entries(value)) {
    if (count >= MAX_DETAILS_KEYS) break
    const key = rawKey.trim().slice(0, 48)
    if (!key || !/^[A-Za-z0-9_.-]+$/.test(key)) continue
    if (rawVal === null) {
      result[key] = null
      count += 1
    } else if (typeof rawVal === 'boolean') {
      result[key] = rawVal
      count += 1
    } else if (typeof rawVal === 'number' && Number.isFinite(rawVal)) {
      result[key] = rawVal
      count += 1
    } else if (typeof rawVal === 'string') {
      result[key] = rawVal.trim().slice(0, MAX_DETAIL_STRING_LENGTH)
      count += 1
    }
  }
  return count > 0 ? result : null
}

export async function resolveActorFromRequest(
  request: Pick<CallableRequest<unknown>, 'auth'>,
  lookupRole: RoleLookup,
): Promise<{
  actorType: ActivityActorType
  actorUid: string | null
  actorEmail: string | null
}> {
  const auth = request.auth
  if (!auth) {
    return { actorType: 'anonymous', actorUid: null, actorEmail: null }
  }
  const email = typeof auth.token.email === 'string' ? auth.token.email : null
  if (auth.token.operator === true) {
    return {
      actorType: 'operator',
      actorUid: auth.uid,
      actorEmail: email,
    }
  }
  try {
    const role = await lookupRole(auth.uid)
    return {
      actorType: role === 'admin' ? 'admin' : 'user',
      actorUid: auth.uid,
      actorEmail: email,
    }
  } catch {
    return {
      actorType: 'user',
      actorUid: auth.uid,
      actorEmail: email,
    }
  }
}

export async function validateClientActivityRequest(
  request: CallableRequest<unknown>,
  verifyAdmin: AdminVerifier = assertAdmin,
): Promise<{
  action: ClientActivityAction
  path: string | null
  sessionId: string | null
  details: ActivityDetails | null
}> {
  const data = request.data
  if (!isObject(data)) {
    throw new HttpsError('invalid-argument', 'Invalid payload.')
  }
  const action = typeof data.action === 'string' ? data.action.trim() : ''
  if (!CLIENT_ACTION_SET.has(action)) {
    throw new HttpsError('invalid-argument', 'Unsupported activity action.')
  }
  if (ADMIN_CLIENT_ACTIVITY_ACTIONS.has(action)) {
    await verifyAdmin(request)
  }
  return {
    action: action as ClientActivityAction,
    path: sanitizePath(data.path),
    sessionId: sanitizeSessionId(data.sessionId),
    details: sanitizeDetails(data.details),
  }
}

export async function recordActivityLog(params: {
  request: CallableRequest<unknown>
  action: ActivityAction
  source: ActivitySource
  path?: string | null
  sessionId?: string | null
  details?: ActivityDetails | null
  actorOverride?: {
    actorType?: ActivityActorType
    actorUid?: string | null
    actorEmail?: string | null
  }
  db?: Firestore
  salonId?: string
}): Promise<ActivityLogEntry> {
  const db = params.db ?? getFirestore()
  const ip = extractClientIp(params.request.rawRequest)
  const userAgent = extractUserAgent(params.request.rawRequest)
  const browser = parseBrowserSummary(userAgent)
  const derivedActor =
    params.actorOverride?.actorType !== undefined &&
    params.actorOverride?.actorUid !== undefined &&
    params.actorOverride?.actorEmail !== undefined
      ? {
          actorType: params.actorOverride.actorType,
          actorUid: params.actorOverride.actorUid,
          actorEmail: params.actorOverride.actorEmail,
        }
      : await resolveActorFromRequest(params.request, async (uid) => {
          const snap = await db.collection('users').doc(uid).get()
          const role = snap.data()?.role
          return typeof role === 'string' ? role : null
        })

  const entry: ActivityLogEntry = {
    createdAt: new Date().toISOString(),
    action: params.action,
    source: params.source,
    ip,
    userAgent,
    browser,
    path: sanitizePath(params.path ?? null),
    sessionId: sanitizeSessionId(params.sessionId ?? null),
    actorType: params.actorOverride?.actorType ?? derivedActor.actorType,
    actorUid:
      params.actorOverride?.actorUid !== undefined
        ? params.actorOverride.actorUid
        : derivedActor.actorUid,
    actorEmail:
      params.actorOverride?.actorEmail !== undefined
        ? params.actorOverride.actorEmail
        : derivedActor.actorEmail,
    details: sanitizeDetails(params.details ?? null),
  }

  logger.info('activity_log', entry)

  try {
    const salonId = params.salonId ?? getSalonId()
    await db.collection('salons').doc(salonId).collection('activityLogs').add(entry)
  } catch (error: unknown) {
    logger.warn('Failed to persist activity log entry to Firestore', {
      action: entry.action,
      error: error instanceof Error ? error.message : String(error),
    })
  }

  return entry
}

export const logActivity = onCall({ region: functionsRegion }, async (request) => {
  const parsed = await validateClientActivityRequest(request)
  if (parsed.action === 'page_view') {
    const ip = extractClientIp(request.rawRequest)
    if (isPageViewRateLimited(ip)) {
      return { ok: true as const, throttled: true as const }
    }
  }

  await recordActivityLog({
    request,
    action: parsed.action,
    source: 'client',
    path: parsed.path,
    sessionId: parsed.sessionId,
    details: parsed.details,
  })

  return { ok: true as const }
})
