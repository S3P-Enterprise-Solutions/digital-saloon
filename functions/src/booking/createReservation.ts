import { onCall, HttpsError } from 'firebase-functions/v2/https'

import { assertAdmin } from '../authz'
import { functionsRegion, getSalonId } from '../config'
import { isObject } from '../schemas'
import { createReservationTransactional } from './reservationWrite'
import { syncReservationToGoogleCalendar } from '../googleCalendar/sync'
import { recordActivityLog } from '../logging/activityLog'
import { sendBookingConfirmationEmail } from './sendBookingEmail'

function requireString(value: unknown, field: string): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new HttpsError('invalid-argument', `${field} is required.`)
  }
  return value.trim()
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function requireEmail(value: unknown): string {
  const email = requireString(value, 'email')
  if (email.length > 254 || !EMAIL_PATTERN.test(email)) {
    throw new HttpsError('invalid-argument', 'email must be a valid email address.')
  }
  return email
}

function optionalNotes(value: unknown): string | null {
  if (value === null || value === undefined) return null
  if (typeof value !== 'string') {
    throw new HttpsError('invalid-argument', 'notes must be a string.')
  }
  const trimmed = value.trim()
  if (trimmed.length === 0) return null
  if (trimmed.length > 1000) {
    throw new HttpsError('invalid-argument', 'notes must be at most 1000 characters.')
  }
  return trimmed
}

/** Exported for unit tests; shared by online and manual create callables. */
export function resolveServiceIds(data: Record<string, unknown>): {
  serviceId: string
  serviceIds: string[]
} {
  if (data.serviceIds !== undefined) {
    if (!Array.isArray(data.serviceIds)) {
      throw new HttpsError('invalid-argument', 'serviceIds must be an array of service ids.')
    }
    const ids = Array.from(
      new Set(
        data.serviceIds
          .filter((item): item is string => typeof item === 'string')
          .map((item) => item.trim())
          .filter(Boolean),
      ),
    )
    if (ids.length === 0) {
      throw new HttpsError('invalid-argument', 'serviceIds must not be empty.')
    }
    if (ids.length > 15) {
      throw new HttpsError('invalid-argument', 'At most 15 services can be booked at once.')
    }
    return { serviceId: ids[0], serviceIds: ids }
  }
  const serviceId = requireString(data.serviceId, 'serviceId')
  return { serviceId, serviceIds: [serviceId] }
}

export const createReservation = onCall({ region: functionsRegion }, async (request) => {
  const data = request.data
  if (!isObject(data)) {
    throw new HttpsError('invalid-argument', 'Invalid payload.')
  }

  const privacyAccepted = data.privacyAccepted === true
  if (!privacyAccepted) {
    throw new HttpsError('invalid-argument', 'Privacy acknowledgement is required.')
  }

  const startAtRaw = requireString(data.startAt, 'startAt')
  const startAt = new Date(startAtRaw)
  if (Number.isNaN(startAt.getTime())) {
    throw new HttpsError('invalid-argument', 'startAt must be an ISO timestamp.')
  }

  const { serviceId, serviceIds } = resolveServiceIds(data)
  const email = requireEmail(data.email)
  const notes = optionalNotes(data.notes)

  const firstName = requireString(data.firstName, 'firstName')
  const lastName = requireString(data.lastName, 'lastName')
  const employeeId =
    typeof data.employeeId === 'string' && data.employeeId.trim() ? data.employeeId.trim() : null

  const result = await createReservationTransactional(
    {
      firstName,
      lastName,
      phone: requireString(data.phone, 'phone'),
      email,
      notes,
      serviceId,
      serviceIds,
      employeeId,
      startAt,
      source: 'ONLINE',
      internalNote: null,
      idempotencyKey:
        typeof data.idempotencyKey === 'string' && data.idempotencyKey.length > 0
          ? data.idempotencyKey
          : null,
      enforceAdvanceRestrictions: true,
    },
    undefined,
    getSalonId(),
  )

  if (!result.ok) {
    throw new HttpsError('failed-precondition', result.message, { reason: result.code })
  }

  if (!result.reused) {
    await syncReservationToGoogleCalendar(result.reservationId)
    await recordActivityLog({
      request,
      action: 'reservation_created',
      source: 'server',
      path: '/book',
      details: {
        reservationId: result.reservationId,
        status: result.status,
        serviceCount: serviceIds.length,
        startAt: startAt.toISOString(),
      },
    })
  }

  if (!result.reused && result.managementToken && result.serviceName && result.durationMinutes) {
    const locale = data.locale === 'it' ? 'it' : 'de'
    const EMAIL_WAIT_TIMEOUT_MS = 2500
    await Promise.race([
      sendBookingConfirmationEmail({
        reservationId: result.reservationId,
        to: email,
        firstName,
        lastName,
        serviceName: result.serviceName,
        durationMinutes: result.durationMinutes,
        startAt,
        status: result.status,
        managementToken: result.managementToken,
        notes,
        locale,
        timeZone: result.timeZone,
        salonName: result.salonName,
        salonAddress: result.salonAddress,
        salonPhone: result.salonPhone,
      }),
      new Promise<void>((resolve) => setTimeout(resolve, EMAIL_WAIT_TIMEOUT_MS)),
    ])
  }

  return {
    reservationId: result.reservationId,
    status: result.status,
    managementToken: result.managementToken,
    reused: result.reused,
  }
})

export const createManualReservation = onCall({ region: functionsRegion }, async (request) => {
  await assertAdmin(request)

  const data = request.data
  if (!isObject(data)) {
    throw new HttpsError('invalid-argument', 'Invalid payload.')
  }

  const startAtRaw = requireString(data.startAt, 'startAt')
  const startAt = new Date(startAtRaw)
  if (Number.isNaN(startAt.getTime())) {
    throw new HttpsError('invalid-argument', 'startAt must be an ISO timestamp.')
  }

  const { serviceId, serviceIds } = resolveServiceIds(data)

  const result = await createReservationTransactional(
    {
      firstName: requireString(data.firstName, 'firstName'),
      lastName: requireString(data.lastName, 'lastName'),
      phone: requireString(data.phone, 'phone'),
      email:
        typeof data.email === 'string' && data.email.trim().length > 0 ? data.email.trim() : null,
      serviceId,
      serviceIds,
      employeeId:
        typeof data.employeeId === 'string' && data.employeeId.trim()
          ? data.employeeId.trim()
          : null,
      startAt,
      source: 'MANUAL',
      internalNote:
        typeof data.internalNote === 'string' && data.internalNote.trim().length > 0
          ? data.internalNote.trim()
          : null,
      idempotencyKey:
        typeof data.idempotencyKey === 'string' && data.idempotencyKey.length > 0
          ? data.idempotencyKey
          : null,
      enforceAdvanceRestrictions: false,
    },
    undefined,
    getSalonId(),
  )

  if (!result.ok) {
    throw new HttpsError('failed-precondition', result.message, { reason: result.code })
  }

  if (!result.reused) {
    await syncReservationToGoogleCalendar(result.reservationId)
    await recordActivityLog({
      request,
      action: 'admin_reservation_created',
      source: 'server',
      path: '/admin/manual',
      details: {
        reservationId: result.reservationId,
        status: result.status,
        serviceCount: serviceIds.length,
        startAt: startAt.toISOString(),
      },
    })
  }

  return {
    reservationId: result.reservationId,
    status: result.status,
    managementToken: result.managementToken,
    reused: result.reused,
  }
})
