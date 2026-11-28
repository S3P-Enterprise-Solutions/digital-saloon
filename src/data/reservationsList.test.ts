import { describe, expect, it } from 'vitest'

import type { BlockedSlotWithId } from './blockedSlots'
import type { ReservationWithId } from './reservations'
import { durationMinutesBetween, mergeReservationsAndCalendarEvents } from './reservationsList'

function makeReservation(id: string, startAt: string, endAt: string): ReservationWithId {
  return {
    id,
    firstName: 'Maria',
    lastName: 'Rossi',
    phone: '+390473000000',
    email: 'maria@example.com',
    serviceId: 'balayage',
    serviceName: 'Balayage',
    durationMinutes: 180,
    priceCents: 15000,
    startAt,
    endAt,
    status: 'CONFIRMED',
    source: 'ONLINE',
    managementTokenHash: 'hash',
    internalNote: null,
    idempotencyKey: null,
    createdAt: startAt,
    updatedAt: startAt,
  }
}

function makeGoogleSlot(
  id: string,
  startAt: string,
  endAt: string,
  overrides: Partial<BlockedSlotWithId> = {},
): BlockedSlotWithId {
  return {
    id,
    source: 'GOOGLE_CALENDAR',
    title: 'Anna Gruber — Färben',
    startAt,
    endAt,
    createdAt: startAt,
    ...overrides,
  }
}

describe('durationMinutesBetween', () => {
  it('computes rounded duration in minutes', () => {
    expect(durationMinutesBetween('2026-11-20T09:00:00.000Z', '2026-11-20T11:30:00.000Z')).toBe(150)
    expect(durationMinutesBetween('2026-11-20T11:30:00.000Z', '2026-11-20T09:00:00.000Z')).toBe(0)
  })
})

describe('mergeReservationsAndCalendarEvents', () => {
  const reservations = [
    makeReservation('res-1', '2026-11-20T10:00:00.000Z', '2026-11-20T13:00:00.000Z'),
  ]
  const blockedSlots: BlockedSlotWithId[] = [
    makeGoogleSlot('gcal-1', '2026-11-20T08:30:00.000Z', '2026-11-20T09:30:00.000Z'),
    makeGoogleSlot('gcal-private', '2026-11-20T14:00:00.000Z', '2026-11-20T15:00:00.000Z', {
      title: null,
      isPrivate: true,
      redacted: true,
    }),
    {
      id: 'manual-block',
      source: 'MANUAL',
      startAt: '2026-11-20T16:00:00.000Z',
      endAt: '2026-11-20T17:00:00.000Z',
      createdAt: '2026-11-19T00:00:00.000Z',
    },
  ]

  it('merges SalonFlow and Google Calendar appointments chronologically and skips manual blocks', () => {
    const rows = mergeReservationsAndCalendarEvents(reservations, blockedSlots, 'all')
    expect(rows.map((row) => row.id)).toEqual(['gcal:gcal-1', 'res:res-1', 'gcal:gcal-private'])
    expect(rows[0].durationMinutes).toBe(60)
    expect(rows[1].durationMinutes).toBe(180)
  })

  it('filters by SalonFlow only or Google Calendar only', () => {
    const salonOnly = mergeReservationsAndCalendarEvents(reservations, blockedSlots, 'salonflow')
    expect(salonOnly.map((row) => row.id)).toEqual(['res:res-1'])

    const googleOnly = mergeReservationsAndCalendarEvents(reservations, blockedSlots, 'google')
    expect(googleOnly.map((row) => row.id)).toEqual(['gcal:gcal-1', 'gcal:gcal-private'])
  })
})
