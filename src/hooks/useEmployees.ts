import { useQuery } from '@tanstack/react-query'

import { fetchActiveEmployees } from '../data/employees'
import { getSalonId } from '../data/salonConfig'
import { queryKeyOf } from './queryKeys'

export function useActiveEmployees(enabled = true) {
  return useQuery({
    queryKey: queryKeyOf('employees', getSalonId()),
    queryFn: fetchActiveEmployees,
    enabled,
  })
}
