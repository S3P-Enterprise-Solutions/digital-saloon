import { useQuery } from '@tanstack/react-query'

import { fetchBlockedSlotsInRange } from '../data/blockedSlots'
import { getSalonId } from '../data/salonConfig'
import { queryKeyOf } from './queryKeys'

export function useBlockedSlots(rangeStartIso: string, rangeEndIso: string, enabled: boolean) {
  return useQuery({
    queryKey: queryKeyOf('blockedSlots', getSalonId(), rangeStartIso, rangeEndIso),
    queryFn: () => fetchBlockedSlotsInRange(rangeStartIso, rangeEndIso),
    enabled,
  })
}
