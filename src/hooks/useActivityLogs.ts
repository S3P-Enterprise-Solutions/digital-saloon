import { useQuery, type UseQueryResult } from '@tanstack/react-query'

import { fetchActivityLogs, type ActivityLogWithId } from '../data/activityLogApi'
import { getSalonId } from '../data/salonConfig'
import { queryKeyOf } from './queryKeys'

export function useActivityLogs(limitCount = 200): UseQueryResult<ActivityLogWithId[], Error> {
  const salonId = getSalonId()
  return useQuery({
    queryKey: queryKeyOf('activityLogs', salonId, limitCount),
    queryFn: () => fetchActivityLogs(salonId, limitCount),
  })
}
