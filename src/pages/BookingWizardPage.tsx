import type * as React from 'react'
import { useEffect, useMemo, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  FormControlLabel,
  IconButton,
  Paper,
  Stack,
  TextField,
  Typography,
  Link,
} from '@mui/material'
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import ExpandLessIcon from '@mui/icons-material/ExpandLess'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import * as v from 'valibot'

import type { AvailableSlotDto, BookingFailure } from '../data/bookingApi'
import {
  addDays,
  addMonths,
  findEarliestAvailableDate,
  monthMatrix,
  parseYmd,
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
  groupServicesByCategory,
  localizedServiceDescription,
  localizedServiceName,
} from '../data/serviceForm'
import type { EmployeeWithId } from '../data/employees'
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

/** Read by screen readers only (same rules as MUI's `visuallyHidden`). */
const screenReaderOnly = {
  position: 'absolute',
  width: 1,
  height: 1,
  margin: -1,
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
  employees?: EmployeeWithId[]
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
  onWeekAnchorChange: (anchorYmd: string) => void
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
  onWeekAnchorChange,
  onMonthAnchorChange,
  onSubmit,
}) => {
  const { t, locale, intlLocale } = useLocale()
  const pricesVisible = arePricesVisible()

  const [calendarExpanded, setCalendarExpanded] = useState(false)
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [notes, setNotes] = useState('')
  const [privacyAccepted, setPrivacyAccepted] = useState(false)
  const [contactIssue, setContactIssue] = useState<BookingContactIssue | null>(null)

  const weekdays = [
    t('book.weekday.mo'),
    t('book.weekday.tu'),
    t('book.weekday.we'),
    t('book.weekday.th'),
    t('book.weekday.fr'),
    t('book.weekday.sa'),
    t('book.weekday.su'),
  ]

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
  const groupedServices = useMemo(
    () => groupServicesByCategory(services ?? [], locale, t('book.categoryOther')),
    [services, locale, t],
  )

  const byDate = useMemo(() => slotsByDate(rangeSlots ?? []), [rangeSlots])
  const daySlots = selectedDate ? (byDate.get(selectedDate) ?? []) : []
  const todayYmd = viennaTodayYmd()
  const currentWeekDays = useMemo(() => weekDays(weekAnchorYmd), [weekAnchorYmd])
  const { year, monthIndex } = parseYmd(monthAnchorYmd)
  const weeks = monthMatrix(year, monthIndex)
  const monthLabel = new Intl.DateTimeFormat(intlLocale, {
    month: 'long',
    timeZone: 'UTC',
  }).format(new Date(Date.UTC(year, monthIndex, 1)))
  const weekParts = parseYmd(weekAnchorYmd)
  const collapsedMonthLabel = new Intl.DateTimeFormat(intlLocale, {
    month: 'long',
    timeZone: 'UTC',
  }).format(new Date(Date.UTC(weekParts.year, weekParts.monthIndex, 1)))

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
            <Stack spacing={3}>
              {groupedServices.map((group) => (
                <Box key={group.category}>
                  <Typography
                    variant="h3"
                    sx={{ fontSize: '0.95rem', fontWeight: 700, color: 'text.secondary', mb: 1.25 }}
                  >
                    {group.category}
                  </Typography>
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
                    {group.services.map((service) => {
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
                            <Typography
                              sx={{ fontWeight: 600, fontSize: '0.95rem', lineHeight: 1.3 }}
                            >
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
                </Box>
              ))}
            </Stack>
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
            <Stack
              direction="row"
              sx={{ mb: 2, alignItems: 'center', justifyContent: 'space-between' }}
            >
              <IconButton
                size="small"
                aria-label={calendarExpanded ? t('book.monthPrev') : t('book.weekPrev')}
                onClick={() =>
                  calendarExpanded
                    ? onMonthAnchorChange(addMonths(monthAnchorYmd, -1))
                    : onWeekAnchorChange(addDays(weekAnchorYmd, -7))
                }
              >
                <ChevronLeftIcon />
              </IconButton>
              <Button
                color="inherit"
                onClick={() => setCalendarExpanded((prev) => !prev)}
                endIcon={calendarExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                aria-label={
                  calendarExpanded ? t('book.collapseCalendar') : t('book.expandCalendar')
                }
                sx={{ fontWeight: 600, fontSize: '1.05rem', textTransform: 'capitalize' }}
              >
                {calendarExpanded ? monthLabel : collapsedMonthLabel}
              </Button>
              <IconButton
                size="small"
                aria-label={calendarExpanded ? t('book.monthNext') : t('book.weekNext')}
                onClick={() =>
                  calendarExpanded
                    ? onMonthAnchorChange(addMonths(monthAnchorYmd, 1))
                    : onWeekAnchorChange(addDays(weekAnchorYmd, 7))
                }
              >
                <ChevronRightIcon />
              </IconButton>
            </Stack>

            {rangeLoading ? (
              <CircularProgress
                aria-label={t('book.availabilityLoading')}
                size={24}
                sx={{ mb: 2, display: 'block', mx: 'auto' }}
              />
            ) : null}
            {rangeError ? (
              <Alert severity="error" sx={{ mb: 2 }}>
                {t('book.availabilityError')}
              </Alert>
            ) : null}

            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: 'repeat(7, 1fr)',
                gap: 0.5,
                mb: 1,
              }}
            >
              {weekdays.map((label) => (
                <Typography
                  key={label}
                  variant="caption"
                  color="text.secondary"
                  sx={{ textAlign: 'center', fontWeight: 600 }}
                >
                  {label}
                </Typography>
              ))}
            </Box>

            {calendarExpanded ? (
              <Stack spacing={0.5}>
                {weeks.map((week, weekIndex) => (
                  <Box
                    key={weekIndex}
                    sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 0.5 }}
                  >
                    {week.map((ymd, dayIndex) => {
                      if (!ymd) return <Box key={`empty-${weekIndex}-${dayIndex}`} />
                      const available = (byDate.get(ymd)?.length ?? 0) > 0
                      const selected = ymd === selectedDate
                      const past = ymd < todayYmd
                      const disabled = !available || past
                      return (
                        <Button
                          key={ymd}
                          size="small"
                          disabled={disabled}
                          variant="text"
                          onClick={() => onSelectDate(ymd)}
                          sx={{
                            minWidth: 36,
                            width: 36,
                            height: 36,
                            mx: 'auto',
                            p: 0,
                            borderRadius: '50%',
                            fontWeight: selected ? 700 : 400,
                            bgcolor: selected ? 'text.primary' : 'transparent',
                            color: selected ? 'background.paper' : 'text.primary',
                            '&:hover': {
                              bgcolor: selected ? 'text.primary' : 'action.hover',
                            },
                            opacity: disabled ? 0.35 : 1,
                            textDecoration: disabled ? 'line-through' : 'none',
                          }}
                        >
                          {String(parseYmd(ymd).day).padStart(2, '0')}
                        </Button>
                      )
                    })}
                  </Box>
                ))}
              </Stack>
            ) : (
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 0.5 }}>
                {currentWeekDays.map((ymd) => {
                  const available = (byDate.get(ymd)?.length ?? 0) > 0
                  const selected = ymd === selectedDate
                  const past = ymd < todayYmd
                  const disabled = !available || past
                  return (
                    <Button
                      key={ymd}
                      size="small"
                      disabled={disabled}
                      variant="text"
                      onClick={() => onSelectDate(ymd)}
                      sx={{
                        minWidth: 36,
                        width: 36,
                        height: 36,
                        mx: 'auto',
                        p: 0,
                        borderRadius: '50%',
                        fontWeight: selected ? 700 : 400,
                        bgcolor: selected ? 'text.primary' : 'transparent',
                        color: selected ? 'background.paper' : 'text.primary',
                        '&:hover': {
                          bgcolor: selected ? 'text.primary' : 'action.hover',
                        },
                        opacity: disabled ? 0.35 : 1,
                        textDecoration: disabled ? 'line-through' : 'none',
                      }}
                    >
                      {String(parseYmd(ymd).day).padStart(2, '0')}
                    </Button>
                  )
                })}
              </Box>
            )}

            {!rangeLoading && byDate.size === 0 ? (
              <Alert severity="info" sx={{ mt: 2 }}>
                {t('book.noSlotsMonth')}
              </Alert>
            ) : null}
          </Paper>

          {selectedDate !== null ? (
            <Paper sx={{ p: { xs: 2, sm: 3 } }} component="section" aria-labelledby="step-time">
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
