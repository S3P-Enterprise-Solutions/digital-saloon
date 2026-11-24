import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query'

import {
  callUpdateEmployeeProfile,
  type UpdateEmployeeProfileInput,
} from '../data/employeeAdminApi'
import { queryKeyOf } from './queryKeys'

export function useUpdateEmployeeProfile(): UseMutationResult<void, Error, UpdateEmployeeProfileInput> {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: callUpdateEmployeeProfile,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeyOf('employees') })
    },
  })
}