import type * as React from 'react'
import { useMemo, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material'

import { BookingMonthCalendar } from '../../components/BookingMonthCalendar'
import type { AvailableSlotDto } from '../../data/bookingApi'
import { slotsByDate, viennaTodayYmd } from '../../data/bookingCalendar'
import { formatViennaTime } from '../../data/dateFormat'
import type { EmployeeWithId } from '../../data/employees'
import { arePricesVisible } from '../../data/salonConfig'
import { formatServicePriceRange, localizedServiceName } from '../../data/serviceForm'
import type { ServiceWithId } from '../../data/services'
import { useLocale } from '../../i18n'
import { brand } from '../../theme'

export type AdminManualBookingInitialCustomer = {
  firstName: string
  lastName: string
  phone: string
  email: string
  internalNote: string
}

export type AdminManualBookingPageProps = {
  mode: 'create' | 'edit'
  services: ServiceWithId[] | undefined
  employees?: EmployeeWithId[]
  selectedEmployeeId?: string | null
  onEmployeeChange?: (employeeId: string | null) => void
  monthAnchorYmd: string
  monthSlots: AvailableSlotDto[] | undefined
  monthSlotsLoading: boolean
  monthSlotsError: boolean
  selectedServiceIds: string[]
  selectedDate: string | null
  /** `HH:MM` picked in the week planner; preselects that slot when it is free. */
  preferredTime: string | null
  /** Exact ISO start when editing; used if the preferred time chip is not in the free list yet. */
  preferredStartAt: string | null
  initialCustomer: AdminManualBookingInitialCustomer | null
  slots: AvailableSlotDto[] | undefined
  slotsLoading: boolean
  isSubmitting: boolean
  submitError: string | null
  onBackClick: () => void
  onToggleService: (serviceId: string) => void
  onMonthAnchorChange: (anchorYmd: string) => void
  onDateChange: (dateYmd: string) => void
  onSubmit: (input: {
    serviceIds: string[]
    employeeId?: string | null
    startAt: string
    firstName: string
    lastName: string
    phone: string
    email: string | null
    internalNote: string | null
  }) => void
}

export const AdminManualBookingPage: React.FunctionComponent<AdminManualBookingPageProps> = ({
  mode,
  services,
  employees,
  selectedEmployeeId,
  onEmployeeChange,
  monthAnchorYmd,
  monthSlots,
  monthSlotsLoading,
  monthSlotsError,
  selectedServiceIds,
  selectedDate,
  preferredTime,
  preferredStartAt,
  initialCustomer,
  slots,
  slotsLoading,
  isSubmitting,
  submitError,
  onBackClick,
  onToggleService,
  onMonthAnchorChange,
  onDateChange,
  onSubmit,
}) => {
  const { t, locale, intlLocale } = useLocale()
  const [firstName, setFirstName] = useState(initialCustomer?.firstName ?? '')
  const [lastName, setLastName] = useState(initialCustomer?.lastName ?? '')
  const [phone, setPhone] = useState(initialCustomer?.phone ?? '')
  const [email, setEmail] = useState(initialCustomer?.email ?? '')
  const [internalNote, setInternalNote] = useState(initialCustomer?.internalNote ?? '')
  const [pickedStartAt, setStartAt] = useState<string | null>(null)
  const preferredMatchStartAt =
    slots?.find((slot) => formatViennaTime(slot.startAt, 'de-AT') === preferredTime)?.startAt ??
    null
  const nextFreeStartAt = slots?.[0]?.startAt ?? null
  // Edit: keep the booking's own start even if it is missing from the free-slot list
  // (e.g. after a duration change) so saving customer fields cannot silently move time.
  const startAt =
    pickedStartAt ??
    preferredMatchStartAt ??
    (mode === 'edit' ? preferredStartAt : null) ??
    (mode === 'create' ? nextFreeStartAt : null)
  const showsNextFreeSuggestion =
    mode === 'create' &&
    startAt !== null &&
    nextFreeStartAt !== null &&
    startAt === nextFreeStartAt &&
    pickedStartAt === null &&
    preferredMatchStartAt === null

  const selectedServices = useMemo(
    () => (services ?? []).filter((service) => selectedServiceIds.includes(service.id)),
    [services, selectedServiceIds],
  )
  const totalDurationMinutes = selectedServices.reduce(
    (sum, service) => sum + service.durationMinutes,
    0,
  )
  const pricesVisible = arePricesVisible()
  const todayYmd = viennaTodayYmd()
  const availableDates = useMemo(
    () => (selectedServiceIds.length > 0 ? new Set(slotsByDate(monthSlots ?? []).keys()) : null),
    [selectedServiceIds, monthSlots],
  )

  return (
    <Stack spacing={3}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h1" gutterBottom>
          {mode === 'edit' ? t('admin.editReservationTitle') : t('admin.manualTitle')}
        </Typography>
        <Typography color="text.secondary">
          {mode === 'edit' ? t('admin.editReservationSubtitle') : t('admin.manualSubtitle')}
        </Typography>
        <Button onClick={onBackClick} sx={{ mt: 2 }}>
          {t('admin.back')}
        </Button>
      </Paper>

      <Paper sx={{ p: 3 }}>
        <Stack spacing={2}>
          <Typography variant="subtitle2">{t('admin.services')}</Typography>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))' },
              gap: 1,
            }}
          >
            {(services ?? []).map((service) => {
              const selected = selectedServiceIds.includes(service.id)
              return (
                <Box
                  key={service.id}
                  component="button"
                  type="button"
                  aria-pressed={selected}
                  onClick={() => {
                    setStartAt(null)
                    onToggleService(service.id)
                  }}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 1,
                    textAlign: 'left',
                    cursor: 'pointer',
                    borderRadius: 1.5,
                    border: '1.5px solid',
                    borderColor: selected ? 'primary.main' : 'divider',
                    bgcolor: selected ? brand.stone : 'background.paper',
                    px: 1.25,
                    py: 1,
                    font: 'inherit',
                    color: 'inherit',
                    width: '100%',
                  }}
                >
                  <Box sx={{ minWidth: 0 }}>
                    <Typography sx={{ fontWeight: 600, fontSize: '0.9rem', lineHeight: 1.3 }}>
                      {localizedServiceName(service, locale)}
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ fontSize: '0.8rem', fontVariantNumeric: 'tabular-nums' }}
                    >
                      {t('book.durationMinutes', { minutes: service.durationMinutes })}
                      {pricesVisible
                        ? ` · ${formatServicePriceRange(service.priceCents, service.priceMaxCents)}`
                        : ''}
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

          {selectedServiceIds.length > 0 ? (
            <Typography variant="body2" color="text.secondary">
              {t('book.selectedServicesCount', { count: selectedServiceIds.length })} ·{' '}
              {t('book.totalDuration', { minutes: totalDurationMinutes })}
            </Typography>
          ) : null}

          {employees && employees.length > 0 && onEmployeeChange ? (
            <TextField
              select
              label={t('book.employeeTitle')}
              value={selectedEmployeeId ?? ''}
              onChange={(event) => onEmployeeChange(event.target.value || null)}
              fullWidth
            >
              <MenuItem value="">{t('book.employeeAny')}</MenuItem>
              {employees.map((emp) => (
                <MenuItem key={emp.id} value={emp.id}>
                  {emp.displayName}
                </MenuItem>
              ))}
            </TextField>
          ) : null}

          <Paper
            variant="outlined"
            component="section"
            aria-labelledby="admin-manual-date"
            sx={{ p: { xs: 2, sm: 3 }, maxWidth: 640 }}
          >
            <Typography id="admin-manual-date" variant="h2" sx={{ fontSize: '1.15rem', mb: 1.5 }}>
              {t('book.step.date')}
            </Typography>
            <BookingMonthCalendar
              monthAnchorYmd={monthAnchorYmd}
              selectedDate={selectedDate}
              todayYmd={todayYmd}
              availableDates={availableDates}
              loading={monthSlotsLoading}
              error={monthSlotsError}
              onMonthAnchorChange={(anchorYmd) => {
                setStartAt(null)
                onMonthAnchorChange(anchorYmd)
              }}
              onSelectDate={(dateYmd) => {
                setStartAt(null)
                onDateChange(dateYmd)
              }}
            />
          </Paper>

          {selectedDate && selectedServiceIds.length > 0 ? (
            <>
              <Typography variant="subtitle2">{t('admin.timeFreeLabel')}</Typography>
              {slotsLoading ? <CircularProgress size={24} /> : null}
              {showsNextFreeSuggestion ? (
                <Alert severity="info" sx={{ py: 0.5 }}>
                  {t('admin.nextFreeSlotHint')}
                </Alert>
              ) : null}
              {mode === 'edit' &&
              startAt &&
              slots &&
              !slots.some((slot) => slot.startAt === startAt) ? (
                <Alert severity="info" sx={{ py: 0.5 }}>
                  {t('admin.currentSlotKept', {
                    time: formatViennaTime(startAt, intlLocale),
                  })}
                </Alert>
              ) : null}
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {slots?.map((slot, index) => (
                  <Button
                    key={slot.startAt}
                    size="small"
                    variant={startAt === slot.startAt ? 'contained' : 'outlined'}
                    onClick={() => setStartAt(slot.startAt)}
                    sx={{ gap: 0.75 }}
                  >
                    {formatViennaTime(slot.startAt, intlLocale)}
                    {index === 0 ? (
                      <Chip
                        size="small"
                        label={t('admin.nextFreeSlotTag')}
                        color={startAt === slot.startAt ? 'default' : 'primary'}
                        variant={startAt === slot.startAt ? 'filled' : 'outlined'}
                        sx={{
                          height: 20,
                          fontSize: '0.7rem',
                          bgcolor: startAt === slot.startAt ? 'rgba(255,255,255,0.22)' : undefined,
                          color: startAt === slot.startAt ? 'inherit' : undefined,
                          '& .MuiChip-label': { px: 0.75 },
                        }}
                      />
                    ) : null}
                  </Button>
                ))}
              </Box>
              {slots && slots.length === 0 ? (
                <Alert severity="info">{t('admin.noSlots')}</Alert>
              ) : null}
            </>
          ) : null}

          <TextField
            label={t('book.firstName')}
            value={firstName}
            onChange={(event) => setFirstName(event.target.value)}
            required
            fullWidth
          />
          <TextField
            label={t('book.lastName')}
            value={lastName}
            onChange={(event) => setLastName(event.target.value)}
            required
            fullWidth
          />
          <TextField
            label={t('book.phone')}
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            required
            fullWidth
          />
          <TextField
            label={t('admin.emailOptional')}
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            fullWidth
          />
          <TextField
            label={t('admin.noteOptional')}
            value={internalNote}
            onChange={(event) => setInternalNote(event.target.value)}
            fullWidth
            multiline
            minRows={2}
          />

          {submitError ? <Alert severity="error">{submitError}</Alert> : null}

          <Button
            variant="contained"
            disabled={
              isSubmitting ||
              selectedServiceIds.length === 0 ||
              !startAt ||
              firstName.trim().length === 0 ||
              lastName.trim().length === 0 ||
              phone.trim().length === 0
            }
            onClick={() => {
              if (selectedServiceIds.length === 0 || !startAt) return
              onSubmit({
                serviceIds: selectedServiceIds,
                ...(selectedEmployeeId ? { employeeId: selectedEmployeeId } : {}),
                startAt,
                firstName: firstName.trim(),
                lastName: lastName.trim(),
                phone: phone.trim(),
                email: email.trim().length > 0 ? email.trim() : null,
                internalNote: internalNote.trim().length > 0 ? internalNote.trim() : null,
              })
            }}
          >
            {isSubmitting
              ? t('admin.saving')
              : mode === 'edit'
                ? t('admin.saveReservation')
                : t('admin.createReservation')}
          </Button>
        </Stack>
      </Paper>
    </Stack>
  )
}
