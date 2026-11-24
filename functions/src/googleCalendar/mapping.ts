import { createHash } from 'node:crypto'

import { zonedLocalToUtc } from '../domain/timezone'

export type GoogleCalendarEventDateTime = {
  dateTime?: string
  date?: string
  timeZone?: string
}

export type GoogleCalendarEvent = {
  id: string
  status?: string
  summary?: string
  description?: string
  transparency?: string
  start?: GoogleCalendarEventDateTime
  end?: GoogleCalendarEventDateTime
  extendedProperties?: {
    private?: Record<string, string>
  }
}

export type MappedBlockedSlot = {
  startAt: string
  endAt: string
  title: string
  allDay: boolean
}

const BASE32HEX = '0123456789abcdefghijklmnopqrstuv'

export function googleEventIdForReservation(salonId: string, reservationId: string): string {
  const digest = createHash('sha256').update(`${salonId}:${reservationId}`).digest()
  let out = 'sf'
  for (let i = 0; i < 20; i += 1) {
    out += BASE32HEX[digest[i]! % 32]
  }
  return out
}

export function blockedSlotDocIdForGoogleEvent(
  eventId: string,
  employeeId?: string | null,
): string {
  const hash = createHash('sha256').update(eventId).digest('hex').slice(0, 24)
  return employeeId ? `gcal_${employeeId}_${hash}` : `gcal_${hash}`
}

function parseYmd(ymd: string): { year: number; month: number; day: number } | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd)
  if (!match) return null
  return {
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3]),
  }
}

/**
 * Converts a Google Calendar event into a SalonFlow blockedSlot payload.
 * Returns null for cancelled events, "Free" (`transparent`) events,
 * or events created by SalonFlow itself (`salonReservationId` extended property).
 */
export function googleEventToBlockedSlot(
  event: GoogleCalendarEvent,
  timeZone: string,
): MappedBlockedSlot | null {
  if (!event.id) return null
  if (event.status === 'cancelled') return null
  if (event.transparency === 'transparent') return null
  if (event.extendedProperties?.private?.salonReservationId) return null

  const title = event.summary?.trim() || 'Google Calendar'

  if (event.start?.dateTime && event.end?.dateTime) {
    const start = new Date(event.start.dateTime)
    const end = new Date(event.end.dateTime)
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return null
    if (end.getTime() <= start.getTime()) return null
    return {
      startAt: start.toISOString(),
      endAt: end.toISOString(),
      title,
      allDay: false,
    }
  }

  if (event.start?.date && event.end?.date) {
    const startYmd = parseYmd(event.start.date)
    const endYmd = parseYmd(event.end.date)
    if (!startYmd || !endYmd) return null
    const start = zonedLocalToUtc(startYmd.year, startYmd.month, startYmd.day, 0, 0, timeZone)
    const end = zonedLocalToUtc(endYmd.year, endYmd.month, endYmd.day, 0, 0, timeZone)
    if (end.getTime() <= start.getTime()) return null
    return {
      startAt: start.toISOString(),
      endAt: end.toISOString(),
      title,
      allDay: true,
    }
  }

  return null
}

export type ReservationGoogleEventInput = {
  reservationId: string
  salonId: string
  firstName: string
  lastName: string
  phone: string
  email: string | null
  serviceName: string
  startAt: string
  endAt: string
  status: string
  notes?: string | null
  internalNote?: string | null
  timeZone: string
}

export type GoogleCalendarEventPayload = {
  id?: string
  summary: string
  description: string
  start: { dateTime: string; timeZone: string }
  end: { dateTime: string; timeZone: string }
  extendedProperties: {
    private: {
      salonReservationId: string
      salonId: string
    }
  }
}

export function reservationToGoogleEvent(
  input: ReservationGoogleEventInput,
): GoogleCalendarEventPayload {
  const customerName = `${input.firstName} ${input.lastName}`.trim()
  const prefix =
    input.status === 'PENDING' ? '[Pending] ' : input.status === 'COMPLETED' ? '[Completed] ' : ''
  const summary = `${prefix}${customerName} — ${input.serviceName}`

  const lines = [
    `Service: ${input.serviceName}`,
    `Status: ${input.status}`,
    `Booking ID: ${input.reservationId}`,
  ]

  return {
    id: googleEventIdForReservation(input.salonId, input.reservationId),
    summary,
    description: lines.join('\n'),
    start: { dateTime: input.startAt, timeZone: input.timeZone },
    end: { dateTime: input.endAt, timeZone: input.timeZone },
    extendedProperties: {
      private: {
        salonReservationId: input.reservationId,
        salonId: input.salonId,
      },
    },
  }
}
