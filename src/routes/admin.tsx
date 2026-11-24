import type * as React from 'react'
import { useCallback, useEffect, useState } from 'react'
import { Outlet, createRoute, redirect, useNavigate } from '@tanstack/react-router'
import * as v from 'valibot'

import { useAuth } from '../auth/AuthProvider'
import { dashboardRange, summarizeDashboard } from '../data/adminDashboard'
import { listRange, startOfWeekYmd } from '../data/calendarRange'
import { addCalendarDays, todayYmdInTimeZone } from '../data/calendarMath'
import { upcomingViennaDates } from '../data/dateFormat'
import { optionalSearchParam } from '../data/schemas'
import { uploadHomepageImage } from '../data/homepageConfig'
import { reservationQueryRange, upcomingAbsences } from '../data/openingHoursForm'
import { defaultWeekStartYmd, isoWeekNumber, planWeek, weekQueryRange } from '../data/weekPlanner'
import { useAdminOps } from '../hooks/useAdminOps'
import { useAdminReservation } from '../hooks/useAdminReservation'
import { useAdminReservationActions, useAdminReservations } from '../hooks/useAdminReservations'
import { useAllServices } from '../hooks/useAllServices'
import { useAvailableSlots } from '../hooks/useAvailableSlots'
import { useBlockedSlots } from '../hooks/useBlockedSlots'
import { useActiveEmployees } from '../hooks/useEmployees'
import { useGoogleCalendarActions, useGoogleCalendarStatus } from '../hooks/useGoogleCalendar'
import { useClosures } from '../hooks/useClosures'
import { useDemoModeStatus, useSetDemoMode } from '../hooks/useDemoMode'
import { useHomepageConfig } from '../hooks/useHomepageConfig'
import { useSaveHomepageConfig } from '../hooks/useSaveHomepageConfig'
import { useBookingSettings } from '../hooks/useBookingSettings'
import { useOpeningHours } from '../hooks/useOpeningHours'
import { useOpeningHoursAdmin } from '../hooks/useOpeningHoursAdmin'
import { useSalon } from '../hooks/useSalon'
import { useSaveBookingSettings } from '../hooks/useSaveBookingSettings'
import { useSaveSalonDetails } from '../hooks/useSaveSalonDetails'
import { useSaveService } from '../hooks/useSaveService'
import {
  useCreateEmployeeAccount,
  useCreateFirstSalonAdmin,
  useStaffOverview,
} from '../hooks/useStaffOverview'
import { useUserProfile } from '../hooks/useUserProfile'
import { useLocale } from '../i18n'
import { AdminHomePage } from '../pages/admin/AdminHomePage'
import { AdminHomepagePage } from '../pages/admin/AdminHomepagePage'
import { AdminManualBookingPage } from '../pages/admin/AdminManualBookingPage'
import { AdminOpeningHoursPage } from '../pages/admin/AdminOpeningHoursPage'
import { AdminPlaceholderPage } from '../pages/admin/AdminPlaceholderPage'
import { AdminReservationDetailPage } from '../pages/admin/AdminReservationDetailPage'
import { AdminReservationsPage } from '../pages/admin/AdminReservationsPage'
import { AdminServicesPage } from '../pages/admin/AdminServicesPage'
import { AdminSettingsPage } from '../pages/admin/AdminSettingsPage'
import { rootRoute } from './root'

const AdminLayoutRoute: React.FunctionComponent = () => {
  const { user, isOperator, isLoading: authLoading } = useAuth()
  const profile = useUserProfile(!isOperator && user ? user.uid : null)
  const navigate = useNavigate()

  useEffect(() => {
    if (!authLoading && user === null) {
      void navigate({ to: '/login', search: { redirect: '/admin' } })
    }
  }, [authLoading, user, navigate])

  const { t } = useLocale()

  if (authLoading || (!isOperator && user !== null && profile.isLoading)) {
    return <AdminPlaceholderPage title={t('admin.title')} description={t('admin.loading')} />
  }

  if (!user) {
    return <AdminPlaceholderPage title={t('admin.title')} description={t('admin.signInRequired')} />
  }

  if (!isOperator && profile.data?.role !== 'admin') {
    return <AdminPlaceholderPage title={t('admin.title')} description={t('admin.forbidden')} />
  }

  return <Outlet />
}

