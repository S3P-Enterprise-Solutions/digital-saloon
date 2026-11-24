import type * as React from 'react'
import { useEffect, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Paper,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined'

import { IntervalsEditor } from '../../components/IntervalsEditor'
import { WeeklyHoursForm, type HoursSaveState } from '../../components/WeeklyHoursForm'
import { addCalendarDays } from '../../data/calendarMath'
import type { OpeningHoursByWeekday } from '../../data/openingHours'
import {
  absenceIssue,
  absenceSaveOf,
  affectedReservations,
  closedRangesOf,
  remainingIntervals,
  weeklyDraftOf,
  type AbsenceDraft,
  type WeeklyDraft,
  type AbsenceIssue,
  type AbsenceKind,
  type AbsenceSave,
  type UpcomingAbsence,
} from '../../data/openingHoursForm'
import { weeklyIntervalsForDate } from '../../data/openingRules'
import type { ReservationWithId } from '../../data/reservations'
import type { TimeInterval } from '../../data/schemas'
import { useLocale } from '../../i18n'

export type { HoursSaveState }

export type AdminOpeningHoursPageProps = {
  todayYmd: string
  timeZone: string
  weekly: OpeningHoursByWeekday | undefined
  weeklyLoading: boolean
  weeklyError: boolean
  weeklySave: HoursSaveState
  onSaveWeekly: (draft: WeeklyDraft) => void
  absences: UpcomingAbsence[] | undefined
  absencesLoading: boolean
  absencesError: boolean
  deletingAbsenceId: string | null
  onDeleteAbsence: (absence: { type: UpcomingAbsence['type']; id: string }) => void
  /** Bookings for the dates the open absence dialog covers (to warn about conflicts). */
  draftReservations: ReservationWithId[] | undefined
  onDraftDatesChange: (range: { startYmd: string; endYmd: string } | null) => void
  onAddAbsence: (absence: AbsenceSave) => Promise<void>
  onBackClick: () => void
}

const formatHours = (intervals: readonly TimeInterval[]): string =>
  intervals.map((interval) => `${interval.start}–${interval.end}`).join(', ')

function useDateFormatters() {
  const { intlLocale } = useLocale()
  const format = new Intl.DateTimeFormat(intlLocale, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  })
  const toDate = (ymd: string) => new Date(`${ymd}T12:00:00.000Z`)
  return {
    date: (ymd: string) => format.format(toDate(ymd)),
    range: (startYmd: string, endYmd: string) =>
      startYmd === endYmd
        ? format.format(toDate(startYmd))
        : format.formatRange(toDate(startYmd), toDate(endYmd)),
  }
}

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

type AbsenceDialogProps = {
  open: boolean
  todayYmd: string
  timeZone: string
  weekly: OpeningHoursByWeekday | undefined
  draftReservations: ReservationWithId[] | undefined
  onDraftDatesChange: (range: { startYmd: string; endYmd: string } | null) => void
  onClose: () => void
  onSubmit: (absence: AbsenceSave) => Promise<void>
}

const AbsenceDialog: React.FunctionComponent<AbsenceDialogProps> = ({
  open,
  todayYmd,
  timeZone,
  weekly,
  draftReservations,
  onDraftDatesChange,
  onClose,
  onSubmit,
}) => {
  const { t } = useLocale()
  const theme = useTheme()
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'))
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
    if (!open || !/^\d{4}-\d{2}-\d{2}$/.test(draft.startDate)) {
      onDraftDatesChange(null)
      return
    }
    const endYmd =
      /^\d{4}-\d{2}-\d{2}$/.test(lastDay) && lastDay >= draft.startDate ? lastDay : draft.startDate
    onDraftDatesChange({ startYmd: draft.startDate, endYmd })
  }, [open, draft.startDate, lastDay, onDraftDatesChange])

  const conflicts =
    issue === null && draftReservations
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
      // Keep the range valid while picking: a later start pulls the end along.
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
          onSubmit(absenceSaveOf(draft, weekly, t('hours.defaultName')))
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
                  ? t('hours.openThen', { hours: formatHours(remaining) })
                  : t('hours.closedThen')}
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

