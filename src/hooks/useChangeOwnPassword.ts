import { EmailAuthProvider, reauthenticateWithCredential, updatePassword } from 'firebase/auth'
import { useMutation, type UseMutationResult } from '@tanstack/react-query'

import { firebaseAuth } from '../firebase'

export type ChangeOwnPasswordInput = {
  currentPassword: string
  newPassword: string
}

export function useChangeOwnPassword(): UseMutationResult<void, Error, ChangeOwnPasswordInput> {
  return useMutation({
    mutationFn: async ({ currentPassword, newPassword }) => {
      const user = firebaseAuth.currentUser
      if (!user?.email) {
        throw new Error('Not signed in.')
      }
      const credential = EmailAuthProvider.credential(user.email, currentPassword)
      await reauthenticateWithCredential(user, credential)
      await updatePassword(user, newPassword)
    },
  })
}
