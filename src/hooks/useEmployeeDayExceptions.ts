import { useQuery } from '@tanstack/react-query'

import { fetchEmployeeDayExceptions } from '../data/employeeSchedule'
import { getSalonId } from '../data/salonConfig'

import { queryKeyOf } from './queryKeys'

export function useEmployeeDayExceptions(employeeUid: string | null, enabled: boolean) {
  return useQuery({
    queryKey: queryKeyOf('employeeDayExceptions', getSalonId(), employeeUid),
    queryFn: () => {
      if (!employeeUid) throw new Error('employeeUid required')
      return fetchEmployeeDayExceptions(employeeUid)
    },
    enabled: enabled && employeeUid !== null,
  })
}
