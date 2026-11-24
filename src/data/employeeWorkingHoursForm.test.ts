import { describe, expect, it } from 'vitest'

import { dayExceptionOpenIntervalsValid } from './employeeWorkingHoursForm'

describe('dayExceptionOpenIntervalsValid', () => {
  it('accepts closed days without intervals', () => {
    expect(dayExceptionOpenIntervalsValid(true, [])).toBe(true)
  })

  it('rejects open days with overlapping intervals', () => {
    expect(
      dayExceptionOpenIntervalsValid(false, [
        { start: '09:00', end: '12:00' },
        { start: '11:00', end: '14:00' },
      ]),
    ).toBe(false)
  })

  it('accepts valid open intervals', () => {
    expect(
      dayExceptionOpenIntervalsValid(false, [
        { start: '09:00', end: '12:00' },
        { start: '13:00', end: '17:00' },
      ]),
    ).toBe(true)
  })
})
