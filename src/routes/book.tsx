import { useMemo } from 'react'
import { createRoute, useNavigate } from '@tanstack/react-router'
import * as v from 'valibot'

import { bookingFailureOf } from '../data/bookingApi'
import { addMonths, viennaTodayYmd, weekStartMondayYmd } from '../data/bookingCalendar'
import { optionalSearchParam } from '../data/schemas'
import { parseSelectedServiceIds, serializeServiceIds } from '../data/serviceSelection'
import { localizedServiceName } from '../data/serviceForm'
import { useActiveServices } from '../hooks/useActiveServices'
import { useActiveEmployees } from '../hooks/useEmployees'
import { useAvailableSlots } from '../hooks/useAvailableSlots'
import { useCreateReservation } from '../hooks/useCreateReservation'
import { useLocale } from '../i18n'
import { BookingWizardPage } from '../pages/BookingWizardPage'
import { customerOnly } from './customerOnly'
import { rootRoute } from './root'

const bookSearchSchema = v.object({
  serviceId: optionalSearchParam(v.pipe(v.string(), v.minLength(1))),
  serviceIds: optionalSearchParam(v.pipe(v.string(), v.minLength(1))),
  employeeId: optionalSearchParam(v.pipe(v.string(), v.minLength(1))),
  step: optionalSearchParam(v.picklist(['1', '2'] as const)),
  date: optionalSearchParam(v.pipe(v.string(), v.regex(/^\d{4}-\d{2}-\d{2}$/))),
  startAt: optionalSearchParam(v.pipe(v.string(), v.minLength(1))),
  week: optionalSearchParam(v.pipe(v.string(), v.regex(/^\d{4}-\d{2}-\d{2}$/))),
  month: optionalSearchParam(v.pipe(v.string(), v.regex(/^\d{4}-\d{2}-\d{2}$/))),
})

