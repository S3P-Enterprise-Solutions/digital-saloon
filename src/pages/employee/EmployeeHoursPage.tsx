import type * as React from 'react'
import { Alert, Box, CircularProgress, Typography } from '@mui/material'

import { EmployeeDayExceptionForm } from '../../components/EmployeeDayExceptionForm'
import { WeeklyHoursForm, type HoursSaveState } from '../../components/WeeklyHoursForm'
import type { EmployeeDayExceptionWithId } from '../../data/employeeSchedule'
import { weeklyDraftOf, type WeeklyDraft } from '../../data/openingHoursForm'
import type { EmployeeWorkingHoursByWeekday } from '../../data/employeeSchedule'
import type { TimeInterval } from '../../data/schemas'
import { useLocale } from '../../i18n'

export type EmployeeHoursPageProps = {
  todayYmd: string
  employeeWeekly: EmployeeWorkingHoursByWeekday | undefined
  employeeWeeklyLoading: boolean
  employeeWeeklyError: boolean
  weeklyHoursSave: HoursSaveState
  onSaveWeeklyHours: (draft: WeeklyDraft) => void
  employeeDayExceptions: EmployeeDayExceptionWithId[] | undefined
  employeeDayExceptionsLoading: boolean
  employeeDayExceptionsError: boolean
  dayExceptionBusy: boolean
  onSaveDayException: (input: {
    exceptionId: string
    date: string
    closed: boolean
    intervals?: TimeInterval[]
  }) => Promise<void>
  onDeleteDayException: (exceptionId: string) => Promise<void>
}

export const EmployeeHoursPage: React.FunctionComponent<EmployeeHoursPageProps> = ({
  todayYmd,
  employeeWeekly,
  employeeWeeklyLoading,
  employeeWeeklyError,
  weeklyHoursSave,
  onSaveWeeklyHours,
  employeeDayExceptions,
  employeeDayExceptionsLoading,
  employeeDayExceptionsError,
  dayExceptionBusy,
  onSaveDayException,
  onDeleteDayException,
}) => {
  const { t } = useLocale()
  const weeklyFormKey = employeeWeekly ? JSON.stringify(employeeWeekly) : 'loading'

  return (
    <Box sx={{ maxWidth: 860 }}>
      <Typography sx={{ fontWeight: 600, mb: 0.5 }}>{t('employee.hoursTitle')}</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {t('employee.hoursHint')}
      </Typography>
      {employeeWeeklyLoading ? (
        <CircularProgress aria-label={t('employee.loading')} size={28} />
      ) : null}
      {employeeWeeklyError ? <Alert severity="error">{t('employee.hoursError')}</Alert> : null}
      {!employeeWeeklyLoading && !employeeWeeklyError ? (
        <WeeklyHoursForm
          key={weeklyFormKey}
          initial={weeklyDraftOf(employeeWeekly)}
          save={weeklyHoursSave}
          onSave={onSaveWeeklyHours}
        />
      ) : null}
      <Typography sx={{ fontWeight: 600, mt: 4, mb: 1 }}>
        {t('employee.dayExceptionTitle')}
      </Typography>
      <EmployeeDayExceptionForm
        todayYmd={todayYmd}
        weekly={employeeWeekly}
        weeklyLoading={employeeWeeklyLoading}
        exceptions={employeeDayExceptions}
        exceptionsLoading={employeeDayExceptionsLoading}
        exceptionsError={employeeDayExceptionsError}
        busy={dayExceptionBusy}
        onSave={onSaveDayException}
        onDelete={onDeleteDayException}
      />
    </Box>
  )
}
