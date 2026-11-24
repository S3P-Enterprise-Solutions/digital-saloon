import { useQuery } from '@tanstack/react-query'

import { fetchEmployeeWorkingHours } from '../data/employeeSchedule'
import { getSalonId } from '../data/salonConfig'

import { queryKeyOf } from './queryKeys'

export function useEmployeeWorkingHours(employeeUid: string | null, enabled: boolean) {
  return useQuery({
    queryKey: queryKeyOf('employeeWorkingHours', getSalonId(), employeeUid),
    queryFn: () => {
      if (!employeeUid) throw new Error('employeeUid required')
      return fetchEmployeeWorkingHours(employeeUid)
    },
    enabled: enabled && employeeUid !== null,
  })
}
