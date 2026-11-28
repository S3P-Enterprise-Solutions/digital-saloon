import type { BlockedSlotWithId } from './blockedSlots'
import type { ReservationWithId } from './reservations'

export type ReservationsListFilter = 'all' | 'salonflow' | 'google'

export type UnifiedAppointmentRow =
  | {
      kind: 'reservation'
      id: string
      startAt: string
      endAt: string
      durationMinutes: number
      reservation: ReservationWithId
    }
  | {
      kind: 'googleCalendar'
      id: string
      startAt: string
      endAt: string
      durationMinutes: number
      slot: BlockedSlotWithId
    }

export function durationMinutesBetween(startAt: string, endAt: string): number {
  const diffMs = new Date(endAt).getTime() - new Date(startAt).getTime()
  if (!Number.isFinite(diffMs) || diffMs <= 0) return 0
  return Math.round(diffMs / 60_000)
}

/**
 * Merges SalonFlow reservations and synced Google Calendar appointments into a single
 * chronologically sorted list, filtered by source.
 */
export function mergeReservationsAndCalendarEvents(
  reservations: readonly ReservationWithId[],
  blockedSlots: readonly BlockedSlotWithId[],
  filter: ReservationsListFilter = 'all',
): UnifiedAppointmentRow[] {
  const rows: UnifiedAppointmentRow[] = []

  if (filter === 'all' || filter === 'salonflow') {
    for (const reservation of reservations) {
      rows.push({
        kind: 'reservation',
        id: `res:${reservation.id}`,
        startAt: reservation.startAt,
        endAt: reservation.endAt,
        durationMinutes: reservation.durationMinutes,
        reservation,
      })
    }
  }

  if (filter === 'all' || filter === 'google') {
    for (const slot of blockedSlots) {
      if (slot.source !== 'GOOGLE_CALENDAR') continue
      rows.push({
        kind: 'googleCalendar',
        id: `gcal:${slot.id}`,
        startAt: slot.startAt,
        endAt: slot.endAt,
        durationMinutes: durationMinutesBetween(slot.startAt, slot.endAt),
        slot,
      })
    }
  }

  rows.sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime())
  return rows
}
