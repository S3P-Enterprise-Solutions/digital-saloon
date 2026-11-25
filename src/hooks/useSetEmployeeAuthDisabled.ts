import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query'

import {
  callSetEmployeeAuthDisabled,
  type SetEmployeeAuthDisabledInput,
} from '../data/employeeAdminApi'
import { queryKeyOf } from './queryKeys'

export function useSetEmployeeAuthDisabled(): UseMutationResult<
  void,
  Error,
  SetEmployeeAuthDisabledInput
> {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: callSetEmployeeAuthDisabled,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeyOf('employees') })
      void queryClient.invalidateQueries({ queryKey: queryKeyOf('staffOverview') })
    },
  })
}