export const bookRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/book',
  validateSearch: (search: Record<string, unknown>) => v.parse(bookSearchSchema, search),
  component: customerOnly(function BookWizardRoute() {
    const navigate = useNavigate()
    const search = bookRoute.useSearch()
    const { locale } = useLocale()
    const services = useActiveServices()
    const employees = useActiveEmployees()
    const create = useCreateReservation()

    const today = viennaTodayYmd()
    const selectedServiceIds = parseSelectedServiceIds(search)
    const step: 1 | 2 =
      search.step === '2' || (!search.step && selectedServiceIds.length > 0) ? 2 : 1
    const weekAnchorYmd = search.week ?? weekStartMondayYmd(today)
    const monthAnchorYmd = search.month ?? `${today.slice(0, 8)}01`
    const rangeFrom = today
    const rangeTo = addMonths(today, 2)

    const selectedEmployeeId = search.employeeId ?? null

    const rangeSlots = useAvailableSlots({
      serviceIds: step === 2 ? selectedServiceIds : [],
      employeeId: selectedEmployeeId,
      fromDateYmd: step === 2 && selectedServiceIds.length > 0 ? rangeFrom : null,
      toDateYmd: step === 2 && selectedServiceIds.length > 0 ? rangeTo : null,
    })

    const selectedServices =
      services.data?.filter((item) => selectedServiceIds.includes(item.id)) ?? []

    const attemptKey = `${selectedServiceIds.join(',')}|${search.startAt ?? ''}`
    const idempotencyKey = useMemo(() => {
      void attemptKey
      return typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : `idemp-${Date.now()}-${Math.random().toString(36).slice(2)}`
    }, [attemptKey])

    return (
      <BookingWizardPage
        privacyHref="/datenschutz"
        services={services.data}
        servicesLoading={services.isLoading}
        servicesError={services.isError}
        step={step}
        selectedServiceIds={selectedServiceIds}
        employees={employees.data}
        selectedEmployeeId={selectedEmployeeId}
        onSelectEmployee={(employeeId) => {
          void navigate({
            to: '/book',
            search: {
              ...search,
              employeeId: employeeId ?? undefined,
              startAt: undefined,
            },
            replace: true,
            resetScroll: false,
          })
        }}
        selectedDate={search.date ?? null}
        selectedStartAt={search.startAt ?? null}
        rangeSlots={rangeSlots.data}
        rangeLoading={rangeSlots.isLoading}
        rangeError={rangeSlots.isError}
        isSubmitting={create.isPending}
        submitFailure={
          // Only for the slot that failed: picking another time clears the message.
          create.isError && create.variables?.startAt === search.startAt
            ? bookingFailureOf(create.error)
            : null
        }
        weekAnchorYmd={weekAnchorYmd}
        monthAnchorYmd={monthAnchorYmd}
        onToggleService={(serviceId) => {
          const exists = selectedServiceIds.includes(serviceId)
          const nextIds = exists
            ? selectedServiceIds.filter((id) => id !== serviceId)
            : [...selectedServiceIds, serviceId]
          void navigate({
            to: '/book',
            search: {
              serviceIds: serializeServiceIds(nextIds),
              step: '1',
              date: undefined,
              startAt: undefined,
              week: weekAnchorYmd,
              month: monthAnchorYmd,
            },
            replace: true,
            resetScroll: false,
          })
        }}
        onContinueToDate={() => {
          if (selectedServiceIds.length === 0) return
          void navigate({
            to: '/book',
            search: {
              serviceIds: serializeServiceIds(selectedServiceIds),
              step: '2',
              date: search.date,
              startAt: undefined,
              week: weekAnchorYmd,
              month: monthAnchorYmd,
            },
            replace: true,
            resetScroll: true,
          })
        }}
        onBackToServices={() => {
          void navigate({
            to: '/book',
            search: {
              serviceIds: serializeServiceIds(selectedServiceIds),
              step: '1',
              date: search.date,
              startAt: undefined,
              week: weekAnchorYmd,
              month: monthAnchorYmd,
            },
            replace: true,
            resetScroll: true,
          })
        }}
        onMonthAnchorChange={(anchorYmd) => {
          void navigate({
            to: '/book',
            search: {
              serviceIds: serializeServiceIds(selectedServiceIds),
              step: '2',
              date: search.date,
              startAt: search.startAt,
              week: weekAnchorYmd,
              month: `${anchorYmd.slice(0, 8)}01`,
            },
            replace: true,
            resetScroll: false,
          })
        }}
        onSelectDate={(dateYmd) => {
          void navigate({
            to: '/book',
            search: {
              serviceIds: serializeServiceIds(selectedServiceIds),
              step: '2',
              date: dateYmd,
              startAt: undefined,
              week: weekStartMondayYmd(dateYmd),
              month: `${dateYmd.slice(0, 8)}01`,
            },
            replace: true,
            resetScroll: false,
          })
        }}
        onSelectTime={(startAt) => {
          void navigate({
            to: '/book',
            search: {
              serviceIds: serializeServiceIds(selectedServiceIds),
              step: '2',
              date: search.date,
              startAt,
              week: weekAnchorYmd,
              month: monthAnchorYmd,
            },
            replace: true,
            resetScroll: false,
          })
        }}
        onClearTime={() => {
          void navigate({
            to: '/book',
            search: {
              serviceIds: serializeServiceIds(selectedServiceIds),
              step: '2',
              date: search.date,
              startAt: undefined,
              week: weekAnchorYmd,
              month: monthAnchorYmd,
            },
            replace: true,
            resetScroll: false,
          })
        }}
        onSubmit={(input) => {
          if (selectedServiceIds.length === 0 || !search.startAt) return
          create.mutate(
            {
              serviceId: selectedServiceIds[0]!,
              serviceIds: selectedServiceIds,
              ...(selectedEmployeeId ? { employeeId: selectedEmployeeId } : {}),
              startAt: search.startAt,
              firstName: input.firstName,
              lastName: input.lastName,
              phone: input.phone,
              email: input.email,
              notes: input.notes,
              locale,
              privacyAccepted: true,
              idempotencyKey,
            },
            {
              onSuccess: (result) => {
                if (!result.managementToken) {
                  void navigate({ to: '/book' })
                  return
                }
                const combinedName = selectedServices
                  .map((service) => localizedServiceName(service, locale))
                  .join(' + ')
                void navigate({
                  to: '/booking/confirmed',
                  search: {
                    reservationId: result.reservationId,
                    token: result.managementToken,
                    status: result.status,
                    serviceName: combinedName,
                    startAt: search.startAt!,
                  },
                })
              },
            },
          )
        }}
      />
    )
  }),
})
