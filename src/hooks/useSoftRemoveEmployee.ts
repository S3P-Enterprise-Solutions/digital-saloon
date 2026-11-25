import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query'

import { callSoftRemoveEmployee, type SoftRemoveEmployeeInput } from '../data/employeeAdminApi'
import { queryKeyOf } from './queryKeys'

export function useSoftRemoveEmployee(): UseMutationResult<void, Error, SoftRemoveEmployeeInput> {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: callSoftRemoveEmployee,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeyOf('employees') })
      void queryClient.invalidateQueries({ queryKey: queryKeyOf('staffOverview') })
    },
  })
}
