import { useMutation, type UseMutationResult } from '@tanstack/react-query'

import { callSetEmployeePassword, type SetEmployeePasswordInput } from '../data/employeeAdminApi'

export function useSetEmployeePassword(): UseMutationResult<void, Error, SetEmployeePasswordInput> {
  return useMutation({
    mutationFn: callSetEmployeePassword,
  })
}