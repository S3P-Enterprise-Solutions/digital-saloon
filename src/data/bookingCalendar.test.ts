import { describe, expect, it } from 'vitest'

import {
  addDays,
  findEarliestAvailableDate,
  monthBoundsYmd,
  weekDays,
  weekStartMondayYmd,
} from './bookingCalendar'

describe('bookingCalendar week helpers', () => {
  it('computes Monday of the week for any weekday', () => {
    // 2026-11-17 is a Tuesday, 2026-11-22 is a Sunday
    expect(weekStartMondayYmd('2026-11-17')).toBe('2026-11-16')
    expect(weekStartMondayYmd('2026-11-22')).toBe('2026-11-16')
    expect(weekStartMondayYmd('2026-11-16')).toBe('2026-11-16')
  })

  it('returns 7 consecutive days starting from Monday', () => {
    expect(weekDays('2026-11-16')).toEqual([
      '2026-11-16',
      '2026-11-17',
      '2026-11-18',
      '2026-11-19',
      '2026-11-20',
      '2026-11-21',
      '2026-11-22',
    ])
  })

  it('adds days across month boundaries', () => {
    expect(addDays('2026-11-29', 3)).toBe('2026-12-02')
  })

  it('finds earliest non-past day with slots', () => {
    const days = weekDays('2026-11-16')
    const byDate = new Map<string, string[]>([
      ['2026-11-16', ['2026-11-16T09:00:00Z']], // past if today is 2026-11-17
      ['2026-11-18', ['2026-11-18T10:00:00Z']],
      ['2026-11-19', ['2026-11-19T11:00:00Z']],
    ])
    expect(findEarliestAvailableDate(days, byDate, '2026-11-17')).toBe('2026-11-18')
    expect(findEarliestAvailableDate(days, new Map(), '2026-11-17')).toBeNull()
  })

  it('computes first and last day of a month including leap years', () => {
    expect(monthBoundsYmd('2026-11-23')).toEqual({
      startYmd: '2026-11-01',
      endYmd: '2026-11-30',
    })
    expect(monthBoundsYmd('2026-12-01')).toEqual({
      startYmd: '2026-12-01',
      endYmd: '2026-12-31',
    })
    expect(monthBoundsYmd('2028-02-10')).toEqual({
      startYmd: '2028-02-01',
      endYmd: '2028-02-29',
    })
  })
})
