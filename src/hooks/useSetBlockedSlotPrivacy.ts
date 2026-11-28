import { useMutation, useQueryClient } from '@tanstack/react-query'

import { setBlockedSlotPrivacy } from '../data/blockedSlots'
import { queryKeyOf } from './queryKeys'

export function useSetBlockedSlotPrivacy() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: { slotId: string; isPrivate: boolean }) => setBlockedSlotPrivacy(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeyOf('blockedSlots') })
    },
  })
}
