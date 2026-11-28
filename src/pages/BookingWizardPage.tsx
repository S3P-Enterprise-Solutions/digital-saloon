import type * as React from 'react'
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  FormControlLabel,
  Paper,
  Stack,
  TextField,
  Typography,
  Link,
} from '@mui/material'
import * as v from 'valibot'

import { BookingMonthCalendar } from '../components/BookingMonthCalendar'
import type { AvailableSlotDto, BookingFailure } from '../data/bookingApi'
import {
  findEarliestAvailableDate,
  slotsByDate,
  viennaTodayYmd,
  weekDays,
} from '../data/bookingCalendar'
import { formatViennaDateTime, formatViennaTime } from '../data/dateFormat'
import {
  bookingContactIssueOf,
  bookingContactSchema,
  type BookingContactIssue,
} from '../data/phone'
import { arePricesVisible } from '../data/salonConfig'
import {
  formatServiceDurationRange,
  formatServicePriceRange,
  localizedServiceDescription,
  localizedServiceName,
} from '../data/serviceForm'
import type { BookableEmployeePublic } from '../data/employeeAdminApi'
import type { ServiceWithId } from '../data/services'
import { useLocale } from '../i18n'
import type { MessageKey } from '../i18n'
import { brand } from '../theme'

const bookingFailureMessages: Record<BookingFailure, MessageKey> = {
  slotTaken: 'book.error.slotTaken',
  serviceUnavailable: 'book.error.serviceUnavailable',
  failed: 'book.error.submitFailed',
}

const contactIssueMessages: Record<BookingContactIssue, MessageKey> = {
  firstNameRequired: 'book.error.firstNameRequired',
  firstNameTooLong: 'book.error.firstNameTooLong',
  lastNameRequired: 'book.error.lastNameRequired',
  lastNameTooLong: 'book.error.lastNameTooLong',
  phoneInvalid: 'book.error.phoneInvalid',
  emailRequired: 'book.error.emailRequired',
  emailTooLong: 'book.error.emailTooLong',
  emailInvalid: 'book.error.emailInvalid',
  notesTooLong: 'book.error.notesTooLong',
  privacyRequired: 'book.error.privacyRequired',
  invalid: 'book.error.invalid',
}

/**
 * Read by screen readers only.
 * String pixel values avoid MUI `sx` turning numeric `1` into `100%` and `-1` into `-8px`.
 */
const screenReaderOnly = {
  position: 'absolute',
  width: '1px',
  height: '1px',
  margin: '-1px',
  padding: 0,
  border: 0,
  overflow: 'hidden',
  clip: 'rect(0 0 0 0)',
  whiteSpace: 'nowrap',
} as const

export type BookingWizardPageProps = {
  /** Privacy policy URL; opened in a new tab so the half-filled form survives. */
  privacyHref: string
  services: ServiceWithId[] | undefined
  servicesLoading: boolean
  servicesError: boolean
  step: 1 | 2
  selectedServiceIds: string[]
  employees?: Pick<BookableEmployeePublic, 'id' | 'displayName'>[]
  selectedEmployeeId?: string | null
  onSelectEmployee?: (employeeId: string | null) => void
  selectedDate: string | null
  selectedStartAt: string | null
  rangeSlots: AvailableSlotDto[] | undefined
  rangeLoading: boolean
  rangeError: boolean
  isSubmitting: boolean
  submitFailure: BookingFailure | null
  weekAnchorYmd: string
  monthAnchorYmd: string
  onToggleService: (serviceId: string) => void
  onContinueToDate: () => void
  onBackToServices: () => void
  onSelectDate: (dateYmd: string) => void
  onSelectTime: (startAt: string) => void
  onClearTime: () => void
  onMonthAnchorChange: (anchorYmd: string) => void
  onSubmit: (input: {
    firstName: string
    lastName: string
    phone: string
    email: string
    notes: string | null
    privacyAccepted: true
  }) => void
}

