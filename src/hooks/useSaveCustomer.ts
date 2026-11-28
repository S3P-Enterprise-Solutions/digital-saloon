import { useMutation, useQueryClient } from '@tanstack/react-query'

import { saveCustomer, type SaveCustomerInput } from '../data/customersApi'
import { queryKeyOf } from './queryKeys'

export function useSaveCustomer() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: SaveCustomerInput) => saveCustomer(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeyOf('customers') })
      void queryClient.invalidateQueries({ queryKey: queryKeyOf('customerDetail') })
    },
  })
}
