import { useQuery } from '@tanstack/react-query'

import { fetchEmployees } from '../data/employees'
import { getSalonId } from '../data/salonConfig'
import { queryKeyOf } from './queryKeys'

export function useAdminEmployees(enabled: boolean) {
  return useQuery({
    queryKey: queryKeyOf('employees', getSalonId(), 'admin'),
    queryFn: fetchEmployees,
    enabled,
  })
}
