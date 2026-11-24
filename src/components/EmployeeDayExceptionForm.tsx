import type * as React from 'react'
import { useState } from 'react'
import { Alert, Box, Button, IconButton, Stack, Typography } from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined'

import { AbsenceDialog } from './AbsenceDialog'
import { translateEmployeeCallableError } from '../data/employeeCallableErrors'
import { employeeDayExceptionsOf } from '../data/employeeAbsenceSave'
import type { EmployeeDayExceptionWithId } from '../data/employeeSchedule'
import type { OpeningHoursByWeekday } from '../data/openingHours'
import type { AbsenceSave } from '../data/openingHoursForm'
import type { TimeInterval } from '../data/schemas'
import { useLocale } from '../i18n'

export type EmployeeDayExceptionFormProps = {
  todayYmd: string
  weekly: OpeningHoursByWeekday | undefined
  weeklyLoading?: boolean
  exceptions: EmployeeDayExceptionWithId[] | undefined
  exceptionsLoading: boolean
  exceptionsError: boolean
  busy: boolean
  disabled?: boolean
  onSave: (input: {
    exceptionId: string
    date: string
    closed: boolean
    intervals?: TimeInterval[]
  }) => Promise<void>
  onDelete: (exceptionId: string) => Promise<void>
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
  }
}

export const EmployeeDayExceptionForm: React.FunctionComponent<EmployeeDayExceptionFormProps> = ({
  todayYmd,
  weekly,
  weeklyLoading = false,
  exceptions,
  exceptionsLoading,
  exceptionsError,
  busy,
  disabled = false,
  onSave,
  onDelete,
}) => {
  const { t } = useLocale()
  const formatDate = useDateFormatters()
  const [dialogKey, setDialogKey] = useState<number | null>(null)
  const [listError, setListError] = useState<string | null>(null)

  const sorted = exceptions?.slice().sort((a, b) => a.date.localeCompare(b.date)) ?? []

  const handleAddAbsence = async (absence: AbsenceSave) => {
    const items = employeeDayExceptionsOf(absence)
    for (const item of items) {
      await onSave(item)
    }
  }

  return (
    <Stack spacing={1.5}>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={1.5}
        sx={{ justifyContent: 'flex-end', alignItems: { sm: 'flex-start' } }}
      >
        <Button
          variant="outlined"
          startIcon={<AddIcon />}
          disabled={busy || disabled || weeklyLoading}
          onClick={() => setDialogKey(Date.now())}
          sx={{ alignSelf: { xs: 'stretch', sm: 'flex-start' } }}
        >
          {t('hours.addAbsence')}
        </Button>
      </Stack>

      {exceptionsLoading ? (
        <Typography variant="body2" color="text.secondary">
          {t('admin.openingHoursLoading')}
        </Typography>
      ) : null}
      {exceptionsError ? <Alert severity="error">{t('admin.openingHoursError')}</Alert> : null}
      {listError ? <Alert severity="error">{listError}</Alert> : null}
      {sorted.length > 0 ? (
        <Stack component="ul" spacing={0} sx={{ listStyle: 'none', m: 0, p: 0 }}>
          {sorted.map((exception) => {
            const title = formatDate.date(exception.date)
            const detail = exception.closed
              ? t('admin.employeesDayExceptionAllDay')
              : t('admin.employeesDayExceptionPartial', {
                  hours: formatHours(exception.intervals),
                })
            return (
              <Box
                component="li"
                key={exception.id}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  py: 1.25,
                  borderBottom: 1,
                  borderColor: 'divider',
                }}
              >
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography sx={{ fontWeight: 600 }}>{title}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {detail}
                  </Typography>
                </Box>
                <IconButton
                  size="small"
                  aria-label={`${t('hours.deleteAbsence')}: ${title}`}
                  disabled={busy || disabled}
                  onClick={() => {
                    setListError(null)
                    void onDelete(exception.id).catch((err: unknown) => {
                      setListError(translateEmployeeCallableError(err, t))
                    })
                  }}
                >
                  <DeleteOutlinedIcon fontSize="small" />
                </IconButton>
              </Box>
            )
          })}
        </Stack>
      ) : !exceptionsLoading && !exceptionsError ? (
        <Typography variant="body2" color="text.secondary">
          {t('hours.absencesEmpty')}
        </Typography>
      ) : null}

      {dialogKey !== null ? (
        <AbsenceDialog
          key={dialogKey}
          open
          todayYmd={todayYmd}
          weekly={weekly}
          variant="employee"
          onClose={() => setDialogKey(null)}
          onSubmit={handleAddAbsence}
        />
      ) : null}
    </Stack>
  )
}
