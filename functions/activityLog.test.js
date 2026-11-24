import assert from 'node:assert/strict'
import test from 'node:test'

import {
  extractClientIp,
  extractUserAgent,
  parseBrowserSummary,
  sanitizeDetails,
  sanitizePath,
  sanitizeSessionId,
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
