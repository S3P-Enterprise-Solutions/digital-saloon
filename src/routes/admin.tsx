import type * as React from 'react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Alert, CircularProgress } from '@mui/material'
import { Outlet, createRoute, redirect, useNavigate } from '@tanstack/react-router'
import * as v from 'valibot'

import { isEmployeeManagementEnabled } from '../brands/employeeManagement'
import { useAuth } from '../auth/AuthProvider'
import { listRange, startOfWeekYmd } from '../data/calendarRange'
import { addCalendarDays, todayYmdInTimeZone } from '../data/calendarMath'
import { upcomingViennaDates } from '../data/dateFormat'
import { optionalSearchParam } from '../data/schemas'
import { uploadHomepageImage } from '../data/homepageConfig'
import { parseSelectedServiceIds, serializeServiceIds } from '../data/serviceSelection'
import { reservationQueryRange, upcomingAbsences } from '../data/openingHoursForm'
import { defaultWeekStartYmd, isoWeekNumber, planWeek, weekQueryRange } from '../data/weekPlanner'
import { useAdminOps } from '../hooks/useAdminOps'
import { useAdminPendingReservations } from '../hooks/useAdminPendingReservations'
import { useAdminReservation } from '../hooks/useAdminReservation'
import { useAdminReservationActions, useAdminReservations } from '../hooks/useAdminReservations'
import { useAllServices } from '../hooks/useAllServices'
import { useAvailableSlots } from '../hooks/useAvailableSlots'
import { useBlockedSlots } from '../hooks/useBlockedSlots'
import { useAdminEmployees } from '../hooks/useAdminEmployees'
import { useActiveEmployees } from '../hooks/useEmployees'
import { useCreateEmployeeProfileForAdmin } from '../hooks/useCreateEmployeeProfileForAdmin'
import { useSetEmployeeAuthDisabled } from '../hooks/useSetEmployeeAuthDisabled'
import { useSetEmployeeBookable } from '../hooks/useSetEmployeeBookable'
import { useSetEmployeePassword } from '../hooks/useSetEmployeePassword'
import { useDeleteEmployeeDayException } from '../hooks/useDeleteEmployeeDayException'
import { useSaveEmployeeDayException } from '../hooks/useSaveEmployeeDayException'
import { useEmployeeDayExceptions } from '../hooks/useEmployeeDayExceptions'
import { useEmployeeWorkingHours } from '../hooks/useEmployeeWorkingHours'
import { useSaveEmployeeWeeklyWorkingHours } from '../hooks/useSaveEmployeeWeeklyWorkingHours'
import { useSoftRemoveEmployee } from '../hooks/useSoftRemoveEmployee'
import { useUpdateEmployeeProfile } from '../hooks/useUpdateEmployeeProfile'
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
import { useMoveService } from '../hooks/useMoveService'
import { useSaveService } from '../hooks/useSaveService'
import {
  useCreateEmployeeAccount,
  useCreateFirstSalonAdmin,
  useStaffOverview,
} from '../hooks/useStaffOverview'
import { useUserProfile } from '../hooks/useUserProfile'
import { useLocale } from '../i18n'
import { AdminEmployeesPage } from '../pages/admin/AdminEmployeesPage'
import { AdminHomePage } from '../pages/admin/AdminHomePage'
import { AdminHomepagePage } from '../pages/admin/AdminHomepagePage'
import { AdminManualBookingPage } from '../pages/admin/AdminManualBookingPage'
import { AdminPendingPage } from '../pages/admin/AdminPendingPage'
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

const adminWeekSearchSchema = v.object({
  week: ymdSearchParam,
  employee: optionalSearchParam(v.pipe(v.string(), v.minLength(1))),
})

const adminDetailSearchSchema = v.object({
  week: ymdSearchParam,
  from: optionalSearchParam(v.literal('pending')),
})

