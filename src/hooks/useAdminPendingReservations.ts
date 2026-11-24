import { dashboardRange, summarizeDashboard } from '../data/adminDashboard'
import { todayYmdInTimeZone } from '../data/calendarMath'
import type { ReservationWithId } from '../data/reservations'
import { useAdminReservations } from './useAdminReservations'
import { useSalon } from './useSalon'

export type UseAdminPendingReservationsResult = {
  pending: ReservationWithId[] | undefined
  isLoading: boolean
  isError: boolean
}

/** Upcoming PENDING reservations for the staff “Anfragen” queue. */
export function useAdminPendingReservations(enabled: boolean): UseAdminPendingReservationsResult {
  const salon = useSalon()
  const timeZone = salon.data?.timezone ?? 'Europe/Vienna'
  const today = todayYmdInTimeZone(timeZone)
  const range = dashboardRange(today)
  const upcoming = useAdminReservations(range.startIso, range.endIso, enabled)
  const pending = upcoming.data
    ? summarizeDashboard(upcoming.data, today, timeZone).pending
    : undefined

  return {
    pending,
    isLoading: upcoming.isLoading,
    isError: upcoming.isError,
  }
}
