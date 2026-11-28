import { useQuery } from '@tanstack/react-query'

import { fetchAvailableSlots } from '../data/bookingApi'
import { queryKeyOf } from './queryKeys'

export function useAvailableSlots(input: {
  serviceId?: string | null
  serviceIds?: string[]
  employeeId?: string | null
  fromDateYmd: string | null
  toDateYmd: string | null
  enforceAdvanceRestrictions?: boolean
  /** Set when moving an existing booking, so its stored duration is used. */
  managementToken?: string
  /** Admin edit: ignore this reservation while loading free slots. */
  excludeReservationId?: string
  /** Admin-only custom duration override (minutes). */
  durationMinutesOverride?: number | null
}) {
  const serviceIds =
    input.serviceIds && input.serviceIds.length > 0
      ? input.serviceIds
      : input.serviceId
        ? [input.serviceId]
        : []
  const enabled = serviceIds.length > 0 && input.fromDateYmd !== null && input.toDateYmd !== null
  const enforceAdvanceRestrictions = input.enforceAdvanceRestrictions !== false
  const servicesKey = serviceIds.join(',')

  return useQuery({
    queryKey: queryKeyOf(
      'availableSlots',
      servicesKey,
      input.employeeId ?? null,
      input.fromDateYmd,
      input.toDateYmd,
      enforceAdvanceRestrictions,
      input.managementToken ?? null,
      input.excludeReservationId ?? null,
      input.durationMinutesOverride ?? null,
    ),
    queryFn: () =>
      fetchAvailableSlots({
        serviceId: serviceIds[0],
        serviceIds,
        ...(input.employeeId ? { employeeId: input.employeeId } : {}),
        fromDateYmd: input.fromDateYmd!,
        toDateYmd: input.toDateYmd!,
        enforceAdvanceRestrictions,
        managementToken: input.managementToken,
        excludeReservationId: input.excludeReservationId,
        durationMinutesOverride: input.durationMinutesOverride,
      }),
    enabled,
  })
}