const AdminIndexRoute: React.FunctionComponent = () => {
  const salon = useSalon()
  const navigate = useNavigate()
  const search = adminIndexRoute.useSearch()
  const employees = useActiveEmployees()
  const selectedEmployeeId = search.employee ?? null
  const openingHours = useOpeningHours(true)
  const closures = useClosures(true)
  const { t, intlLocale } = useLocale()
  const timeZone = salon.data?.timezone ?? 'Europe/Vienna'
  const now = new Date()
  const today = todayYmdInTimeZone(timeZone, now)
  const weekFromSearch = search.week ? startOfWeekYmd(search.week) : null
  // Wait for opening hours before choosing the default week to avoid a first-paint flip.
  const weekReady = weekFromSearch != null || !openingHours.isLoading
  const currentWeekStart = defaultWeekStartYmd(today, openingHours.data)
  const weekStart = weekFromSearch ?? currentWeekStart

  // Keep the visible week in the URL so reload and browser-back restore it.
  useEffect(() => {
    if (!weekReady) return
    if (search.week === weekStart) return
    void navigate({
      to: '/admin',
      search: { week: weekStart, employee: selectedEmployeeId ?? undefined },
      replace: true,
    })
  }, [navigate, search.week, selectedEmployeeId, weekReady, weekStart])

  const weekRange = weekQueryRange(weekStart)
  const weekReservations = useAdminReservations(weekRange.startIso, weekRange.endIso, weekReady)
  const weekBlockedSlots = useBlockedSlots(weekRange.startIso, weekRange.endIso, weekReady)
  const plan =
    weekReady &&
    weekReservations.data &&
    !weekBlockedSlots.isLoading &&
    !openingHours.isLoading &&
    !closures.isLoading
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
      search: { week: startOfWeekYmd(weekStartYmd), employee: selectedEmployeeId ?? undefined },
    })
  }

  const weekSearch = { week: weekStart }

  return (
    <AdminHomePage
      weekTitle={t('admin.weekNumber', { week: isoWeekNumber(weekStart) })}
      weekRangeLabel={weekRangeLabel}
      isCurrentWeek={weekStart === currentWeekStart}
      plan={plan}
      planLoading={
        !weekReady ||
        weekReservations.isLoading ||
        weekBlockedSlots.isLoading ||
        openingHours.isLoading ||
        closures.isLoading
      }
      planError={weekReservations.isError || weekBlockedSlots.isError}
      onPrevWeekClick={() => {
        goToWeek(addCalendarDays(weekStart, -7))
      }}
      onNextWeekClick={() => {
        goToWeek(addCalendarDays(weekStart, 7))
      }}
      onThisWeekClick={() => {
        goToWeek(currentWeekStart)
      }}
      onOpenReservationDetails={(reservationId) => {
        void navigate({
          to: '/admin/reservations/$reservationId',
          params: { reservationId },
          search: weekSearch,
        })
      }}
      onEditReservation={(reservationId) => {
        void navigate({
          to: '/admin/manual',
          search: { reservationId, ...weekSearch },
        })
      }}
      employees={employees.data}
      selectedEmployeeId={selectedEmployeeId}
      onSelectEmployee={(empId) => {
        void navigate({
          to: '/admin',
          search: {
            week: weekStart,
            employee: empId ?? undefined,
          },
        })
      }}
      onAddReservationClick={() => {
        void navigate({
          to: '/admin/manual',
          search: {
            ...weekSearch,
            ...(selectedEmployeeId ? { employeeId: selectedEmployeeId } : {}),
          },
        })
      }}
      onListViewClick={() => {
        void navigate({ to: '/admin/reservations', search: weekSearch })
      }}
    />
  )
}

export const adminIndexRoute = createRoute({
  getParentRoute: () => adminRoute,
  path: '/',
  validateSearch: (search: Record<string, unknown>) => v.parse(adminWeekSearchSchema, search),
  component: AdminIndexRoute,
})

