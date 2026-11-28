import { useMutation, useQueryClient } from '@tanstack/react-query'

import { archiveCustomer } from '../data/customersApi'
import { queryKeyOf } from './queryKeys'

export function useArchiveCustomer() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (customerId: string) => archiveCustomer(customerId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeyOf('customers') })
      void queryClient.invalidateQueries({ queryKey: queryKeyOf('customerDetail') })
    },
  })
}
