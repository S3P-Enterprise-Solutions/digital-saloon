import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query'

import { callSetEmployeeBookable, type SetEmployeeBookableInput } from '../data/employeeAdminApi'
import { getSalonId } from '../data/salonConfig'
import { queryKeyOf } from './queryKeys'

export function useSetEmployeeBookable(): UseMutationResult<void, Error, SetEmployeeBookableInput> {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: callSetEmployeeBookable,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeyOf('employees', getSalonId()) })
    },
  })
}