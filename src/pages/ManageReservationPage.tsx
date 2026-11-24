import type * as React from 'react'
import { Alert, Box, Button, CircularProgress, Paper, Stack, Typography } from '@mui/material'

import type { AvailableSlotDto, PublicReservation } from '../data/bookingApi'
import { slotsByDate } from '../data/bookingCalendar'
import { formatViennaDate, formatViennaDateTime, formatViennaTime } from '../data/dateFormat'
import { useLocale } from '../i18n'
import type { MessageKey } from '../i18n'

export type ManageReservationPageProps = {
  reservation: PublicReservation | undefined
  isLoading: boolean
  isError: boolean
  cancelPending: boolean
  reschedulePending: boolean
  actionError: string | null
  rescheduleSlots: AvailableSlotDto[] | undefined
  rescheduleLoading: boolean
  showReschedule: boolean
  onToggleReschedule: () => void
  onCancel: () => void
  onReschedule: (startAt: string) => void
  onHomeClick: () => void
}

function statusLabel(status: string, t: (key: MessageKey) => string): string {
  return t(`status.${status}` as MessageKey)
}

export const ManageReservationPage: React.FunctionComponent<ManageReservationPageProps> = ({
  reservation,
  isLoading,
  isError,
  cancelPending,
  reschedulePending,
  actionError,
  rescheduleSlots,
  rescheduleLoading,
  showReschedule,
  onToggleReschedule,
  onCancel,
  onReschedule,
  onHomeClick,
}) => {
  const { t, intlLocale } = useLocale()
  const canChange = reservation?.status === 'PENDING' || reservation?.status === 'CONFIRMED'
  const rescheduleByDate = slotsByDate(rescheduleSlots ?? [])
  const rescheduleDates = Array.from(rescheduleByDate.keys()).sort()

  return (
    <Stack spacing={3}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h1" gutterBottom>
          {t('manage.title')}
        </Typography>
        <Typography color="text.secondary">{t('manage.subtitle')}</Typography>
      </Paper>

      {isLoading ? <CircularProgress aria-label={t('manage.loading')} /> : null}
      {isError ? <Alert severity="error">{t('manage.notFound')}</Alert> : null}

      {reservation ? (
        <Paper sx={{ p: 3 }}>
          <Stack spacing={1}>
            <Typography sx={{ fontWeight: 600 }}>{reservation.serviceName}</Typography>
            <Typography>{formatViennaDateTime(reservation.startAt, intlLocale)}</Typography>
            <Typography>
              {reservation.firstName} {reservation.lastName} · {reservation.phone}
            </Typography>
            <Typography>
              {t('manage.status', { status: statusLabel(reservation.status, t) })}
            </Typography>
          </Stack>

          {actionError ? (
            <Alert severity="error" sx={{ mt: 2 }}>
              {actionError}
            </Alert>
          ) : null}

          {canChange ? (
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ mt: 3 }}>
              <Button
                variant="outlined"
                onClick={onToggleReschedule}
                disabled={cancelPending || reschedulePending}
              >
                {showReschedule ? t('manage.cancelReschedule') : t('manage.reschedule')}
              </Button>
              <Button
                color="error"
                variant="outlined"
                onClick={onCancel}
                disabled={cancelPending || reschedulePending}
              >
                {cancelPending ? t('manage.cancelling') : t('manage.cancel')}
              </Button>
            </Stack>
          ) : (
            <Alert severity="info" sx={{ mt: 2 }}>
              {t('manage.immutable')}
            </Alert>
          )}
        </Paper>
      ) : null}

      {showReschedule && canChange ? (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h2" sx={{ fontSize: '1.2rem', mb: 2 }}>
            {t('manage.pickTime')}
          </Typography>
          {rescheduleLoading ? <CircularProgress aria-label={t('manage.slotsLoading')} /> : null}
          <Stack spacing={2}>
            {rescheduleDates.map((ymd) => (
              <Box key={ymd}>
                <Typography sx={{ fontWeight: 600, mb: 1 }}>
                  {formatViennaDate(ymd, intlLocale)}
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {(rescheduleByDate.get(ymd) ?? []).map((startAt) => (
                    <Button
                      key={startAt}
                      variant="outlined"
                      disabled={reschedulePending}
                      onClick={() => onReschedule(startAt)}
                    >
                      {formatViennaTime(startAt, intlLocale)}
                    </Button>
                  ))}
                </Box>
              </Box>
            ))}
          </Stack>
          {rescheduleSlots && rescheduleSlots.length === 0 ? (
            <Alert severity="info">{t('manage.noAlternatives')}</Alert>
          ) : null}
        </Paper>
      ) : null}

      <Button onClick={onHomeClick}>{t('manage.home')}</Button>
    </Stack>
  )
}
