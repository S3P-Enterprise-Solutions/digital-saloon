import type * as React from 'react'
import { useState } from 'react'
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material'

import type { AvailableSlotDto } from '../../data/bookingApi'
import { formatViennaDate, formatViennaTime } from '../../data/dateFormat'
import { localizedServiceName } from '../../data/serviceForm'
import type { EmployeeWithId } from '../../data/employees'
import type { ServiceWithId } from '../../data/services'
import { useLocale } from '../../i18n'

export type AdminManualBookingPageProps = {
  services: ServiceWithId[] | undefined
  employees?: EmployeeWithId[]
  selectedEmployeeId?: string | null
  onEmployeeChange?: (employeeId: string | null) => void
  dates: string[]
  selectedServiceId: string | null
  selectedDate: string | null
  /** `HH:MM` picked in the week planner; preselects that slot when it is free. */
  preferredTime: string | null
  slots: AvailableSlotDto[] | undefined
  slotsLoading: boolean
  isSubmitting: boolean
  submitError: string | null
  onBackClick: () => void
  onServiceChange: (serviceId: string) => void
  onDateChange: (dateYmd: string) => void
  onSubmit: (input: {
    serviceId: string
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
  services,
  employees,
  selectedEmployeeId,
  onEmployeeChange,
  dates,
  selectedServiceId,
  selectedDate,
  preferredTime,
  slots,
  slotsLoading,
  isSubmitting,
  submitError,
  onBackClick,
  onServiceChange,
  onDateChange,
  onSubmit,
}) => {
  const { t, locale, intlLocale } = useLocale()
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [internalNote, setInternalNote] = useState('')
  const [pickedStartAt, setStartAt] = useState<string | null>(null)
  const startAt =
    pickedStartAt ??
    slots?.find((slot) => formatViennaTime(slot.startAt, 'de-AT') === preferredTime)?.startAt ??
    null

  return (
    <Stack spacing={3}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h1" gutterBottom>
          {t('admin.manualTitle')}
        </Typography>
        <Typography color="text.secondary">{t('admin.manualSubtitle')}</Typography>
        <Button onClick={onBackClick} sx={{ mt: 2 }}>
          {t('admin.back')}
        </Button>
      </Paper>

      <Paper sx={{ p: 3 }}>
        <Stack spacing={2}>
          <TextField
            select
            label={t('admin.service')}
            value={selectedServiceId ?? ''}
            onChange={(event) => onServiceChange(event.target.value)}
            fullWidth
          >
            {(services ?? []).map((service) => (
              <MenuItem key={service.id} value={service.id}>
                {localizedServiceName(service, locale)}
              </MenuItem>
            ))}
          </TextField>

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

          <Typography variant="subtitle2">{t('admin.dayLabel')}</Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {dates.map((dateYmd) => (
              <Button
                key={dateYmd}
                size="small"
                variant={selectedDate === dateYmd ? 'contained' : 'outlined'}
                onClick={() => {
                  setStartAt(null)
                  onDateChange(dateYmd)
                }}
              >
                {formatViennaDate(dateYmd, intlLocale)}
              </Button>
            ))}
          </Box>

          {selectedDate && selectedServiceId ? (
            <>
              <Typography variant="subtitle2">{t('admin.time')}</Typography>
              {slotsLoading ? <CircularProgress size={24} /> : null}
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {slots?.map((slot) => (
                  <Button
                    key={slot.startAt}
                    size="small"
                    variant={startAt === slot.startAt ? 'contained' : 'outlined'}
                    onClick={() => setStartAt(slot.startAt)}
                  >
                    {formatViennaTime(slot.startAt, intlLocale)}
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
              !selectedServiceId ||
              !startAt ||
              firstName.trim().length === 0 ||
              lastName.trim().length === 0 ||
              phone.trim().length === 0
            }
            onClick={() => {
              if (!selectedServiceId || !startAt) return
              onSubmit({
                serviceId: selectedServiceId,
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
            {isSubmitting ? t('admin.saving') : t('admin.createReservation')}
          </Button>
        </Stack>
      </Paper>
    </Stack>
  )
}
