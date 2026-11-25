import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query'

import {
  callCreateEmployeeProfileForAdmin,
  type CreateEmployeeProfileForAdminInput,
} from '../data/employeeAdminApi'
import { queryKeyOf } from './queryKeys'

export function useCreateEmployeeProfileForAdmin(): UseMutationResult<
  { uid: string; displayName: string; role: 'admin' },
  Error,
  CreateEmployeeProfileForAdminInput
> {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: callCreateEmployeeProfileForAdmin,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeyOf('employees') })
      void queryClient.invalidateQueries({ queryKey: queryKeyOf('staffOverview') })
    },
  })
}
