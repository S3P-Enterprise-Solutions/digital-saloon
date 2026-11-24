import { addCalendarDays } from './calendarMath'
import type { AbsenceSave } from './openingHoursForm'
import type { TimeInterval } from './schemas'

/** One employee day-exception write (callable payload without employeeUid). */
export type EmployeeDayExceptionSave = {
  exceptionId: string
  date: string
  closed: boolean
  intervals?: TimeInterval[]
}

/**
 * Maps a salon-style AbsenceSave onto employee day-exception docs.
 * Multi-day holiday → one closed exception per date (doc id = date).
 * Partial / custom day → one exception for that date.
 */
export function employeeDayExceptionsOf(absence: AbsenceSave): EmployeeDayExceptionSave[] {
  if (absence.type === 'holiday') {
    const { startDate, endDate } = absence.holiday
    const items: EmployeeDayExceptionSave[] = []
    for (let date = startDate; date <= endDate; date = addCalendarDays(date, 1)) {
      items.push({ exceptionId: date, date, closed: true })
    }
    return items
  }

  const { date, closed, intervals } = absence.dayException
  return [
    {
      exceptionId: date,
      date,
      closed,
      intervals: closed ? undefined : intervals,
    },
  ]
}