export const adminPendingRoute = createRoute({
  getParentRoute: () => adminRoute,
  path: '/pending',
  component: function AdminPendingRoute() {
    const navigate = useNavigate()
    const actions = useAdminReservationActions()
    const pendingQuery = useAdminPendingReservations(true)

    return (
      <AdminPendingPage
        pending={pendingQuery.pending}
        isLoading={pendingQuery.isLoading}
        isError={pendingQuery.isError}
        confirmingReservationId={
          actions.confirm.isPending ? (actions.confirm.variables ?? null) : null
        }
        confirmError={actions.confirm.error instanceof Error ? actions.confirm.error.message : null}
        onConfirmReservation={(reservationId) => {
          actions.confirm.mutate(reservationId)
        }}
        onOpenReservationDetails={(reservationId) => {
          void navigate({
            to: '/admin/reservations/$reservationId',
            params: { reservationId },
            search: { from: 'pending' },
          })
        }}
      />
    )
  },
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
  validateSearch: (search: Record<string, unknown>) => v.parse(adminWeekSearchSchema, search),
  component: function AdminReservationsRoute() {
    const navigate = useNavigate()
    const search = adminReservationsRoute.useSearch()
    const returnWeek = search.week ? startOfWeekYmd(search.week) : undefined
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
            search: returnWeek ? { week: returnWeek } : {},
          })
        }}
        onCalendarClick={() => {
          void navigate({
            to: '/admin',
            search: returnWeek ? { week: returnWeek } : {},
          })
        }}
      />
    )
  },
})

export const adminReservationDetailRoute = createRoute({
  getParentRoute: () => adminRoute,
  path: '/reservations/$reservationId',
  validateSearch: (search: Record<string, unknown>) => v.parse(adminDetailSearchSchema, search),
  component: function AdminReservationDetailRoute() {
    const navigate = useNavigate()
    const { t } = useLocale()
    const { reservationId } = adminReservationDetailRoute.useParams()
    const search = adminReservationDetailRoute.useSearch()
    const returnWeek = search.week ? startOfWeekYmd(search.week) : undefined
    const fromPending = search.from === 'pending'
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
        backLabel={fromPending ? t('admin.backToPending') : t('admin.backToCalendar')}
        onBackClick={() => {
          if (fromPending) {
            void navigate({ to: '/admin/pending' })
            return
          }
          void navigate({
            to: '/admin',
            search: returnWeek ? { week: returnWeek } : {},
          })
        }}
        onConfirm={() => {
          actions.confirm.mutate(reservationId)
        }}
        onDecline={() => {
          actions.decline.mutate(reservationId)
        }}
        onCancel={() => {
          actions.cancel.mutate(reservationId)
        }}
        onComplete={() => {
          actions.complete.mutate(reservationId)
        }}
        onEditClick={() => {
          void navigate({
            to: '/admin/manual',
            search: {
              reservationId,
              week: returnWeek,
              from: fromPending ? 'pending' : undefined,
            },
          })
        }}
      />
    )
  },
})

const manualSearchSchema = v.object({
  reservationId: optionalSearchParam(v.pipe(v.string(), v.minLength(1))),
  serviceId: optionalSearchParam(v.pipe(v.string(), v.minLength(1))),
  serviceIds: optionalSearchParam(v.pipe(v.string(), v.minLength(1))),
  employeeId: optionalSearchParam(v.pipe(v.string(), v.minLength(1))),
  date: ymdSearchParam,
  time: optionalSearchParam(v.pipe(v.string(), v.regex(/^\d{2}:\d{2}$/))),
  week: ymdSearchParam,
  from: optionalSearchParam(v.literal('pending')),
})

const viennaYmdOfIso = (iso: string): string =>
  new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Vienna',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(iso))

