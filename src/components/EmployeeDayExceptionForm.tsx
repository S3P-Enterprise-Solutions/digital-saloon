import type * as React from 'react'
import { useState } from 'react'
import {
  Alert,
  Box,
  Button,
  FormControlLabel,
  IconButton,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@mui/material'
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined'

import {
  dayExceptionOpenIntervalsValid,
  defaultDayInterval,
} from '../data/employeeWorkingHoursForm'
import type { EmployeeDayExceptionWithId } from '../data/employeeSchedule'
import type { TimeInterval } from '../data/schemas'
import { useLocale } from '../i18n'

import { IntervalsEditor } from './IntervalsEditor'

const datePattern = /^\d{4}-\d{2}-\d{2}$/

export type EmployeeDayExceptionFormProps = {
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

export const EmployeeDayExceptionForm: React.FunctionComponent<EmployeeDayExceptionFormProps> = ({
  exceptions,
  exceptionsLoading,
  exceptionsError,
  busy,
  disabled = false,
  onSave,
  onDelete,
}) => {
  const { t } = useLocale()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [date, setDate] = useState('')
  const [closed, setClosed] = useState(false)
  const [intervals, setIntervals] = useState<TimeInterval[]>([{ ...defaultDayInterval }])
  const [showValidation, setShowValidation] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const dateValid = datePattern.test(date)
  const intervalsValid = dayExceptionOpenIntervalsValid(closed, intervals)
  const formValid = dateValid && intervalsValid

  const resetForm = () => {
    setEditingId(null)
    setDate('')
    setClosed(false)
    setIntervals([{ ...defaultDayInterval }])
    setShowValidation(false)
    setFormError(null)
  }

  const loadException = (exception: EmployeeDayExceptionWithId) => {
    setEditingId(exception.id)
    setDate(exception.date)
    setClosed(exception.closed)
    setIntervals(
      exception.closed || exception.intervals.length === 0
        ? [{ ...defaultDayInterval }]
        : exception.intervals.map((interval) => ({ ...interval })),
    )
    setShowValidation(false)
    setFormError(null)
  }

  const sorted = exceptions?.slice().sort((a, b) => a.date.localeCompare(b.date)) ?? []

  return (
    <Stack spacing={2}>
      {exceptionsLoading ? (
        <Typography variant="body2" color="text.secondary">
          {t('admin.openingHoursLoading')}
        </Typography>
      ) : null}
      {exceptionsError ? <Alert severity="error">{t('admin.openingHoursError')}</Alert> : null}
      {sorted.length > 0 ? (
        <Stack component="ul" spacing={1} sx={{ listStyle: 'none', m: 0, p: 0 }}>
          {sorted.map((exception) => (
            <Box
              component="li"
              key={exception.id}
              sx={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 1,
                py: 1,
                borderBottom: 1,
                borderColor: 'divider',
              }}
            >
              <Box sx={{ flex: 1 }}>
                <Typography sx={{ fontWeight: 600 }}>{exception.date}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {exception.closed
                    ? t('admin.closed')
                    : formatHours(exception.intervals) || t('admin.closed')}
                </Typography>
              </Box>
              <Button
                size="small"
                disabled={busy || disabled}
                onClick={() => loadException(exception)}
              >
                {t('admin.edit')}
              </Button>
              <IconButton
                size="small"
                aria-label={`${t('admin.employeesDayExceptionDelete')}: ${exception.date}`}
                disabled={busy || disabled}
                onClick={() => {
                  setFormError(null)
                  void onDelete(exception.id).catch((err: unknown) => {
                    setFormError(err instanceof Error ? err.message : String(err))
                  })
                  if (editingId === exception.id) resetForm()
                }}
              >
                <DeleteOutlinedIcon fontSize="small" />
              </IconButton>
            </Box>
          ))}
        </Stack>
      ) : !exceptionsLoading && !exceptionsError ? (
        <Typography variant="body2" color="text.secondary">
          {t('admin.employeesDayExceptionEmpty')}
        </Typography>
      ) : null}

      <Box
        component="form"
        noValidate
        onSubmit={(event) => {
          event.preventDefault()
          setShowValidation(true)
          setFormError(null)
          if (!formValid || disabled) return
          const exceptionId =
            editingId ??
            (typeof crypto !== 'undefined' && 'randomUUID' in crypto
              ? crypto.randomUUID()
              : `exc-${Date.now()}`)
          void onSave({
            exceptionId,
            date,
            closed,
            intervals: closed ? undefined : intervals,
          })
            .then(() => resetForm())
            .catch((err: unknown) => {
              setFormError(err instanceof Error ? err.message : String(err))
            })
        }}
      >
        <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 600 }}>
          {editingId ? t('admin.employeesDayExceptionEdit') : t('admin.employeesDayExceptionAdd')}
        </Typography>
        <Stack spacing={2} sx={{ maxWidth: 480 }}>
          <TextField
            size="small"
            label={t('admin.employeesDayExceptionDate')}
            value={date}
            onChange={(e) => setDate(e.target.value)}
            error={showValidation && !dateValid}
            helperText={showValidation && !dateValid ? t('hours.dateRequired') : undefined}
            slotProps={{ htmlInput: { pattern: '^\\d{4}-\\d{2}-\\d{2}$' } }}
          />
          <FormControlLabel
            control={
              <Switch
                checked={closed}
                onChange={(_, checked) => {
                  setClosed(checked)
                  if (!checked && intervals.length === 0) {
                    setIntervals([{ ...defaultDayInterval }])
                  }
                }}
              />
            }
            label={t('admin.closed')}
          />
          {!closed ? (
            <IntervalsEditor
              intervals={intervals}
              label={t('admin.employeesDayExceptionTitle')}
              onChange={setIntervals}
              allowEmpty
            />
          ) : null}
          {showValidation && !closed && !intervalsValid ? (
            <Alert severity="error">{t('hours.checkIntervals')}</Alert>
          ) : null}
          <Stack direction="row" spacing={1.5} sx={{ flexWrap: 'wrap' }}>
            <Button type="submit" variant="outlined" disabled={busy || disabled}>
              {busy ? t('admin.saving') : t('admin.employeesDayExceptionSave')}
            </Button>
            {editingId ? (
              <Button variant="text" disabled={busy} onClick={resetForm}>
                {t('hours.dialogCancel')}
              </Button>
            ) : null}
          </Stack>
          {formError ? <Alert severity="error">{formError}</Alert> : null}
        </Stack>
      </Box>
    </Stack>
  )
}
