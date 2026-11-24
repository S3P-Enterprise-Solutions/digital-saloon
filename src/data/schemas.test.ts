import { describe, expect, it } from 'vitest'
import * as v from 'valibot'

import {
  bookingSettingsSchema,
  optionalSearchParam,
  reservationSchema,
  salonSchema,
  serviceSchema,
  userProfileSchema,
} from './schemas'

describe('schemas', () => {
  it('accepts a valid user profile', () => {
    const profile = v.parse(userProfileSchema, {
      email: 'demo@example.com',
      displayName: 'Demo User',
      role: 'user',
      createdAt: '2026-01-01T00:00:00.000Z',
    })

    expect(profile.role).toBe('user')
  })

  it('falls back missing optional search params', () => {
    const schema = v.object({
      redirect: optionalSearchParam(v.pipe(v.string(), v.minLength(1))),
    })

    expect(v.parse(schema, {})).toEqual({ redirect: undefined })
    expect(v.parse(schema, { redirect: '/home' })).toEqual({ redirect: '/home' })
  })

  it('accepts a valid salon document', () => {
    const salon = v.parse(salonSchema, {
      name: 'SalonFlow Pilot',
      address: 'Hauptstraße 1, 1010 Wien',
      phone: '+43 1 234567',
      email: 'hello@salonflow.local',
      timezone: 'Europe/Vienna',
    })

    expect(salon.timezone).toBe('Europe/Vienna')
  })

  it('accepts booking settings with advance restrictions', () => {
    const settings = v.parse(bookingSettingsSchema, {
      confirmationMode: 'AUTOMATIC',
      slotIntervalMinutes: 15,
      minAdvanceBookingMinutes: 60,
      maxAdvanceBookingDays: 60,
      pendingExpirationHours: 24,
    })

    expect(settings.minAdvanceBookingMinutes).toBe(60)
    expect(settings.maxAdvanceBookingDays).toBe(60)
  })

  it('accepts EXPIRED reservation status', () => {
    const reservation = v.parse(reservationSchema, {
      firstName: 'Alt',
      lastName: 'Anfrage',
      phone: '+43 660 1',
      email: 'a@example.com',
      serviceId: 'svc1',
      serviceName: 'Haircut',
      durationMinutes: 30,
      priceCents: 2500,
      startAt: '2026-03-10T09:00:00.000Z',
      endAt: '2026-03-10T09:30:00.000Z',
      status: 'EXPIRED',
      source: 'ONLINE',
      managementTokenHash: 'abc',
      internalNote: null,
      idempotencyKey: null,
      createdAt: '2026-03-01T00:00:00.000Z',
      updatedAt: '2026-03-01T00:00:00.000Z',
    })
    expect(reservation.status).toBe('EXPIRED')
  })

  it('rejects invalid reservation status', () => {
    expect(() =>
      v.parse(reservationSchema, {
        firstName: 'Anna',
        lastName: 'Muster',
        phone: '+43 660 1234567',
        email: null,
        serviceId: 'svc1',
        serviceName: 'Haircut',
        durationMinutes: 30,
        priceCents: 2500,
        startAt: '2026-03-10T09:00:00.000Z',
        endAt: '2026-03-10T09:30:00.000Z',
        status: 'UNKNOWN',
        source: 'ONLINE',
        managementTokenHash: 'abc',
        internalNote: null,
        idempotencyKey: null,
        createdAt: '2026-03-01T00:00:00.000Z',
        updatedAt: '2026-03-01T00:00:00.000Z',
      }),
    ).toThrow()
  })

  it('accepts a valid service with price in cents', () => {
    const service = v.parse(serviceSchema, {
      nameDe: 'Haircut',
      nameIt: 'Taglio',
      descriptionDe: 'Classic cut',
      descriptionIt: 'Taglio classico',
      durationMinutes: 30,
      priceCents: 2500,
      active: true,
      sortOrder: 0,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    })

    expect(service.priceCents).toBe(2500)
    expect(service.sortOrder).toBe(0)
  })
})
