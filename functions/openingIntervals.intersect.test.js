import assert from 'node:assert/strict'
import test from 'node:test'

import { intersectLocalIntervals, sanitizeTimeIntervals } from './lib/domain/openingIntervals.js'
import { resolveOpenIntervalsForDate } from './lib/domain/openingIntervals.js'

test('intersectLocalIntervals returns overlap', () => {
  const a = [
    { startMinutes: 9 * 60, endMinutes: 12 * 60 },
    { startMinutes: 13 * 60, endMinutes: 17 * 60 },
  ]
  const b = [{ startMinutes: 10 * 60, endMinutes: 14 * 60 }]
  assert.deepEqual(intersectLocalIntervals(a, b), [
    { startMinutes: 10 * 60, endMinutes: 12 * 60 },
    { startMinutes: 13 * 60, endMinutes: 14 * 60 },
  ])
})

test('intersectLocalIntervals empty when disjoint', () => {
  const a = [{ startMinutes: 9 * 60, endMinutes: 11 * 60 }]
  const b = [{ startMinutes: 12 * 60, endMinutes: 14 * 60 }]
  assert.deepEqual(intersectLocalIntervals(a, b), [])
})

test('sanitizeTimeIntervals rejects overlapping intervals', () => {
  assert.deepEqual(
    sanitizeTimeIntervals([
      { start: '09:00', end: '12:00' },
      { start: '11:00', end: '14:00' },
    ]),
    [],
  )
})

test('sanitizeTimeIntervals rejects start not before end', () => {
  assert.deepEqual(sanitizeTimeIntervals([{ start: '12:00', end: '09:00' }]), [])
})

test('employee missing weekly weekday is closed that day', () => {
  const salonWeekly = {
    monday: [{ start: '09:00', end: '17:00' }],
    tuesday: [],
    wednesday: [],
    thursday: [],
    friday: [],
    saturday: [],
    sunday: [],
  }
  const employeeWeekly = {
    monday: [],
    tuesday: [],
    wednesday: [],
    thursday: [],
    friday: [],
    saturday: [],
    sunday: [],
  }
  const salonOpen = resolveOpenIntervalsForDate({
    dateYmd: '2026-04-13',
    timeZone: 'Europe/Vienna',
    weekly: salonWeekly,
    holidays: [],
    dayExceptions: [],
  })
  const employeeOpen = resolveOpenIntervalsForDate({
    dateYmd: '2026-04-13',
    timeZone: 'Europe/Vienna',
    weekly: employeeWeekly,
    holidays: [],
    dayExceptions: [],
  })
  assert.deepEqual(intersectLocalIntervals(salonOpen, employeeOpen), [])
})
