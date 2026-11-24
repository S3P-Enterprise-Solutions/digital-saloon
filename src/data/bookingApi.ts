import { httpsCallable } from 'firebase/functions'
import * as v from 'valibot'

import { firebaseFunctions } from '../firebase'

export type AvailableSlotDto = {
  startAt: string
  endAt: string
}

export type CreateReservationResult = {
  reservationId: string
  status: 'PENDING' | 'CONFIRMED'
  managementToken: string | null
  reused: boolean
}

export type PublicReservation = {
  reservationId: string
  firstName: string
  lastName: string
  phone: string
  email: string | null
  serviceId: string
  serviceName: string
  durationMinutes: number
  priceCents: number
  startAt: string
  endAt: string
  status: string
  source: string
}

export async function fetchAvailableSlots(input: {
  serviceId?: string
  serviceIds?: string[]
  employeeId?: string | null
  fromDateYmd: string
  toDateYmd: string
  enforceAdvanceRestrictions?: boolean
  /** When moving a booking: slots use that booking's own duration. */
  managementToken?: string
  /** Admin edit: keep this reservation's slot free while picking a new time. */
  excludeReservationId?: string
}): Promise<AvailableSlotDto[]> {
  const callable = httpsCallable<
    {
      serviceId?: string
      serviceIds?: string[]
      employeeId?: string | null
      fromDateYmd: string
      toDateYmd: string
      enforceAdvanceRestrictions?: boolean
      managementToken?: string
      excludeReservationId?: string
    },
    { slots: AvailableSlotDto[] }
  >(firebaseFunctions, 'getAvailableSlots')
  const result = await callable({
    ...(input.serviceId ? { serviceId: input.serviceId } : {}),
    ...(input.serviceIds && input.serviceIds.length > 0 ? { serviceIds: input.serviceIds } : {}),
    ...(input.employeeId ? { employeeId: input.employeeId } : {}),
    fromDateYmd: input.fromDateYmd,
    toDateYmd: input.toDateYmd,
    ...(input.enforceAdvanceRestrictions === false ? { enforceAdvanceRestrictions: false } : {}),
    ...(input.managementToken ? { managementToken: input.managementToken } : {}),
    ...(input.excludeReservationId ? { excludeReservationId: input.excludeReservationId } : {}),
  })
  return result.data.slots
}

export async function submitOnlineReservation(input: {
  serviceId: string
  serviceIds: string[]
  employeeId?: string | null
  startAt: string
  firstName: string
  lastName: string
  phone: string
  email: string
  notes: string | null
  locale?: 'de' | 'it'
  privacyAccepted: true
  idempotencyKey: string
}): Promise<CreateReservationResult> {
  const callable = httpsCallable<typeof input, CreateReservationResult>(
    firebaseFunctions,
    'createReservation',
  )
  const result = await callable(input)
  return result.data
}

export async function fetchManagedReservation(token: string): Promise<PublicReservation> {
  const callable = httpsCallable<{ token: string }, { reservation: PublicReservation }>(
    firebaseFunctions,
    'manageReservation',
  )
  const result = await callable({ token })
  return result.data.reservation
}

export async function cancelManagedReservation(token: string): Promise<PublicReservation> {
  const callable = httpsCallable<{ token: string }, { reservation: PublicReservation }>(
    firebaseFunctions,
    'cancelReservation',
  )
  const result = await callable({ token })
  return result.data.reservation
}

export async function rescheduleManagedReservation(input: {
  token: string
  startAt: string
}): Promise<PublicReservation> {
  const callable = httpsCallable<typeof input, { reservation: PublicReservation }>(
    firebaseFunctions,
    'rescheduleReservation',
  )
  const result = await callable(input)
  return result.data.reservation
}

/** Why an online booking was rejected, in terms the customer can act on. */
export type BookingFailure = 'slotTaken' | 'serviceUnavailable' | 'failed'

const bookingFailureDetailsSchema = v.object({ reason: v.string() })

/** Reads the `reason` the `createReservation` function attaches to its errors. */
export function bookingFailureOf(error: unknown): BookingFailure {
  const details =
    typeof error === 'object' && error !== null && 'details' in error ? error.details : undefined
  const parsed = v.safeParse(bookingFailureDetailsSchema, details)
  if (!parsed.success) return 'failed'
  switch (parsed.output.reason) {
    case 'UNAVAILABLE':
      return 'slotTaken'
    case 'SERVICE_INACTIVE':
    case 'NOT_FOUND':
      return 'serviceUnavailable'
    default:
      return 'failed'
  }
}
