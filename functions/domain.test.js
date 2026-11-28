import assert from 'node:assert/strict'
import test from 'node:test'

import { intervalsOverlap } from './lib/domain/overlap.js'
import { resolveOpenIntervalsForDate } from './lib/domain/openingIntervals.js'
import { isSlotAvailable, listAvailableSlots } from './lib/domain/availability.js'
import { zonedLocalToUtc } from './lib/domain/timezone.js'

const TZ = 'Europe/Vienna'

const weekly = {
  monday: [{ start: '09:00', end: '17:00' }],
  tuesday: [{ start: '09:00', end: '17:00' }],
  wednesday: [{ start: '09:00', end: '13:00' }],
  thursday: [{ start: '09:00', end: '18:00' }],
  friday: [{ start: '09:00', end: '17:00' }],
  saturday: [{ start: '09:00', end: '12:00' }],
  sunday: [],
}

const settings = {
  slotIntervalMinutes: 15,
  minAdvanceBookingMinutes: 60,
  maxAdvanceBookingDays: 60,
}

test('adjacent intervals do not overlap', () => {
  const aStart = new Date('2026-04-08T08:00:00.000Z')
  const aEnd = new Date('2026-04-08T08:30:00.000Z')
  const bStart = new Date('2026-04-08T08:30:00.000Z')
  const bEnd = new Date('2026-04-08T09:00:00.000Z')
  assert.equal(intervalsOverlap(aStart, aEnd, bStart, bEnd), false)
})

test('overlapping intervals are detected', () => {
  const aStart = new Date('2026-04-08T08:00:00.000Z')
  const aEnd = new Date('2026-04-08T08:30:00.000Z')
  const bStart = new Date('2026-04-08T08:15:00.000Z')
  const bEnd = new Date('2026-04-08T08:45:00.000Z')
  assert.equal(intervalsOverlap(aStart, aEnd, bStart, bEnd), true)
})

test('sunday weekly hours are closed', () => {
  const open = resolveOpenIntervalsForDate({
    dateYmd: '2026-04-12',
    timeZone: TZ,
    weekly,
    holidays: [],
    dayExceptions: [],
  })
  assert.deepEqual(open, [])
})

test('holiday closes the day even with a day exception', () => {
  const open = resolveOpenIntervalsForDate({
    dateYmd: '2026-05-01',
    timeZone: TZ,
    weekly,
    holidays: [{ startDate: '2026-05-01', endDate: '2026-05-01' }],
    dayExceptions: [
      { date: '2026-05-01', intervals: [{ start: '10:00', end: '14:00' }], closed: false },
    ],
  })
  assert.deepEqual(open, [])
})

test('day exception overrides weekly hours', () => {
  const open = resolveOpenIntervalsForDate({
    dateYmd: '2026-12-24',
    timeZone: TZ,
    weekly,
    holidays: [],
    dayExceptions: [
      { date: '2026-12-24', intervals: [{ start: '09:00', end: '12:00' }], closed: false },
    ],
  })
  assert.deepEqual(open, [{ startMinutes: 9 * 60, endMinutes: 12 * 60 }])
})

test('service cannot spill past closing time', () => {
  // Wednesday closes 13:00; 120-minute service at 12:00 must not appear.
  const now = zonedLocalToUtc(2026, 4, 7, 8, 0, TZ)
  const slots = listAvailableSlots({
    timeZone: TZ,
    weekly,
    holidays: [],
    dayExceptions: [],
    busy: [],
    durationMinutes: 120,
    settings,
    now,
    fromDateYmd: '2026-04-08',
    toDateYmd: '2026-04-08',
    enforceAdvanceRestrictions: false,
  })
  const localStarts = slots.map((slot) =>
    new Intl.DateTimeFormat('en-GB', {
      timeZone: TZ,
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    }).format(slot.startAt),
  )
  assert.equal(localStarts.includes('12:00'), false)
  assert.ok(localStarts.includes('09:00'))
})

test('blocked busy intervals remove slots', () => {
  const now = zonedLocalToUtc(2026, 4, 7, 8, 0, TZ)
  const blockStart = zonedLocalToUtc(2026, 4, 8, 10, 0, TZ)
  const blockEnd = zonedLocalToUtc(2026, 4, 8, 11, 0, TZ)
  const slots = listAvailableSlots({
    timeZone: TZ,
    weekly,
    holidays: [],
    dayExceptions: [],
    busy: [{ startAt: blockStart, endAt: blockEnd }],
    durationMinutes: 30,
    settings,
    now,
    fromDateYmd: '2026-04-08',
    toDateYmd: '2026-04-08',
    enforceAdvanceRestrictions: false,
  })
  const hasBlocked = slots.some((slot) => slot.startAt.getTime() === blockStart.getTime())
  assert.equal(hasBlocked, false)
})

