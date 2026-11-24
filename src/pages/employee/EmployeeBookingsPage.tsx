import type * as React from 'react'
import {
  Alert,
  Chip,
  CircularProgress,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material'

import { formatViennaDateTime } from '../../data/dateFormat'
import type { EmployeeReservationPublic } from '../../data/employeeSelfApi'
import { reservationStatusColor } from '../../data/reservationStatus'
import { useLocale, type MessageKey } from '../../i18n'

export type EmployeeBookingsPageProps = {
  reservations: EmployeeReservationPublic[] | undefined
  isLoading: boolean
  isError: boolean
}

export const EmployeeBookingsPage: React.FunctionComponent<EmployeeBookingsPageProps> = ({
  reservations,
  isLoading,
  isError,
}) => {
  const { t, intlLocale } = useLocale()

  return (
    <Stack spacing={2}>
      <Typography variant="h2" sx={{ fontSize: '1.15rem' }}>
        {t('employee.bookingsTitle')}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        {t('employee.bookingsHint')}
      </Typography>
      {isLoading ? <CircularProgress aria-label={t('employee.loading')} size={28} /> : null}
      {isError ? <Alert severity="error">{t('employee.bookingsError')}</Alert> : null}
      {reservations && reservations.length === 0 ? (
        <Alert severity="info">{t('employee.bookingsEmpty')}</Alert>
      ) : null}
      {reservations && reservations.length > 0 ? (
        <Paper sx={{ overflowX: 'auto' }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>{t('admin.time')}</TableCell>
                <TableCell>{t('admin.customer')}</TableCell>
                <TableCell>{t('admin.services')}</TableCell>
                <TableCell>{t('admin.status')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {reservations.map((reservation) => (
                <TableRow key={reservation.id}>
                  <TableCell>{formatViennaDateTime(reservation.startAt, intlLocale)}</TableCell>
                  <TableCell>
                    {reservation.firstName} {reservation.lastName}
                  </TableCell>
                  <TableCell>{reservation.serviceName}</TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      color={reservationStatusColor[reservation.status] ?? 'default'}
                      label={t(`status.${reservation.status}` as MessageKey)}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>
      ) : null}
    </Stack>
  )
}