export const AdminOpeningHoursPage: React.FunctionComponent<AdminOpeningHoursPageProps> = ({
  todayYmd,
  timeZone,
  weekly,
  weeklyLoading,
  weeklyError,
  weeklySave,
  onSaveWeekly,
  absences,
  absencesLoading,
  absencesError,
  deletingAbsenceId,
  onDeleteAbsence,
  draftReservations,
  onDraftDatesChange,
  onAddAbsence,
  onBackClick,
}) => {
  const { t } = useLocale()
  const formatDate = useDateFormatters()
  // Remount the dialog per opening so it starts fresh.
  const [dialogKey, setDialogKey] = useState<number | null>(null)

  return (
    <Stack spacing={4} sx={{ maxWidth: 860 }}>
      <Box>
        <Button onClick={onBackClick} sx={{ ml: -1, mb: 1 }}>
          {t('admin.backToSettings')}
        </Button>
        <Typography variant="h1">{t('hours.title')}</Typography>
        <Typography color="text.secondary" sx={{ mt: 0.5 }}>
          {t('hours.subtitle')}
        </Typography>
      </Box>

      <Paper component="section" aria-labelledby="hours-absences" sx={{ p: { xs: 2, sm: 3 } }}>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={2}
          sx={{ justifyContent: 'space-between', alignItems: { sm: 'flex-start' }, mb: 2 }}
        >
          <Box>
            <Typography id="hours-absences" variant="h2" sx={{ mb: 0.5 }}>
              {t('hours.absencesTitle')}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t('hours.absencesHint')}
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            disabled={weeklyLoading}
            onClick={() => setDialogKey(Date.now())}
            sx={{ whiteSpace: 'nowrap', alignSelf: { xs: 'stretch', sm: 'flex-start' } }}
          >
            {t('hours.addAbsence')}
          </Button>
        </Stack>

        {absencesLoading ? <CircularProgress aria-label={t('admin.loading')} /> : null}
        {absencesError ? <Alert severity="error">{t('hours.absencesError')}</Alert> : null}
        {absences && absences.length === 0 ? (
          <Typography color="text.secondary">{t('hours.absencesEmpty')}</Typography>
        ) : null}
        {absences && absences.length > 0 ? (
          <Stack component="ul" sx={{ listStyle: 'none', m: 0, p: 0 }}>
            {absences.map((absence) => {
              const title =
                absence.type === 'holiday'
                  ? formatDate.range(absence.startDate, absence.endDate)
                  : formatDate.date(absence.date)
              const detail =
                absence.type === 'holiday'
                  ? absence.name
                  : absence.closed
                    ? t('hours.closedAllDay')
                    : t('hours.openOnly', { hours: formatHours(absence.intervals) })
              return (
                <Box
                  component="li"
                  key={`${absence.type}-${absence.id}`}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                    py: 1.5,
                    borderTop: 1,
                    borderColor: 'divider',
                    '&:first-of-type': { borderTop: 0, pt: 0 },
                  }}
                >
                  <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                    <Typography sx={{ fontWeight: 600 }}>{title}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {detail}
                    </Typography>
                  </Box>
                  <IconButton
                    aria-label={`${t('hours.deleteAbsence')}: ${title}`}
                    disabled={deletingAbsenceId === absence.id}
                    onClick={() => onDeleteAbsence({ type: absence.type, id: absence.id })}
                  >
                    <DeleteOutlinedIcon />
                  </IconButton>
                </Box>
              )
            })}
          </Stack>
        ) : null}
      </Paper>

      <Paper component="section" aria-labelledby="hours-weekly" sx={{ p: { xs: 2, sm: 3 } }}>
        <Typography id="hours-weekly" variant="h2" sx={{ mb: 0.5 }}>
          {t('hours.weeklyTitle')}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
          {t('hours.weeklyHint')}
        </Typography>
        {weeklyLoading ? <CircularProgress aria-label={t('admin.openingHoursLoading')} /> : null}
        {weeklyError ? <Alert severity="error">{t('admin.openingHoursError')}</Alert> : null}
        {!weeklyLoading && !weeklyError ? (
          <WeeklyHoursForm
            initial={weeklyDraftOf(weekly)}
            save={weeklySave}
            onSave={onSaveWeekly}
          />
        ) : null}
      </Paper>

      {dialogKey !== null ? (
        <AbsenceDialog
          key={dialogKey}
          open
          todayYmd={todayYmd}
          timeZone={timeZone}
          weekly={weekly}
          draftReservations={draftReservations}
          onDraftDatesChange={onDraftDatesChange}
          onClose={() => {
            setDialogKey(null)
            onDraftDatesChange(null)
          }}
          onSubmit={onAddAbsence}
        />
      ) : null}
    </Stack>
  )
}