test('minimum advance booking is enforced', () => {
  const now = zonedLocalToUtc(2026, 4, 8, 10, 0, TZ)
  const tooSoon = zonedLocalToUtc(2026, 4, 8, 10, 30, TZ)
  assert.equal(
    isSlotAvailable({
      startAt: tooSoon,
      durationMinutes: 30,
      timeZone: TZ,
      weekly,
      holidays: [],
      dayExceptions: [],
      busy: [],
      settings,
      now,
      enforceAdvanceRestrictions: true,
    }),
    false,
  )
})

test('maximum advance booking is enforced', () => {
  const now = zonedLocalToUtc(2026, 4, 8, 10, 0, TZ)
  const tooFar = zonedLocalToUtc(2026, 7, 1, 10, 0, TZ)
  assert.equal(
    isSlotAvailable({
      startAt: tooFar,
      durationMinutes: 30,
      timeZone: TZ,
      weekly,
      holidays: [],
      dayExceptions: [],
      busy: [],
      settings,
      now,
      enforceAdvanceRestrictions: true,
    }),
    false,
  )
})

test('manual bookings can bypass advance restrictions', () => {
  const now = zonedLocalToUtc(2026, 4, 8, 10, 0, TZ)
  const soon = zonedLocalToUtc(2026, 4, 8, 10, 30, TZ)
  assert.equal(
    isSlotAvailable({
      startAt: soon,
      durationMinutes: 30,
      timeZone: TZ,
      weekly,
      holidays: [],
      dayExceptions: [],
      busy: [],
      settings,
      now,
      enforceAdvanceRestrictions: false,
    }),
    true,
  )
})

test('Vienna DST spring-forward maps local 09:00 correctly', () => {
  // 2026-03-29 clocks jump 02:00 -> 03:00 in Europe/Vienna.
  const utc = zonedLocalToUtc(2026, 3, 29, 9, 0, TZ)
  assert.equal(utc.toISOString(), '2026-03-29T07:00:00.000Z')
})

test('Vienna DST fall-back maps local 09:00 correctly', () => {
  // 2026-10-25 clocks fall back 03:00 -> 02:00; 09:00 is still CET (UTC+1).
  const utc = zonedLocalToUtc(2026, 10, 25, 9, 0, TZ)
  assert.equal(utc.toISOString(), '2026-10-25T08:00:00.000Z')
})

test('listAvailableSlots uses 15-minute interval by default settings', () => {
  const now = zonedLocalToUtc(2026, 4, 7, 8, 0, TZ)
  const slots = listAvailableSlots({
    timeZone: TZ,
    weekly,
    holidays: [],
    dayExceptions: [],
    busy: [],
    durationMinutes: 30,
    settings,
    now,
    fromDateYmd: '2026-04-11',
    toDateYmd: '2026-04-11',
    enforceAdvanceRestrictions: false,
  })
  assert.ok(slots.length > 0)
  const first = slots[0].startAt
  const second = slots[1].startAt
  assert.equal(second.getTime() - first.getTime(), 15 * 60_000)
})

test('listAvailableSlots inherits salon weekly hours when employee has no custom weekly schedule', () => {
  const now = zonedLocalToUtc(2026, 4, 7, 8, 0, TZ)
  const openSlots = listAvailableSlots({
    timeZone: TZ,
    weekly,
    holidays: [],
    dayExceptions: [],
    busy: [],
    durationMinutes: 30,
    settings,
    now,
    fromDateYmd: '2026-04-11',
    toDateYmd: '2026-04-11',
    enforceAdvanceRestrictions: false,
    employeeEnvelope: { dayExceptions: [] },
  })
  assert.ok(openSlots.length > 0)

  const closedByException = listAvailableSlots({
    timeZone: TZ,
    weekly,
    holidays: [],
    dayExceptions: [],
    busy: [],
    durationMinutes: 30,
    settings,
    now,
    fromDateYmd: '2026-04-11',
    toDateYmd: '2026-04-11',
    enforceAdvanceRestrictions: false,
    employeeEnvelope: {
      dayExceptions: [{ date: '2026-04-11', closed: true, intervals: [] }],
    },
  })
  assert.equal(closedByException.length, 0)
})
