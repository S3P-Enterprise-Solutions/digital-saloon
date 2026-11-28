import { useQuery } from '@tanstack/react-query'

import { lookupCustomerContext, type LookupCustomerContextInput } from '../data/customersApi'
import { getSalonId } from '../data/salonConfig'
import { queryKeyOf } from './queryKeys'

export function useCustomerContext(input: LookupCustomerContextInput, enabled = true) {
  const customerId = input.customerId?.trim() || null
  const firstName = input.firstName?.trim() || ''
  const lastName = input.lastName?.trim() || ''
  const email = input.email?.trim().toLowerCase() || null
  const excludeReservationId = input.excludeReservationId?.trim() || null
  const hasLookupKey =
    customerId !== null || email !== null || `${firstName} ${lastName}`.trim().length >= 2

  return useQuery({
    queryKey: queryKeyOf(
      'customerContext',
      getSalonId(),
      customerId,
      firstName.toLowerCase(),
      lastName.toLowerCase(),
      email,
      excludeReservationId,
    ),
    queryFn: () =>
      lookupCustomerContext({
        customerId,
        firstName,
        lastName,
        email,
        excludeReservationId,
      }),
    enabled: enabled && hasLookupKey,
  })
}
