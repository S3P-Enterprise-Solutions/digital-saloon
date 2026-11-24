import { describe, expect, it } from 'vitest'

import type { OpeningHoursByWeekday } from './openingHours'
import type { ReservationWithId } from './reservations'
import {
  defaultWeekStartYmd,
  formatBookedTime,
  hhmmOfMinute,
  isoWeekNumber,
  planWeek,
  weekQueryRange,
  weekdayOfYmd,
  zonedDateAndMinute,
} from './weekPlanner'

const timeZone = 'Europe/Vienna'
const weekStart = '2026-11-16'

function reservation(
  id: string,
  startAt: string,
  endAt: string,
  status: ReservationWithId['status'] = 'CONFIRMED',
  priceCents = 2600,
): ReservationWithId {
  return {
    id,
    firstName: 'Anna',
    lastName: 'Muster',
    phone: '+390473000000',
    email: null,
    serviceId: 'haircut',
    serviceName: 'Herrenschnitt',
    durationMinutes: 30,
    priceCents,
    startAt,
    endAt,
    status,
    source: 'ONLINE',
    managementTokenHash: 'hash',
    internalNote: null,
    idempotencyKey: null,
    createdAt: startAt,
    updatedAt: startAt,
  }
}

const openingHours: Partial<OpeningHoursByWeekday> = {
  monday: { intervals: [] },
  tuesday: {
    intervals: [
      { start: '08:00', end: '12:00' },
      { start: '14:00', end: '18:00' },
    ],
  },
  wednesday: { intervals: [{ start: '08:00', end: '16:00' }] },
}

/** Monday 16 November 2026, 10:15 in Meran (UTC+1). */
const mondayMorning = new Date('2026-11-16T09:15:00.000Z')

describe('week helpers', () => {
  it('numbers weeks like the ISO calendar', () => {
    expect(isoWeekNumber('2026-11-16')).toBe(47)
    expect(isoWeekNumber('2026-12-28')).toBe(53)
    expect(isoWeekNumber('2027-01-04')).toBe(1)
    expect(isoWeekNumber('2021-01-03')).toBe(53)
  })

  it('maps dates to weekdays', () => {
    expect(weekdayOfYmd('2026-11-16')).toBe('monday')
    expect(weekdayOfYmd('2026-11-22')).toBe('sunday')
  })

  it('reads local date and minute in the salon time zone', () => {
    expect(zonedDateAndMinute('2026-11-17T23:30:00.000Z', timeZone)).toEqual({
      dateYmd: '2026-11-18',
      minute: 30,
    })
    expect(zonedDateAndMinute('2026-07-01T06:00:00.000Z', timeZone)).toEqual({
      dateYmd: '2026-07-01',
      minute: 8 * 60,
    })
  })

  it('queries a day around the week so local midnight is covered', () => {
    expect(weekQueryRange(weekStart)).toEqual({
      startIso: '2026-11-15T00:00:00.000Z',
      endIso: '2026-11-24T00:00:00.000Z',
    })
  })

  it('formats minutes as HH:MM', () => {
    expect(hhmmOfMinute(9 * 60 + 5)).toBe('09:05')
  })

  it('formats booked time like a timesheet total', () => {
    expect(formatBookedTime(0)).toBe('0 min')
    expect(formatBookedTime(45)).toBe('45 min')
    expect(formatBookedTime(180)).toBe('3 h')
    expect(formatBookedTime(150)).toBe('2 h 30 min')
  })
})

describe('defaultWeekStartYmd', () => {
  it('opens the current week while the salon still opens this week', () => {
    expect(defaultWeekStartYmd('2026-11-16', openingHours)).toBe('2026-11-16')
    expect(defaultWeekStartYmd('2026-11-18', openingHours)).toBe('2026-11-16')
  })

  it('jumps to next week once no opening day is left', () => {
    expect(defaultWeekStartYmd('2026-11-19', openingHours)).toBe('2026-11-23')
    expect(defaultWeekStartYmd('2026-11-22', openingHours)).toBe('2026-11-23')
  })

  it('stays on the current week while opening hours are unknown', () => {
    expect(defaultWeekStartYmd('2026-11-22', undefined)).toBe('2026-11-16')
  })
})

