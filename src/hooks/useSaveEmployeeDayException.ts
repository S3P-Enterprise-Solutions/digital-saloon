import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query'

import {
  callSaveEmployeeDayException,
  type SaveEmployeeDayExceptionInput,
} from '../data/employeeAdminApi'
import { getSalonId } from '../data/salonConfig'

import { queryKeyOf } from './queryKeys'

export function useSaveEmployeeDayException(): UseMutationResult<
  void,
  Error,
  SaveEmployeeDayExceptionInput
> {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: callSaveEmployeeDayException,
    onSuccess: (_, { employeeUid }) => {
      void queryClient.invalidateQueries({
        queryKey: queryKeyOf('employeeDayExceptions', getSalonId(), employeeUid),
      })
    },
  })
}
