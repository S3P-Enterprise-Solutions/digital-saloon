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
  serviceId: string
  employeeId?: string | null
  startAt: string
  firstName: string
  lastName: string
  phone: string
  email: string | null
  internalNote: string | null
  idempotencyKey: string
}): Promise<CreateReservationResult> {
  try {
    const callable = httpsCallable<typeof input, CreateReservationResult>(
      firebaseFunctions,
      'createManualReservation',
    )
    const result = await callable(input)
    return result.data
  } catch (error) {
    throw new Error(callableErrorMessage(error), { cause: error })
  }
}
