import assert from 'node:assert/strict'
import test from 'node:test'

import { resolveEmailTransport } from './lib/booking/sendBookingEmail.js'

const SALON = 'KIMM Hair'

test('no config → none', () => {
  assert.deepEqual(resolveEmailTransport({}, SALON), { kind: 'none' })
})

test('Mail-Catcher wins over SMTP and Resend', () => {
  const t = resolveEmailTransport(
    {
      MAIL_CATCHER_URL: 'http://127.0.0.1:4105/emails',
      SMTP_USER: 'a@gmail.com',
      SMTP_PASS: 'x',
      RESEND_API_KEY: 're_x',
    },
    SALON,
  )
  assert.equal(t.kind, 'mailCatcher')
})

test('SMTP wins over Resend, defaults to Gmail and salon display name', () => {
  const t = resolveEmailTransport(
    { SMTP_USER: 'kimm@gmail.com', SMTP_PASS: 'abcd efgh ijkl mnop', RESEND_API_KEY: 're_x' },
    SALON,
  )
  assert.deepEqual(t, {
    kind: 'smtp',
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    user: 'kimm@gmail.com',
    pass: 'abcdefghijklmnop',
    from: '"KIMM Hair" <kimm@gmail.com>',
  })
})

test('SMTP respects host, port 587 (STARTTLS) and explicit SMTP_FROM', () => {
  const t = resolveEmailTransport(
    {
      SMTP_HOST: 'smtp.example.org',
      SMTP_PORT: '587',
      SMTP_USER: 'u',
      SMTP_PASS: 'p',
      SMTP_FROM: 'Salon <u@example.org>',
    },
    SALON,
  )
  assert.equal(t.kind, 'smtp')
  assert.equal(t.host, 'smtp.example.org')
  assert.equal(t.port, 587)
  assert.equal(t.secure, false)
  assert.equal(t.from, 'Salon <u@example.org>')
})

test('SMTP needs both user and password', () => {
  assert.equal(resolveEmailTransport({ SMTP_USER: 'u' }, SALON).kind, 'none')
  assert.equal(
    resolveEmailTransport({ SMTP_USER: 'u', RESEND_API_KEY: 're_x' }, SALON).kind,
    'resend',
  )
})

test('Resend fallback keeps default sender', () => {
  assert.deepEqual(resolveEmailTransport({ RESEND_API_KEY: 're_x' }, SALON), {
    kind: 'resend',
    apiKey: 're_x',
    from: 'onboarding@resend.dev',
  })
})

test('getEmailPalette returns complete palette for kimm, salon1500, and hairboutique', async () => {
  const { getEmailPalette } = await import('./lib/booking/sendBookingEmail.js')
  const prevBrand = process.env.BRAND
  try {
    for (const brand of ['kimm', 'salon1500', 'hairboutique']) {
      process.env.BRAND = brand
      const p = getEmailPalette()
      assert.ok(p.canvasBg && p.primary && p.accent && p.fontFamily && p.headingFontFamily)
    }
  } finally {
    if (prevBrand === undefined) delete process.env.BRAND
    else process.env.BRAND = prevBrand
  }
})
