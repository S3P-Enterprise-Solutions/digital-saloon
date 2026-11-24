import { FirebaseError } from 'firebase/app'
import { useMutation, type UseMutationResult } from '@tanstack/react-query'
import {
  signInWithCustomToken,
  signInWithEmailAndPassword,
  type UserCredential,
} from 'firebase/auth'

import { logClientActivity } from '../data/activityLogApi'
import { callOperatorLogin } from '../data/adminAccessApi'
import { firebaseAuth } from '../firebase'

export type SignInInput = {
  email: string
  password: string
}

const OPERATOR_FALLBACK_CODES = new Set(['auth/user-not-found', 'auth/invalid-credential'])

export function useSignIn(): UseMutationResult<UserCredential, Error, SignInInput> {
  return useMutation({
    mutationFn: async ({ email, password }) => {
      try {
        const credential = await signInWithEmailAndPassword(firebaseAuth, email, password)
        void logClientActivity({
          action: 'admin_login',
          path: '/login',
          details: { method: 'password' },
        })
        return credential
      } catch (originalError: unknown) {
        if (
          originalError instanceof FirebaseError &&
          OPERATOR_FALLBACK_CODES.has(originalError.code)
        ) {
          try {
            const token = await callOperatorLogin(email, password)
            return await signInWithCustomToken(firebaseAuth, token)
          } catch (operatorError: unknown) {
            if (
              operatorError instanceof FirebaseError &&
              operatorError.code === 'functions/unauthenticated'
            ) {
              throw originalError
            }
            throw operatorError
          }
        }
        throw originalError
      }
    },
  })
}
