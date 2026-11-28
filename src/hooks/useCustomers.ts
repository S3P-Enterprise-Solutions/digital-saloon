import { useQuery } from '@tanstack/react-query'

import { listCustomers } from '../data/customersApi'
import { getSalonId } from '../data/salonConfig'
import { queryKeyOf } from './queryKeys'

export function useCustomers(search: string, enabled = true) {
  const normalized = search.trim()
  return useQuery({
    queryKey: queryKeyOf('customers', getSalonId(), normalized),
    queryFn: () => listCustomers(normalized || undefined),
    enabled,
  })
}
