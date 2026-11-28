import type * as React from 'react'
import { useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  IconButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Stack,
  Typography,
} from '@mui/material'
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import EventNoteIcon from '@mui/icons-material/EventNote'
import EditCalendarIcon from '@mui/icons-material/EditCalendar'

import { AdminViewSwitch } from '../../components/AdminViewSwitch'
import { CalendarEventDialog } from '../../components/CalendarEventDialog'
import { WeekPlanner } from '../../components/WeekPlanner'
import type { EmployeeWithId } from '../../data/employees'
import { formatBookedTime, type WeekPlan } from '../../data/weekPlanner'
import { useLocale } from '../../i18n'
import { Toolbar, WeekTitle, WeekTotals } from './AdminHomePage.styles'

export type AdminHomePageProps = {
  weekTitle: string
  weekRangeLabel: string
  isCurrentWeek: boolean
  plan: WeekPlan | undefined
  planLoading: boolean
  planError: boolean
  onPrevWeekClick: () => void
  onNextWeekClick: () => void
  onThisWeekClick: () => void
  onOpenReservationDetails: (reservationId: string) => void
  onEditReservation: (reservationId: string) => void
  onAddReservationClick: () => void
  onListViewClick: () => void
  employees?: EmployeeWithId[]
  selectedEmployeeId?: string | null
  onSelectEmployee?: (employeeId: string | null) => void
  privacyToggleBusy?: boolean
  privacyToggleError?: string | null
  onToggleBlockedSlotPrivacy?: (slotId: string, isPrivate: boolean) => void
}

export const AdminHomePage: React.FunctionComponent<AdminHomePageProps> = ({
  weekTitle,
  weekRangeLabel,
  isCurrentWeek,
  plan,
  planLoading,
  planError,
  onPrevWeekClick,
  onNextWeekClick,
  onThisWeekClick,
  onOpenReservationDetails,
  onEditReservation,
  onAddReservationClick,
  onListViewClick,
  employees,
  selectedEmployeeId,
  onSelectEmployee,
  privacyToggleBusy = false,
  privacyToggleError = null,
  onToggleBlockedSlotPrivacy,
}) => {
  const { t, intlLocale } = useLocale()
  const [menu, setMenu] = useState<{
    reservationId: string
    anchorEl: HTMLElement
    canEdit: boolean
  } | null>(null)
  const [selectedBlockedSlotId, setSelectedBlockedSlotId] = useState<string | null>(null)
  const selectedBlockedSlot =
    selectedBlockedSlotId && plan
      ? (plan.days
          .flatMap((day) => day.blockedEntries)
          .find((entry) => entry.block.id === selectedBlockedSlotId)?.block ?? null)
      : null
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
            onSelectReservation={(reservationId, anchorEl) => {
              const entry = plan.days
                .flatMap((day) => day.entries)
                .find((item) => item.reservation.id === reservationId)
              const status = entry?.reservation.status
              setMenu({
                reservationId,
                anchorEl,
                canEdit: status === 'PENDING' || status === 'CONFIRMED',
              })
            }}
            onSelectBlockedSlot={(slot) => {
              setSelectedBlockedSlotId(slot.id)
            }}
          />
        ) : null}
        <CalendarEventDialog
          slot={selectedBlockedSlot}
          busy={privacyToggleBusy}
          error={privacyToggleError}
          onClose={() => {
            setSelectedBlockedSlotId(null)
          }}
          onTogglePrivacy={onToggleBlockedSlotPrivacy}
        />
        <Menu
          anchorEl={menu?.anchorEl ?? null}
          open={menu !== null}
          onClose={() => {
            setMenu(null)
          }}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
          transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        >
          <MenuItem
            onClick={() => {
              if (!menu) return
              const { reservationId } = menu
              setMenu(null)
              onOpenReservationDetails(reservationId)
            }}
          >
            <ListItemIcon>
              <EventNoteIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>{t('admin.quickDetails')}</ListItemText>
          </MenuItem>
          {menu?.canEdit ? (
            <MenuItem
              onClick={() => {
                if (!menu) return
                const { reservationId } = menu
                setMenu(null)
                onEditReservation(reservationId)
              }}
            >
              <ListItemIcon>
                <EditCalendarIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>{t('admin.reschedule')}</ListItemText>
            </MenuItem>
          ) : null}
        </Menu>
        {planLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress aria-label={t('admin.calendarLoading')} />
          </Box>
        ) : null}
      </Box>
    </Stack>
  )
}
