import assert from 'node:assert/strict'
import test from 'node:test'

import { buildBookingIcs } from './lib/booking/sendBookingEmail.js'

test('buildBookingIcs generates valid RFC 5545 calendar event', () => {
  const ics = buildBookingIcs(
    {
      reservationId: 'res-123',
      to: 'erika@example.com',
      firstName: 'Erika',
      lastName: 'Muster',
      serviceName: 'Damenhaarschnitt + Glossing',
      durationMinutes: 75,
      startAt: new Date('2026-11-18T13:00:00.000Z'),
      status: 'CONFIRMED',
      managementToken: 'tok-abc',
      notes: 'Bitte warmes Wasser',
      salonName: 'KIMM Hair',
      salonAddress: 'Via Piave 71, 39012 Meran',
    },
    'http://127.0.0.1:3100/manage/tok-abc',
  )

  assert.match(ics, /^BEGIN:VCALENDAR\r\n/)
  assert.match(ics, /BEGIN:VEVENT\r\n/)
  assert.match(ics, /UID:res-123@salonflow\.local\r\n/)
  assert.match(ics, /DTSTART:20261118T130000Z\r\n/)
  assert.match(ics, /DTEND:20261118T141500Z\r\n/)
  assert.match(ics, /STATUS:CONFIRMED\r\n/)
  assert.match(ics, /SEQUENCE:0\r\n/)
  assert.match(ics, /LOCATION:Via Piave 71\\, 39012 Meran\r\n/)
  assert.match(ics, /END:VCALENDAR\r\n$/)
})
