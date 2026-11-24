import type * as React from 'react'
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  IconButton,
  Paper,
  Stack,
  Typography,
} from '@mui/material'
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'

import { AdminViewSwitch } from '../../components/AdminViewSwitch'
import { WeekPlanner } from '../../components/WeekPlanner'
import { formatViennaDateTime } from '../../data/dateFormat'
import type { EmployeeWithId } from '../../data/employees'
import type { ReservationWithId } from '../../data/reservations'
import { formatBookedTime, type WeekPlan } from '../../data/weekPlanner'
import { useLocale } from '../../i18n'
import { PendingItem, Toolbar, WeekTitle, WeekTotals } from './AdminHomePage.styles'

export type AdminHomePageProps = {
  weekTitle: string
  weekRangeLabel: string
  isCurrentWeek: boolean
  plan: WeekPlan | undefined
  planLoading: boolean
  planError: boolean
  pending: ReservationWithId[] | undefined
  confirmingReservationId: string | null
  confirmError: string | null
  onPrevWeekClick: () => void
  onNextWeekClick: () => void
  onThisWeekClick: () => void
  onSelectReservation: (reservationId: string) => void
  onConfirmReservation: (reservationId: string) => void
  onAddReservationClick: () => void
  onAddReservationAt: (dateYmd: string, startTime: string) => void
  onListViewClick: () => void
  employees?: EmployeeWithId[]
  selectedEmployeeId?: string | null
  onSelectEmployee?: (employeeId: string | null) => void
}

export const AdminHomePage: React.FunctionComponent<AdminHomePageProps> = ({
  weekTitle,
  weekRangeLabel,
  isCurrentWeek,
  plan,
  planLoading,
  planError,
  pending,
  confirmingReservationId,
  confirmError,
  onPrevWeekClick,
  onNextWeekClick,
  onThisWeekClick,
  onSelectReservation,
  onConfirmReservation,
  onAddReservationClick,
  onAddReservationAt,
  onListViewClick,
  employees,
  selectedEmployeeId,
  onSelectEmployee,
}) => {
  const { t, intlLocale } = useLocale()
  const revenue = new Intl.NumberFormat(intlLocale, {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format((plan?.totals.revenueCents ?? 0) / 100)

  return (
    <Stack spacing={3}>
      <Toolbar>
        <Box className="toolbar-title">
          <WeekTitle>{weekTitle}</WeekTitle>
          <Typography color="text.secondary" sx={{ mt: 0.5, whiteSpace: 'nowrap' }}>
            {weekRangeLabel}
          </Typography>
        </Box>

        <Box className="toolbar-controls">
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, ml: { xs: -1, md: 0 } }}>
            <IconButton aria-label={t('admin.prevWeek')} onClick={onPrevWeekClick}>
              <ChevronLeftIcon />
            </IconButton>
            <Button
              variant="outlined"
              disabled={isCurrentWeek}
              onClick={onThisWeekClick}
              sx={{ whiteSpace: 'nowrap' }}
            >
              {t('admin.thisWeek')}
            </Button>
            <IconButton aria-label={t('admin.nextWeek')} onClick={onNextWeekClick}>
              <ChevronRightIcon />
            </IconButton>
          </Box>
          <AdminViewSwitch value="week" onWeekClick={() => {}} onListClick={onListViewClick} />
        </Box>

        {plan ? (
          <WeekTotals className="toolbar-totals" aria-label={t('admin.weekTotals')}>
            <div>
              <dt>{t('admin.totalCount')}</dt>
              <dd>{plan.totals.count}</dd>
            </div>
            <div>
              <dt>{t('admin.totalTime')}</dt>
              <dd>{formatBookedTime(plan.totals.bookedMinutes)}</dd>
            </div>
            <div>
              <dt>{t('admin.totalRevenue')}</dt>
              <dd>{revenue}</dd>
            </div>
          </WeekTotals>
        ) : null}

        <Button
          className="toolbar-cta"
          variant="contained"
          size="large"
          onClick={onAddReservationClick}
        >
          {t('admin.addReservation')}
        </Button>
      </Toolbar>

      {employees && employees.length > 0 && onSelectEmployee ? (
        <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1, alignItems: 'center' }}>
          <Typography variant="body2" color="text.secondary" sx={{ mr: 0.5 }}>
            {t('admin.employeeSelectLabel')}:
          </Typography>
          <Chip
            label={t('admin.employeeAll')}
            clickable
            color={!selectedEmployeeId ? 'primary' : 'default'}
            variant={!selectedEmployeeId ? 'filled' : 'outlined'}
            onClick={() => onSelectEmployee(null)}
          />
          {employees.map((emp) => (
            <Chip
              key={emp.id}
              label={emp.displayName}
              clickable
              color={selectedEmployeeId === emp.id ? 'primary' : 'default'}
              variant={selectedEmployeeId === emp.id ? 'filled' : 'outlined'}
              onClick={() => onSelectEmployee(emp.id)}
            />
          ))}
        </Stack>
      ) : null}

      {planError ? <Alert severity="error">{t('admin.reservationsError')}</Alert> : null}

      <Box component="section" aria-label={t('admin.plannerLabel')} sx={{ position: 'relative' }}>
        {plan ? (
          <WeekPlanner
            plan={plan}
            onSelectReservation={onSelectReservation}
            onAddAt={onAddReservationAt}
          />
        ) : null}
        {planLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress aria-label={t('admin.calendarLoading')} />
          </Box>
        ) : null}
      </Box>

      <Paper component="section" aria-label={t('admin.statPending')} sx={{ p: { xs: 2, sm: 3 } }}>
        <Typography variant="h2" sx={{ fontSize: '1.25rem', mb: 2 }}>
          {t('admin.statPending')}
          {pending && pending.length > 0 ? (
            <Box component="span" sx={{ color: 'text.secondary', fontWeight: 400, ml: 1 }}>
              {pending.length}
            </Box>
          ) : null}
        </Typography>
        {pending && pending.length === 0 ? (
          <Typography color="text.secondary">{t('admin.pendingEmpty')}</Typography>
        ) : null}
        {confirmError ? (
          <Alert severity="error" sx={{ mb: 2 }}>
            {confirmError}
          </Alert>
        ) : null}
        <Box
          component="ul"
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 340px), 1fr))',
            gap: { xs: 2, sm: 2.5 },
            listStyle: 'none',
            m: 0,
            p: 0,
          }}
        >
          {pending?.map((reservation) => (
            <PendingItem key={reservation.id}>
              <Box sx={{ minWidth: 0, maxWidth: '100%' }}>
                <Typography sx={{ fontWeight: 600 }}>
                  {reservation.firstName} {reservation.lastName}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {formatViennaDateTime(reservation.startAt, intlLocale)}
                </Typography>
                <Typography variant="body2" color="text.secondary" noWrap>
                  {reservation.serviceName}
                </Typography>
              </Box>
              <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                <Button
                  size="small"
                  variant="contained"
                  disabled={confirmingReservationId !== null}
                  onClick={() => onConfirmReservation(reservation.id)}
                >
                  {t('admin.confirm')}
                </Button>
                <Button size="small" onClick={() => onSelectReservation(reservation.id)}>
                  {t('admin.open')}
                </Button>
              </Stack>
            </PendingItem>
          ))}
        </Box>
      </Paper>
    </Stack>
  )
}
