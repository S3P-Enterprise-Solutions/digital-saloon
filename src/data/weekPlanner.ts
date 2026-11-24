import { addCalendarDays } from './calendarMath'
import { startOfWeekYmd } from './calendarRange'
import type { OpeningHoursByWeekday } from './openingHours'
import { minuteOfHhmm, openIntervalsForDate, weekdayOfYmd, type Closures } from './openingRules'
import type { BlockedSlotWithId } from './blockedSlots'
import type { ReservationWithId } from './reservations'
import type { ReservationStatus, Weekday } from './schemas'

export const addSlotStepMinutes = 30

const plannedStatuses: ReadonlySet<ReservationStatus> = new Set([
  'PENDING',
  'CONFIRMED',
  'COMPLETED',
])

export type MinuteInterval = { startMinute: number; endMinute: number }

export type PlannerEntry = MinuteInterval & {
  reservation: ReservationWithId
  /** Column inside the day when appointments overlap (0-based). */
  lane: number
  laneCount: number
}

export type PlannerBlockedEntry = MinuteInterval & {
  block: BlockedSlotWithId
}

export type PlannerDay = {
  dateYmd: string
  weekday: Weekday
  isToday: boolean
  openIntervals: MinuteInterval[]
  entries: PlannerEntry[]
  blockedEntries: PlannerBlockedEntry[]
  /** Start minutes where a new appointment can be entered (open, free, not in the past). */
  addStartMinutes: number[]
  count: number
  bookedMinutes: number
}

export type WeekPlan = {
  weekStartYmd: string
  isoWeek: number
  days: PlannerDay[]
  firstHour: number
  lastHour: number
  /** Minute of the day for the "now" line, when today is in this week. */
  nowMinute: number | null
  totals: { count: number; bookedMinutes: number; revenueCents: number }
}

export { minuteOfHhmm, weekdayOfYmd }

/**
 * Week the planner opens on: the current week, or the next one when the salon
 * has no opening hours left this week (for example on a Sunday).
 */
export function defaultWeekStartYmd(
  todayYmd: string,
  openingHours: Partial<OpeningHoursByWeekday> | undefined,
): string {
  const weekStart = startOfWeekYmd(todayYmd)
  if (!openingHours) return weekStart
  for (let dateYmd = todayYmd; dateYmd < addCalendarDays(weekStart, 7);) {
    if ((openingHours[weekdayOfYmd(dateYmd)]?.intervals.length ?? 0) > 0) return weekStart
    dateYmd = addCalendarDays(dateYmd, 1)
  }
  return addCalendarDays(weekStart, 7)
}

/** ISO 8601 week number (weeks start Monday, week 1 contains January 4th). */
export function isoWeekNumber(dateYmd: string): number {
  const [y, m, d] = dateYmd.split('-').map(Number)
  const date = new Date(Date.UTC(y, m - 1, d))
  const dayFromMonday = (date.getUTCDay() + 6) % 7
  date.setUTCDate(date.getUTCDate() - dayFromMonday + 3)
  const firstThursday = new Date(Date.UTC(date.getUTCFullYear(), 0, 4))
  const firstDayFromMonday = (firstThursday.getUTCDay() + 6) % 7
  firstThursday.setUTCDate(firstThursday.getUTCDate() - firstDayFromMonday + 3)
  return 1 + Math.round((date.getTime() - firstThursday.getTime()) / (7 * 24 * 60 * 60_000))
}

/**
 * Query window for one week. Starts a day early and ends a day late in UTC so
 * appointments near local midnight are included; `planWeek` filters by local date.
 */
export function weekQueryRange(weekStartYmd: string): { startIso: string; endIso: string } {
  return {
    startIso: `${addCalendarDays(weekStartYmd, -1)}T00:00:00.000Z`,
    endIso: `${addCalendarDays(weekStartYmd, 8)}T00:00:00.000Z`,
  }
}

/** Local calendar date and minute of the day for an instant in the given time zone. */
export function zonedDateAndMinute(
  instant: string | Date,
  timeZone: string,
): { dateYmd: string; minute: number } {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(typeof instant === 'string' ? new Date(instant) : instant)
  const part = (type: Intl.DateTimeFormatPartTypes): string =>
    parts.find((item) => item.type === type)?.value ?? '00'
  return {
    dateYmd: `${part('year')}-${part('month')}-${part('day')}`,
    minute: Number(part('hour')) * 60 + Number(part('minute')),
  }
}

export function hhmmOfMinute(minute: number): string {
  return `${String(Math.floor(minute / 60)).padStart(2, '0')}:${String(minute % 60).padStart(2, '0')}`
}

/** Compact booked time like a timesheet total: `2 h 30 min`, `45 min`, `3 h`. */
export function formatBookedTime(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  if (hours === 0) return `${rest} min`
  return rest === 0 ? `${hours} h` : `${hours} h ${rest} min`
}

function assignLanes(
  items: Array<MinuteInterval & { reservation: ReservationWithId }>,
): PlannerEntry[] {
  const sorted = [...items].sort(
    (a, b) => a.startMinute - b.startMinute || b.endMinute - a.endMinute,
  )
  const result: PlannerEntry[] = []
  let cluster: PlannerEntry[] = []
  let clusterEnd = -1
  let laneEnds: number[] = []

  const closeCluster = () => {
    for (const entry of cluster) entry.laneCount = laneEnds.length
    result.push(...cluster)
    cluster = []
    laneEnds = []
  }

  for (const item of sorted) {
    if (item.startMinute >= clusterEnd) closeCluster()
    let lane = laneEnds.findIndex((end) => end <= item.startMinute)
    if (lane === -1) {
      lane = laneEnds.length
      laneEnds.push(item.endMinute)
    } else {
      laneEnds[lane] = item.endMinute
    }
    cluster.push({ ...item, lane, laneCount: 1 })
    clusterEnd = Math.max(clusterEnd, item.endMinute)
  }
  closeCluster()
  return result
}