describe('planWeek', () => {
  it('places appointments on their local day and time', () => {
    const plan = planWeek({
      reservations: [reservation('a', '2026-11-17T08:00:00.000Z', '2026-11-17T08:30:00.000Z')],
      weekStartYmd: weekStart,
      openingHours,
      timeZone,
      now: mondayMorning,
    })
    expect(plan.isoWeek).toBe(47)
    expect(plan.days.map((day) => day.dateYmd)).toEqual([
      '2026-11-16',
      '2026-11-17',
      '2026-11-18',
      '2026-11-19',
      '2026-11-20',
      '2026-11-21',
      '2026-11-22',
    ])
    const tuesday = plan.days[1]
    expect(tuesday.entries).toHaveLength(1)
    expect(tuesday.entries[0]).toMatchObject({ startMinute: 9 * 60, endMinute: 9 * 60 + 30 })
    expect(tuesday.count).toBe(1)
    expect(tuesday.bookedMinutes).toBe(30)
  })

  it('skips declined, cancelled, and expired appointments and other weeks', () => {
    const plan = planWeek({
      reservations: [
        reservation('declined', '2026-11-17T08:00:00.000Z', '2026-11-17T08:30:00.000Z', 'DECLINED'),
        reservation(
          'cancelled',
          '2026-11-17T09:00:00.000Z',
          '2026-11-17T09:30:00.000Z',
          'CANCELLED',
        ),
        reservation('expired', '2026-11-17T10:00:00.000Z', '2026-11-17T10:30:00.000Z', 'EXPIRED'),
        reservation('next-week', '2026-11-23T08:00:00.000Z', '2026-11-23T08:30:00.000Z'),
        reservation('done', '2026-11-17T11:00:00.000Z', '2026-11-17T11:30:00.000Z', 'COMPLETED'),
        reservation('ask', '2026-11-18T11:00:00.000Z', '2026-11-18T11:30:00.000Z', 'PENDING'),
      ],
      weekStartYmd: weekStart,
      openingHours,
      timeZone,
      now: mondayMorning,
    })
    const ids = plan.days.flatMap((day) => day.entries.map((entry) => entry.reservation.id))
    expect(ids.sort()).toEqual(['ask', 'done'])
  })

  it('adds up the week like a timesheet', () => {
    const plan = planWeek({
      reservations: [
        reservation('a', '2026-11-17T08:00:00.000Z', '2026-11-17T09:00:00.000Z', 'CONFIRMED', 4800),
        reservation('b', '2026-11-18T08:00:00.000Z', '2026-11-18T10:00:00.000Z', 'PENDING', 8500),
      ],
      weekStartYmd: weekStart,
      openingHours,
      timeZone,
      now: mondayMorning,
    })
    expect(plan.totals).toEqual({ count: 2, bookedMinutes: 180, revenueCents: 13300 })
  })

  it('puts overlapping appointments side by side', () => {
    const plan = planWeek({
      reservations: [
        reservation('long', '2026-11-17T08:00:00.000Z', '2026-11-17T10:00:00.000Z'),
        reservation('short', '2026-11-17T08:30:00.000Z', '2026-11-17T09:00:00.000Z'),
        reservation('after-short', '2026-11-17T09:00:00.000Z', '2026-11-17T09:30:00.000Z'),
        reservation('alone', '2026-11-17T13:00:00.000Z', '2026-11-17T13:30:00.000Z'),
      ],
      weekStartYmd: weekStart,
      openingHours,
      timeZone,
      now: mondayMorning,
    })
    const lanes = Object.fromEntries(
      plan.days[1].entries.map((entry) => [
        entry.reservation.id,
        [entry.lane, entry.laneCount] as const,
      ]),
    )
    expect(lanes).toEqual({
      long: [0, 2],
      short: [1, 2],
      'after-short': [1, 2],
      alone: [0, 1],
    })
  })

  it('marks today and the current minute when viewing this week', () => {
    const plan = planWeek({
      reservations: [],
      weekStartYmd: weekStart,
      openingHours,
      timeZone,
      now: new Date('2026-11-18T13:40:00.000Z'),
    })
    expect(plan.days[1].isToday).toBe(false)
    expect(plan.days[2].isToday).toBe(true)
    expect(plan.nowMinute).toBe(14 * 60 + 40)
  })

  it('spans the hours from opening to closing and stretches for late appointments', () => {
    const regular = planWeek({
      reservations: [],
      weekStartYmd: weekStart,
      openingHours,
      timeZone,
      now: mondayMorning,
    })
    expect([regular.firstHour, regular.lastHour]).toEqual([8, 18])

    const late = planWeek({
      reservations: [reservation('late', '2026-11-19T18:00:00.000Z', '2026-11-19T19:15:00.000Z')],
      weekStartYmd: weekStart,
      openingHours,
      timeZone,
      now: mondayMorning,
    })
    expect([late.firstHour, late.lastHour]).toEqual([8, 21])
  })

  it('falls back to a working day without opening hours and hides the now line in other weeks', () => {
    const plan = planWeek({
      reservations: [],
      weekStartYmd: '2026-11-23',
      openingHours: undefined,
      timeZone,
      now: mondayMorning,
    })
    expect([plan.firstHour, plan.lastHour]).toEqual([8, 18])
    expect(plan.nowMinute).toBeNull()
  })

  it('shows blockedSlots (Google Calendar events) on the matching day', () => {
    const plan = planWeek({
      reservations: [],
      blockedSlots: [
        {
          id: 'gcal_1',
          source: 'GOOGLE_CALENDAR',
          title: 'Dentist',
          startAt: '2026-11-17T08:00:00.000Z',
          endAt: '2026-11-17T09:00:00.000Z',
          createdAt: '2026-11-16T00:00:00.000Z',
        },
      ],
      weekStartYmd: weekStart,
      openingHours,
      timeZone,
      now: mondayMorning,
    })
    const tuesday = plan.days[1]
    expect(tuesday.blockedEntries).toHaveLength(1)
    expect(tuesday.blockedEntries[0].block.title).toBe('Dentist')
    expect(tuesday.blockedEntries[0].startMinute).toBe(9 * 60)
    expect(tuesday.blockedEntries[0].endMinute).toBe(10 * 60)
  })

  it('filters reservations and blockedSlots by employeeId when selected', () => {
    const r1 = {
      ...reservation('emp1', '2026-11-17T08:00:00.000Z', '2026-11-17T09:00:00.000Z'),
      employeeId: 'e1',
      employeeName: 'Anna',
    }
    const r2 = {
      ...reservation('emp2', '2026-11-17T08:00:00.000Z', '2026-11-17T09:00:00.000Z'),
      employeeId: 'e2',
      employeeName: 'Ben',
    }
    const plan = planWeek({
      reservations: [r1, r2],
      blockedSlots: [
        {
          id: 'b1',
          employeeId: 'e1',
          source: 'GOOGLE_CALENDAR',
          title: 'Anna Break',
          startAt: '2026-11-17T10:00:00.000Z',
          endAt: '2026-11-17T11:00:00.000Z',
          createdAt: '2026-11-16T00:00:00.000Z',
        },
        {
          id: 'b2',
          employeeId: 'e2',
          source: 'GOOGLE_CALENDAR',
          title: 'Ben Break',
          startAt: '2026-11-17T12:00:00.000Z',
          endAt: '2026-11-17T13:00:00.000Z',
          createdAt: '2026-11-16T00:00:00.000Z',
        },
      ],
      employeeId: 'e1',
      weekStartYmd: weekStart,
      openingHours,
      timeZone,
      now: mondayMorning,
    })
    const tuesday = plan.days[1]
    expect(tuesday.entries.map((e) => e.reservation.id)).toEqual(['emp1'])
    expect(tuesday.blockedEntries.map((b) => b.block.id)).toEqual(['b1'])
  })
})
