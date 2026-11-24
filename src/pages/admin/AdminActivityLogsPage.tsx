import type * as React from 'react'
import { useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
  type ChipProps,
} from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import RefreshIcon from '@mui/icons-material/Refresh'

import {
  categoryOfAction,
  type ActivityCategory,
  type ActivityLogWithId,
} from '../../data/activityLogApi'
import type { ActivityAction } from '../../data/schemas'
import { useLocale, type MessageKey } from '../../i18n'

export type AdminActivityLogsPageProps = {
  logs: ActivityLogWithId[]
  skippedCount: number
  loading: boolean
  refreshing: boolean
  error: boolean
  onRefresh: () => void
  onBackClick: () => void
}

function formatLogTimestamp(iso: string, locale: 'de' | 'it'): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso
  return new Intl.DateTimeFormat(locale === 'it' ? 'it-IT' : 'de-AT', {
    timeZone: 'Europe/Vienna',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(date)
}

function actionLabelKey(action: ActivityAction): MessageKey {
  return `admin.activityLogsAction.${action}`
}

function actionChipColor(action: ActivityAction): ChipProps['color'] {
  if (action === 'admin_login_failed') return 'error'
  if (action === 'reservation_created' || action === 'admin_reservation_created') return 'success'
  if (action === 'reservation_cancelled' || action === 'admin_reservation_cancelled') {
    return 'warning'
  }
  if (action === 'admin_reservation_declined') return 'warning'
  if (action === 'admin_login' || action === 'admin_logout') return 'info'
  if (action === 'page_view') return 'default'
  return 'primary'
}

function formatDetailsSummary(details: ActivityLogWithId['details']): string {
  if (!details) return ''
  return Object.entries(details)
    .filter(([, value]) => value !== null && value !== '')
    .map(([key, value]) => `${key}: ${String(value)}`)
    .join(' · ')
}

function matchesSearch(entry: ActivityLogWithId, queryText: string): boolean {
  if (!queryText) return true
  const haystack = [
    entry.ip,
    entry.browser,
    entry.userAgent,
    entry.action,
    entry.path ?? '',
    entry.actorEmail ?? '',
    entry.actorType,
    entry.sessionId ?? '',
    formatDetailsSummary(entry.details),
  ]
    .join(' ')
    .toLowerCase()
  return haystack.includes(queryText)
}

const categories: readonly { value: ActivityCategory; labelKey: MessageKey }[] = [
  { value: 'all', labelKey: 'admin.activityLogsFilterAll' },
  { value: 'page_views', labelKey: 'admin.activityLogsFilterPageViews' },
  { value: 'bookings', labelKey: 'admin.activityLogsFilterBookings' },
  { value: 'auth', labelKey: 'admin.activityLogsFilterAuth' },
  { value: 'admin', labelKey: 'admin.activityLogsFilterAdmin' },
]

export const AdminActivityLogsPage: React.FunctionComponent<AdminActivityLogsPageProps> = ({
  logs,
  skippedCount,
  loading,
  refreshing,
  error,
  onRefresh,
  onBackClick,
}) => {
  const { locale, t } = useLocale()
  const [category, setCategory] = useState<ActivityCategory>('all')
  const [search, setSearch] = useState('')

  const normalizedSearch = search.trim().toLowerCase()
  const visibleLogs = logs.filter((entry) => {
    if (category !== 'all' && categoryOfAction(entry.action) !== category) {
      return false
    }
    return matchesSearch(entry, normalizedSearch)
  })

  const formatActor = (entry: ActivityLogWithId): string => {
    if (entry.actorType === 'anonymous') return t('admin.activityLogsActorAnonymous')
    if (entry.actorType === 'user') {
      return entry.actorEmail
        ? `${t('admin.activityLogsActorUser')} (${entry.actorEmail})`
        : t('admin.activityLogsActorUser')
    }
    if (entry.actorType === 'operator') {
      return entry.actorEmail
        ? `${t('admin.activityLogsActorOperator')} (${entry.actorEmail})`
        : t('admin.activityLogsActorOperator')
    }
    return entry.actorEmail ?? t('admin.activityLogsActorAdmin')
  }

  return (
    <Stack spacing={3}>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        sx={{ justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' } }}
      >
        <Box>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={onBackClick}
            size="small"
            sx={{ mb: 1, ml: -1 }}
          >
            {t('admin.backToSettings')}
          </Button>
          <Typography variant="h1">{t('admin.activityLogsTitle')}</Typography>
          <Typography color="text.secondary" sx={{ mt: 0.5 }}>
            {t('admin.activityLogsHint')}
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={onRefresh}
          disabled={loading || refreshing}
        >
          {t('admin.activityLogsRefresh')}
        </Button>
      </Stack>

      <Paper sx={{ p: 2 }}>
        <Stack spacing={2}>
          <TextField
            size="small"
            fullWidth
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t('admin.activityLogsSearchPlaceholder')}
          />
          <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', rowGap: 1 }}>
            {categories.map((item) => (
              <Chip
                key={item.value}
                label={t(item.labelKey)}
                clickable
                color={category === item.value ? 'primary' : 'default'}
                variant={category === item.value ? 'filled' : 'outlined'}
                onClick={() => setCategory(item.value)}
              />
            ))}
          </Stack>
        </Stack>
      </Paper>

      {loading ? (
        <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', py: 3 }}>
          <CircularProgress size={22} />
          <Typography color="text.secondary">{t('admin.activityLogsLoading')}</Typography>
        </Stack>
      ) : null}

      {error ? <Alert severity="error">{t('admin.activityLogsError')}</Alert> : null}

      {!loading && !error && skippedCount > 0 ? (
        <Alert severity="warning">
          {t('admin.activityLogsSkippedWarning', { count: skippedCount })}
        </Alert>
      ) : null}

      {!loading && !error && visibleLogs.length === 0 ? (
        <Alert severity="info">{t('admin.activityLogsEmpty')}</Alert>
      ) : null}

      {!loading && !error && visibleLogs.length > 0 ? (
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>{t('admin.activityLogsColTime')}</TableCell>
                <TableCell>{t('admin.activityLogsColAction')}</TableCell>
                <TableCell>{t('admin.activityLogsColPath')}</TableCell>
                <TableCell>{t('admin.activityLogsColIp')}</TableCell>
                <TableCell>{t('admin.activityLogsColBrowser')}</TableCell>
                <TableCell>{t('admin.activityLogsColActor')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {visibleLogs.map((entry) => {
                const detailsText = formatDetailsSummary(entry.details)
                return (
                  <TableRow key={entry.id} hover>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>
                      {formatLogTimestamp(entry.createdAt, locale)}
                    </TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>
                      <Chip
                        size="small"
                        color={actionChipColor(entry.action)}
                        label={t(actionLabelKey(entry.action))}
                      />
                    </TableCell>
                    <TableCell>
                      {entry.path ? (
                        <Typography
                          variant="body2"
                          sx={{ fontFamily: 'monospace', fontWeight: 500 }}
                        >
                          {entry.path}
                        </Typography>
                      ) : null}
                      {detailsText ? (
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ display: 'block' }}
                        >
                          {detailsText}
                        </Typography>
                      ) : null}
                    </TableCell>
                    <TableCell sx={{ fontFamily: 'monospace', whiteSpace: 'nowrap' }}>
                      {entry.ip}
                    </TableCell>
                    <TableCell>
                      <Tooltip title={entry.userAgent} arrow>
                        <Typography variant="body2" noWrap sx={{ maxWidth: 220 }}>
                          {entry.browser}
                        </Typography>
                      </Tooltip>
                    </TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>{formatActor(entry)}</TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </TableContainer>
      ) : null}
    </Stack>
  )
}
