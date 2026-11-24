import { collection, getDocs, limit, orderBy, query } from 'firebase/firestore'
import { httpsCallable } from 'firebase/functions'
import * as v from 'valibot'

import { firebaseFunctions, firestore } from '../firebase'
import { activityLogsCollectionPath } from './salonPaths'
import { activityLogSchema, type ActivityAction, type ActivityLog } from './schemas'

export type ClientActivityAction = 'page_view' | 'admin_login' | 'admin_logout'

export type ClientActivityDetails = Record<string, string | number | boolean | null>

export type ClientActivityInput = {
  action: ClientActivityAction
  path?: string
  details?: ClientActivityDetails
}

export type ActivityLogWithId = ActivityLog & { id: string }

export type ActivityLogsResult = {
  logs: ActivityLogWithId[]
  skippedCount: number
}

export type ActivityCategory = 'all' | 'page_views' | 'bookings' | 'auth' | 'admin'

const SESSION_STORAGE_KEY = 'salonflow.activitySessionId'
let fallbackSessionId: string | null = null

function generateSessionId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `s-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

export function getOrCreateSessionId(): string {
  try {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      const existing = window.sessionStorage.getItem(SESSION_STORAGE_KEY)
      if (existing && /^[A-Za-z0-9_-]{8,64}$/.test(existing)) {
        return existing
      }
      const created = generateSessionId()
      window.sessionStorage.setItem(SESSION_STORAGE_KEY, created)
      return created
    }
  } catch {
    // Ignore storage access errors in restricted browsing contexts.
  }
  if (!fallbackSessionId) {
    fallbackSessionId = generateSessionId()
  }
  return fallbackSessionId
}

export async function logClientActivity(input: ClientActivityInput): Promise<void> {
  try {
    const callable = httpsCallable<
      {
        action: ClientActivityAction
        path?: string
        sessionId: string
        details?: ClientActivityDetails
      },
      { ok: true }
    >(firebaseFunctions, 'logActivity')
    await callable({
      action: input.action,
      ...(input.path ? { path: input.path } : {}),
      sessionId: getOrCreateSessionId(),
      ...(input.details ? { details: input.details } : {}),
    })
  } catch {
    // Logging must never block or break user navigation, login, or booking.
  }
}

export async function fetchActivityLogs(
  salonId: string,
  limitCount = 200,
): Promise<ActivityLogsResult> {
  const colRef = collection(firestore, activityLogsCollectionPath(salonId))
  const snapshot = await getDocs(query(colRef, orderBy('createdAt', 'desc'), limit(limitCount)))
  const logs: ActivityLogWithId[] = []
  let skippedCount = 0
  for (const docSnap of snapshot.docs) {
    const parsed = v.safeParse(activityLogSchema, docSnap.data())
    if (parsed.success) {
      logs.push({ id: docSnap.id, ...parsed.output })
    } else {
      skippedCount += 1
    }
  }
  return { logs, skippedCount }
}

export function categoryOfAction(action: ActivityAction): Exclude<ActivityCategory, 'all'> {
  if (action === 'page_view') return 'page_views'
  if (
    action === 'reservation_created' ||
    action === 'reservation_viewed' ||
    action === 'reservation_cancelled' ||
    action === 'reservation_rescheduled'
  ) {
    return 'bookings'
  }
  if (action === 'admin_login' || action === 'admin_login_failed' || action === 'admin_logout') {
    return 'auth'
  }
  return 'admin'
}
