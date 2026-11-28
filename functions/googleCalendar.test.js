import assert from 'node:assert/strict'
import { createVerify, generateKeyPairSync } from 'node:crypto'
import { describe, it } from 'node:test'

import {
  clearServiceAccountTokenCache,
  createServiceAccountJwt,
  getCalendar,
  getServiceAccountAccessToken,
  getServiceAccountEmail,
  GOOGLE_CALENDAR_SCOPE,
  GoogleApiError,
  isWritableAccessRole,
  parseServiceAccountCredentials,
  subscribeToCalendar,
} from './lib/googleCalendar/client.js'
import {
  blockedSlotDocIdForGoogleEvent,
  googleEventIdForReservation,
  googleEventToBlockedSlot,
  hasBlockedSlotSyncedFieldsChanged,
  isGoogleVisibilityPrivate,
  redactBlockedSlotForViewer,
  reservationToGoogleEvent,
  resolveEffectivePrivacy,
} from './lib/googleCalendar/mapping.js'

describe('googleCalendar mapping', () => {
  it('converts a timed Google Calendar event into a blockedSlot with description and visibility', () => {
    const slot = googleEventToBlockedSlot(
      {
        id: 'evt-123',
        status: 'confirmed',
        summary: 'Haircut Seminar',
        description: '  Balayage formula 7.1 + 6%  ',
        visibility: 'private',
        start: { dateTime: '2026-11-20T09:00:00+01:00' },
        end: { dateTime: '2026-11-20T11:30:00+01:00' },
      },
      'Europe/Vienna',
    )
    assert.deepEqual(slot, {
      startAt: '2026-11-20T08:00:00.000Z',
      endAt: '2026-11-20T10:30:00.000Z',
      title: 'Haircut Seminar',
      description: 'Balayage formula 7.1 + 6%',
      visibility: 'private',
      isPrivate: true,
      allDay: false,
    })
  })

  it('converts an all-day Google Calendar event using salon timezone', () => {
    const slot = googleEventToBlockedSlot(
      {
        id: 'evt-all-day',
        status: 'confirmed',
        summary: 'Training Day',
        start: { date: '2026-11-21' },
        end: { date: '2026-11-22' },
      },
      'Europe/Vienna',
    )
    assert.deepEqual(slot, {
      startAt: '2026-11-20T23:00:00.000Z',
      endAt: '2026-11-21T23:00:00.000Z',
      title: 'Training Day',
      description: null,
      visibility: null,
      isPrivate: false,
      allDay: true,
    })
  })

  it('skips cancelled, transparent, and SalonFlow-owned events', () => {
    assert.equal(
      googleEventToBlockedSlot(
        {
          id: 'cancelled-1',
          status: 'cancelled',
          start: { dateTime: '2026-11-20T09:00:00Z' },
          end: { dateTime: '2026-11-20T10:00:00Z' },
        },
        'Europe/Vienna',
      ),
      null,
    )
    assert.equal(
      googleEventToBlockedSlot(
        {
          id: 'free-1',
          transparency: 'transparent',
          start: { dateTime: '2026-11-20T09:00:00Z' },
          end: { dateTime: '2026-11-20T10:00:00Z' },
        },
        'Europe/Vienna',
      ),
      null,
    )
    assert.equal(
      googleEventToBlockedSlot(
        {
          id: 'own-1',
          start: { dateTime: '2026-11-20T09:00:00Z' },
          end: { dateTime: '2026-11-20T10:00:00Z' },
          extendedProperties: { private: { salonReservationId: 'res-1' } },
        },
        'Europe/Vienna',
      ),
      null,
    )
  })

  it('formats reservationToGoogleEvent with deterministic id and without PII/internal notes', () => {
    const payload = reservationToGoogleEvent({
      reservationId: 'res-42',
      salonId: 'pilot',
      firstName: 'Anna',
      lastName: 'Muster',
      phone: '+43660123456',
      email: 'anna@example.com',
      serviceName: 'Waschen & Schneiden',
      startAt: '2026-11-20T09:00:00.000Z',
      endAt: '2026-11-20T10:00:00.000Z',
      status: 'PENDING',
      notes: 'Please use ammonia-free dye',
      internalNote: 'VIP secret note',
      timeZone: 'Europe/Vienna',
    })
    assert.equal(payload.summary, '[Pending] Anna Muster — Waschen & Schneiden')
    assert.equal(payload.id, googleEventIdForReservation('pilot', 'res-42'))
    assert.match(payload.id, /^[0-9a-v]{22}$/)
    assert.deepEqual(payload.extendedProperties.private, {
      salonReservationId: 'res-42',
      salonId: 'pilot',
    })
    assert.match(payload.description, /Booking ID: res-42/)
    assert.doesNotMatch(payload.description, /\+43660123456/)
    assert.doesNotMatch(payload.description, /anna@example\.com/)
    assert.doesNotMatch(payload.description, /VIP secret note/)
  })

  it('produces deterministic Firestore-safe doc IDs for Google event IDs', () => {
    const id1 = blockedSlotDocIdForGoogleEvent('abc/def@google.com')
    const id2 = blockedSlotDocIdForGoogleEvent('abc/def@google.com')
    assert.equal(id1, id2)
    assert.match(id1, /^gcal_[0-9a-f]{24}$/)
    const empId = blockedSlotDocIdForGoogleEvent('abc/def@google.com', 'emp-1')
    assert.match(empId, /^gcal_emp-1_[0-9a-f]{24}$/)
  })

  it('resolves privacy from Google visibility and manual privateOverride', () => {
    assert.equal(isGoogleVisibilityPrivate('private'), true)
    assert.equal(isGoogleVisibilityPrivate('confidential'), true)
    assert.equal(isGoogleVisibilityPrivate('default'), false)
    assert.equal(isGoogleVisibilityPrivate('public'), false)
    assert.equal(isGoogleVisibilityPrivate(null), false)

    assert.equal(resolveEffectivePrivacy('default', true), true)
    assert.equal(resolveEffectivePrivacy('private', false), false)
    assert.equal(resolveEffectivePrivacy('private', null), true)
    assert.equal(resolveEffectivePrivacy(null, null), false)
  })

  it('redacts private employee events for admins and other stylists, but not for the owner', () => {
    const privateSlot = {
      id: 'gcal_emp-1_abc',
      source: 'GOOGLE_CALENDAR',
      employeeId: 'emp-1',
      title: 'Zahnarzt',
      reason: 'Zahnarzt',
      description: 'Dr. Huber',
      visibility: 'private',
      isPrivate: true,
      privateOverride: null,
      startAt: '2026-11-20T09:00:00.000Z',
      endAt: '2026-11-20T10:00:00.000Z',
      createdAt: '2026-11-19T00:00:00.000Z',
    }

    const ownerView = redactBlockedSlotForViewer(privateSlot, { uid: 'emp-1', isAdmin: false })
    assert.equal(ownerView.redacted, false)
    assert.equal(ownerView.title, 'Zahnarzt')
    assert.equal(ownerView.description, 'Dr. Huber')
    assert.equal(ownerView.canTogglePrivacy, true)

    const adminView = redactBlockedSlotForViewer(privateSlot, { uid: 'admin-1', isAdmin: true })
    assert.equal(adminView.redacted, true)
    assert.equal(adminView.title, null)
    assert.equal(adminView.reason, null)
    assert.equal(adminView.description, null)
    assert.equal(adminView.isPrivate, true)
    assert.equal(adminView.canTogglePrivacy, false)

    const otherStylistView = redactBlockedSlotForViewer(privateSlot, {
      uid: 'emp-2',
      isAdmin: false,
    })
    assert.equal(otherStylistView.redacted, true)
    assert.equal(otherStylistView.title, null)
    assert.equal(otherStylistView.canTogglePrivacy, false)
  })

  it('allows admins to see and toggle privacy on salon-wide (employeeId: null) events', () => {
    const salonSlot = {
      id: 'gcal_abc',
      source: 'GOOGLE_CALENDAR',
      employeeId: null,
      title: 'Team Meeting',
      reason: 'Team Meeting',
      description: 'Notes',
      visibility: 'private',
      isPrivate: true,
      privateOverride: null,
      startAt: '2026-11-20T09:00:00.000Z',
      endAt: '2026-11-20T10:00:00.000Z',
      createdAt: '2026-11-19T00:00:00.000Z',
    }

    const adminView = redactBlockedSlotForViewer(salonSlot, { uid: 'admin-1', isAdmin: true })
    assert.equal(adminView.redacted, false)
    assert.equal(adminView.title, 'Team Meeting')
    assert.equal(adminView.canTogglePrivacy, true)

    const stylistView = redactBlockedSlotForViewer(salonSlot, { uid: 'emp-1', isAdmin: false })
    assert.equal(stylistView.redacted, true)
    assert.equal(stylistView.title, null)
    assert.equal(stylistView.canTogglePrivacy, false)
  })

  it('detects unchanged synced fields to avoid unnecessary Firestore writes', () => {
    const base = {
      title: 'Maria Rossi — Balayage',
      reason: 'Maria Rossi — Balayage',
      description: 'Formula 8.1',
      startAt: '2026-11-20T09:00:00.000Z',
      endAt: '2026-11-20T12:00:00.000Z',
      allDay: false,
      visibility: 'default',
      isPrivate: false,
      privateOverride: null,
    }
    assert.equal(hasBlockedSlotSyncedFieldsChanged(undefined, base), true)
    assert.equal(hasBlockedSlotSyncedFieldsChanged(base, base), false)
    assert.equal(
      hasBlockedSlotSyncedFieldsChanged(base, { ...base, description: 'Formula 9.1' }),
      true,
    )
    assert.equal(hasBlockedSlotSyncedFieldsChanged(base, { ...base, isPrivate: true }), true)
  })
})

