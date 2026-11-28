import type * as React from 'react'
import { useMemo, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material'
import LockOutlinedIcon from '@mui/icons-material/LockOutlined'

import { AdminViewSwitch } from '../../components/AdminViewSwitch'
import { CalendarEventDialog } from '../../components/CalendarEventDialog'
import type { BlockedSlotWithId } from '../../data/blockedSlots'
import { formatViennaDateTime } from '../../data/dateFormat'
import { reservationStatusColor } from '../../data/reservationStatus'
import type { ReservationWithId } from '../../data/reservations'
import {
  mergeReservationsAndCalendarEvents,
  type ReservationsListFilter,
} from '../../data/reservationsList'
import { formatBookedTime } from '../../data/weekPlanner'
import { useLocale } from '../../i18n'
import type { MessageKey } from '../../i18n'

export type AdminReservationsPageProps = {
  reservations: ReservationWithId[] | undefined
  blockedSlots?: BlockedSlotWithId[] | undefined
  isLoading: boolean
  isError: boolean
  privacyToggleBusy?: boolean
  privacyToggleError?: string | null
  onSelectReservation: (reservationId: string) => void
  onToggleBlockedSlotPrivacy?: (slotId: string, isPrivate: boolean) => void
  onCalendarClick: () => void
}

export const AdminReservationsPage: React.FunctionComponent<AdminReservationsPageProps> = ({
  reservations,
  blockedSlots,
  isLoading,
  isError,
  privacyToggleBusy = false,
  privacyToggleError = null,
  onSelectReservation,
  onToggleBlockedSlotPrivacy,
  onCalendarClick,
}) => {
  const { t, intlLocale } = useLocale()
  const [filter, setFilter] = useState<ReservationsListFilter>('all')
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null)

  const rows = useMemo(
    () => mergeReservationsAndCalendarEvents(reservations ?? [], blockedSlots ?? [], filter),
    [reservations, blockedSlots, filter],
  )
  const selectedSlot = selectedSlotId
    ? ((blockedSlots ?? []).find((slot) => slot.id === selectedSlotId) ?? null)
    : null

  return (
    <Stack spacing={3}>
      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 2,
          alignItems: 'flex-end',
          justifyContent: 'space-between',
        }}
      >
        <Typography variant="h1">{t('admin.reservations')}</Typography>
        <AdminViewSwitch value="list" onWeekClick={onCalendarClick} onListClick={() => {}} />
      </Box>

      <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
        <Chip
          label={t('admin.reservationsFilterAll')}
          clickable
          color={filter === 'all' ? 'primary' : 'default'}
          variant={filter === 'all' ? 'filled' : 'outlined'}
          onClick={() => setFilter('all')}
        />
        <Chip
          label={t('admin.reservationsFilterSalonFlow')}
          clickable
          color={filter === 'salonflow' ? 'primary' : 'default'}
          variant={filter === 'salonflow' ? 'filled' : 'outlined'}
          onClick={() => setFilter('salonflow')}
        />
        <Chip
          label={t('admin.reservationsFilterGoogle')}
          clickable
          color={filter === 'google' ? 'primary' : 'default'}
          variant={filter === 'google' ? 'filled' : 'outlined'}
          onClick={() => setFilter('google')}
        />
      </Stack>

      {isLoading ? <CircularProgress aria-label={t('admin.loading')} /> : null}
      {isError ? <Alert severity="error">{t('admin.reservationsError')}</Alert> : null}

      {!isLoading && !isError && rows.length === 0 ? (
        <Alert severity="info">{t('admin.noReservations')}</Alert>
      ) : null}

      {rows.length > 0 ? (
        <Paper sx={{ overflowX: 'auto' }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>{t('admin.time')}</TableCell>
                <TableCell>{t('admin.customer')}</TableCell>
                <TableCell>{t('admin.services')}</TableCell>
                <TableCell>{t('admin.status')}</TableCell>
                <TableCell />
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((row) =>
                row.kind === 'reservation' ? (
                  <TableRow key={row.id} hover>
                    <TableCell>{formatViennaDateTime(row.startAt, intlLocale)}</TableCell>
                    <TableCell>
                      {row.reservation.firstName} {row.reservation.lastName}
                    </TableCell>
                    <TableCell>{row.reservation.serviceName}</TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        color={reservationStatusColor[row.reservation.status] ?? 'default'}
                        label={t(`status.${row.reservation.status}` as MessageKey)}
                      />
                    </TableCell>
                    <TableCell>
                      <Button size="small" onClick={() => onSelectReservation(row.reservation.id)}>
                        {t('admin.open')}
                      </Button>
                    </TableCell>
                  </TableRow>
                ) : (
                  <TableRow key={row.id} hover>
                    <TableCell>{formatViennaDateTime(row.startAt, intlLocale)}</TableCell>
                    <TableCell>
                      {row.slot.redacted
                        ? t('admin.googleCalendarPrivateLabel')
                        : row.slot.title ||
                          row.slot.reason ||
                          t('admin.googleCalendarEventFallback')}
                    </TableCell>
                    <TableCell>
                      {row.durationMinutes > 0 ? formatBookedTime(row.durationMinutes) : '—'}
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={0.5} sx={{ flexWrap: 'wrap', gap: 0.5 }}>
                        <Chip
                          size="small"
                          variant="outlined"
                          label={t('admin.googleCalendarEventFallback')}
                        />
                        {row.slot.isPrivate ? (
                          <Chip
                            size="small"
                            icon={<LockOutlinedIcon />}
                            label={t('admin.googleCalendarPrivateLabel')}
                          />
                        ) : null}
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Button size="small" onClick={() => setSelectedSlotId(row.slot.id)}>
                        {t('admin.open')}
                      </Button>
                    </TableCell>
                  </TableRow>
                ),
              )}
            </TableBody>
          </Table>
        </Paper>
      ) : null}

      <CalendarEventDialog
        slot={selectedSlot}
        busy={privacyToggleBusy}
        error={privacyToggleError}
        onClose={() => setSelectedSlotId(null)}
        onTogglePrivacy={onToggleBlockedSlotPrivacy}
      />
    </Stack>
  )
}
