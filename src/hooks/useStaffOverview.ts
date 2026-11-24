import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from '@tanstack/react-query'

import {
  createEmployeeAccount,
  createFirstSalonAdmin,
  fetchStaffOverview,
  type NewAccountInput,
  type StaffMember,
  type StaffOverview,
} from '../data/adminAccessApi'
import { queryKeyOf } from './queryKeys'

export function useStaffOverview(enabled: boolean): UseQueryResult<StaffOverview> {
  return useQuery({
    queryKey: queryKeyOf('staffOverview'),
    queryFn: fetchStaffOverview,
    enabled,
  })
}

export function useCreateFirstSalonAdmin(): UseMutationResult<StaffMember, Error, NewAccountInput> {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createFirstSalonAdmin,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeyOf('staffOverview') })
      void queryClient.invalidateQueries({ queryKey: queryKeyOf('employees') })
    },
  })
}

export function useCreateEmployeeAccount(): UseMutationResult<StaffMember, Error, NewAccountInput> {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createEmployeeAccount,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeyOf('staffOverview') })
      void queryClient.invalidateQueries({ queryKey: queryKeyOf('employees') })
    },
  })
}
