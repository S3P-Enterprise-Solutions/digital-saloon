import { useQuery } from '@tanstack/react-query'

import { getCustomerDetail } from '../data/customersApi'
import { getSalonId } from '../data/salonConfig'
import { queryKeyOf } from './queryKeys'

export function useCustomerDetail(customerId: string | null, enabled = true) {
  return useQuery({
    queryKey: queryKeyOf('customerDetail', getSalonId(), customerId),
    queryFn: () => getCustomerDetail(customerId!),
    enabled: enabled && Boolean(customerId),
  })
}
