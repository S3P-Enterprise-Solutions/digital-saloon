import type {
  DayException,
  Holiday,
  LocalInterval,
  OpeningHoursByWeekday,
  TimeInterval,
} from './types'
import { parseHm, weekdayInTimeZone, zonedLocalToUtc } from './timezone'

function isHolidayOnDate(dateYmd: string, holidays: readonly Holiday[]): boolean {
  return holidays.some((holiday) => dateYmd >= holiday.startDate && dateYmd <= holiday.endDate)
}

function parseHmSafe(value: string): number | null {
  const match = /^(\d{2}):(\d{2})$/.exec(value)
  if (!match) return null
  const hours = Number(match[1])
  const minutes = Number(match[2])
  if (hours > 23 || minutes > 59) return null
  return hours * 60 + minutes
}

/** Drop invalid intervals instead of throwing (invalid stored hours → closed day). */
export function sanitizeTimeIntervals(intervals: unknown): TimeInterval[] {
  if (!Array.isArray(intervals)) return []
  const parsed: { startMin: number; endMin: number; interval: TimeInterval }[] = []
  for (const raw of intervals) {
    if (!raw || typeof raw !== 'object') continue
    const start = typeof raw.start === 'string' ? raw.start : ''
    const end = typeof raw.end === 'string' ? raw.end : ''
    const startMin = parseHmSafe(start)
    const endMin = parseHmSafe(end)
    if (startMin === null || endMin === null || startMin >= endMin) continue
    parsed.push({ startMin, endMin, interval: { start, end } })
  }
  parsed.sort((a, b) => a.startMin - b.startMin)
  const result: TimeInterval[] = []
  for (let i = 0; i < parsed.length; i += 1) {
    if (i > 0 && parsed[i].startMin < parsed[i - 1].endMin) return []
    result.push(parsed[i].interval)
  }
  return result
}

function intervalsToLocal(intervals: readonly TimeInterval[]): LocalInterval[] {
  return intervals.map((interval) => ({
    startMinutes: parseHm(interval.start),
    endMinutes: parseHm(interval.end),
  }))
}

/** Intersection of two local-open interval lists (same calendar day). */
export function intersectLocalIntervals(
  left: readonly LocalInterval[],
  right: readonly LocalInterval[],
): LocalInterval[] {
  const a = [...left].sort((x, y) => x.startMinutes - y.startMinutes)
  const b = [...right].sort((x, y) => x.startMinutes - y.startMinutes)
  const result: LocalInterval[] = []
  let i = 0
  let j = 0
  while (i < a.length && j < b.length) {
    const start = Math.max(a[i].startMinutes, b[j].startMinutes)
    const end = Math.min(a[i].endMinutes, b[j].endMinutes)
    if (start < end) {
      result.push({ startMinutes: start, endMinutes: end })
    }
    if (a[i].endMinutes < b[j].endMinutes) {
      i += 1
    } else {
      j += 1
    }
  }
  return result
}

/**
 * Resolve open intervals for a calendar date in salon timezone.
 * Precedence: holiday (closed) > day exception > weekly opening hours.
 */
export function resolveOpenIntervalsForDate(input: {
  dateYmd: string
  timeZone: string
  weekly: OpeningHoursByWeekday
  holidays: readonly Holiday[]
  dayExceptions: readonly DayException[]
}): LocalInterval[] {
  const { dateYmd, timeZone, weekly, holidays, dayExceptions } = input

  if (isHolidayOnDate(dateYmd, holidays)) {
    return []
  }

  const exception = dayExceptions.find((item) => item.date === dateYmd)
  if (exception) {
    if (exception.closed) return []
    return intervalsToLocal(exception.intervals)
  }

  const [y, m, d] = dateYmd.split('-').map(Number)
  const noon = zonedLocalToUtc(y, m, d, 12, 0, timeZone)
  const weekday = weekdayInTimeZone(noon, timeZone)
  return intervalsToLocal(weekly[weekday] ?? [])
}
