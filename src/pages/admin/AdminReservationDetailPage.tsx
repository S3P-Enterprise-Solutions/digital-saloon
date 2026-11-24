import type * as React from 'react'
import { useState } from 'react'
import {
  Alert,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Paper,
  Stack,
  Typography,
} from '@mui/material'

import { formatViennaDateTime } from '../../data/dateFormat'
import { reservationStatusColor } from '../../data/reservationStatus'
import type { ReservationWithId } from '../../data/reservations'
import { useLocale } from '../../i18n'
import type { MessageKey } from '../../i18n'

export type AdminReservationDetailPageProps = {
  reservation: ReservationWithId | undefined
  isLoading: boolean
  actionError: string | null
  busy: boolean
  backLabel: string
  onBackClick: () => void
  onConfirm: () => void
  onDecline: () => void
  onCancel: () => void
  onComplete: () => void
  onEditClick: () => void
}

export const AdminReservationDetailPage: React.FunctionComponent<
  AdminReservationDetailPageProps
> = ({
  reservation,
  isLoading,
  actionError,
  busy,
  backLabel,
  onBackClick,
  onConfirm,
  onDecline,
  onCancel,
  onComplete,
  onEditClick,
}) => {
  const { t, intlLocale } = useLocale()
  const [confirmAction, setConfirmAction] = useState<'cancel' | 'decline' | null>(null)

  return (
    <Stack spacing={3}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h1" gutterBottom>
          {t('admin.detailTitle')}
        </Typography>
        <Button onClick={onBackClick}>{backLabel}</Button>
      </Paper>

      {isLoading ? <CircularProgress aria-label={t('admin.detailLoading')} /> : null}
      {!isLoading && !reservation ? <Alert severity="error">{t('admin.notFound')}</Alert> : null}

      {reservation ? (
        <Paper sx={{ p: 3 }}>
          <Stack spacing={1}>
            <Chip
              size="small"
              sx={{ alignSelf: 'flex-start' }}
              color={reservationStatusColor[reservation.status] ?? 'default'}
              label={t(`status.${reservation.status}` as MessageKey)}
            />
            <Typography sx={{ fontWeight: 600 }}>{reservation.serviceName}</Typography>
            <Typography>{formatViennaDateTime(reservation.startAt, intlLocale)}</Typography>
            <Typography>
              {reservation.firstName} {reservation.lastName}
            </Typography>
            <Typography>{reservation.phone}</Typography>
            {reservation.email ? <Typography>{reservation.email}</Typography> : null}
            {reservation.notes ? (
              <Typography variant="body2">
                {t('admin.customerNotes', { notes: reservation.notes })}
              </Typography>
            ) : null}
            <Typography variant="body2" color="text.secondary">
              {t('admin.source', { source: reservation.source })}
            </Typography>
            {reservation.internalNote ? (
              <Typography variant="body2">
                {t('admin.note', { note: reservation.internalNote })}
              </Typography>
            ) : null}
          </Stack>

          {actionError ? (
            <Alert severity="error" sx={{ mt: 2 }}>
              {actionError}
            </Alert>
          ) : null}

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ mt: 3 }}>
            {reservation.status === 'PENDING' || reservation.status === 'CONFIRMED' ? (
              <Button variant="outlined" disabled={busy} onClick={onEditClick}>
                {t('admin.reschedule')}
              </Button>
            ) : null}
            {reservation.status === 'PENDING' ? (
              <>
                <Button variant="contained" disabled={busy} onClick={onConfirm}>
                  {t('admin.confirm')}
                </Button>
                <Button
                  color="error"
                  variant="outlined"
                  disabled={busy}
                  onClick={() => setConfirmAction('decline')}
                >
                  {t('admin.decline')}
                </Button>
              </>
            ) : null}
            {reservation.status === 'CONFIRMED' ? (
              <Button variant="contained" disabled={busy} onClick={onComplete}>
                {t('admin.complete')}
              </Button>
            ) : null}
            {reservation.status === 'PENDING' || reservation.status === 'CONFIRMED' ? (
              <Button color="error" disabled={busy} onClick={() => setConfirmAction('cancel')}>
                {t('admin.cancel')}
              </Button>
            ) : null}
          </Stack>
        </Paper>
      ) : null}

      <Dialog
        open={confirmAction !== null}
        onClose={() => {
          if (!busy) setConfirmAction(null)
        }}
        aria-labelledby="admin-confirm-dialog-title"
      >
        <DialogTitle id="admin-confirm-dialog-title">
          {confirmAction === 'decline'
            ? t('admin.declineConfirmTitle')
            : t('admin.cancelConfirmTitle')}
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            {confirmAction === 'decline'
              ? t('admin.declineConfirmBody')
              : t('admin.cancelConfirmBody')}
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            disabled={busy}
            onClick={() => {
              setConfirmAction(null)
            }}
          >
            {t('admin.dialogDismiss')}
          </Button>
          <Button
            color="error"
            variant="contained"
            disabled={busy}
            onClick={() => {
              if (confirmAction === 'decline') onDecline()
              if (confirmAction === 'cancel') onCancel()
              setConfirmAction(null)
            }}
          >
            {confirmAction === 'decline'
              ? t('admin.declineConfirmAction')
              : t('admin.cancelConfirmAction')}
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  )
}
