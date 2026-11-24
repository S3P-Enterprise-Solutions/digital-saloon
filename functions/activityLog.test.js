import assert from 'node:assert/strict'
import test from 'node:test'

import {
  extractClientIp,
  extractUserAgent,
  isPageViewRateLimited,
  parseBrowserSummary,
  resetPageViewRateLimiter,
  resolveActorFromRequest,
  sanitizeDetails,
  sanitizePath,
  sanitizeSessionId,
  validateClientActivityRequest,
} from './lib/logging/activityLog.js'

test('logActivity callable is exported from lib/index.js', async () => {
  const mod = await import('./lib/index.js')
  assert.equal(typeof mod.logActivity, 'function')
})

test('extractClientIp prefers x-forwarded-for first entry and strips ::ffff:', () => {
  assert.equal(
    extractClientIp({
      headers: { 'x-forwarded-for': '203.0.113.10, 10.0.0.1' },
      ip: '127.0.0.1',
    }),
    '203.0.113.10',
  )
  assert.equal(
    extractClientIp({
      headers: { 'fastly-client-ip': '::ffff:198.51.100.7' },
    }),
    '198.51.100.7',
  )
  assert.equal(
    extractClientIp({
      socket: { remoteAddress: '::ffff:127.0.0.1' },
    }),
    '127.0.0.1',
  )
  assert.equal(extractClientIp(undefined), 'unknown')
})

test('extractUserAgent returns header value or unknown', () => {
  assert.equal(
    extractUserAgent({ headers: { 'user-agent': 'Mozilla/5.0 Test' } }),
    'Mozilla/5.0 Test',
  )
  assert.equal(extractUserAgent({ headers: {} }), 'unknown')
})

test('parseBrowserSummary identifies common browsers and platforms', () => {
  assert.equal(
    parseBrowserSummary(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    ),
    'Chrome 131 · Windows',
  )
  assert.equal(
    parseBrowserSummary(
      'Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Mobile/15E148 Safari/604.1',
    ),
    'Safari 18 · iOS',
  )
  assert.equal(
    parseBrowserSummary(
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:133.0) Gecko/20100101 Firefox/133.0',
    ),
    'Firefox 133 · macOS',
  )
  assert.equal(
    parseBrowserSummary(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36 Edg/131.0.0.0',
    ),
    'Edge 131 · Windows',
  )
  assert.equal(
    parseBrowserSummary('Googlebot/2.1 (+http://www.google.com/bot.html)'),
    'Bot / Crawler',
  )
  assert.equal(parseBrowserSummary('unknown'), 'Unknown')
})

test('sanitizePath strips query params and hashes so tokens are never stored', () => {
  assert.equal(sanitizePath('/manage?token=secret-token-123#top'), '/manage')
  assert.equal(sanitizePath('/book'), '/book')
  assert.equal(sanitizePath('https://evil.example/path'), null)
  assert.equal(sanitizePath(null), null)
})

test('sanitizeSessionId accepts safe ids and rejects invalid ones', () => {
  assert.equal(sanitizeSessionId('sess_abc-123'), 'sess_abc-123')
  assert.equal(sanitizeSessionId('bad id with spaces'), null)
  assert.equal(sanitizeSessionId(''), null)
})

test('sanitizeDetails keeps bounded primitives and drops unsafe keys or nested objects', () => {
  assert.deepEqual(
    sanitizeDetails({
      reservationId: 'res-1',
      serviceCount: 2,
      enabled: true,
      note: null,
      nested: { secret: 'drop-me' },
      'bad key!': 'drop-me',
    }),
    {
      reservationId: 'res-1',
      serviceCount: 2,
      enabled: true,
      note: null,
    },
  )
  assert.equal(sanitizeDetails({}), null)
})

test('resolveActorFromRequest distinguishes anonymous, user, admin, and operator', async () => {
  assert.deepEqual(await resolveActorFromRequest({ auth: undefined }, async () => 'admin'), {
    actorType: 'anonymous',
    actorUid: null,
    actorEmail: null,
  })

  assert.deepEqual(
    await resolveActorFromRequest(
      { auth: { uid: 'op-1', token: { operator: true, email: 'op@example.com' } } },
      async () => null,
    ),
    { actorType: 'operator', actorUid: 'op-1', actorEmail: 'op@example.com' },
  )

  assert.deepEqual(
    await resolveActorFromRequest(
      { auth: { uid: 'admin-1', token: { email: 'admin@example.com' } } },
      async () => 'admin',
    ),
    { actorType: 'admin', actorUid: 'admin-1', actorEmail: 'admin@example.com' },
  )

  assert.deepEqual(
    await resolveActorFromRequest(
      { auth: { uid: 'user-1', token: { email: 'customer@example.com' } } },
      async () => 'user',
    ),
    { actorType: 'user', actorUid: 'user-1', actorEmail: 'customer@example.com' },
  )

  assert.deepEqual(
    await resolveActorFromRequest(
      { auth: { uid: 'user-2', token: { email: 'fallback@example.com' } } },
      async () => {
        throw new Error('firestore unavailable')
      },
    ),
    { actorType: 'user', actorUid: 'user-2', actorEmail: 'fallback@example.com' },
  )
})

test('validateClientActivityRequest rejects client admin_login_failed and enforces admin auth for admin_login/admin_logout', async () => {
  // page_view works without calling verifyAdmin
  let verifyCalls = 0
  const pageView = await validateClientActivityRequest(
    { data: { action: 'page_view', path: '/book?foo=bar', sessionId: 'sess_1' } },
    async () => {
      verifyCalls += 1
      return 'admin-1'
    },
  )
  assert.equal(verifyCalls, 0)
  assert.equal(pageView.action, 'page_view')
  assert.equal(pageView.path, '/book')

  // admin_login_failed is server-only and rejected from client callable
  await assert.rejects(
    validateClientActivityRequest({ data: { action: 'admin_login_failed', path: '/login' } }),
    /Unsupported activity action/,
  )

  // admin_login & admin_logout require verifyAdmin
  for (const action of ['admin_login', 'admin_logout']) {
    await assert.rejects(
      validateClientActivityRequest({ data: { action, path: '/login' } }, async () => {
        throw new Error('permission-denied')
      }),
      /permission-denied/,
    )

    const verified = await validateClientActivityRequest(
      { data: { action, path: '/login' } },
      async () => {
        verifyCalls += 1
        return 'admin-1'
      },
    )
    assert.equal(verified.action, action)
  }
  assert.equal(verifyCalls, 2)
})

test('isPageViewRateLimited allows up to 60 views per minute and resets after window', () => {
  resetPageViewRateLimiter()
  const base = 1_700_000_000_000
  for (let i = 0; i < 60; i += 1) {
    assert.equal(isPageViewRateLimited('203.0.113.9', base + i), false)
  }
  assert.equal(isPageViewRateLimited('203.0.113.9', base + 1000), true)
  // Different IP is unaffected
  assert.equal(isPageViewRateLimited('203.0.113.10', base + 1000), false)
  // Window resets after 60s
  assert.equal(isPageViewRateLimited('203.0.113.9', base + 60_001), false)
})
