import { httpsCallable } from 'firebase/functions'

import { firebaseFunctions } from '../firebase'
import type { Weekday } from './schemas'

export type BookableEmployeePublic = {
  id: string
  displayName: string
  serviceIds: string[]
}

export type CreateEmployeeProfileForAdminInput = {
  adminUid: string
  firstName: string
  lastName: string
}

export type UpdateEmployeeProfileInput = {
  employeeUid: string
  firstName?: string
  lastName?: string
  photoUrl?: string | null
  serviceIds?: string[]
}

export type SetEmployeeBookableInput = {
  employeeUid: string
  active: boolean
}

export type SetEmployeeAuthDisabledInput = {
  employeeUid: string
  disabled: boolean
}

export type SetEmployeePasswordInput = {
  employeeUid: string
  password: string
}

export type SoftRemoveEmployeeInput = {
  employeeUid: string
}

export type SaveEmployeeWorkingHoursInput = {
  employeeUid: string
  weekday: Weekday
  intervals: { start: string; end: string }[]
}

export type SaveEmployeeDayExceptionInput = {
  employeeUid: string
  exceptionId: string
  date: string
  closed: boolean
  intervals?: { start: string; end: string }[]
}

export type DeleteEmployeeDayExceptionInput = {
  employeeUid: string
  exceptionId: string
}

export async function callCreateEmployeeProfileForAdmin(
  input: CreateEmployeeProfileForAdminInput,
): Promise<{ uid: string; displayName: string; role: 'admin' }> {
  const fn = httpsCallable<
    CreateEmployeeProfileForAdminInput,
    { uid: string; displayName: string; role: 'admin' }
  >(firebaseFunctions, 'createEmployeeProfileForAdmin')
  const result = await fn(input)
  return result.data
}

export async function callUpdateEmployeeProfile(input: UpdateEmployeeProfileInput): Promise<void> {
  const fn = httpsCallable<UpdateEmployeeProfileInput, { ok: true }>(
    firebaseFunctions,
    'updateEmployeeProfile',
  )
  await fn(input)
}

export async function callSetEmployeeBookable(input: SetEmployeeBookableInput): Promise<void> {
  const fn = httpsCallable<SetEmployeeBookableInput, { ok: true; active: boolean }>(
    firebaseFunctions,
    'setEmployeeBookable',
  )
  await fn(input)
}

export async function callSetEmployeeAuthDisabled(
  input: SetEmployeeAuthDisabledInput,
): Promise<void> {
  const fn = httpsCallable<SetEmployeeAuthDisabledInput, { ok: true; disabled: boolean }>(
    firebaseFunctions,
    'setEmployeeAuthDisabled',
  )
  await fn(input)
}

export async function callSetEmployeePassword(input: SetEmployeePasswordInput): Promise<void> {
  const fn = httpsCallable<SetEmployeePasswordInput, { ok: true }>(
    firebaseFunctions,
    'setEmployeePassword',
  )
  await fn(input)
}

export async function callSoftRemoveEmployee(input: SoftRemoveEmployeeInput): Promise<void> {
  const fn = httpsCallable<SoftRemoveEmployeeInput, { ok: true }>(
    firebaseFunctions,
    'softRemoveEmployee',
  )
  await fn(input)
}

export async function callSaveEmployeeWorkingHours(
  input: SaveEmployeeWorkingHoursInput,
): Promise<void> {
  const fn = httpsCallable<SaveEmployeeWorkingHoursInput, { ok: true }>(
    firebaseFunctions,
    'saveEmployeeWorkingHours',
  )
  await fn(input)
}

export async function callSaveEmployeeDayException(
  input: SaveEmployeeDayExceptionInput,
): Promise<void> {
  const fn = httpsCallable<SaveEmployeeDayExceptionInput, { ok: true }>(
    firebaseFunctions,
    'saveEmployeeDayException',
  )
  await fn(input)
}

export async function callDeleteEmployeeDayException(
  input: DeleteEmployeeDayExceptionInput,
): Promise<void> {
  const fn = httpsCallable<DeleteEmployeeDayExceptionInput, { ok: true }>(
    firebaseFunctions,
    'deleteEmployeeDayException',
  )
  await fn(input)
}

export async function fetchListBookableEmployees(): Promise<BookableEmployeePublic[]> {
  const fn = httpsCallable<undefined, { employees: BookableEmployeePublic[] }>(
    firebaseFunctions,
    'listBookableEmployees',
  )
  const result = await fn(undefined)
  return result.data.employees
}