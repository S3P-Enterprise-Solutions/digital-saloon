import { httpsCallable } from 'firebase/functions'

import { firebaseFunctions } from '../firebase'
import type { CreateReservationResult, PublicReservation } from './bookingApi'

function callableErrorMessage(error: unknown): string {
  if (error && typeof error === 'object') {
    const record = error as { message?: string; code?: string; details?: unknown }
    const details =
      typeof record.details === 'string'
        ? record.details
        : record.details != null
          ? JSON.stringify(record.details)
          : ''
    return [record.code, record.message, details].filter(Boolean).join(' | ')
  }
  return 'Unknown callable error'
}

export async function confirmReservationAdmin(reservationId: string): Promise<PublicReservation> {
  try {
    const callable = httpsCallable<{ reservationId: string }, { reservation: PublicReservation }>(
      firebaseFunctions,
      'confirmReservation',
    )
    const result = await callable({ reservationId })
    return result.data.reservation
  } catch (error) {
    throw new Error(callableErrorMessage(error), { cause: error })
  }
}

export async function declineReservationAdmin(reservationId: string): Promise<PublicReservation> {
  try {
    const callable = httpsCallable<
      { reservationId: string; confirmed: true },
      { reservation: PublicReservation }
    >(firebaseFunctions, 'declineReservation')
    const result = await callable({ reservationId, confirmed: true })
    return result.data.reservation
  } catch (error) {
    throw new Error(callableErrorMessage(error), { cause: error })
  }
}

export async function cancelReservationAdmin(reservationId: string): Promise<PublicReservation> {
  try {
    const callable = httpsCallable<{ reservationId: string }, { reservation: PublicReservation }>(
      firebaseFunctions,
      'adminCancelReservation',
    )
    const result = await callable({ reservationId })
    return result.data.reservation
  } catch (error) {
    throw new Error(callableErrorMessage(error), { cause: error })
  }
}

export async function completeReservationAdmin(reservationId: string): Promise<PublicReservation> {
  try {
    const callable = httpsCallable<{ reservationId: string }, { reservation: PublicReservation }>(
      firebaseFunctions,
      'completeReservation',
    )
    const result = await callable({ reservationId })
    return result.data.reservation
  } catch (error) {
    throw new Error(callableErrorMessage(error), { cause: error })
  }
}

export async function createManualReservationAdmin(input: {
  serviceIds: string[]
  employeeId?: string | null
  startAt: string
  durationMinutesOverride?: number | null
  firstName: string
  lastName: string
  phone: string
  email: string | null
  internalNote: string | null
  idempotencyKey: string
}): Promise<CreateReservationResult> {
  const serviceIds = Array.from(new Set(input.serviceIds.map((id) => id.trim()).filter(Boolean)))
  if (serviceIds.length === 0) {
    throw new Error('serviceIds must not be empty')
  }
  const payload = {
    ...input,
    serviceIds,
    serviceId: serviceIds[0],
  }
  try {
    const callable = httpsCallable<typeof payload, CreateReservationResult>(
      firebaseFunctions,
      'createManualReservation',
    )
    const result = await callable(payload)
    return result.data
  } catch (error) {
    throw new Error(callableErrorMessage(error), { cause: error })
  }
}

export async function updateManualReservationAdmin(input: {
  reservationId: string
  serviceIds: string[]
  employeeId?: string | null
  startAt: string
  durationMinutesOverride?: number | null
  firstName: string
  lastName: string
  phone: string
  email: string | null
  internalNote: string | null
}): Promise<PublicReservation> {
  const serviceIds = Array.from(new Set(input.serviceIds.map((id) => id.trim()).filter(Boolean)))
  if (serviceIds.length === 0) {
    throw new Error('serviceIds must not be empty')
  }
  const payload = {
    ...input,
    serviceIds,
    serviceId: serviceIds[0],
  }
  try {
    const callable = httpsCallable<typeof payload, { reservation: PublicReservation }>(
      firebaseFunctions,
      'adminUpdateReservation',
    )
    const result = await callable(payload)
    return result.data.reservation
  } catch (error) {
    throw new Error(callableErrorMessage(error), { cause: error })
  }
}
