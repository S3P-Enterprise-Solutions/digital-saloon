import type * as React from 'react'
import { Alert, Box, Button, CircularProgress, IconButton, Stack, Typography } from '@mui/material'
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'

import { addMonths, monthMatrix, parseYmd } from '../data/bookingCalendar'
import { useLocale } from '../i18n'

export type BookingMonthCalendarProps = {
  monthAnchorYmd: string
  selectedDate: string | null
  todayYmd: string
  /**
   * Dates (`YYYY-MM-DD`) that have at least one free slot.
   * When `null` (e.g. before a service is selected), all non-past dates remain selectable
   * and the empty-month notice is suppressed.
   */
  availableDates: ReadonlySet<string> | null
  loading: boolean
  error: boolean
  onMonthAnchorChange: (anchorYmd: string) => void
  onSelectDate: (dateYmd: string) => void
}

export const BookingMonthCalendar: React.FunctionComponent<BookingMonthCalendarProps> = ({
  monthAnchorYmd,
  selectedDate,
  todayYmd,
  availableDates,
  loading,
  error,
  onMonthAnchorChange,
  onSelectDate,
}) => {
  const { t, intlLocale } = useLocale()
  const weekdays = [
    t('book.weekday.mo'),
    t('book.weekday.tu'),
    t('book.weekday.we'),
    t('book.weekday.th'),
    t('book.weekday.fr'),
    t('book.weekday.sa'),
    t('book.weekday.su'),
  ]
  const { year, monthIndex } = parseYmd(monthAnchorYmd)
  const weeks = monthMatrix(year, monthIndex)
  const monthLabel = new Intl.DateTimeFormat(intlLocale, {
    month: 'long',
    timeZone: 'UTC',
  }).format(new Date(Date.UTC(year, monthIndex, 1)))

  return (
    <>
      <Stack direction="row" sx={{ mb: 2, alignItems: 'center', justifyContent: 'space-between' }}>
        <IconButton
          size="small"
          aria-label={t('book.monthPrev')}
          onClick={() => onMonthAnchorChange(addMonths(monthAnchorYmd, -1))}
        >
          <ChevronLeftIcon />
        </IconButton>
        <Typography
          component="span"
          sx={{ fontWeight: 600, fontSize: '1.05rem', textTransform: 'capitalize' }}
        >
          {monthLabel}
        </Typography>
        <IconButton
          size="small"
          aria-label={t('book.monthNext')}
          onClick={() => onMonthAnchorChange(addMonths(monthAnchorYmd, 1))}
        >
          <ChevronRightIcon />
        </IconButton>
      </Stack>

      {loading ? (
        <CircularProgress
          aria-label={t('book.availabilityLoading')}
          size={24}
          sx={{ mb: 2, display: 'block', mx: 'auto' }}
        />
      ) : null}
      {error ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          {t('book.availabilityError')}
        </Alert>
      ) : null}

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: 0.5,
          mb: 1,
        }}
      >
        {weekdays.map((label) => (
          <Typography
            key={label}
            variant="caption"
            color="text.secondary"
            sx={{ textAlign: 'center', fontWeight: 600 }}
          >
            {label}
          </Typography>
        ))}
      </Box>

      <Stack spacing={0.5}>
        {weeks.map((week, weekIndex) => (
          <Box
            key={weekIndex}
            sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 0.5 }}
          >
            {week.map((ymd, dayIndex) => {
              if (!ymd) return <Box key={`empty-${weekIndex}-${dayIndex}`} />
              const available = availableDates === null ? true : availableDates.has(ymd)
              const selected = ymd === selectedDate
              const past = ymd < todayYmd
              const disabled = !available || past
              return (
                <Button
                  key={ymd}
                  size="small"
                  disabled={disabled}
                  variant="text"
                  onClick={() => onSelectDate(ymd)}
                  sx={{
                    minWidth: 36,
                    width: 36,
                    height: 36,
                    mx: 'auto',
                    p: 0,
                    borderRadius: '50%',
                    fontWeight: selected ? 700 : 400,
                    bgcolor: selected ? 'text.primary' : 'transparent',
                    color: selected ? 'background.paper' : 'text.primary',
                    '&:hover': {
                      bgcolor: selected ? 'text.primary' : 'action.hover',
                    },
                    opacity: disabled ? 0.35 : 1,
                    textDecoration: disabled ? 'line-through' : 'none',
                  }}
                >
                  {String(parseYmd(ymd).day).padStart(2, '0')}
                </Button>
              )
            })}
          </Box>
        ))}
      </Stack>

      {!loading && !error && availableDates !== null && availableDates.size === 0 ? (
        <Alert severity="info" sx={{ mt: 2 }}>
          {t('book.noSlotsMonth')}
        </Alert>
      ) : null}
    </>
  )
}
