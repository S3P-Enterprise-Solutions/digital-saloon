import type * as React from 'react'
import {
  Alert,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Stack,
  Switch,
  Typography,
} from '@mui/material'
import LockOutlinedIcon from '@mui/icons-material/LockOutlined'

import type { BlockedSlotWithId } from '../data/blockedSlots'
import { formatViennaDateTime, formatViennaTime } from '../data/dateFormat'
import { durationMinutesBetween } from '../data/reservationsList'
import { formatBookedTime } from '../data/weekPlanner'
import { useLocale } from '../i18n'

export type CalendarEventDialogProps = {
  slot: BlockedSlotWithId | null
  busy: boolean
  error: string | null
  onClose: () => void
  onTogglePrivacy?: (slotId: string, isPrivate: boolean) => void
}

export const CalendarEventDialog: React.FunctionComponent<CalendarEventDialogProps> = ({
  slot,
  busy,
  error,
  onClose,
  onTogglePrivacy,
}) => {
  const { t, intlLocale } = useLocale()
  if (!slot) return null

  const isPrivate = Boolean(slot.isPrivate)
  const isRedacted = Boolean(slot.redacted)
  const displayTitle = isRedacted
    ? t('admin.googleCalendarPrivateLabel')
    : slot.title || slot.reason || t('admin.googleCalendarEventFallback')
  const durationMinutes = durationMinutesBetween(slot.startAt, slot.endAt)

  return (
    <Dialog
      open
      onClose={() => {
        if (!busy) onClose()
      }}
      maxWidth="xs"
      fullWidth
      aria-labelledby="calendar-event-dialog-title"
    >
      <DialogTitle id="calendar-event-dialog-title">{displayTitle}</DialogTitle>
      <DialogContent>
        <Stack spacing={1.5} sx={{ pt: 0.5 }}>
          <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
            <Chip size="small" label={t('admin.googleCalendarEventFallback')} variant="outlined" />
            {isPrivate ? (
              <Chip
                size="small"
                icon={<LockOutlinedIcon />}
                label={t('admin.googleCalendarPrivateLabel')}
                color="default"
              />
            ) : null}
          </Stack>

          <Typography variant="body2">
            {formatViennaDateTime(slot.startAt, intlLocale)} –{' '}
            {formatViennaTime(slot.endAt, intlLocale)}
          </Typography>

          {durationMinutes > 0 ? (
            <Typography variant="body2" color="text.secondary">
              {t('admin.googleCalendarEventDuration', {
                duration: formatBookedTime(durationMinutes),
              })}
            </Typography>
          ) : null}

          {!isRedacted && slot.description ? (
            <Stack spacing={0.5}>
              <Typography variant="caption" color="text.secondary">
                {t('admin.googleCalendarEventDescription')}
              </Typography>
              <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                {slot.description}
              </Typography>
            </Stack>
          ) : null}

          {slot.canTogglePrivacy && onTogglePrivacy ? (
            <Stack spacing={0.25} sx={{ pt: 1 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={isPrivate}
                    disabled={busy}
                    onChange={(event) => {
                      onTogglePrivacy(slot.id, event.target.checked)
                    }}
                  />
                }
                label={t('admin.googleCalendarPrivateToggle')}
              />
              <Typography variant="caption" color="text.secondary">
                {t('admin.googleCalendarPrivateHint')}
              </Typography>
            </Stack>
          ) : null}

          {error ? <Alert severity="error">{error}</Alert> : null}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button disabled={busy} onClick={onClose}>
          {t('admin.googleCalendarClose')}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
