import type * as React from 'react'
import { useState } from 'react'
import { Alert, Box, Button, IconButton, Stack, Switch, Tooltip, Typography } from '@mui/material'
import ContentCopyOutlinedIcon from '@mui/icons-material/ContentCopyOutlined'

import { defaultDayInterval, weeklyDraftIsValid, type WeeklyDraft } from '../data/openingHoursForm'
import { weekdays } from '../data/openingRules'
import type { TimeInterval, Weekday } from '../data/schemas'
import { useLocale } from '../i18n'

import { IntervalsEditor } from './IntervalsEditor'

export type HoursSaveState = {
  saving: boolean
  saved: boolean
  error: string | null
}

export type WeeklyHoursFormProps = {
  initial: WeeklyDraft
  save: HoursSaveState
  onSave: (draft: WeeklyDraft) => void
  disabled?: boolean
}

function useWeekdayLabels(): Record<Weekday, string> {
  const { intlLocale } = useLocale()
  const format = new Intl.DateTimeFormat(intlLocale, { weekday: 'long', timeZone: 'UTC' })
  const labels = {} as Record<Weekday, string>
  weekdays.forEach((weekday, index) => {
    labels[weekday] = format.format(new Date(Date.UTC(2024, 0, 1 + index)))
  })
  return labels
}

export const WeeklyHoursForm: React.FunctionComponent<WeeklyHoursFormProps> = ({
  initial,
  save,
  onSave,
  disabled = false,
}) => {
  const { t } = useLocale()
  const labels = useWeekdayLabels()
  const [draft, setDraft] = useState(initial)
  const [dirty, setDirty] = useState(false)
  const [copiedFrom, setCopiedFrom] = useState<Weekday | null>(null)
  const valid = weeklyDraftIsValid(draft)

  const setDay = (weekday: Weekday, intervals: TimeInterval[]) => {
    setDraft((current) => ({ ...current, [weekday]: intervals }))
    setDirty(true)
    setCopiedFrom(null)
  }

  const copyToOpenDays = (source: Weekday) => {
    setDraft((current) => {
      const next = { ...current }
      for (const weekday of weekdays) {
        if (weekday !== source && current[weekday].length > 0) {
          next[weekday] = current[source].map((interval) => ({ ...interval }))
        }
      }
      return next
    })
    setDirty(true)
    setCopiedFrom(source)
  }

  return (
    <Box
      component="form"
      noValidate
      onSubmit={(event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        if (!valid) return
        setDirty(false)
        setCopiedFrom(null)
        onSave(draft)
      }}
    >
      <Stack component="ul" sx={{ listStyle: 'none', m: 0, p: 0 }}>
        {weekdays.map((weekday) => {
          const intervals = draft[weekday]
          const open = intervals.length > 0
          return (
            <Box
              component="li"
              key={weekday}
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr auto', sm: '130px 72px 1fr auto' },
                columnGap: 2,
                rowGap: 1,
                alignItems: 'start',
                py: 2,
                borderTop: 1,
                borderColor: 'divider',
                '&:first-of-type': { borderTop: 0, pt: 0 },
              }}
            >
              <Typography sx={{ fontWeight: 600, pt: 1 }}>{labels[weekday]}</Typography>
              <Box sx={{ pt: 0.25, justifySelf: { xs: 'end', sm: 'start' } }}>
                <Switch
                  checked={open}
                  disabled={disabled}
                  onChange={(event) =>
                    setDay(weekday, event.target.checked ? [{ ...defaultDayInterval }] : [])
                  }
                  slotProps={{
                    input: { 'aria-label': `${labels[weekday]}: ${t('hours.open')}` },
                  }}
                />
              </Box>
              <Box sx={{ gridColumn: { xs: '1 / -1', sm: 'auto' } }}>
                {open ? (
                  <Box sx={disabled ? { pointerEvents: 'none', opacity: 0.6 } : undefined}>
                    <IntervalsEditor
                      intervals={intervals}
                      label={labels[weekday]}
                      onChange={(next) => setDay(weekday, next)}
                    />
                  </Box>
                ) : (
                  <Typography color="text.secondary" sx={{ pt: 1 }}>
                    {t('admin.closed')}
                  </Typography>
                )}
                {copiedFrom === weekday ? (
                  <Typography variant="body2" role="status" sx={{ mt: 1, color: 'success.main' }}>
                    {t('hours.copied')}
                  </Typography>
                ) : null}
              </Box>
              <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
                {open ? (
                  <Tooltip title={t('hours.copyToOpenDays')}>
                    <IconButton
                      aria-label={`${labels[weekday]}: ${t('hours.copyToOpenDays')}`}
                      onClick={() => copyToOpenDays(weekday)}
                    >
                      <ContentCopyOutlinedIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                ) : null}
              </Box>
            </Box>
          )
        })}
      </Stack>

      <Stack direction="row" spacing={2} sx={{ alignItems: 'center', mt: 2, flexWrap: 'wrap' }}>
        <Button
          type="submit"
          variant="contained"
          disabled={disabled || save.saving || !valid || !dirty}
        >
          {save.saving ? t('admin.saving') : t('admin.save')}
        </Button>
        {dirty ? (
          <Typography variant="body2" color="text.secondary">
            {t('hours.unsaved')}
          </Typography>
        ) : save.saved ? (
          <Typography role="status" sx={{ color: 'success.main', fontWeight: 600 }}>
            {t('admin.saved')}
          </Typography>
        ) : null}
        {save.error ? (
          <Alert severity="error" sx={{ width: '100%' }}>
            {t('admin.saveFailed', { message: save.error })}
          </Alert>
        ) : null}
      </Stack>
    </Box>
  )
}
