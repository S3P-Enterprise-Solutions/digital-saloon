import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query'

import {
  callDeleteEmployeeDayException,
  type DeleteEmployeeDayExceptionInput,
} from '../data/employeeAdminApi'
import { getSalonId } from '../data/salonConfig'

import { queryKeyOf } from './queryKeys'

export function useDeleteEmployeeDayException(): UseMutationResult<
  void,
  Error,
  DeleteEmployeeDayExceptionInput
> {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: callDeleteEmployeeDayException,
    onSuccess: (_, { employeeUid }) => {
      void queryClient.invalidateQueries({
        queryKey: queryKeyOf('employeeDayExceptions', getSalonId(), employeeUid),
      })
    },
  })
}