export const adminRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/admin',
  component: AdminLayoutRoute,
})

const ymdSearchParam = optionalSearchParam(v.pipe(v.string(), v.regex(/^\d{4}-\d{2}-\d{2}$/)))

const adminIndexSearchSchema = v.object({
  week: ymdSearchParam,
  employee: optionalSearchParam(v.pipe(v.string(), v.minLength(1))),
})

const AdminIndexRoute: React.FunctionComponent = () => {
  const salon = useSalon()
  const navigate = useNavigate()
  const search = adminIndexRoute.useSearch()
  const employees = useActiveEmployees()
  const selectedEmployeeId = search.employee ?? null
  const actions = useAdminReservationActions()
  const openingHours = useOpeningHours(true)
  const closures = useClosures(true)
  const { t, intlLocale } = useLocale()
  const timeZone = salon.data?.timezone ?? 'Europe/Vienna'
  const now = new Date()
  const today = todayYmdInTimeZone(timeZone, now)
  const currentWeekStart = defaultWeekStartYmd(today, openingHours.data)
  const weekStart = search.week ? startOfWeekYmd(search.week) : currentWeekStart

  const weekRange = weekQueryRange(weekStart)
  const weekReservations = useAdminReservations(weekRange.startIso, weekRange.endIso, true)
  const weekBlockedSlots = useBlockedSlots(weekRange.startIso, weekRange.endIso, true)
  const plan =
    weekReservations.data && !openingHours.isLoading && !closures.isLoading
      ? planWeek({
          reservations: weekReservations.data,
          blockedSlots: weekBlockedSlots.data,
          employeeId: selectedEmployeeId,
          weekStartYmd: weekStart,
          openingHours: openingHours.data,
          closures: closures.data,
          timeZone,
          now,
        })
      : undefined

  const upcomingRange = dashboardRange(today)
  const upcoming = useAdminReservations(upcomingRange.startIso, upcomingRange.endIso, true)
  const pending = upcoming.data
    ? summarizeDashboard(upcoming.data, today, timeZone).pending
    : undefined

  const weekRangeLabel = new Intl.DateTimeFormat(intlLocale, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).formatRange(
    new Date(`${weekStart}T12:00:00.000Z`),
    new Date(`${addCalendarDays(weekStart, 6)}T12:00:00.000Z`),
  )

  const goToWeek = (weekStartYmd: string) => {
    void navigate({
      to: '/admin',
      search: {
        week: weekStartYmd === currentWeekStart ? undefined : weekStartYmd,
        employee: selectedEmployeeId ?? undefined,
      },
    })
  }

  return (
    <AdminHomePage
      weekTitle={t('admin.weekNumber', { week: isoWeekNumber(weekStart) })}
      weekRangeLabel={weekRangeLabel}
      isCurrentWeek={weekStart === currentWeekStart}
      plan={plan}
      planLoading={weekReservations.isLoading || openingHours.isLoading || closures.isLoading}
      planError={weekReservations.isError}
      pending={pending}
      confirmingReservationId={
        actions.confirm.isPending ? (actions.confirm.variables ?? null) : null
      }
      confirmError={actions.confirm.error instanceof Error ? actions.confirm.error.message : null}
      onPrevWeekClick={() => {
        goToWeek(addCalendarDays(weekStart, -7))
      }}
      onNextWeekClick={() => {
        goToWeek(addCalendarDays(weekStart, 7))
      }}
      onThisWeekClick={() => {
        goToWeek(currentWeekStart)
      }}
      onSelectReservation={(reservationId) => {
        void navigate({ to: '/admin/reservations/$reservationId', params: { reservationId } })
      }}
      onConfirmReservation={(reservationId) => {
        actions.confirm.mutate(reservationId)
      }}
      employees={employees.data}
      selectedEmployeeId={selectedEmployeeId}
      onSelectEmployee={(empId) => {
        void navigate({
          to: '/admin',
          search: {
            week: weekStart === currentWeekStart ? undefined : weekStart,
            employee: empId ?? undefined,
          },
        })
      }}
      onAddReservationClick={() => {
        void navigate({
          to: '/admin/manual',
          search: selectedEmployeeId ? { employeeId: selectedEmployeeId } : {},
        })
      }}
      onAddReservationAt={(dateYmd, startTime) => {
        void navigate({
          to: '/admin/manual',
          search: {
            date: dateYmd,
            time: startTime,
            ...(selectedEmployeeId ? { employeeId: selectedEmployeeId } : {}),
          },
        })
      }}
      onListViewClick={() => {
        void navigate({ to: '/admin/reservations' })
      }}
    />
  )
}

