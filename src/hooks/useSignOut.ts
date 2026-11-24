import { useMutation, useQueryClient } from '@tanstack/react-query'
import { signOut } from 'firebase/auth'

import { logClientActivity } from '../data/activityLogApi'
import { firebaseAuth } from '../firebase'
import { clearPrivateQueries } from './queryKeys'

export function useSignOut() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      // Log before signing out so request.auth still identifies the admin.
      await Promise.race([
        logClientActivity({ action: 'admin_logout', path: '/admin' }),
        new Promise<void>((resolve) => setTimeout(resolve, 1000)),
      ])
      await signOut(firebaseAuth)
    },
    onSuccess: () => {
      clearPrivateQueries(queryClient)
    },
  })
}
