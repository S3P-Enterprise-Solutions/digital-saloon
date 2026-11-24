import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { createOAuthNonce, signOAuthState, verifyOAuthState } from './lib/googleCalendar/client.js'
import {
  blockedSlotDocIdForGoogleEvent,
  googleEventToBlockedSlot,
  reservationToGoogleEvent,
} from './lib/googleCalendar/mapping.js'

describe('googleCalendar mapping', () => {
  it('converts a timed Google Calendar event into a blockedSlot', () => {
    const slot = googleEventToBlockedSlot(
      {
        id: 'evt-123',
        status: 'confirmed',
        summary: 'Haircut Seminar',
        start: { dateTime: '2026-11-20T09:00:00+01:00' },
        end: { dateTime: '2026-11-20T11:30:00+01:00' },
      },
      'Europe/Vienna',
    )
    assert.deepEqual(slot, {
      startAt: '2026-11-20T08:00:00.000Z',
      endAt: '2026-11-20T10:30:00.000Z',
      title: 'Haircut Seminar',
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

  it('formats reservationToGoogleEvent with pending prefix and extendedProperties', () => {
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
      timeZone: 'Europe/Vienna',
    })
    assert.equal(payload.summary, '[Pending] Anna Muster — Waschen & Schneiden')
    assert.deepEqual(payload.extendedProperties.private, {
      salonReservationId: 'res-42',
      salonId: 'pilot',
    })
    assert.match(payload.description, /Booking ID: res-42/)
  })

  it('produces deterministic Firestore-safe doc IDs for Google event IDs', () => {
    const id1 = blockedSlotDocIdForGoogleEvent('abc/def@google.com')
    const id2 = blockedSlotDocIdForGoogleEvent('abc/def@google.com')
    assert.equal(id1, id2)
    assert.match(id1, /^gcal_[0-9a-f]{24}$/)
    const empId = blockedSlotDocIdForGoogleEvent('abc/def@google.com', 'emp-1')
    assert.match(empId, /^gcal_emp-1_[0-9a-f]{24}$/)
  })
})

describe('googleCalendar OAuth state signing', () => {
  it('signs and verifies state tokens and rejects tampering or expiry', () => {
    const secret = 'test-secret-key-32-chars-minimum'
    const now = 1_700_000_000_000
    const token = signOAuthState(
      {
        salonId: 'pilot',
        uid: 'admin-1',
        returnUrl: 'http://127.0.0.1:3100/admin/settings',
        nonce: createOAuthNonce(),
        exp: now + 60_000,
      },
      secret,
    )

    const verified = verifyOAuthState(token, secret, now + 10_000)
    assert.equal(verified?.salonId, 'pilot')
    assert.equal(verified?.uid, 'admin-1')

    assert.equal(verifyOAuthState(`${token}x`, secret, now + 10_000), null)
    assert.equal(verifyOAuthState(token, secret, now + 120_000), null)
  })
})
