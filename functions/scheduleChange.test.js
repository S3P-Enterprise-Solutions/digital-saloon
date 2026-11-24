import assert from 'node:assert/strict'
import test from 'node:test'

import {
  buildBookingIcs,
  customerEmailOf,
  isReservationScheduleChange,
  serviceIdsOf,
} from './lib/booking/sendBookingEmail.js'

test('customerEmailOf accepts only non-empty addresses with @', () => {
  assert.equal(customerEmailOf({ email: 'a@b.com' }), 'a@b.com')
  assert.equal(customerEmailOf({ email: '  a@b.com  ' }), 'a@b.com')
  assert.equal(customerEmailOf({ email: '' }), null)
  assert.equal(customerEmailOf({ email: null }), null)
  assert.equal(customerEmailOf({}), null)
})

test('serviceIdsOf prefers serviceIds array over primary serviceId', () => {
  assert.deepEqual(serviceIdsOf({ serviceId: 'a', serviceIds: ['b', 'a'] }), ['b', 'a'])
  assert.deepEqual(serviceIdsOf({ serviceId: 'a' }), ['a'])
  assert.deepEqual(serviceIdsOf({}), [])
})

test('isReservationScheduleChange ignores contact-only edits', () => {
  const base = {
    startAt: '2026-11-20T10:00:00.000Z',
    durationMinutes: 30,
    serviceIds: ['haircut'],
  }
  assert.equal(isReservationScheduleChange(base, { ...base }), false)
  assert.equal(
    isReservationScheduleChange(base, {
      ...base,
      startAt: '2026-11-20T11:00:00.000Z',
    }),
    true,
  )
  assert.equal(
    isReservationScheduleChange(base, {
      ...base,
      durationMinutes: 45,
    }),
    true,
  )
  assert.equal(
    isReservationScheduleChange(base, {
      ...base,
      serviceIds: ['haircut', 'blow-dry'],
    }),
    true,
  )
  assert.equal(
    isReservationScheduleChange(base, {
      ...base,
      serviceIds: ['haircut'],
    }),
    false,
  )
})

test('buildBookingIcs marks cancelled events with METHOD CANCEL', () => {
  const ics = buildBookingIcs(
    {
      kind: 'cancelled',
      reservationId: 'res-cancel',
      to: 'erika@example.com',
      firstName: 'Erika',
      lastName: 'Muster',
      serviceName: 'Herrenhaarschnitt',
      durationMinutes: 30,
      startAt: new Date('2026-11-18T13:00:00.000Z'),
      status: 'CONFIRMED',
      notes: null,
      salonName: 'KIMM Hair',
    },
    null,
  )
  assert.match(ics, /METHOD:CANCEL\r\n/)
  assert.match(ics, /STATUS:CANCELLED\r\n/)
  assert.match(ics, /SEQUENCE:1\r\n/)
  assert.match(ics, /UID:res-cancel@salonflow\.local\r\n/)
})
