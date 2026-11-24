import { useQuery } from '@tanstack/react-query'

import { callListMyEmployeeReservations } from '../data/employeeSelfApi'
import { getSalonId } from '../data/salonConfig'
import { queryKeyOf } from './queryKeys'

export function useListMyEmployeeReservations(
  rangeStartIso: string,
  rangeEndIso: string,
  enabled: boolean,
) {
  return useQuery({
    queryKey: queryKeyOf('myEmployeeReservations', getSalonId(), rangeStartIso, rangeEndIso),
    queryFn: () => callListMyEmployeeReservations({ rangeStartIso, rangeEndIso }),
    enabled,
  })
}
