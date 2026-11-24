import { useMutation, useQueryClient } from '@tanstack/react-query'

import { moveService } from '../data/services'
import { queryKeyOf } from './queryKeys'

export type MoveServiceInput = {
  serviceId: string
  direction: 'up' | 'down'
}

export function useMoveService() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ serviceId, direction }: MoveServiceInput): Promise<void> => {
      await moveService(serviceId, direction)
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeyOf('services') })
    },
  })
}