export const adminIndexRoute = createRoute({
  getParentRoute: () => adminRoute,
  path: '/',
  validateSearch: (search: Record<string, unknown>) => v.parse(adminIndexSearchSchema, search),
  component: AdminIndexRoute,
})

const calendarSearchSchema = v.object({
  view: optionalSearchParam(v.string()),
  date: ymdSearchParam,
})

/** The week planner on `/admin` replaced the separate calendar; keep old links working. */
export const adminCalendarRoute = createRoute({
  getParentRoute: () => adminRoute,
  path: '/calendar',
  validateSearch: (search: Record<string, unknown>) => v.parse(calendarSearchSchema, search),
  beforeLoad: ({ search }) => {
    throw redirect({
      to: '/admin',
      search: { week: search.date ? startOfWeekYmd(search.date) : undefined },
    })
  },
})

export const adminReservationsRoute = createRoute({
  getParentRoute: () => adminRoute,
  path: '/reservations',
  component: function AdminReservationsRoute() {
    const navigate = useNavigate()
    const salon = useSalon()
    const today = todayYmdInTimeZone(salon.data?.timezone ?? 'Europe/Vienna')
    const range = listRange(today)
    const reservations = useAdminReservations(range.startIso, range.endIso, true)

    return (
      <AdminReservationsPage
        reservations={reservations.data}
        isLoading={reservations.isLoading}
        isError={reservations.isError}
        onSelectReservation={(reservationId) => {
          void navigate({
            to: '/admin/reservations/$reservationId',
            params: { reservationId },
          })
        }}
        onCalendarClick={() => {
          void navigate({ to: '/admin', search: { week: undefined } })
        }}
      />
    )
  },
})

export const adminReservationDetailRoute = createRoute({
  getParentRoute: () => adminRoute,
  path: '/reservations/$reservationId',
  component: function AdminReservationDetailRoute() {
    const navigate = useNavigate()
    const { reservationId } = adminReservationDetailRoute.useParams()
    const reservation = useAdminReservation(reservationId)
    const actions = useAdminReservationActions()

    const failed =
      actions.confirm.error ??
      actions.decline.error ??
      actions.cancel.error ??
      actions.complete.error
    const actionError =
      failed instanceof Error ? failed.message : failed ? 'Aktion fehlgeschlagen' : null

    return (
      <AdminReservationDetailPage
        reservation={reservation.data ?? undefined}
        isLoading={reservation.isLoading}
        actionError={actionError}
        busy={
          actions.confirm.isPending ||
          actions.decline.isPending ||
          actions.cancel.isPending ||
          actions.complete.isPending
        }
        onBackClick={() => {
          void navigate({ to: '/admin', search: { week: undefined } })
        }}
        onConfirm={() => {
          actions.confirm.mutate(reservationId)
        }}
        onDecline={() => {
          if (window.confirm('Termin wirklich ablehnen? Der Slot wird freigegeben.')) {
            actions.decline.mutate(reservationId)
          }
        }}
        onCancel={() => {
          if (window.confirm('Termin wirklich stornieren?')) {
            actions.cancel.mutate(reservationId)
          }
        }}
        onComplete={() => {
          actions.complete.mutate(reservationId)
        }}
      />
    )
  },
})

const manualSearchSchema = v.object({
  serviceId: optionalSearchParam(v.pipe(v.string(), v.minLength(1))),
  employeeId: optionalSearchParam(v.pipe(v.string(), v.minLength(1))),
  date: ymdSearchParam,
  time: optionalSearchParam(v.pipe(v.string(), v.regex(/^\d{2}:\d{2}$/))),
})

