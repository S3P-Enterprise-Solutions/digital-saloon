import { httpsCallable } from 'firebase/functions'

import { firebaseFunctions } from '../firebase'

export type GoogleCalendarListItem = {
  id: string
  summary: string
  primary?: boolean
  accessRole?: string
}

export type GoogleCalendarStatus = {
  employeeId: string | null
  oauthConfigured: boolean
  connected: boolean
  accountEmail: string | null
  calendarId: string | null
  calendarSummary: string | null
  availableCalendars: GoogleCalendarListItem[]
  lastSyncAt: string | null
  lastSyncStatus: 'OK' | 'ERROR' | null
  lastSyncError: string | null
}

export type GoogleCalendarSyncResult = {
  syncedBlockedSlots: number
  pushedReservations: number
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

export async function startGoogleCalendarOAuth(input: {
  returnUrl: string
  employeeId?: string | null
}): Promise<{ authUrl: string }> {
  const call = httpsCallable<
    { returnUrl: string; employeeId?: string | null },
    { authUrl: string }
  >(firebaseFunctions, 'startGoogleCalendarOAuth')
  const result = await call(input)
  return result.data
}

export async function selectGoogleCalendar(input: {
  calendarId: string
  employeeId?: string | null
}): Promise<GoogleCalendarStatus> {
  const call = httpsCallable<
    { calendarId: string; employeeId?: string | null },
    GoogleCalendarStatus
  >(firebaseFunctions, 'selectGoogleCalendar')
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
