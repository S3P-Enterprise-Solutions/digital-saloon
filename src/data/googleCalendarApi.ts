import { httpsCallable } from 'firebase/functions'

import { firebaseFunctions } from '../firebase'

export type GoogleCalendarStatus = {
  employeeId: string | null
  configured: boolean
  serviceAccountEmail: string | null
  connected: boolean
  calendarId: string | null
  calendarSummary: string | null
  accessRole: string | null
  lastSyncAt: string | null
  lastSyncStatus: 'OK' | 'ERROR' | null
  lastSyncError: string | null
  lastHistoryImportAt: string | null
  lastHistoryImportCount: number | null
}

export type GoogleCalendarSyncResult = {
  syncedBlockedSlots: number
  pushedReservations: number
  status: GoogleCalendarStatus
}

export type GoogleCalendarHistoryImportResult = {
  importedEvents: number
  writtenEvents: number
  skippedUnchanged: number
  seededCustomers?: number
  status: GoogleCalendarStatus
}

export async function getGoogleCalendarStatus(
  employeeId?: string | null,
): Promise<GoogleCalendarStatus> {
  const call = httpsCallable<{ employeeId?: string | null }, GoogleCalendarStatus>(
    firebaseFunctions,
    'getGoogleCalendarStatus',
  )
  const result = await call(employeeId ? { employeeId } : {})
  return result.data
}

export async function connectGoogleCalendar(input: {
  calendarId: string
  employeeId?: string | null
}): Promise<GoogleCalendarStatus> {
  const call = httpsCallable<
    { calendarId: string; employeeId?: string | null },
    GoogleCalendarStatus
  >(firebaseFunctions, 'connectGoogleCalendar')
  const result = await call(input)
  return result.data
}

export async function syncGoogleCalendar(
  employeeId?: string | null,
): Promise<GoogleCalendarSyncResult> {
  const call = httpsCallable<{ employeeId?: string | null }, GoogleCalendarSyncResult>(
    firebaseFunctions,
    'syncGoogleCalendar',
  )
  const result = await call(employeeId ? { employeeId } : {})
  return result.data
}

export async function importGoogleCalendarHistory(
  employeeId?: string | null,
): Promise<GoogleCalendarHistoryImportResult> {
  const call = httpsCallable<{ employeeId?: string | null }, GoogleCalendarHistoryImportResult>(
    firebaseFunctions,
    'importGoogleCalendarHistory',
  )
  const result = await call(employeeId ? { employeeId } : {})
  return result.data
}

export async function disconnectGoogleCalendar(
  employeeId?: string | null,
): Promise<GoogleCalendarStatus> {
  const call = httpsCallable<{ employeeId?: string | null }, GoogleCalendarStatus>(
    firebaseFunctions,
    'disconnectGoogleCalendar',
  )
  const result = await call(employeeId ? { employeeId } : {})
  return result.data
}