export const adminManualRoute = createRoute({
  getParentRoute: () => adminRoute,
  path: '/manual',
  validateSearch: (search: Record<string, unknown>) => v.parse(manualSearchSchema, search),
  component: function AdminManualRoute() {
    const navigate = useNavigate()
    const search = adminManualRoute.useSearch()
    const services = useAllServices(true)
    const employees = useActiveEmployees()
    const dates = upcomingViennaDates(14)
    const selectedServiceId = search.serviceId ?? null
    const selectedEmployeeId = search.employeeId ?? null
    const selectedDate = search.date ?? null
    const slots = useAvailableSlots({
      serviceId: selectedServiceId,
      employeeId: selectedEmployeeId,
      fromDateYmd: selectedDate,
      toDateYmd: selectedDate,
      enforceAdvanceRestrictions: false,
    })
    const actions = useAdminReservationActions()

    return (
      <AdminManualBookingPage
        services={services.data?.filter((service) => service.active)}
        employees={employees.data}
        selectedEmployeeId={selectedEmployeeId}
        onEmployeeChange={(employeeId) => {
          void navigate({
            to: '/admin/manual',
            search: {
              serviceId: selectedServiceId ?? undefined,
              employeeId: employeeId ?? undefined,
              date: selectedDate ?? undefined,
              time: search.time,
            },
          })
        }}
        dates={dates}
        selectedServiceId={selectedServiceId}
        selectedDate={selectedDate}
        preferredTime={search.time ?? null}
        slots={slots.data}
        slotsLoading={slots.isLoading}
        isSubmitting={actions.createManual.isPending}
        submitError={
          actions.createManual.isError
            ? actions.createManual.error instanceof Error
              ? actions.createManual.error.message
              : 'Speichern fehlgeschlagen'
            : null
        }
        onBackClick={() => {
          void navigate({ to: '/admin', search: { week: undefined } })
        }}
        onServiceChange={(serviceId) => {
          void navigate({
            to: '/admin/manual',
            search: {
              serviceId,
              employeeId: selectedEmployeeId ?? undefined,
              date: selectedDate ?? undefined,
              time: search.time,
            },
          })
        }}
        onDateChange={(dateYmd) => {
          void navigate({
            to: '/admin/manual',
            search: {
              serviceId: selectedServiceId ?? undefined,
              employeeId: selectedEmployeeId ?? undefined,
              date: dateYmd,
            },
          })
        }}
        onSubmit={(input) => {
          actions.createManual.mutate(
            {
              ...input,
              idempotencyKey:
                typeof crypto !== 'undefined' && 'randomUUID' in crypto
                  ? crypto.randomUUID()
                  : `manual-${Date.now()}`,
            },
            {
              onSuccess: (result) => {
                void navigate({
                  to: '/admin/reservations/$reservationId',
                  params: { reservationId: result.reservationId },
                })
              },
            },
          )
        }}
      />
    )
  },
})

export const adminServicesRoute = createRoute({
  getParentRoute: () => adminRoute,
  path: '/services',
  component: function AdminServicesRoute() {
    const navigate = useNavigate()
    const services = useAllServices(true)
    const saveService = useSaveService()
    return (
      <AdminServicesPage
        services={services.data}
        isLoading={services.isLoading}
        isError={services.isError}
        saving={saveService.isPending}
        onSave={(serviceId, draft) => saveService.mutateAsync({ serviceId, draft })}
        onBackClick={() => {
          void navigate({ to: '/admin/settings' })
        }}
      />
    )
  },
})