export type PlanWeekInput = {
  reservations: readonly ReservationWithId[]
  blockedSlots?: readonly BlockedSlotWithId[]
  employeeId?: string | null
  weekStartYmd: string
  openingHours: Partial<OpeningHoursByWeekday> | undefined
  /** Holidays and day exceptions; days they close show as closed in the planner. */
  closures?: Closures
  timeZone: string
  now: Date
}

export function planWeek({
  reservations,
  blockedSlots = [],
  employeeId,
  weekStartYmd,
  openingHours,
  closures,
  timeZone,
  now,
}: PlanWeekInput): WeekPlan {
  const current = zonedDateAndMinute(now, timeZone)
  const dates = Array.from({ length: 7 }, (_, index) => addCalendarDays(weekStartYmd, index))

  const byDate = new Map<string, Array<MinuteInterval & { reservation: ReservationWithId }>>()
  for (const reservation of reservations) {
    if (!plannedStatuses.has(reservation.status)) continue
    if (employeeId && reservation.employeeId !== employeeId) continue
    const start = zonedDateAndMinute(reservation.startAt, timeZone)
    if (!dates.includes(start.dateYmd)) continue
    const end = zonedDateAndMinute(reservation.endAt, timeZone)
    const endMinute = end.dateYmd === start.dateYmd ? end.minute : 24 * 60
    const items = byDate.get(start.dateYmd) ?? []
    items.push({ reservation, startMinute: start.minute, endMinute })
    byDate.set(start.dateYmd, items)
  }

  const blockedByDate = new Map<string, PlannerBlockedEntry[]>()
  for (const block of blockedSlots) {
    if (employeeId && block.employeeId && block.employeeId !== employeeId) continue
    const start = zonedDateAndMinute(block.startAt, timeZone)
    const end = zonedDateAndMinute(block.endAt, timeZone)
    for (const dateYmd of dates) {
      if (start.dateYmd > dateYmd || end.dateYmd < dateYmd) continue
      if (end.dateYmd === dateYmd && end.minute === 0) continue
      const startMinute = start.dateYmd < dateYmd ? 0 : start.minute
      const endMinute = end.dateYmd > dateYmd ? 24 * 60 : end.minute
      if (endMinute <= startMinute) continue
      const list = blockedByDate.get(dateYmd) ?? []
      list.push({ block, startMinute, endMinute })
      blockedByDate.set(dateYmd, list)
    }
  }

  let earliest = Number.POSITIVE_INFINITY
  let latest = Number.NEGATIVE_INFINITY
  const totals = { count: 0, bookedMinutes: 0, revenueCents: 0 }

  const days = dates.map((dateYmd): PlannerDay => {
    const weekday = weekdayOfYmd(dateYmd)
    const openIntervals = openIntervalsForDate(dateYmd, openingHours, closures).map((interval) => ({
      startMinute: minuteOfHhmm(interval.start),
      endMinute: minuteOfHhmm(interval.end),
    }))
    const entries = assignLanes(byDate.get(dateYmd) ?? [])
    const blockedEntries = blockedByDate.get(dateYmd) ?? []

    for (const interval of [...openIntervals, ...entries]) {
      earliest = Math.min(earliest, interval.startMinute)
      latest = Math.max(latest, interval.endMinute)
    }

    const blocking = entries.filter((entry) => entry.reservation.status !== 'COMPLETED')
    const addStartMinutes: number[] = []
    if (dateYmd >= current.dateYmd) {
      for (const interval of openIntervals) {
        for (
          let minute = interval.startMinute;
          minute + addSlotStepMinutes <= interval.endMinute;
          minute += addSlotStepMinutes
        ) {
          const inPast = dateYmd === current.dateYmd && minute <= current.minute
          const taken =
            blocking.some((entry) => entry.startMinute <= minute && minute < entry.endMinute) ||
            blockedEntries.some((entry) => entry.startMinute <= minute && minute < entry.endMinute)
          if (!inPast && !taken) addStartMinutes.push(minute)
        }
      }
    }

    const bookedMinutes = entries.reduce(
      (sum, entry) => sum + entry.endMinute - entry.startMinute,
      0,
    )
    totals.count += entries.length
    totals.bookedMinutes += bookedMinutes
    totals.revenueCents += entries.reduce((sum, entry) => sum + entry.reservation.priceCents, 0)

    return {
      dateYmd,
      weekday,
      isToday: dateYmd === current.dateYmd,
      openIntervals,
      entries,
      blockedEntries,
      addStartMinutes,
      count: entries.length,
      bookedMinutes,
    }
  })

  const hasContent = Number.isFinite(earliest)
  return {
    weekStartYmd,
    isoWeek: isoWeekNumber(weekStartYmd),
    days,
    firstHour: hasContent ? Math.floor(earliest / 60) : 8,
    lastHour: hasContent ? Math.ceil(latest / 60) : 18,
    nowMinute: dates.includes(current.dateYmd) ? current.minute : null,
    totals,
  }
}