export const adminManualRoute = createRoute({
  getParentRoute: () => adminRoute,
  path: '/manual',
  validateSearch: (search: Record<string, unknown>) => v.parse(manualSearchSchema, search),
  component: function AdminManualRoute() {
    const navigate = useNavigate()
    const { t } = useLocale()
    const search = adminManualRoute.useSearch()
    const editingReservationId = search.reservationId ?? null
    const editing = useAdminReservation(editingReservationId)
    const services = useAllServices(true)
    const employees = useActiveEmployees()
    const selectedEmployeeId = search.employeeId ?? null
    const actions = useAdminReservationActions()
    const hydratedEditId = useRef<string | null>(null)

    useEffect(() => {
      if (!editingReservationId) {
        hydratedEditId.current = null
        return
      }
      if (!editing.data) return
      if (hydratedEditId.current === editingReservationId) return
      hydratedEditId.current = editingReservationId
      const reservation = editing.data
      const serviceIds =
        reservation.serviceIds && reservation.serviceIds.length > 0
          ? reservation.serviceIds
          : [reservation.serviceId]
      const time = new Intl.DateTimeFormat('de-AT', {
        timeZone: 'Europe/Vienna',
        hour: '2-digit',
        minute: '2-digit',
      }).format(new Date(reservation.startAt))
      void navigate({
        to: '/admin/manual',
        search: {
          reservationId: editingReservationId,
          serviceIds: serializeServiceIds(serviceIds),
          employeeId: reservation.employeeId ?? undefined,
          date: viennaYmdOfIso(reservation.startAt),
          time,
          week: search.week ? startOfWeekYmd(search.week) : undefined,
          from: search.from === 'pending' ? 'pending' : undefined,
        },
        replace: true,
        resetScroll: false,
      })
    }, [editingReservationId, editing.data, navigate, search.week, search.from])

    const selectedServiceIds = parseSelectedServiceIds(search)
    const selectedDate = search.date ?? null
    const returnWeek = search.week ? startOfWeekYmd(search.week) : undefined
    const fromPending = search.from === 'pending'
    const baseDates = upcomingViennaDates(14)
    const dates =
      selectedDate && !baseDates.includes(selectedDate)
        ? [selectedDate, ...baseDates].sort()
        : baseDates
    const slots = useAvailableSlots({
      serviceIds: selectedServiceIds,
      employeeId: selectedEmployeeId,
      fromDateYmd: selectedDate,
      toDateYmd: selectedDate,
      enforceAdvanceRestrictions: false,
      excludeReservationId: editingReservationId ?? undefined,
    })

    const isEdit = editingReservationId !== null
    const editReady = !isEdit || editing.data != null
    const submitPending = isEdit ? actions.updateManual.isPending : actions.createManual.isPending
    const submitError = isEdit
      ? actions.updateManual.isError
        ? actions.updateManual.error instanceof Error
          ? actions.updateManual.error.message
          : 'Speichern fehlgeschlagen'
        : null
      : actions.createManual.isError
        ? actions.createManual.error instanceof Error
          ? actions.createManual.error.message
          : 'Speichern fehlgeschlagen'
        : null

    const manualSearchBase = {
      reservationId: editingReservationId ?? undefined,
      week: returnWeek,
      from: fromPending ? ('pending' as const) : undefined,
    }

    if (isEdit && editing.isLoading) {
      return (
        <CircularProgress aria-label={t('admin.detailLoading')} sx={{ display: 'block', m: 4 }} />
      )
    }
    if (isEdit && (editing.isError || !editing.data)) {
      return (
        <Alert severity="error" sx={{ m: 3 }}>
          {t('admin.notFound')}
        </Alert>
      )
    }

    return editReady ? (
      <AdminManualBookingPage
        key={editingReservationId ?? 'create'}
        mode={isEdit ? 'edit' : 'create'}
        services={services.data?.filter((service) => service.active)}
        employees={employees.data}
        selectedEmployeeId={selectedEmployeeId}
        onEmployeeChange={(employeeId) => {
          void navigate({
            to: '/admin/manual',
            search: {
              ...manualSearchBase,
              serviceIds: serializeServiceIds(selectedServiceIds),
              serviceId: undefined,
              employeeId: employeeId ?? undefined,
              date: selectedDate ?? undefined,
              time: undefined,
            },
            replace: true,
            resetScroll: false,
          })
        }}
        dates={dates}
        selectedServiceIds={selectedServiceIds}
        selectedDate={selectedDate}
        preferredTime={search.time ?? null}
        preferredStartAt={editing.data?.startAt ?? null}
        initialCustomer={
          editing.data
            ? {
                firstName: editing.data.firstName,
                lastName: editing.data.lastName,
                phone: editing.data.phone,
                email: editing.data.email ?? '',
                internalNote: editing.data.internalNote ?? '',
              }
            : null
        }
        slots={slots.data}
        slotsLoading={slots.isLoading}
        isSubmitting={submitPending}
        submitError={submitError}
        onBackClick={() => {
          if (fromPending) {
            void navigate({ to: '/admin/pending' })
            return
          }
          void navigate({
            to: '/admin',
            search: returnWeek ? { week: returnWeek } : {},
          })
        }}
        onToggleService={(serviceId) => {
          const exists = selectedServiceIds.includes(serviceId)
          const nextIds = exists
            ? selectedServiceIds.filter((id) => id !== serviceId)
            : [...selectedServiceIds, serviceId]
          void navigate({
            to: '/admin/manual',
            search: {
              ...manualSearchBase,
              serviceIds: serializeServiceIds(nextIds),
              serviceId: undefined,
              employeeId: selectedEmployeeId ?? undefined,
              date: selectedDate ?? undefined,
              time: undefined,
            },
            replace: true,
            resetScroll: false,
          })
        }}
        onDateChange={(dateYmd) => {
          void navigate({
            to: '/admin/manual',
            search: {
              ...manualSearchBase,
              serviceIds: serializeServiceIds(selectedServiceIds),
              serviceId: undefined,
              employeeId: selectedEmployeeId ?? undefined,
              date: dateYmd,
              time: undefined,
            },
            replace: true,
            resetScroll: false,
          })
        }}
        onSubmit={(input) => {
          if (isEdit && editingReservationId) {
            actions.updateManual.mutate(
              { reservationId: editingReservationId, ...input },
              {
                onSuccess: (reservation) => {
                  void navigate({
                    to: '/admin/reservations/$reservationId',
                    params: { reservationId: reservation.reservationId },
                    search: {
                      week: returnWeek,
                      from: fromPending ? 'pending' : undefined,
                    },
                  })
                },
              },
            )
            return
          }
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
                  search: {
                    week: returnWeek,
                    from: fromPending ? 'pending' : undefined,
                  },
                })
              },
            },
          )
        }}
      />
    ) : null
  },
})