const AdminOpeningHoursRoute: React.FunctionComponent = () => {
  const navigate = useNavigate()
  const salon = useSalon()
  const timeZone = salon.data?.timezone ?? 'Europe/Vienna'
  const todayYmd = todayYmdInTimeZone(timeZone)
  const hours = useOpeningHours(true)
  const closures = useClosures(true)
  const { saveWeekly, addAbsence, removeAbsence } = useOpeningHoursAdmin()
  const [draftRange, setDraftRange] = useState<{ startYmd: string; endYmd: string } | null>(null)
  const draftQuery = draftRange
    ? reservationQueryRange(draftRange.startYmd, draftRange.endYmd)
    : null
  const draftReservations = useAdminReservations(
    draftQuery?.startIso ?? '',
    draftQuery?.endIso ?? '',
    draftQuery !== null,
  )
  const onDraftDatesChange = useCallback((range: { startYmd: string; endYmd: string } | null) => {
    setDraftRange((current) =>
      current?.startYmd === range?.startYmd && current?.endYmd === range?.endYmd ? current : range,
    )
  }, [])

  return (
    <AdminOpeningHoursPage
      todayYmd={todayYmd}
      timeZone={timeZone}
      weekly={hours.data}
      weeklyLoading={hours.isLoading}
      weeklyError={hours.isError}
      weeklySave={{
        saving: saveWeekly.isPending,
        saved: saveWeekly.isSuccess,
        error: saveWeekly.error instanceof Error ? saveWeekly.error.message : null,
      }}
      onSaveWeekly={(draft) => {
        saveWeekly.mutate(draft)
      }}
      absences={closures.data ? upcomingAbsences(closures.data, todayYmd) : undefined}
      absencesLoading={closures.isLoading}
      absencesError={closures.isError}
      deletingAbsenceId={removeAbsence.isPending ? (removeAbsence.variables?.id ?? null) : null}
      onDeleteAbsence={(absence) => {
        removeAbsence.mutate(absence)
      }}
      draftReservations={draftQuery ? draftReservations.data : undefined}
      onDraftDatesChange={onDraftDatesChange}
      onAddAbsence={(absence) => addAbsence.mutateAsync(absence)}
      onBackClick={() => {
        void navigate({ to: '/admin/settings' })
      }}
    />
  )
}

export const adminOpeningHoursRoute = createRoute({
  getParentRoute: () => adminRoute,
  path: '/opening-hours',
  component: AdminOpeningHoursRoute,
})

/** Holidays are managed together with opening hours; keep old links working. */
export const adminHolidaysRoute = createRoute({
  getParentRoute: () => adminRoute,
  path: '/holidays',
  beforeLoad: () => {
    throw redirect({ to: '/admin/opening-hours' })
  },
})

const adminSettingsSearchSchema = v.object({
  gcal: optionalSearchParam(v.picklist(['connected', 'error'] as const)),
})

