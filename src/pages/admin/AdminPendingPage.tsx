import type * as React from 'react'
import { Alert, Box, Button, CircularProgress, Paper, Stack, Typography } from '@mui/material'

import { formatViennaDateTime } from '../../data/dateFormat'
import type { ReservationWithId } from '../../data/reservations'
import { useLocale } from '../../i18n'
import { PendingItem } from './AdminPendingPage.styles'

export type AdminPendingPageProps = {
  pending: ReservationWithId[] | undefined
  isLoading: boolean
  isError: boolean
  confirmingReservationId: string | null
  confirmError: string | null
  onConfirmReservation: (reservationId: string) => void
  onOpenReservationDetails: (reservationId: string) => void
}

export const AdminPendingPage: React.FunctionComponent<AdminPendingPageProps> = ({
  pending,
  isLoading,
  isError,
  confirmingReservationId,
  confirmError,
  onConfirmReservation,
  onOpenReservationDetails,
}) => {
  const { t, intlLocale } = useLocale()

  return (
    <Stack spacing={3}>
      <Typography variant="h1">
        {t('admin.statPending')}
        {pending && pending.length > 0 ? (
          <Box component="span" sx={{ color: 'text.secondary', fontWeight: 400, ml: 1 }}>
            {pending.length}
          </Box>
        ) : null}
      </Typography>

      {isLoading ? <CircularProgress aria-label={t('admin.loading')} /> : null}
      {isError ? <Alert severity="error">{t('admin.reservationsError')}</Alert> : null}
      {confirmError ? <Alert severity="error">{confirmError}</Alert> : null}

      {!isLoading && !isError && pending && pending.length === 0 ? (
        <Typography color="text.secondary">{t('admin.pendingEmpty')}</Typography>
      ) : null}

      {pending && pending.length > 0 ? (
        <Paper component="section" aria-label={t('admin.statPending')} sx={{ p: { xs: 2, sm: 3 } }}>
          <Box
            component="ul"
            sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 340px), 1fr))',
              gap: { xs: 2, sm: 2.5 },
              listStyle: 'none',
              m: 0,
              p: 0,
            }}
          >
            {pending.map((reservation) => (
              <PendingItem key={reservation.id}>
                <Box sx={{ minWidth: 0, maxWidth: '100%' }}>
                  <Typography sx={{ fontWeight: 600 }}>
                    {reservation.firstName} {reservation.lastName}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {formatViennaDateTime(reservation.startAt, intlLocale)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" noWrap>
                    {reservation.serviceName}
                  </Typography>
                </Box>
                <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                  <Button
                    size="small"
                    variant="contained"
                    disabled={confirmingReservationId !== null}
                    aria-busy={confirmingReservationId === reservation.id}
                    onClick={() => onConfirmReservation(reservation.id)}
                  >
                    {t('admin.confirm')}
                  </Button>
                  <Button size="small" onClick={() => onOpenReservationDetails(reservation.id)}>
                    {t('admin.open')}
                  </Button>
                </Stack>
              </PendingItem>
            ))}
          </Box>
        </Paper>
      ) : null}
    </Stack>
  )
}