describe('googleCalendar service account auth & calendar sharing', () => {
  it('parses service account credentials from inline JSON, base64 JSON, or split env vars', () => {
    const rawJson = JSON.stringify({
      client_email: 'calendar-bot@example.iam.gserviceaccount.com',
      private_key: '-----BEGIN PRIVATE KEY-----\\nabc\\n-----END PRIVATE KEY-----',
    })
    const fromJson = parseServiceAccountCredentials({ GOOGLE_SERVICE_ACCOUNT_JSON: rawJson })
    assert.equal(fromJson?.clientEmail, 'calendar-bot@example.iam.gserviceaccount.com')
    assert.match(fromJson?.privateKey ?? '', /\nabc\n/)

    const fromB64 = parseServiceAccountCredentials({
      GOOGLE_SERVICE_ACCOUNT_JSON: Buffer.from(rawJson, 'utf8').toString('base64'),
    })
    assert.equal(fromB64?.clientEmail, 'calendar-bot@example.iam.gserviceaccount.com')

    const fromSplit = parseServiceAccountCredentials({
      GOOGLE_SERVICE_ACCOUNT_EMAIL: 'split@example.iam.gserviceaccount.com',
      GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY: 'key-line-1\\nkey-line-2',
    })
    assert.equal(fromSplit?.clientEmail, 'split@example.iam.gserviceaccount.com')
    assert.equal(fromSplit?.privateKey, 'key-line-1\nkey-line-2')

    assert.equal(parseServiceAccountCredentials({}), null)
  })

  it('signs a valid RS256 JWT assertion for Google Calendar scope', () => {
    const { privateKey, publicKey } = generateKeyPairSync('rsa', { modulusLength: 2048 })
    const privatePem = privateKey.export({ type: 'pkcs8', format: 'pem' }).toString()
    const nowSec = 1_700_000_000

    const jwt = createServiceAccountJwt(
      { clientEmail: 'bot@salon.iam.gserviceaccount.com', privateKey: privatePem },
      GOOGLE_CALENDAR_SCOPE,
      nowSec,
    )
    const parts = jwt.split('.')
    assert.equal(parts.length, 3)

    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'))
    assert.equal(payload.iss, 'bot@salon.iam.gserviceaccount.com')
    assert.equal(payload.scope, GOOGLE_CALENDAR_SCOPE)
    assert.equal(payload.iat, nowSec)
    assert.equal(payload.exp, nowSec + 3600)

    const valid = createVerify('RSA-SHA256')
      .update(`${parts[0]}.${parts[1]}`)
      .end()
      .verify(publicKey, parts[2], 'base64url')
    assert.equal(valid, true)
  })

  it('returns null in emulator without key, and uses metadata server outside emulator', async () => {
    clearServiceAccountTokenCache()
    assert.equal(await getServiceAccountEmail({ FUNCTIONS_EMULATOR: 'true' }), null)
    assert.equal(await getServiceAccountAccessToken({ FUNCTIONS_EMULATOR: 'true' }), null)

    const fakeFetch = async (url) => {
      if (String(url).endsWith('/email')) {
        return new Response('proj@appspot.gserviceaccount.com', { status: 200 })
      }
      if (String(url).includes('/token?scopes=')) {
        return new Response(JSON.stringify({ access_token: 'meta-token', expires_in: 3600 }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      }
      return new Response('not found', { status: 404 })
    }

    const token = await getServiceAccountAccessToken({}, fakeFetch, 1_700_000_000_000)
    assert.deepEqual(token, {
      accessToken: 'meta-token',
      serviceAccountEmail: 'proj@appspot.gserviceaccount.com',
    })
    clearServiceAccountTokenCache()
  })

  it('subscribes to a shared calendar and returns summary and accessRole', async () => {
    const fakeFetch = async () =>
      new Response(
        JSON.stringify({
          id: 'salon@gmail.com',
          summary: 'Salon Termine',
          accessRole: 'writer',
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      )
    const cal = await subscribeToCalendar('tok', 'salon@gmail.com', fakeFetch)
    assert.deepEqual(cal, {
      id: 'salon@gmail.com',
      summary: 'Salon Termine',
      accessRole: 'writer',
    })
  })

  it('preserves accessRole via calendarList.get when calendarList.insert returns 409', async () => {
    const calls = []
    const fakeFetch = async (url, init) => {
      calls.push({ url: String(url), method: init?.method ?? 'GET' })
      if (init?.method === 'POST' && String(url).endsWith('/users/me/calendarList')) {
        return new Response('already exists', { status: 409 })
      }
      if (String(url).includes('/users/me/calendarList/salon%40gmail.com')) {
        return new Response(
          JSON.stringify({
            id: 'salon@gmail.com',
            summary: 'Salon Termine',
            accessRole: 'reader',
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        )
      }
      return new Response('unexpected', { status: 500 })
    }

    const cal = await subscribeToCalendar('tok', 'salon@gmail.com', fakeFetch)
    assert.deepEqual(cal, {
      id: 'salon@gmail.com',
      summary: 'Salon Termine',
      accessRole: 'reader',
    })
    assert.equal(calls.length, 2)
    assert.equal(calls[1].method, 'GET')
  })

  it('falls back to getCalendar when both calendarList.insert and calendarList.get return non-auth errors', async () => {
    const fakeFetch = async (url, init) => {
      if (init?.method === 'POST') return new Response('conflict', { status: 409 })
      if (String(url).includes('/users/me/calendarList/'))
        return new Response('err', { status: 500 })
      if (String(url).includes('/calendars/salon%40gmail.com')) {
        return new Response(JSON.stringify({ id: 'salon@gmail.com', summary: 'Fallback Cal' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      }
      return new Response('unexpected', { status: 500 })
    }

    const cal = await subscribeToCalendar('tok', 'salon@gmail.com', fakeFetch)
    assert.deepEqual(cal, {
      id: 'salon@gmail.com',
      summary: 'Fallback Cal',
    })
  })

  it('throws GoogleApiError on 403/404 from subscribeToCalendar', async () => {
    const fakeFetch = async () => new Response('forbidden', { status: 403 })
    await assert.rejects(
      () => subscribeToCalendar('tok', 'salon@gmail.com', fakeFetch),
      (err) => err instanceof GoogleApiError && err.status === 403,
    )
  })

  it('treats only writer and owner roles as writable', () => {
    assert.equal(isWritableAccessRole('writer'), true)
    assert.equal(isWritableAccessRole('owner'), true)
    assert.equal(isWritableAccessRole('reader'), false)
    assert.equal(isWritableAccessRole('freeBusyReader'), false)
    assert.equal(isWritableAccessRole(null), false)
    assert.equal(isWritableAccessRole(undefined), false)
  })

  it('invalidates cached service account token after a 401 response', async () => {
    clearServiceAccountTokenCache()
    let tokenCounter = 0
    const fakeFetch = async (url) => {
      if (String(url).endsWith('/email')) {
        return new Response('proj@appspot.gserviceaccount.com', { status: 200 })
      }
      if (String(url).includes('/token?scopes=')) {
        tokenCounter += 1
        return new Response(JSON.stringify({ access_token: `tok-${tokenCounter}` }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      }
      return new Response('unauthorized', { status: 401 })
    }

    const first = await getServiceAccountAccessToken({}, fakeFetch, 1_700_000_000_000)
    assert.equal(first?.accessToken, 'tok-1')

    await assert.rejects(
      () => getCalendar('tok-1', 'salon@gmail.com', fakeFetch),
      (err) => err instanceof GoogleApiError && err.status === 401,
    )

    const second = await getServiceAccountAccessToken({}, fakeFetch, 1_700_000_001_000)
    assert.equal(second?.accessToken, 'tok-2')
    clearServiceAccountTokenCache()
  })
})
