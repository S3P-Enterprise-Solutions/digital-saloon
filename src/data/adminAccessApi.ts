import { httpsCallable } from 'firebase/functions'

import { firebaseFunctions } from '../firebase'

export type StaffMember = {
  uid: string
  email: string
  displayName: string
  isPrimaryAdmin: boolean
  createdAt: string
}

export type StaffOverview = {
  hasPrimaryAdmin: boolean
  staff: StaffMember[]
}

export type NewAccountInput = {
  email: string
  password: string
  displayName: string
}

export type EmployeeAccountInput = {
  email: string
  password: string
  firstName: string
  lastName: string
}

export async function callOperatorLogin(email: string, password: string): Promise<string> {
  const fn = httpsCallable<{ email: string; password: string }, { token: string }>(
    firebaseFunctions,
    'operatorLogin',
  )
  const result = await fn({ email, password })
  return result.data.token
}

export async function fetchDemoModeStatus(): Promise<{ enabled: boolean }> {
  const fn = httpsCallable<undefined, { enabled: boolean }>(firebaseFunctions, 'getDemoModeStatus')
  const result = await fn(undefined)
  return result.data
}

export async function saveDemoMode(enabled: boolean): Promise<{ enabled: boolean }> {
  const fn = httpsCallable<{ enabled: boolean }, { enabled: boolean }>(
    firebaseFunctions,
    'setDemoMode',
  )
  const result = await fn({ enabled })
  return result.data
}

export async function fetchStaffOverview(): Promise<StaffOverview> {
  const fn = httpsCallable<undefined, StaffOverview>(firebaseFunctions, 'getStaffOverview')
  const result = await fn(undefined)
  return result.data
}

export async function createFirstSalonAdmin(input: NewAccountInput): Promise<StaffMember> {
  const fn = httpsCallable<NewAccountInput, StaffMember>(firebaseFunctions, 'createFirstSalonAdmin')
  const result = await fn(input)
  return result.data
}

export async function createEmployeeAccount(input: EmployeeAccountInput): Promise<StaffMember> {
  const fn = httpsCallable<EmployeeAccountInput, StaffMember>(
    firebaseFunctions,
    'createEmployeeAccount',
  )
  const result = await fn(input)
  return result.data
}