export const BookingWizardPage: React.FunctionComponent<BookingWizardPageProps> = ({
  privacyHref,
  services,
  servicesLoading,
  servicesError,
  step,
  selectedServiceIds,
  employees,
  selectedEmployeeId,
  onSelectEmployee,
  selectedDate,
  selectedStartAt,
  rangeSlots,
  rangeLoading,
  rangeError,
  isSubmitting,
  submitFailure,
  weekAnchorYmd,
  monthAnchorYmd,
  onToggleService,
  onContinueToDate,
  onBackToServices,
  onSelectDate,
  onSelectTime,
  onClearTime,
  onMonthAnchorChange,
  onSubmit,
}) => {
  const { t, locale, intlLocale } = useLocale()
  const pricesVisible = arePricesVisible()

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [notes, setNotes] = useState('')
  const [privacyAccepted, setPrivacyAccepted] = useState(false)
  const [contactIssue, setContactIssue] = useState<BookingContactIssue | null>(null)
  const timeSectionRef = useRef<HTMLDivElement | null>(null)
  const shouldScrollToTimeRef = useRef(false)

  const handleSelectDate = (dateYmd: string) => {
    if (dateYmd === selectedDate) {
      timeSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      return
    }
    shouldScrollToTimeRef.current = true
    onSelectDate(dateYmd)
  }

  useLayoutEffect(() => {
    if (!shouldScrollToTimeRef.current || selectedDate === null) return
    shouldScrollToTimeRef.current = false
    timeSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [selectedDate])

  const selectedServices = useMemo(
    () => (services ?? []).filter((item) => selectedServiceIds.includes(item.id)),
    [services, selectedServiceIds],
  )
  const totalDurationMinutes = useMemo(
    () => selectedServices.reduce((sum, item) => sum + item.durationMinutes, 0),
    [selectedServices],
  )
  const totalMaxDurationMinutes = useMemo(
    () =>
      selectedServices.reduce(
        (sum, item) => sum + (item.durationMaxMinutes ?? item.durationMinutes),
        0,
      ),
    [selectedServices],
  )
  const totalMinPriceCents = useMemo(
    () => selectedServices.reduce((sum, item) => sum + item.priceCents, 0),
    [selectedServices],
  )
  const totalMaxPriceCents = useMemo(
    () => selectedServices.reduce((sum, item) => sum + (item.priceMaxCents ?? item.priceCents), 0),
    [selectedServices],
  )
  const byDate = useMemo(() => slotsByDate(rangeSlots ?? []), [rangeSlots])
  const availableDates = useMemo(() => new Set(byDate.keys()), [byDate])
  const daySlots = selectedDate ? (byDate.get(selectedDate) ?? []) : []
  const todayYmd = viennaTodayYmd()
  const currentWeekDays = useMemo(() => weekDays(weekAnchorYmd), [weekAnchorYmd])

  useEffect(() => {
    if (step !== 2 || rangeLoading || rangeSlots === undefined) return
    if (selectedDate !== null) return

    const earliestInWeek = findEarliestAvailableDate(currentWeekDays, byDate, todayYmd)
    const earliestOverall =
      earliestInWeek ??
      Array.from(byDate.keys())
        .sort()
        .find((ymd) => ymd >= todayYmd && (byDate.get(ymd)?.length ?? 0) > 0) ??
      null

    if (earliestOverall) {
      onSelectDate(earliestOverall)
    }
  }, [
    step,
    rangeLoading,
    rangeSlots,
    selectedDate,
    byDate,
    currentWeekDays,
    todayYmd,
    onSelectDate,
  ])

  const priceSummaryText = pricesVisible
    ? t('book.totalPrice', {
        price: formatServicePriceRange(totalMinPriceCents, totalMaxPriceCents),
      })
    : t('price.onRequest')

  return (
    <Stack
      spacing={3}
      sx={{ maxWidth: step === 1 ? 1040 : 640, mx: 'auto', width: '100%', pb: step === 1 ? 10 : 4 }}
    >
      <Box>
        <Typography variant="h1" gutterBottom>
          {t('book.title')}
        </Typography>
        <Typography color="text.secondary">{t('book.subtitle')}</Typography>
        <Typography variant="body2" color="primary.main" sx={{ fontWeight: 600, mt: 1 }}>
          {step === 1 ? t('book.step1Title') : t('book.step2Title')}
        </Typography>
      </Box>

      {step === 1 ? (
        <>
          <Paper sx={{ p: { xs: 2, sm: 3 } }} component="section" aria-labelledby="step-service">
            <Typography id="step-service" variant="h2" sx={{ fontSize: '1.15rem', mb: 2 }}>
              {t('book.step.service')}
            </Typography>
            {servicesLoading ? (
              <CircularProgress aria-label={t('book.servicesLoading')} size={28} />
            ) : null}
            {servicesError ? <Alert severity="error">{t('book.servicesError')}</Alert> : null}
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: {
                  xs: '1fr',
                  sm: 'repeat(2, minmax(0, 1fr))',
                  md: 'repeat(3, minmax(0, 1fr))',
                },
                gap: 1.25,
              }}
            >
              {(services ?? []).map((service) => {
                const selected = selectedServiceIds.includes(service.id)
                const description = localizedServiceDescription(service, locale)
                return (
                  <Box
                    key={service.id}
                    component="button"
                    type="button"
                    aria-pressed={selected}
                    onClick={() => onToggleService(service.id)}
                    sx={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      justifyContent: 'space-between',
                      gap: 1,
                      textAlign: 'left',
                      cursor: 'pointer',
                      borderRadius: 2,
                      border: '1.5px solid',
                      borderColor: selected ? 'primary.main' : 'divider',
                      bgcolor: selected ? brand.stone : 'background.paper',
                      p: 1.5,
                      font: 'inherit',
                      color: 'inherit',
                      width: '100%',
                      height: '100%',
                      transition: 'border-color 120ms ease, background-color 120ms ease',
                    }}
                  >
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography sx={{ fontWeight: 600, fontSize: '0.95rem', lineHeight: 1.3 }}>
                        {localizedServiceName(service, locale)}
                      </Typography>
                      {description ? (
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ mt: 0.25, fontSize: '0.8rem' }}
                        >
                          {description}
                        </Typography>
                      ) : null}
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{
                          mt: 0.5,
                          fontSize: '0.85rem',
                          fontVariantNumeric: 'tabular-nums',
                        }}
                      >
                        {t('book.durationMinutes', {
                          minutes: formatServiceDurationRange(
                            service.durationMinutes,
                            service.durationMaxMinutes,
                          ),
                        })}{' '}
                        ·{' '}
                        {pricesVisible
                          ? formatServicePriceRange(service.priceCents, service.priceMaxCents)
                          : t('price.onRequest')}
                      </Typography>
                    </Box>
                    <Checkbox
                      checked={selected}
                      tabIndex={-1}
                      readOnly
                      aria-hidden
                      size="small"
                      sx={{ p: 0.25 }}
                    />
                  </Box>
                )
              })}
            </Box>
          </Paper>

          <Paper
            elevation={4}
            sx={{
              position: 'sticky',
              bottom: 12,
              zIndex: 10,
              p: 2,
              borderRadius: 2,
              border: '1px solid',
              borderColor: 'divider',
            }}
            aria-live="polite"
          >
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={1.5}
              sx={{ alignItems: { sm: 'center' }, justifyContent: 'space-between' }}
            >
              <Box>
                <Typography sx={{ fontWeight: 600 }}>
                  {t('book.selectedServicesCount', { count: selectedServices.length })} ·{' '}
                  {t('book.totalDuration', {
                    minutes: formatServiceDurationRange(
                      totalDurationMinutes,
                      totalMaxDurationMinutes,
                    ),
                  })}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {priceSummaryText}
                </Typography>
              </Box>
              <Button
                variant="contained"
                disabled={selectedServices.length === 0}
                onClick={onContinueToDate}
              >
                {t('book.continueToDate')}
              </Button>
            </Stack>
          </Paper>
        </>
      ) : null}

      {step === 2 ? (
        <>
          <Paper sx={{ p: 2 }}>
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={1.5}
              sx={{ alignItems: { sm: 'center' }, justifyContent: 'space-between' }}
            >
              <Box>
                <Typography sx={{ fontWeight: 600 }}>
                  {selectedServices.map((s) => localizedServiceName(s, locale)).join(' + ')}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {t('book.totalDuration', {
                    minutes: formatServiceDurationRange(
                      totalDurationMinutes,
                      totalMaxDurationMinutes,
                    ),
                  })}{' '}
                  · {priceSummaryText}
                </Typography>
              </Box>
              <Button variant="outlined" size="small" onClick={onBackToServices}>
                {t('book.backToServices')}
              </Button>
            </Stack>
          </Paper>

          {employees && employees.length > 0 && onSelectEmployee ? (
            <Paper sx={{ p: { xs: 2, sm: 3 } }} component="section" aria-labelledby="step-employee">
              <Typography id="step-employee" variant="h2" sx={{ fontSize: '1.15rem', mb: 1.5 }}>
                {t('book.employeeTitle')}
              </Typography>
              <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
                <Chip
                  label={t('book.employeeAny')}
                  clickable
                  color={!selectedEmployeeId ? 'primary' : 'default'}
                  variant={!selectedEmployeeId ? 'filled' : 'outlined'}
                  onClick={() => onSelectEmployee(null)}
                />
                {employees.map((emp) => (
                  <Chip
                    key={emp.id}
                    label={emp.displayName}
                    clickable
                    color={selectedEmployeeId === emp.id ? 'primary' : 'default'}
                    variant={selectedEmployeeId === emp.id ? 'filled' : 'outlined'}
                    onClick={() => onSelectEmployee(emp.id)}
                  />
                ))}
              </Stack>
            </Paper>
          ) : null}

          <Paper sx={{ p: { xs: 2, sm: 3 } }} component="section" aria-labelledby="step-date">
            <Typography id="step-date" variant="h2" sx={{ fontSize: '1.15rem', mb: 1.5 }}>
              {t('book.step.date')}
            </Typography>
            <BookingMonthCalendar
              monthAnchorYmd={monthAnchorYmd}
              selectedDate={selectedDate}
              todayYmd={todayYmd}
              availableDates={availableDates}
              loading={rangeLoading}
              error={rangeError}
              onMonthAnchorChange={onMonthAnchorChange}
              onSelectDate={handleSelectDate}
            />
          </Paper>

          {selectedDate !== null ? (
            <Paper
              ref={timeSectionRef}
              sx={{ p: { xs: 2, sm: 3 } }}
              component="section"
              aria-labelledby="step-time"
            >
              <Typography id="step-time" variant="h2" sx={{ fontSize: '1.15rem', mb: 2 }}>
                {t('book.step.time')}
              </Typography>
              {daySlots.length === 0 ? (
                <Alert severity="info">{t('book.noSlotsDay')}</Alert>
              ) : (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {daySlots.map((startAt) => (
                    <Chip
                      key={startAt}
                      label={formatViennaTime(startAt, intlLocale)}
                      clickable
                      color={selectedStartAt === startAt ? 'primary' : 'default'}
                      variant={selectedStartAt === startAt ? 'filled' : 'outlined'}
                      onClick={() => onSelectTime(startAt)}
                    />
                  ))}
                </Box>
              )}
            </Paper>
          ) : null}

          {selectedStartAt !== null ? (
            <>
              <Paper
                sx={{ p: { xs: 2, sm: 3 } }}
                component="section"
                aria-labelledby="step-details"
              >
                <Typography id="step-details" variant="h2" sx={{ fontSize: '1.15rem', mb: 2 }}>
                  {t('book.step.details')}
                </Typography>
                <Stack spacing={2}>
                  <TextField
                    label={t('book.firstName')}
                    value={firstName}
                    onChange={(event) => {
                      setFirstName(event.target.value)
                      setContactIssue(null)
                    }}
                    required
                    fullWidth
                    autoComplete="given-name"
                  />
                  <TextField
                    label={t('book.lastName')}
                    value={lastName}
                    onChange={(event) => {
                      setLastName(event.target.value)
                      setContactIssue(null)
                    }}
                    required
                    fullWidth
                    autoComplete="family-name"
                  />
                  <TextField
                    label={t('book.phone')}
                    value={phone}
                    onChange={(event) => {
                      setPhone(event.target.value)
                      setContactIssue(null)
                    }}
                    required
                    fullWidth
                    autoComplete="tel"
                    helperText={t('book.phoneHelp')}
                  />
                  <TextField
                    label={t('book.email')}
                    type="email"
                    value={email}
                    onChange={(event) => {
                      setEmail(event.target.value)
                      setContactIssue(null)
                    }}
                    required
                    fullWidth
                    autoComplete="email"
                  />
                  <TextField
                    label={t('book.notes')}
                    value={notes}
                    onChange={(event) => {
                      setNotes(event.target.value)
                      setContactIssue(null)
                    }}
                    placeholder={t('book.notesPlaceholder')}
                    multiline
                    minRows={2}
                    fullWidth
                  />
                </Stack>
              </Paper>

              <Paper
                sx={{ p: { xs: 2, sm: 3 } }}
                component="section"
                aria-labelledby="step-confirm"
              >
                <Typography id="step-confirm" variant="h2" sx={{ fontSize: '1.15rem', mb: 2 }}>
                  {t('book.step.confirm')}
                </Typography>
                <Stack spacing={1} sx={{ mb: 2 }}>
                  <Typography sx={{ fontWeight: 600 }}>
                    {selectedServices.map((s) => localizedServiceName(s, locale)).join(' + ')}
                  </Typography>
                  <Typography color="text.secondary">
                    {formatViennaDateTime(selectedStartAt, intlLocale)}
                  </Typography>
                  <Typography color="text.secondary">
                    {t('book.totalDuration', {
                      minutes: formatServiceDurationRange(
                        totalDurationMinutes,
                        totalMaxDurationMinutes,
                      ),
                    })}{' '}
                    · {priceSummaryText}
                  </Typography>
                </Stack>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={privacyAccepted}
                      onChange={(event) => {
                        setPrivacyAccepted(event.target.checked)
                        setContactIssue(null)
                      }}
                    />
                  }
                  label={
                    <>
                      {t('book.privacyBefore')}
                      <Link href={privacyHref} target="_blank" rel="noopener">
                        {t('book.privacyLink')}
                        <Box component="span" sx={screenReaderOnly}>
                          {t('book.opensInNewTab')}
                        </Box>
                      </Link>
                      {t('book.privacyAfter')}
                    </>
                  }
                />
                {contactIssue ? (
                  <Alert severity="error">{t(contactIssueMessages[contactIssue])}</Alert>
                ) : null}
                {submitFailure ? (
                  <Alert severity="error">{t(bookingFailureMessages[submitFailure])}</Alert>
                ) : null}
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ mt: 2 }}>
                  <Button
                    variant="contained"
                    disabled={isSubmitting}
                    onClick={() => {
                      const result = v.safeParse(bookingContactSchema, {
                        firstName: firstName.trim(),
                        lastName: lastName.trim(),
                        phone,
                        email,
                        notes,
                        privacyAccepted: privacyAccepted ? true : false,
                      })
                      if (!result.success) {
                        setContactIssue(bookingContactIssueOf(result.issues))
                        return
                      }
                      setContactIssue(null)
                      onSubmit({
                        firstName: result.output.firstName,
                        lastName: result.output.lastName,
                        phone: result.output.phone,
                        email: result.output.email,
                        notes:
                          result.output.notes && result.output.notes.length > 0
                            ? result.output.notes
                            : null,
                        privacyAccepted: true,
                      })
                    }}
                  >
                    {isSubmitting ? t('book.submitting') : t('book.submit')}
                  </Button>
                  <Button disabled={isSubmitting} onClick={onClearTime}>
                    {t('book.otherTime')}
                  </Button>
                </Stack>
              </Paper>
            </>
          ) : null}
        </>
      ) : null}
    </Stack>
  )
}
