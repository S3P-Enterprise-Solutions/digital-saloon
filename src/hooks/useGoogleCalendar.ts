import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  connectGoogleCalendar,
  disconnectGoogleCalendar,
  getGoogleCalendarStatus,
  syncGoogleCalendar,
} from '../data/googleCalendarApi'
import { getSalonId } from '../data/salonConfig'
import { queryKeyOf } from './queryKeys'

export function useGoogleCalendarStatus(enabled: boolean, employeeId?: string | null) {
  return useQuery({
    queryKey: queryKeyOf('googleCalendarStatus', getSalonId(), employeeId ?? null),
    queryFn: () => getGoogleCalendarStatus(employeeId),
    enabled,
  })
}

export function useGoogleCalendarActions(employeeId?: string | null) {
  const queryClient = useQueryClient()
  const empKey = employeeId ?? null

  const invalidate = async (): Promise<void> => {
    await queryClient.invalidateQueries({ queryKey: queryKeyOf('googleCalendarStatus') })
    await queryClient.invalidateQueries({ queryKey: queryKeyOf('blockedSlots') })
  }

  const connect = useMutation({
    mutationFn: (calendarId: string) => connectGoogleCalendar({ calendarId, employeeId: empKey }),
    onSuccess: (status) => {
      queryClient.setQueryData(queryKeyOf('googleCalendarStatus', getSalonId(), empKey), status)
      void queryClient.invalidateQueries({ queryKey: queryKeyOf('blockedSlots') })
    },
  })

  const sync = useMutation({
    mutationFn: () => syncGoogleCalendar(empKey),
    onSuccess: (result) => {
      queryClient.setQueryData(
        queryKeyOf('googleCalendarStatus', getSalonId(), empKey),
        result.status,
      )
      void queryClient.invalidateQueries({ queryKey: queryKeyOf('blockedSlots') })
    },
  })

  const disconnect = useMutation({
    mutationFn: () => disconnectGoogleCalendar(empKey),
    onSuccess: (status) => {
      queryClient.setQueryData(queryKeyOf('googleCalendarStatus', getSalonId(), empKey), status)
      void invalidate()
    },
  })

  return { connect, sync, disconnect }
}
