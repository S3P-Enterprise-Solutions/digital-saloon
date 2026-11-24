import type * as React from 'react'
import { useCallback, useEffect, useState } from 'react'
import { Outlet, createRoute, redirect, useNavigate, useRouterState } from '@tanstack/react-router'

import { isEmployeeManagementEnabled } from '../brands/employeeManagement'
import { useAuth } from '../auth/AuthProvider'
import { listRange } from '../data/calendarRange'
import { todayYmdInTimeZone } from '../data/calendarMath'
import type { WeeklyDraft } from '../data/openingHoursForm'
import { useChangeOwnPassword } from '../hooks/useChangeOwnPassword'
import { useDeleteEmployeeDayException } from '../hooks/useDeleteEmployeeDayException'
import { useEmployeeDayExceptions } from '../hooks/useEmployeeDayExceptions'
import { useEmployeeWorkingHours } from '../hooks/useEmployeeWorkingHours'
import { useListMyEmployeeReservations } from '../hooks/useListMyEmployeeReservations'
import { useMyEmployeeProfile } from '../hooks/useMyEmployeeProfile'
import { useSaveEmployeeDayException } from '../hooks/useSaveEmployeeDayException'
import { useSaveEmployeeWeeklyWorkingHours } from '../hooks/useSaveEmployeeWeeklyWorkingHours'
import { useSignOut } from '../hooks/useSignOut'
import { useActiveServices } from '../hooks/useActiveServices'
import { useSalon } from '../hooks/useSalon'
import { useUserProfile } from '../hooks/useUserProfile'
import { useLocale } from '../i18n'
import type { HoursSaveState } from '../components/WeeklyHoursForm'
import { EmployeeBookingsPage } from '../pages/employee/EmployeeBookingsPage'
import { EmployeeHoursPage } from '../pages/employee/EmployeeHoursPage'
import { EmployeeLayoutPage, type EmployeeNavSection } from '../pages/employee/EmployeeLayoutPage'
import { EmployeePasswordPage } from '../pages/employee/EmployeePasswordPage'
import { EmployeePlaceholderPage } from '../pages/employee/EmployeePlaceholderPage'
import { EmployeeServicesPage } from '../pages/employee/EmployeeServicesPage'
import { rootRoute } from './root'

function employeeManagementEnabled(): boolean {
  return isEmployeeManagementEnabled()
}

const EmployeeLayoutRoute: React.FunctionComponent = () => {
  const { user, isLoading: authLoading } = useAuth()
  const profile = useUserProfile(user ? user.uid : null)
  const navigate = useNavigate()
  const signOut = useSignOut()
  const { t } = useLocale()
  const myProfile = useMyEmployeeProfile(user?.uid ?? null, user !== null)
  const pathname = useRouterState({ select: (state) => state.location.pathname })

  useEffect(() => {
    if (!authLoading && user === null) {
      void navigate({ to: '/login', search: { redirect: '/employee' } })
    }
  }, [authLoading, user, navigate])

  if (authLoading || (user !== null && profile.isLoading)) {
    return (
      <EmployeePlaceholderPage title={t('employee.title')} description={t('employee.loading')} />
    )
  }

  if (!user) {
    return (
      <EmployeePlaceholderPage
        title={t('employee.title')}
        description={t('employee.signInRequired')}
      />
    )
  }

  if (profile.data?.role !== 'employee') {
    return (
      <EmployeePlaceholderPage title={t('employee.title')} description={t('employee.forbidden')} />
    )
  }

  const activeNav: EmployeeNavSection = pathname.startsWith('/employee/services')
    ? 'services'
    : pathname.startsWith('/employee/bookings')
      ? 'bookings'
      : pathname.startsWith('/employee/password')
        ? 'password'
        : 'hours'

  return (
    <EmployeeLayoutPage
      active={activeNav}
      displayName={myProfile.data?.displayName ?? null}
      onHoursClick={() => {
        void navigate({ to: '/employee/hours' })
      }}
      onServicesClick={() => {
        void navigate({ to: '/employee/services' })
      }}
      onBookingsClick={() => {
        void navigate({ to: '/employee/bookings' })
      }}
      onPasswordClick={() => {
        void navigate({ to: '/employee/password' })
      }}
      onSignOutClick={() => {
        void navigate({ to: '/login' }).then(() => {
          signOut.mutate(undefined, {
            onSuccess: () => {
              void navigate({ to: '/', replace: true })
            },
          })
        })
      }}
    >
      <Outlet />
    </EmployeeLayoutPage>
  )
}

