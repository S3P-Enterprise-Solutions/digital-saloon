import { onCall, HttpsError } from 'firebase-functions/v2/https'

import { assertAdmin } from '../authz'
import { functionsRegion, getSalonId } from '../config'
import { isObject } from '../schemas'
import { findReservationByManagementToken } from './findByToken'
import { parseDurationOverride, previewAvailableSlots } from './reservationWrite'

export const getAvailableSlots = onCall({ region: functionsRegion }, async (request) => {
  const data = request.data
  if (!isObject(data)) {
    throw new HttpsError('invalid-argument', 'Invalid payload.')
  }

  const serviceId = typeof data.serviceId === 'string' ? data.serviceId.trim() : ''
  const serviceIds = Array.isArray(data.serviceIds)
    ? data.serviceIds
        .filter((item): item is string => typeof item === 'string')
        .map((item) => item.trim())
        .filter(Boolean)
    : []
  const employeeId =
    typeof data.employeeId === 'string' && data.employeeId.trim() ? data.employeeId.trim() : null
  const fromDateYmd = data.fromDateYmd
  const toDateYmd = data.toDateYmd

  if (serviceId.length === 0 && serviceIds.length === 0) {
    throw new HttpsError('invalid-argument', 'serviceId or serviceIds is required.')
  }
  if (serviceIds.length > 15) {
    throw new HttpsError('invalid-argument', 'Too many services requested.')
  }
  if (typeof fromDateYmd !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(fromDateYmd)) {
    throw new HttpsError('invalid-argument', 'fromDateYmd is required (YYYY-MM-DD).')
  }
  if (typeof toDateYmd !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(toDateYmd)) {
    throw new HttpsError('invalid-argument', 'toDateYmd is required (YYYY-MM-DD).')
  }

  let enforceAdvanceRestrictions = true
  if (data.enforceAdvanceRestrictions === false) {
    await assertAdmin(request)
    enforceAdvanceRestrictions = false
  }

  let reschedule:
    | {
        reservationId: string
        durationMinutes: number
        employeeId?: string | null
        serviceIds?: string[]
      }
    | undefined
  if (typeof data.managementToken === 'string' && data.managementToken.trim().length > 0) {
    if (data.managementToken.trim().length < 16) {
      throw new HttpsError('invalid-argument', 'managementToken is invalid.')
    }
    const reservation = await findReservationByManagementToken(data.managementToken.trim())
    if (!reservation) {
      throw new HttpsError('not-found', 'Reservation not found or token invalid.')
    }
    const resData = reservation.data()
    const status = String(resData.status)
    if (status !== 'PENDING' && status !== 'CONFIRMED') {
      return { slots: [] }
    }
    const resEmployeeId =
      typeof resData.employeeId === 'string' && resData.employeeId.trim()
        ? resData.employeeId.trim()
        : null
    const resServiceIds = Array.isArray(resData.serviceIds)
      ? resData.serviceIds
          .filter((item): item is string => typeof item === 'string')
          .map((item) => item.trim())
          .filter(Boolean)
      : typeof resData.serviceId === 'string' && resData.serviceId.trim()
        ? [resData.serviceId.trim()]
        : []
    reschedule = {
      reservationId: reservation.id,
      durationMinutes: Number(resData.durationMinutes),
      ...(resEmployeeId ? { employeeId: resEmployeeId } : {}),
      ...(resServiceIds.length > 0 ? { serviceIds: resServiceIds } : {}),
    }
  }

  let excludeReservationId: string | undefined
  if (
    typeof data.excludeReservationId === 'string' &&
    data.excludeReservationId.trim().length > 0
  ) {
    await assertAdmin(request)
    excludeReservationId = data.excludeReservationId.trim()
  }

  let durationMinutesOverride: number | null = null
  if (data.durationMinutesOverride !== undefined && data.durationMinutesOverride !== null) {
    await assertAdmin(request)
    const parsed = parseDurationOverride(data.durationMinutesOverride)
    if (parsed === null) {
      throw new HttpsError(
        'invalid-argument',
        'durationMinutesOverride must be an integer between 5 and 600.',
      )
    }
    durationMinutesOverride = parsed
  }

  const slots = await previewAvailableSlots({
    ...(serviceId ? { serviceId } : {}),
    ...(serviceIds.length > 0 ? { serviceIds } : {}),
    ...(employeeId ? { employeeId } : {}),
    fromDateYmd,
    toDateYmd,
    salonId: getSalonId(),
    enforceAdvanceRestrictions,
    ...(excludeReservationId ? { excludeReservationId } : {}),
    ...(durationMinutesOverride !== null ? { durationMinutesOverride } : {}),
    reschedule,
  })

  return { slots }
})
