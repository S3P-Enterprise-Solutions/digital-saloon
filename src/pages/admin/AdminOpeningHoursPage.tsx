import type * as React from 'react'
import { useState } from 'react'
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  IconButton,
  Paper,
  Stack,
  Typography,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined'

import { AbsenceDialog } from '../../components/AbsenceDialog'
import { WeeklyHoursForm, type HoursSaveState } from '../../components/WeeklyHoursForm'
import type { OpeningHoursByWeekday } from '../../data/openingHours'
import {
  weeklyDraftOf,
  type AbsenceSave,
  type UpcomingAbsence,
  type WeeklyDraft,
} from '../../data/openingHoursForm'
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