export const adminServicesRoute = createRoute({
  getParentRoute: () => adminRoute,
  path: '/services',
  component: function AdminServicesRoute() {
    const navigate = useNavigate()
    const services = useAllServices(true)
    const saveService = useSaveService()
    const moveServiceMutation = useMoveService()
    return (
      <AdminServicesPage
        services={services.data}
        isLoading={services.isLoading}
        isError={services.isError}
        saving={saveService.isPending}
        moving={moveServiceMutation.isPending}
        onSave={(serviceId, draft) => saveService.mutateAsync({ serviceId, draft })}
        onMove={(serviceId, direction) => moveServiceMutation.mutateAsync({ serviceId, direction })}
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
  gcalEmployee: optionalSearchParam(v.pipe(v.string(), v.minLength(1))),
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
    const employeeManagementEnabled = isEmployeeManagementEnabled()
    const ops = useAdminOps()
    const employees = useActiveEmployees()
    const gcalEmployeeId = settingsSearch.gcalEmployee ?? null
    const setGcalEmployeeId = (empId: string | null) => {
      void navigate({
        to: '/admin/settings',
        search: { gcalEmployee: empId ?? undefined },
        replace: true,
      })
    }
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
            const returnUrl = gcalEmployeeId
              ? `${window.location.origin}/admin/settings?gcalEmployee=${encodeURIComponent(gcalEmployeeId)}`
              : `${window.location.origin}/admin/settings`
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
        onCreateEmployee={
          employeeManagementEnabled
            ? undefined
            : async (input) => {
                await createEmployee.mutateAsync(input)
              }
        }
        employeeManagementEnabled={employeeManagementEnabled}
        onEmployeesClick={
          employeeManagementEnabled
            ? () => {
                void navigate({ to: '/admin/employees' })
              }
            : undefined
        }
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

export const adminEmployeesRoute = createRoute({
  getParentRoute: () => adminRoute,
  path: '/employees',
  beforeLoad: () => {
    if (!isEmployeeManagementEnabled()) {
      throw redirect({ to: '/admin/settings' })
    }
  },
  component: function AdminEmployeesRoute() {
    const navigate = useNavigate()
    const { user, isOperator } = useAuth()
    const salon = useSalon()
    const salonTimezone = salon.data?.timezone ?? 'Europe/Vienna'
    const profile = useUserProfile(!isOperator && user ? user.uid : null)
    const isPrimaryAdmin = !isOperator && profile.data?.isPrimaryAdmin === true
    const employeesQuery = useAdminEmployees(true)
    const staffOverview = useStaffOverview(true)
    const services = useAllServices(true)
    const createAccount = useCreateEmployeeAccount()
    const linkProfile = useCreateEmployeeProfileForAdmin()
    const updateProfile = useUpdateEmployeeProfile()
    const setBookable = useSetEmployeeBookable()
    const setAuthDisabled = useSetEmployeeAuthDisabled()
    const setPassword = useSetEmployeePassword()
    const softRemove = useSoftRemoveEmployee()
    const saveWeeklyWorkingHours = useSaveEmployeeWeeklyWorkingHours()
    const saveDayException = useSaveEmployeeDayException()
    const deleteDayException = useDeleteEmployeeDayException()
    const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null)
    const employeeHours = useEmployeeWorkingHours(selectedEmployeeId, selectedEmployeeId !== null)
    const employeeExceptions = useEmployeeDayExceptions(
      selectedEmployeeId,
      selectedEmployeeId !== null,
    )
    const errorText = (error: unknown): string | null =>
      error instanceof Error ? error.message : error ? String(error) : null

    const employeeIds = new Set(employeesQuery.data?.map((emp) => emp.id) ?? [])
    const linkableAdmins =
      staffOverview.data?.staff.filter((member) => !employeeIds.has(member.uid)) ?? []

    return (
      <AdminEmployeesPage
        employees={employeesQuery.data}
        isLoading={employeesQuery.isLoading}
        isError={employeesQuery.isError}
        linkableAdmins={linkableAdmins}
        services={services.data}
        servicesLoading={services.isLoading}
        isPrimaryAdmin={isPrimaryAdmin}
        selectedEmployeeId={selectedEmployeeId}
        onSelectEmployee={setSelectedEmployeeId}
        onBackClick={() => {
          void navigate({ to: '/admin/settings' })
        }}
        onCreateEmployeeAccount={async (input) => {
          await createAccount.mutateAsync(input)
        }}
        onLinkAdminProfile={async (input) => {
          await linkProfile.mutateAsync(input)
        }}
        onSaveProfile={async (input) => {
          await updateProfile.mutateAsync(input)
        }}
        onSetBookable={async (employeeUid, active) => {
          await setBookable.mutateAsync({ employeeUid, active })
        }}
        onSetAuthDisabled={async (employeeUid, disabled) => {
          await setAuthDisabled.mutateAsync({ employeeUid, disabled })
        }}
        onSetPassword={async (employeeUid, password) => {
          await setPassword.mutateAsync({ employeeUid, password })
        }}
        onSoftRemove={async (employeeUid) => {
          await softRemove.mutateAsync({ employeeUid })
        }}
        employeeWeekly={employeeHours.data}
        employeeWeeklyLoading={employeeHours.isLoading}
        employeeWeeklyError={employeeHours.isError}
        weeklyHoursSave={{
          saving: saveWeeklyWorkingHours.isPending,
          saved: saveWeeklyWorkingHours.isSuccess,
          error: errorText(saveWeeklyWorkingHours.error),
        }}
        onSaveWeeklyHours={(draft) => {
          if (!selectedEmployeeId) return
          saveWeeklyWorkingHours.mutate({ employeeUid: selectedEmployeeId, draft })
        }}
        employeeDayExceptions={employeeExceptions.data}
        employeeDayExceptionsLoading={employeeExceptions.isLoading}
        employeeDayExceptionsError={employeeExceptions.isError}
        onSaveDayException={async (input) => {
          await saveDayException.mutateAsync(input)
        }}
        onDeleteDayException={async (input) => {
          await deleteDayException.mutateAsync(input)
        }}
        todayYmd={todayYmdInTimeZone(salonTimezone)}
        bookableBusy={setBookable.isPending}
        authBusy={setAuthDisabled.isPending}
        profileBusy={updateProfile.isPending}
        createBusy={createAccount.isPending}
        linkBusy={linkProfile.isPending}
        removeBusy={softRemove.isPending}
        passwordBusy={setPassword.isPending}
        dayExceptionBusy={saveDayException.isPending || deleteDayException.isPending}
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
