import { httpsCallable } from 'firebase/functions'

import { firebaseFunctions } from '../firebase'

export type EmployeeReservationPublic = {
  id: string
  firstName: string
  lastName: string
  phone: string
  email: string | null
  serviceName: string
  startAt: string
  endAt: string
  status: string
  notes: string | null
}

export type ListMyEmployeeReservationsInput = {
  rangeStartIso: string
  rangeEndIso: string
}

export async function callListMyEmployeeReservations(
  input: ListMyEmployeeReservationsInput,
): Promise<EmployeeReservationPublic[]> {
  const fn = httpsCallable<
    ListMyEmployeeReservationsInput,
    { reservations: EmployeeReservationPublic[] }
  >(firebaseFunctions, 'listMyEmployeeReservations')
  const result = await fn(input)
  return result.data.reservations
}
