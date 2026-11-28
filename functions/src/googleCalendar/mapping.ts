import { createHash } from 'node:crypto'

import { zonedLocalToUtc } from '../domain/timezone'

export type GoogleCalendarEventDateTime = {
  dateTime?: string
  date?: string
  timeZone?: string
}

export type GoogleCalendarVisibility = 'default' | 'public' | 'private' | 'confidential'

export type GoogleCalendarEvent = {
  id: string
  status?: string
  summary?: string
  description?: string
  transparency?: string
  visibility?: string
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
  description: string | null
  visibility: GoogleCalendarVisibility | null
  isPrivate: boolean
  allDay: boolean
}

export function normalizeGoogleVisibility(
  visibility: string | null | undefined,
): GoogleCalendarVisibility | null {
  if (
    visibility === 'default' ||
    visibility === 'public' ||
    visibility === 'private' ||
    visibility === 'confidential'
  ) {
    return visibility
  }
  return null
}

export function isGoogleVisibilityPrivate(visibility: string | null | undefined): boolean {
  return visibility === 'private' || visibility === 'confidential'
}

export function resolveEffectivePrivacy(
  googleVisibility: string | null | undefined,
  privateOverride: boolean | null | undefined,
): boolean {
  if (typeof privateOverride === 'boolean') return privateOverride
  return isGoogleVisibilityPrivate(googleVisibility)
}

export type SyncedBlockedSlotComparable = {
  title?: string | null
  reason?: string | null
  description?: string | null
  startAt?: string | null
  endAt?: string | null
  allDay?: boolean
  visibility?: string | null
  isPrivate?: boolean
  privateOverride?: boolean | null
}

/** Returns true when any synced field differs so unchanged Google Calendar docs can skip writes. */
export function hasBlockedSlotSyncedFieldsChanged(
  prev: SyncedBlockedSlotComparable | undefined,
  next: Required<SyncedBlockedSlotComparable>,
): boolean {
  if (!prev) return true
  return (
    (prev.title ?? null) !== next.title ||
    (prev.reason ?? null) !== next.reason ||
    (prev.description ?? null) !== next.description ||
    (prev.startAt ?? null) !== next.startAt ||
    (prev.endAt ?? null) !== next.endAt ||
    Boolean(prev.allDay) !== next.allDay ||
    (prev.visibility ?? null) !== next.visibility ||
    Boolean(prev.isPrivate) !== next.isPrivate ||
    (typeof prev.privateOverride === 'boolean' ? prev.privateOverride : null) !==
      next.privateOverride
  )
}

export type ViewerContext = {
  uid: string
  isAdmin: boolean
}

export type StoredBlockedSlot = {
  id: string
  startAt: string
  endAt: string
  reason?: string | null
  createdAt: string
  source?: 'MANUAL' | 'GOOGLE_CALENDAR'
  employeeId?: string | null
  googleEventId?: string
  title?: string | null
  description?: string | null
  visibility?: GoogleCalendarVisibility | null
  isPrivate?: boolean
  privateOverride?: boolean | null
  allDay?: boolean
  updatedAt?: string
}

export type RedactedBlockedSlot = Omit<StoredBlockedSlot, 'title' | 'reason' | 'description'> & {
  title: string | null
  reason: string | null
  description: string | null
  isPrivate: boolean
  redacted: boolean
  canTogglePrivacy: boolean
}

/**
 * Enforces owner-only visibility for private Google Calendar events:
 * - For employee-owned events (`employeeId` set): only the owning stylist (`viewer.uid === employeeId`)
 *   sees title, reason, and description when `isPrivate` is true. Admins and other stylists see a redacted slot.
 * - For salon-wide events (`employeeId === null`): admins can view and toggle privacy.
 */
export function redactBlockedSlotForViewer(
  slot: StoredBlockedSlot,
  viewer: ViewerContext,
): RedactedBlockedSlot {
  const employeeId =
    typeof slot.employeeId === 'string' && slot.employeeId.trim() ? slot.employeeId.trim() : null
  const isPrivate =
    resolveEffectivePrivacy(slot.visibility, slot.privateOverride) || Boolean(slot.isPrivate)
  const isOwner = employeeId !== null ? viewer.uid === employeeId : viewer.isAdmin
  const canTogglePrivacy = slot.source === 'GOOGLE_CALENDAR' && isOwner
  const shouldRedact = isPrivate && !isOwner

  if (shouldRedact) {
    return {
      ...slot,
      employeeId,
      title: null,
      reason: null,
      description: null,
      isPrivate: true,
      redacted: true,
      canTogglePrivacy: false,
    }
  }

  return {
    ...slot,
    employeeId,
    title: slot.title ?? null,
    reason: slot.reason ?? null,
    description: slot.description ?? null,
    isPrivate,
    redacted: false,
    canTogglePrivacy,
  }
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
  const rawDescription = typeof event.description === 'string' ? event.description.trim() : ''
  const description = rawDescription.length > 0 ? rawDescription.slice(0, 2000) : null
  const visibility = normalizeGoogleVisibility(event.visibility)
  const isPrivate = isGoogleVisibilityPrivate(visibility)

  if (event.start?.dateTime && event.end?.dateTime) {
    const start = new Date(event.start.dateTime)
    const end = new Date(event.end.dateTime)
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return null
    if (end.getTime() <= start.getTime()) return null
    return {
      startAt: start.toISOString(),
      endAt: end.toISOString(),
      title,
      description,
      visibility,
      isPrivate,
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
      description,
      visibility,
      isPrivate,
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