export const employeeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/employee',
  beforeLoad: () => {
    if (!employeeManagementEnabled()) {
      throw redirect({ to: '/' })
    }
  },
  component: EmployeeLayoutRoute,
})

export const employeeIndexRoute = createRoute({
  getParentRoute: () => employeeRoute,
  path: '/',
  beforeLoad: () => {
    throw redirect({ to: '/employee/hours' })
  },
})

const EmployeeHoursRoute: React.FunctionComponent = () => {
  const { user } = useAuth()
  const employeeUid = user?.uid ?? null
  const employeeWeekly = useEmployeeWorkingHours(employeeUid, employeeUid !== null)
  const employeeExceptions = useEmployeeDayExceptions(employeeUid, employeeUid !== null)
  const saveWeekly = useSaveEmployeeWeeklyWorkingHours()
  const saveDayException = useSaveEmployeeDayException()
  const deleteDayException = useDeleteEmployeeDayException()
  const [weeklySave, setWeeklySave] = useState<HoursSaveState>({
    saving: false,
    saved: false,
    error: null,
  })

  const onSaveWeeklyHours = useCallback(
    (draft: WeeklyDraft) => {
      if (!employeeUid) return
      setWeeklySave({ saving: true, saved: false, error: null })
      void saveWeekly
        .mutateAsync({ employeeUid, draft })
        .then(() => {
          setWeeklySave({ saving: false, saved: true, error: null })
        })
        .catch((err: unknown) => {
          setWeeklySave({
            saving: false,
            saved: false,
            error: err instanceof Error ? err.message : String(err),
          })
        })
    },
    [employeeUid, saveWeekly],
  )

  return (
    <EmployeeHoursPage
      employeeWeekly={employeeWeekly.data}
      employeeWeeklyLoading={employeeWeekly.isLoading}
      employeeWeeklyError={employeeWeekly.isError}
      weeklyHoursSave={weeklySave}
      onSaveWeeklyHours={onSaveWeeklyHours}
      employeeDayExceptions={employeeExceptions.data}
      employeeDayExceptionsLoading={employeeExceptions.isLoading}
      employeeDayExceptionsError={employeeExceptions.isError}
      dayExceptionBusy={saveDayException.isPending || deleteDayException.isPending}
      onSaveDayException={async (input) => {
        if (!employeeUid) return
        await saveDayException.mutateAsync({ employeeUid, ...input })
      }}
      onDeleteDayException={async (exceptionId) => {
        if (!employeeUid) return
        await deleteDayException.mutateAsync({ employeeUid, exceptionId })
      }}
    />
  )
}

export const employeeHoursRoute = createRoute({
  getParentRoute: () => employeeRoute,
  path: '/hours',
  component: EmployeeHoursRoute,
})

const EmployeeServicesRoute: React.FunctionComponent = () => {
  const { user } = useAuth()
  const myProfile = useMyEmployeeProfile(user?.uid ?? null, user !== null)
  const services = useActiveServices()

  return (
    <EmployeeServicesPage
      serviceIds={myProfile.data?.serviceIds ?? []}
      services={services.data}
      servicesLoading={services.isLoading || myProfile.isLoading}
      servicesError={services.isError || myProfile.isError}
    />
  )
}

export const employeeServicesRoute = createRoute({
  getParentRoute: () => employeeRoute,
  path: '/services',
  component: EmployeeServicesRoute,
})

const EmployeeBookingsRoute: React.FunctionComponent = () => {
  const salon = useSalon()
  const timeZone = salon.data?.timezone ?? 'Europe/Vienna'
  const today = todayYmdInTimeZone(timeZone, new Date())
  const { startIso: rangeStartIso, endIso: rangeEndIso } = listRange(today)
  const reservations = useListMyEmployeeReservations(
    rangeStartIso,
    rangeEndIso,
    salon.data !== undefined,
  )

  return (
    <EmployeeBookingsPage
      reservations={reservations.data}
      isLoading={reservations.isLoading}
      isError={reservations.isError}
    />
  )
}

export const employeeBookingsRoute = createRoute({
  getParentRoute: () => employeeRoute,
  path: '/bookings',
  component: EmployeeBookingsRoute,
})

const EmployeePasswordRoute: React.FunctionComponent = () => {
  const changePassword = useChangeOwnPassword()

  return (
    <EmployeePasswordPage
      busy={changePassword.isPending}
      onChangePassword={async (input) => {
        await changePassword.mutateAsync(input)
      }}
    />
  )
}

export const employeePasswordRoute = createRoute({
  getParentRoute: () => employeeRoute,
  path: '/password',
  component: EmployeePasswordRoute,
})