export const adminSettingsRoute = createRoute({
  getParentRoute: () => adminRoute,
  path: '/settings',
  validateSearch: (search) => v.parse(adminSettingsSearchSchema, search),
  component: function AdminSettingsRoute() {
    const settingsSearch = adminSettingsRoute.useSearch()
    const navigate = useNavigate()
    const { user, isOperator } = useAuth()
    const profile = useUserProfile(!isOperator && user ? user.uid : null)
    const isPrimaryAdmin = !isOperator && profile.data?.isPrimaryAdmin === true
    const settings = useBookingSettings(true)
    const salon = useSalon()
    const saveSettings = useSaveBookingSettings()
    const saveSalon = useSaveSalonDetails()
    const demoStatus = useDemoModeStatus(isOperator)
    const setDemoMode = useSetDemoMode()
    const staffOverview = useStaffOverview(isOperator || isPrimaryAdmin)
    const createFirstAdmin = useCreateFirstSalonAdmin()
    const createEmployee = useCreateEmployeeAccount()
    const ops = useAdminOps()
    const employees = useActiveEmployees()
    const [gcalEmployeeId, setGcalEmployeeId] = useState<string | null>(null)
    const gcalStatus = useGoogleCalendarStatus(true, gcalEmployeeId)
    const gcalActions = useGoogleCalendarActions(gcalEmployeeId)
    const { t } = useLocale()
    const errorText = (error: unknown): string | null =>
      error instanceof Error ? error.message : error ? String(error) : null

    return (
      <AdminSettingsPage
        settings={settings.data}
        settingsLoading={settings.isLoading}
        settingsError={settings.isError}
        settingsSave={{
          saving: saveSettings.isPending,
          saved: saveSettings.isSuccess,
          error: errorText(saveSettings.error),
        }}
        onSaveSettings={(next) => {
          saveSettings.mutate(next)
        }}
        salon={salon.data}
        salonLoading={salon.isLoading}
        salonSave={{
          saving: saveSalon.isPending,
          saved: saveSalon.isSuccess,
          error: errorText(saveSalon.error),
        }}
        onSaveSalon={(details) => {
          saveSalon.mutate(details)
        }}
        googleCalendar={{
          employees: employees.data,
          selectedEmployeeId: gcalEmployeeId,
          onSelectEmployee: setGcalEmployeeId,
          status: gcalStatus.data,
          loading: gcalStatus.isLoading,
          error: errorText(gcalStatus.error),
          oauthCallbackResult: settingsSearch.gcal,
          connecting: gcalActions.connect.isPending,
          selecting: gcalActions.selectCalendar.isPending,
          syncing: gcalActions.sync.isPending,
          disconnecting: gcalActions.disconnect.isPending,
          actionError:
            errorText(gcalActions.connect.error) ??
            errorText(gcalActions.selectCalendar.error) ??
            errorText(gcalActions.sync.error) ??
            errorText(gcalActions.disconnect.error),
          syncMessage: gcalActions.sync.data
            ? t('admin.googleCalendarSyncResult', {
                blocked: gcalActions.sync.data.syncedBlockedSlots,
                pushed: gcalActions.sync.data.pushedReservations,
              })
            : null,
          onConnect: () => {
            const returnUrl = `${window.location.origin}/admin/settings`
            gcalActions.connect.mutate(returnUrl, {
              onSuccess: ({ authUrl }) => {
                window.location.assign(authUrl)
              },
            })
          },
          onSelectCalendar: (calendarId) => {
            gcalActions.selectCalendar.mutate(calendarId)
          },
          onSyncNow: () => {
            gcalActions.sync.mutate()
          },
          onDisconnect: () => {
            gcalActions.disconnect.mutate()
          },
        }}
        isOperator={isOperator}
        isPrimaryAdmin={isPrimaryAdmin}
        demoMode={{
          enabled: demoStatus.data?.enabled ?? false,
          loading: demoStatus.isLoading,
          saving: setDemoMode.isPending,
          error: errorText(setDemoMode.error),
          onToggle: (enabled) => {
            setDemoMode.mutate(enabled)
          },
        }}
        staffOverview={staffOverview.data}
        onCreateFirstAdmin={async (input) => {
          await createFirstAdmin.mutateAsync(input)
        }}
        onCreateEmployee={async (input) => {
          await createEmployee.mutateAsync(input)
        }}
        onHomepageClick={() => {
          void navigate({ to: '/admin/homepage' })
        }}
        onServicesClick={() => {
          void navigate({ to: '/admin/services' })
        }}
        onOpeningHoursClick={() => {
          void navigate({ to: '/admin/opening-hours' })
        }}
        expireBusy={ops.processPending.isPending}
        expireMessage={
          ops.processPending.isSuccess && ops.processPending.data
            ? t('admin.expireResult', {
                expired: ops.processPending.data.expired,
                scanned: ops.processPending.data.scanned,
              })
            : null
        }
        expireError={errorText(ops.processPending.error)}
        onExpirePendingClick={() => {
          ops.processPending.mutate()
        }}
      />
    )
  },
})

export const adminHomepageRoute = createRoute({
  getParentRoute: () => adminRoute,
  path: '/homepage',
  component: function AdminHomepageRoute() {
    const navigate = useNavigate()
    const config = useHomepageConfig()
    const saveConfig = useSaveHomepageConfig()
    const errorText = (error: unknown): string | null =>
      error instanceof Error ? error.message : error ? String(error) : null

    return (
      <AdminHomepagePage
        config={config.data}
        isLoading={config.isLoading}
        isError={config.isError}
        save={{
          saving: saveConfig.isPending,
          saved: saveConfig.isSuccess,
          error: errorText(saveConfig.error),
        }}
        onSave={(next) => {
          saveConfig.mutate(next)
        }}
        onUploadImage={uploadHomepageImage}
        onBackClick={() => {
          void navigate({ to: '/admin' })
        }}
      />
    )
  },
})
