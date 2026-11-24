import { useQuery } from '@tanstack/react-query'

import { fetchEmployeeByUid } from '../data/employees'
import { getSalonId } from '../data/salonConfig'
import { queryKeyOf } from './queryKeys'

export function useMyEmployeeProfile(employeeUid: string | null, enabled: boolean) {
  return useQuery({
    queryKey: queryKeyOf('myEmployeeProfile', getSalonId(), employeeUid),
    queryFn: async () => {
      if (!employeeUid) throw new Error('employeeUid required')
      return fetchEmployeeByUid(employeeUid)
    },
    enabled: enabled && employeeUid !== null,
  })
}
