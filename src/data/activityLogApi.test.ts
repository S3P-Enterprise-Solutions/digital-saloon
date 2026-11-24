import * as v from 'valibot'
import { describe, expect, it } from 'vitest'

import { categoryOfAction, getOrCreateSessionId } from './activityLogApi'
import { activityLogsCollectionPath } from './salonPaths'
import { activityLogSchema } from './schemas'

describe('activityLogApi', () => {
  it('builds the salon activityLogs collection path', () => {
    expect(activityLogsCollectionPath('pilot')).toBe('salons/pilot/activityLogs')
  })

  it('validates a complete activity log document with valibot', () => {
    const parsed = v.safeParse(activityLogSchema, {
      createdAt: '2026-11-24T16:30:00.000Z',
      action: 'page_view',
      source: 'client',
      ip: '203.0.113.5',
      userAgent: 'Mozilla/5.0 Chrome/131.0',
      browser: 'Chrome 131 · Windows',
      path: '/',
      sessionId: 'sess-12345',
      actorType: 'anonymous',
      actorUid: null,
      actorEmail: null,
      details: { reservationId: 'res-1', count: 2, ok: true },
    })
    expect(parsed.success).toBe(true)
  })

  it('rejects unknown activity actions', () => {
    const parsed = v.safeParse(activityLogSchema, {
      createdAt: '2026-11-24T16:30:00.000Z',
      action: 'not_a_real_action',
      source: 'client',
      ip: '203.0.113.5',
      userAgent: 'Mozilla/5.0',
      browser: 'Unknown',
      path: '/',
      sessionId: null,
      actorType: 'anonymous',
      actorUid: null,
      actorEmail: null,
      details: null,
    })
    expect(parsed.success).toBe(false)
  })

  it('maps actions to UI filter categories', () => {
    expect(categoryOfAction('page_view')).toBe('page_views')
    expect(categoryOfAction('reservation_created')).toBe('bookings')
    expect(categoryOfAction('reservation_cancelled')).toBe('bookings')
    expect(categoryOfAction('admin_login')).toBe('auth')
    expect(categoryOfAction('admin_login_failed')).toBe('auth')
    expect(categoryOfAction('admin_logout')).toBe('auth')
    expect(categoryOfAction('admin_reservation_confirmed')).toBe('admin')
  })

  it('returns a stable session id across repeated calls', () => {
    const first = getOrCreateSessionId()
    const second = getOrCreateSessionId()
    expect(first.length).toBeGreaterThanOrEqual(8)
    expect(second).toBe(first)
  })
})
