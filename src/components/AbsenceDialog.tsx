import type * as React from 'react'
import { useEffect, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material'

import { IntervalsEditor } from './IntervalsEditor'
import { addCalendarDays } from '../data/calendarMath'
import type { OpeningHoursByWeekday } from '../data/openingHours'
import {
  absenceIssue,
  absenceSaveOf,
  affectedReservations,
  closedRangesOf,
  remainingIntervals,
  type AbsenceDraft,
  type AbsenceIssue,
  type AbsenceKind,
  type AbsenceSave,
} from '../data/openingHoursForm'
import { weeklyIntervalsForDate } from '../data/openingRules'
import type { ReservationWithId } from '../data/reservations'
import type { TimeInterval } from '../data/schemas'
import { useLocale } from '../i18n'

export type AbsenceDialogProps = {
  open: boolean
  todayYmd: string
  weekly: OpeningHoursByWeekday | undefined
  onClose: () => void
  onSubmit: (absence: AbsenceSave) => Promise<void>
  /** Employee copy uses “abwesend/verfügbar” instead of salon “geschlossen/geöffnet”. */
  variant?: 'salon' | 'employee'
  /** When set with draft reservations, shows booking conflict warnings. */
  timeZone?: string
  draftReservations?: ReservationWithId[]
  onDraftDatesChange?: (range: { startYmd: string; endYmd: string } | null) => void
}

const formatHours = (intervals: readonly TimeInterval[]): string =>
  intervals.map((interval) => `${interval.start}–${interval.end}`).join(', ')

const kindOptions: ReadonlyArray<{
  kind: AbsenceKind
  label: 'hours.kindDays' | 'hours.kindMorning' | 'hours.kindAfternoon' | 'hours.kindCustom'
  hint:
    | 'hours.kindDaysHint'
    | 'hours.kindMorningHint'
    | 'hours.kindAfternoonHint'
    | 'hours.kindCustomHint'
}> = [
  { kind: 'days', label: 'hours.kindDays', hint: 'hours.kindDaysHint' },
  { kind: 'morning', label: 'hours.kindMorning', hint: 'hours.kindMorningHint' },
  { kind: 'afternoon', label: 'hours.kindAfternoon', hint: 'hours.kindAfternoonHint' },
  { kind: 'custom', label: 'hours.kindCustom', hint: 'hours.kindCustomHint' },
]

const issueKey = {
  dateRequired: 'hours.dateRequired',
  endBeforeStart: 'hours.endBeforeStart',
  tooLong: 'hours.tooLong',
  intervals: 'hours.checkIntervals',
} as const satisfies Record<AbsenceIssue, string>

export const AbsenceDialog: React.FunctionComponent<AbsenceDialogProps> = ({
  open,
  todayYmd,
  weekly,
  onClose,
  onSubmit,
  variant = 'salon',
  timeZone,
  draftReservations,
  onDraftDatesChange,
}) => {
  const { t } = useLocale()
  const theme = useTheme()
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'))
  const forEmployee = variant === 'employee'
  const [draft, setDraft] = useState<AbsenceDraft>({
    kind: 'days',
    startDate: todayYmd,
    endDate: todayYmd,
    note: '',
    customIntervals: weeklyIntervalsForDate(todayYmd, weekly),
  })
  const [showIssue, setShowIssue] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const issue = absenceIssue(draft)
  const multiDay = draft.kind === 'days'
  const lastDay = multiDay ? draft.endDate : draft.startDate

  useEffect(() => {
    if (!onDraftDatesChange) return
    if (!open || !/^\d{4}-\d{2}-\d{2}$/.test(draft.startDate)) {
      onDraftDatesChange(null)
      return
    }
    const endYmd =
      /^\d{4}-\d{2}-\d{2}$/.test(lastDay) && lastDay >= draft.startDate ? lastDay : draft.startDate
    onDraftDatesChange({ startYmd: draft.startDate, endYmd })
  }, [open, draft.startDate, lastDay, onDraftDatesChange])

  const conflicts =
    issue === null && timeZone && draftReservations
      ? affectedReservations(draftReservations, closedRangesOf(draft, weekly), timeZone)
      : []
  const remaining = !multiDay && issue === null ? remainingIntervals(draft, weekly) : null
  const dayCount = (() => {
    if (!multiDay || issue !== null) return null
    let count = 0
    for (let date = draft.startDate; date <= draft.endDate; date = addCalendarDays(date, 1)) {
      count += 1
    }
    return count
  })()

  const setStartDate = (startDate: string) => {
    setDraft((current) => ({
      ...current,
      startDate,
      endDate: current.endDate < startDate ? startDate : current.endDate,
      customIntervals:
        current.kind === 'custom' && current.startDate === startDate
          ? current.customIntervals
          : weeklyIntervalsForDate(startDate, weekly),
    }))
  }

  return (
    <Dialog
      open={open}
      onClose={submitting ? undefined : onClose}
      fullScreen={fullScreen}
      fullWidth
      maxWidth="sm"
      aria-labelledby="absence-dialog-title"
    >
      <Box
        component="form"
        noValidate
        sx={{ display: 'flex', flexDirection: 'column', minHeight: 0, flex: 1 }}
        onSubmit={(event: React.FormEvent<HTMLFormElement>) => {
          event.preventDefault()
          if (issue) {
            setShowIssue(true)
            return
          }
          setSubmitting(true)
          setSubmitError(null)
          onSubmit(
            absenceSaveOf(
              draft,
              weekly,
              t(forEmployee ? 'admin.employeesDayExceptionDefaultName' : 'hours.defaultName'),
            ),
          )
            .then(onClose)
            .catch((error: unknown) => {
              setSubmitError(error instanceof Error ? error.message : String(error))
            })
            .finally(() => setSubmitting(false))
        }}
      >
        <DialogTitle id="absence-dialog-title">{t('hours.addAbsence')}</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ pt: 0.5 }}>
            <Box>
              <Typography id="absence-kind" sx={{ fontWeight: 600, mb: 1 }}>
                {t('hours.kindQuestion')}
              </Typography>
              <ToggleButtonGroup
                exclusive
                value={draft.kind}
                aria-labelledby="absence-kind"
                onChange={(_, kind: AbsenceKind | null) => {
                  if (!kind) return
                  setDraft((current) => ({
                    ...current,
                    kind,
                    customIntervals:
                      kind === 'custom'
                        ? weeklyIntervalsForDate(current.startDate, weekly)
                        : current.customIntervals,
                  }))
                }}
                sx={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 1,
                  '& .MuiToggleButtonGroup-grouped': {
                    border: 1,
                    borderColor: 'divider',
                    borderRadius: '4px !important',
                    m: 0,
                  },
                }}
              >
                {kindOptions.map((option) => (
                  <ToggleButton
                    key={option.kind}
                    value={option.kind}
                    sx={{
                      flexDirection: 'column',
                      alignItems: 'flex-start',
                      textAlign: 'left',
                      textTransform: 'none',
                      px: 1.5,
                      py: 1.25,
                      '&.Mui-selected': {
                        borderColor: 'primary.main !important',
                        boxShadow: (themeArg) => `inset 0 0 0 1px ${themeArg.palette.primary.main}`,
                      },
                    }}
                  >
                    <Typography sx={{ fontWeight: 600, color: 'text.primary' }}>
                      {t(option.label)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {t(option.hint)}
                    </Typography>
                  </ToggleButton>
                ))}
              </ToggleButtonGroup>
            </Box>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                type="date"
                label={multiDay ? t('hours.firstDay') : t('hours.date')}
                value={draft.startDate}
                onChange={(event) => setStartDate(event.target.value)}
                slotProps={{ inputLabel: { shrink: true }, htmlInput: { min: todayYmd } }}
                fullWidth
              />
              {multiDay ? (
                <TextField
                  type="date"
                  label={t('hours.lastDay')}
                  value={draft.endDate}
                  onChange={(event) =>
                    setDraft((current) => ({ ...current, endDate: event.target.value }))
                  }
                  slotProps={{
                    inputLabel: { shrink: true },
                    htmlInput: { min: draft.startDate || todayYmd },
                  }}
                  helperText={dayCount ? t('hours.dayCount', { count: dayCount }) : ' '}
                  fullWidth
                />
              ) : null}
            </Stack>

            {multiDay ? (
              <TextField
                label={t('hours.note')}
                placeholder={t('hours.notePlaceholder')}
                value={draft.note}
                onChange={(event) =>
                  setDraft((current) => ({ ...current, note: event.target.value }))
                }
                slotProps={{ htmlInput: { maxLength: 120 } }}
              />
            ) : null}

            {draft.kind === 'custom' ? (
              <Box>
                <Typography variant="body2" sx={{ mb: 1.5 }}>
                  {t('hours.customHint')}
                </Typography>
                <IntervalsEditor
                  intervals={draft.customIntervals}
                  label={t('hours.date')}
                  allowEmpty
                  onChange={(customIntervals) =>
                    setDraft((current) => ({ ...current, customIntervals }))
                  }
                />
              </Box>
            ) : null}

            {remaining && draft.kind !== 'custom' ? (
              <Alert severity="info">
                {remaining.length > 0
                  ? t(
                      forEmployee ? 'admin.employeesDayExceptionOpenThen' : 'hours.openThen',
                      { hours: formatHours(remaining) },
                    )
                  : t(forEmployee ? 'admin.employeesDayExceptionAbsentThen' : 'hours.closedThen')}
              </Alert>
            ) : null}

            {conflicts.length > 0 ? (
              <Alert severity="warning">{t('hours.conflicts', { count: conflicts.length })}</Alert>
            ) : null}

            {showIssue && issue ? <Alert severity="error">{t(issueKey[issue])}</Alert> : null}
            {submitError ? (
              <Alert severity="error">{t('admin.saveFailed', { message: submitError })}</Alert>
            ) : null}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, mt: 'auto' }}>
          <Button onClick={onClose} disabled={submitting}>
            {t('hours.dialogCancel')}
          </Button>
          <Button type="submit" variant="contained" disabled={submitting}>
            {submitting ? t('admin.saving') : t('hours.submitAbsence')}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  )
}
