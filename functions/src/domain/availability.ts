import { intervalsOverlap } from './overlap'
import { intersectLocalIntervals, resolveOpenIntervalsForDate } from './openingIntervals'
import { addCalendarDays, calendarDateInTimeZone, parseHm, zonedLocalToUtc } from './timezone'
import type {
  AvailableSlot,
  BookingSettingsInput,
  BusyInterval,
  DayException,
  Holiday,
  OpeningHoursByWeekday,
} from './types'

export type EmployeeAvailabilityEnvelope = {
  weekly: OpeningHoursByWeekday
  dayExceptions: readonly DayException[]
}

export type ListAvailableSlotsInput = {
  timeZone: string
  weekly: OpeningHoursByWeekday
  holidays: readonly Holiday[]
  dayExceptions: readonly DayException[]
  busy: readonly BusyInterval[]
  durationMinutes: number
  settings: BookingSettingsInput
  /** UTC "now" for advance restrictions. */
  now: Date
  /** First local calendar day to consider (YYYY-MM-DD). */
  fromDateYmd: string
  /** Inclusive last local calendar day. */
  toDateYmd: string
  /** When false, skip min/max advance checks (manual admin bookings). */
  enforceAdvanceRestrictions?: boolean
  /** When set, open hours are salon hours ∩ employee hours for each day. */
  employeeEnvelope?: EmployeeAvailabilityEnvelope
}

function resolveOpenForDay(input: {
  dateYmd: string
  timeZone: string
  weekly: OpeningHoursByWeekday
  holidays: readonly Holiday[]
  dayExceptions: readonly DayException[]
  employeeEnvelope?: EmployeeAvailabilityEnvelope
}): ReturnType<typeof resolveOpenIntervalsForDate> {
  const salonOpen = resolveOpenIntervalsForDate({
    dateYmd: input.dateYmd,
    timeZone: input.timeZone,
    weekly: input.weekly,
    holidays: input.holidays,
    dayExceptions: input.dayExceptions,
  })
  if (!input.employeeEnvelope) return salonOpen
  const employeeOpen = resolveOpenIntervalsForDate({
    dateYmd: input.dateYmd,
    timeZone: input.timeZone,
    weekly: input.employeeEnvelope.weekly,
    holidays: [],
    dayExceptions: input.employeeEnvelope.dayExceptions,
  })
  return intersectLocalIntervals(salonOpen, employeeOpen)
}

function fitsInOpenInterval(
  startMinutes: number,
  durationMinutes: number,
  openStart: number,
  openEnd: number,
): boolean {
  const endMinutes = startMinutes + durationMinutes
  return startMinutes >= openStart && endMinutes <= openEnd
}

function isBusy(startAt: Date, endAt: Date, busy: readonly BusyInterval[]): boolean {
  return busy.some((interval) => intervalsOverlap(interval.startAt, interval.endAt, startAt, endAt))
}

/**
 * List UTC start times where a service of `durationMinutes` can be booked.
 * Slots must fit entirely inside one opening interval.
 */
export function listAvailableSlots(input: ListAvailableSlotsInput): AvailableSlot[] {
  const {
    timeZone,
    weekly,
    holidays,
    dayExceptions,
    busy,
    durationMinutes,
    settings,
    now,
    fromDateYmd,
    toDateYmd,
    enforceAdvanceRestrictions = true,
    employeeEnvelope,
  } = input

  const earliestStart = new Date(now.getTime() + settings.minAdvanceBookingMinutes * 60_000)
  const latestStart = new Date(now.getTime() + settings.maxAdvanceBookingDays * 24 * 60 * 60_000)

  const slots: AvailableSlot[] = []
  let cursor = fromDateYmd

  while (cursor <= toDateYmd) {
    const open = resolveOpenForDay({
      dateYmd: cursor,
      timeZone,
      weekly,
      holidays,
      dayExceptions,
      employeeEnvelope,
    })
    const [y, m, d] = cursor.split('-').map(Number)

    for (const interval of open) {
      for (
        let startMinutes = interval.startMinutes;
        startMinutes + durationMinutes <= interval.endMinutes;
        startMinutes += settings.slotIntervalMinutes
      ) {
        if (
          !fitsInOpenInterval(
            startMinutes,
            durationMinutes,
            interval.startMinutes,
            interval.endMinutes,
          )
        ) {
          continue
        }

        const hour = Math.floor(startMinutes / 60)
        const minute = startMinutes % 60
        const startAt = zonedLocalToUtc(y, m, d, hour, minute, timeZone)
        const endAt = new Date(startAt.getTime() + durationMinutes * 60_000)

        if (enforceAdvanceRestrictions) {
          if (startAt.getTime() < earliestStart.getTime()) continue
          if (startAt.getTime() > latestStart.getTime()) continue
        }

        if (isBusy(startAt, endAt, busy)) continue

        slots.push({ startAt, endAt })
      }
    }

    cursor = addCalendarDays(cursor, 1)
  }

  return slots
}

export function isSlotAvailable(input: {
  startAt: Date
  durationMinutes: number
  timeZone: string
  weekly: OpeningHoursByWeekday
  holidays: readonly Holiday[]
  dayExceptions: readonly DayException[]
  busy: readonly BusyInterval[]
  settings: BookingSettingsInput
  now: Date
  enforceAdvanceRestrictions?: boolean
  employeeEnvelope?: EmployeeAvailabilityEnvelope
}): boolean {
  const endAt = new Date(input.startAt.getTime() + input.durationMinutes * 60_000)
  const dateYmd = calendarDateInTimeZone(input.startAt, input.timeZone)
  const open = resolveOpenForDay({
    dateYmd,
    timeZone: input.timeZone,
    weekly: input.weekly,
    holidays: input.holidays,
    dayExceptions: input.dayExceptions,
    employeeEnvelope: input.employeeEnvelope,
  })

  const localPartsHour = Number(
    new Intl.DateTimeFormat('en-US', {
      timeZone: input.timeZone,
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    })
      .formatToParts(input.startAt)
      .find((p) => p.type === 'hour')?.value ?? '0',
  )
  const localPartsMinute = Number(
    new Intl.DateTimeFormat('en-US', {
      timeZone: input.timeZone,
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    })
      .formatToParts(input.startAt)
      .find((p) => p.type === 'minute')?.value ?? '0',
  )
  const startMinutes = localPartsHour * 60 + localPartsMinute
  const endMinutes = startMinutes + input.durationMinutes

  const fitsOpen = open.some(
    (interval) => startMinutes >= interval.startMinutes && endMinutes <= interval.endMinutes,
  )
  if (!fitsOpen) return false

  if (input.enforceAdvanceRestrictions !== false) {
    const earliest = new Date(
      input.now.getTime() + input.settings.minAdvanceBookingMinutes * 60_000,
    )
    const latest = new Date(
      input.now.getTime() + input.settings.maxAdvanceBookingDays * 24 * 60 * 60_000,
    )
    if (input.startAt.getTime() < earliest.getTime()) return false
    if (input.startAt.getTime() > latest.getTime()) return false
  }

  if (isBusy(input.startAt, endAt, input.busy)) return false
  return true
}

export { parseHm }
