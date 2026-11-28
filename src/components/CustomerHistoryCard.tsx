import type * as React from 'react'
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  Paper,
  Stack,
  Typography,
} from '@mui/material'
import AutoAwesomeOutlinedIcon from '@mui/icons-material/AutoAwesomeOutlined'
import NotesOutlinedIcon from '@mui/icons-material/NotesOutlined'

import type { CustomerContextResponse } from '../data/customersApi'
import { formatViennaDateTime } from '../data/dateFormat'
import { rankCustomerHistoryByService } from '../data/serviceSimilarity'
import { formatBookedTime } from '../data/weekPlanner'
import { useLocale } from '../i18n'

export type CustomerHistoryCardProps = {
  context: CustomerContextResponse | undefined
  loading: boolean
  selectedServiceNames: readonly string[]
  currentDurationMinutes?: number | null
  onApplyDuration?: (durationMinutes: number) => void
  onOpenCustomer?: (customerId: string) => void
}

export const CustomerHistoryCard: React.FunctionComponent<CustomerHistoryCardProps> = ({
  context,
  loading,
  selectedServiceNames,
  currentDurationMinutes,
  onApplyDuration,
  onOpenCustomer,
}) => {
  const { t, intlLocale } = useLocale()

  if (loading) {
    return (
      <Paper variant="outlined" sx={{ p: 2 }}>
        <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
          <CircularProgress size={18} />
          <Typography variant="body2" color="text.secondary">
            {t('admin.customerContextLoading')}
          </Typography>
        </Stack>
      </Paper>
    )
  }

  if (!context || (!context.customer && context.history.length === 0)) {
    return null
  }

  const ranked = rankCustomerHistoryByService(context.history, selectedServiceNames)
  const topItems = ranked.items.slice(0, 5)
  const rec = ranked.recommendedMatch
  const recDuration = rec?.item.durationMinutes ?? null
  const recLabel = rec
    ? rec.item.kind === 'reservation'
      ? rec.item.serviceName
      : rec.item.title
    : ''

  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      <Stack spacing={1.5}>
        <Box
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 1,
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
            <Typography variant="subtitle2">{t('admin.customerContextTitle')}</Typography>
            {context.customer ? (
              <Chip
                size="small"
                label={`${context.customer.firstName} ${context.customer.lastName}`.trim()}
              />
            ) : null}
          </Stack>
          {context.customer && onOpenCustomer ? (
            <Button size="small" onClick={() => onOpenCustomer(context.customer!.id)}>
              {t('admin.customerContextOpenProfile')}
            </Button>
          ) : null}
        </Box>

        {context.customer?.stylistNotes ? (
          <Alert severity="warning" icon={<NotesOutlinedIcon fontSize="small" />} sx={{ py: 0.5 }}>
            <Typography variant="caption" sx={{ fontWeight: 600, display: 'block' }}>
              {t('admin.customersStylistNotes')}
            </Typography>
            <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
              {context.customer.stylistNotes}
            </Typography>
          </Alert>
        ) : null}

        {rec && recDuration ? (
          <Alert
            severity="info"
            icon={<AutoAwesomeOutlinedIcon fontSize="small" />}
            action={
              onApplyDuration && currentDurationMinutes !== recDuration ? (
                <Button
                  color="inherit"
                  size="small"
                  variant="outlined"
                  onClick={() => onApplyDuration(recDuration)}
                >
                  {t('admin.customerContextApplyDuration', {
                    duration: formatBookedTime(recDuration),
                  })}
                </Button>
              ) : undefined
            }
          >
            {t('admin.customerContextRecommendation', {
              service: recLabel,
              date: formatViennaDateTime(rec.item.startAt, intlLocale),
              duration: formatBookedTime(recDuration),
            })}
          </Alert>
        ) : null}

        {topItems.length > 0 ? (
          <Stack spacing={1} divider={<Divider flexItem />}>
            {topItems.map(({ item, matchQuality }) => {
              const title = item.kind === 'reservation' ? item.serviceName : item.title
              const note =
                item.kind === 'reservation' ? item.internalNote || item.notes : item.description
              return (
                <Box
                  key={item.id}
                  sx={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 1,
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <Box sx={{ minWidth: 0, flexGrow: 1 }}>
                    <Stack
                      direction="row"
                      spacing={0.75}
                      sx={{ alignItems: 'center', flexWrap: 'wrap' }}
                    >
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {title}
                      </Typography>
                      {matchQuality === 'exact' || matchQuality === 'similar' ? (
                        <Chip
                          size="small"
                          color="primary"
                          variant="outlined"
                          label={t('admin.customerContextSimilarBadge')}
                          sx={{ height: 20, fontSize: '0.7rem' }}
                        />
                      ) : null}
                      {item.kind === 'googleCalendar' ? (
                        <Chip
                          size="small"
                          variant="outlined"
                          label={t('admin.googleCalendarEventFallback')}
                          sx={{ height: 20, fontSize: '0.7rem' }}
                        />
                      ) : null}
                    </Stack>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                      {formatViennaDateTime(item.startAt, intlLocale)}
                      {item.durationMinutes > 0
                        ? ` · ${formatBookedTime(item.durationMinutes)}`
                        : ''}
                    </Typography>
                    {note ? (
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ display: 'block', whiteSpace: 'pre-wrap' }}
                      >
                        {note}
                      </Typography>
                    ) : null}
                  </Box>
                  {onApplyDuration && item.durationMinutes > 0 ? (
                    <Button
                      size="small"
                      disabled={currentDurationMinutes === item.durationMinutes}
                      onClick={() => onApplyDuration(item.durationMinutes)}
                    >
                      {formatBookedTime(item.durationMinutes)}
                    </Button>
                  ) : null}
                </Box>
              )
            })}
          </Stack>
        ) : null}
      </Stack>
    </Paper>
  )
}
