import { useQuery, type UseQueryResult } from '@tanstack/react-query'

import {
  fetchListBookableEmployees,
  type BookableEmployeePublic,
} from '../data/employeeAdminApi'
import { getSalonId } from '../data/salonConfig'
import { queryKeyOf } from './queryKeys'

export function useListBookableEmployees(
  enabled = true,
): UseQueryResult<BookableEmployeePublic[]> {
  return useQuery({
    queryKey: queryKeyOf('employees', getSalonId(), 'bookable'),
    queryFn: fetchListBookableEmployees,
    enabled,
    staleTime: 0,
    refetchOnMount: 'always',
  })
}