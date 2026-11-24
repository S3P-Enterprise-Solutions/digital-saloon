import { describe, expect, it } from 'vitest'

import { employeeDayExceptionsOf } from './employeeAbsenceSave'

describe('employeeDayExceptionsOf', () => {
  it('expands a holiday range into closed day exceptions keyed by date', () => {
    expect(
      employeeDayExceptionsOf({
        type: 'holiday',
        holiday: {
          name: 'Urlaub',
          startDate: '2026-12-01',
          endDate: '2026-12-03',
        },
      }),
    ).toEqual([
      { exceptionId: '2026-12-01', date: '2026-12-01', closed: true },
      { exceptionId: '2026-12-02', date: '2026-12-02', closed: true },
      { exceptionId: '2026-12-03', date: '2026-12-03', closed: true },
    ])
  })

  it('maps a single-day exception and uses the date as id', () => {
    expect(
      employeeDayExceptionsOf({
        type: 'dayException',
        dayException: {
          date: '2026-12-10',
          closed: false,
          intervals: [{ start: '09:00', end: '12:00' }],
        },
      }),
    ).toEqual([
      {
        exceptionId: '2026-12-10',
        date: '2026-12-10',
        closed: false,
        intervals: [{ start: '09:00', end: '12:00' }],
      },
    ])
  })

  it('omits intervals when the day is closed', () => {
    expect(
      employeeDayExceptionsOf({
        type: 'dayException',
        dayException: { date: '2026-12-11', closed: true, intervals: [] },
      }),
    ).toEqual([{ exceptionId: '2026-12-11', date: '2026-12-11', closed: true }])
  })
})
