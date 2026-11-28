import type * as React from 'react'
import { useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material'

import type { CustomerDetailResponse, SaveCustomerInput } from '../../data/customersApi'
import { formatViennaDateTime } from '../../data/dateFormat'
import { reservationStatusColor } from '../../data/reservationStatus'
import type { Customer, ReservationStatus } from '../../data/schemas'
import { formatBookedTime } from '../../data/weekPlanner'
import { useLocale, type MessageKey } from '../../i18n'

export type AdminCustomerDetailPageProps = {
  detail: CustomerDetailResponse | undefined
  isLoading: boolean
  isError: boolean
  saving: boolean
  saved: boolean
  saveError: string | null
  archiving: boolean
  archiveError: string | null
  onBackClick: () => void
  onBookForCustomer: (customer: Customer) => void
  onOpenReservation: (reservationId: string) => void
  onSave: (input: SaveCustomerInput) => void
  onArchive: () => void
}

type CustomerProfileFormProps = {
  customer: Customer
  saving: boolean
  saved: boolean
  saveError: string | null
  archiving: boolean
  archiveError: string | null
  onSave: (input: SaveCustomerInput) => void
  onRequestArchive: () => void
}

const CustomerProfileForm: React.FunctionComponent<CustomerProfileFormProps> = ({
  customer,
  saving,
  saved,
  saveError,
  archiving,
  archiveError,
  onSave,
  onRequestArchive,
}) => {
  const { t } = useLocale()
  const [firstName, setFirstName] = useState(customer.firstName)
  const [lastName, setLastName] = useState(customer.lastName)
  const [email, setEmail] = useState(customer.email ?? '')
  const [phone, setPhone] = useState(customer.phone ?? '')
  const [stylistNotes, setStylistNotes] = useState(customer.stylistNotes ?? '')
  const [dirty, setDirty] = useState(false)

  return (
    <Paper
      component="form"
      sx={{ p: 3 }}
      onSubmit={(event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        if (!firstName.trim()) return
        setDirty(false)
        onSave({
          customerId: customer.id,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: email.trim() || null,
          phone: phone.trim() || null,
          stylistNotes: stylistNotes.trim() || null,
        })
      }}
    >
      <Stack spacing={2.5} sx={{ maxWidth: 640 }}>
        <Typography variant="h2" sx={{ fontSize: '1.15rem' }}>
          {t('admin.customersProfileTitle')}
        </Typography>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <TextField
            label={t('book.firstName')}
            value={firstName}
            onChange={(event) => {
              setFirstName(event.target.value)
              setDirty(true)
            }}
            required
            fullWidth
            size="small"
          />
          <TextField
            label={t('book.lastName')}
            value={lastName}
            onChange={(event) => {
              setLastName(event.target.value)
              setDirty(true)
            }}
            fullWidth
            size="small"
          />
        </Stack>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <TextField
            label={t('admin.emailOptional')}
            type="email"
            value={email}
            onChange={(event) => {
              setEmail(event.target.value)
              setDirty(true)
            }}
            fullWidth
            size="small"
          />
          <TextField
            label={t('book.phone')}
            value={phone}
            onChange={(event) => {
              setPhone(event.target.value)
              setDirty(true)
            }}
            fullWidth
            size="small"
          />
        </Stack>
        <TextField
          label={t('admin.customersStylistNotes')}
          placeholder={t('admin.customersStylistNotesHint')}
          helperText={t('admin.customersStylistNotesHint')}
          value={stylistNotes}
          onChange={(event) => {
            setStylistNotes(event.target.value)
            setDirty(true)
          }}
          fullWidth
          multiline
          minRows={3}
        />

        {saveError ? <Alert severity="error">{saveError}</Alert> : null}
        {archiveError ? <Alert severity="error">{archiveError}</Alert> : null}
        {saved && !dirty ? (
          <Typography role="status" sx={{ color: 'success.main', fontWeight: 600 }}>
            {t('admin.saved')}
          </Typography>
        ) : null}

        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={1.5}
          sx={{ justifyContent: 'space-between', alignItems: { sm: 'center' } }}
        >
          <Button
            type="submit"
            variant="contained"
            disabled={saving || firstName.trim().length === 0}
          >
            {saving ? t('admin.saving') : t('admin.save')}
          </Button>
          <Button
            color="error"
            variant="outlined"
            disabled={archiving || saving}
            onClick={onRequestArchive}
          >
            {t('admin.customersArchive')}
          </Button>
        </Stack>
      </Stack>
    </Paper>
  )
}

export const AdminCustomerDetailPage: React.FunctionComponent<AdminCustomerDetailPageProps> = ({
  detail,
  isLoading,
  isError,
  saving,
  saved,
  saveError,
  archiving,
  archiveError,
  onBackClick,
  onBookForCustomer,
  onOpenReservation,
  onSave,
  onArchive,
}) => {
  const { t, intlLocale } = useLocale()
  const [confirmArchive, setConfirmArchive] = useState(false)

  return (
    <Stack spacing={3}>
      <Paper sx={{ p: 3 }}>
        <Box
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 2,
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Box>
            <Typography variant="h1">
              {detail
                ? `${detail.customer.firstName} ${detail.customer.lastName}`.trim()
                : t('admin.customersTitle')}
            </Typography>
            <Button onClick={onBackClick} sx={{ mt: 1, pl: 0 }}>
              {t('admin.customersBack')}
            </Button>
          </Box>
          {detail ? (
            <Button variant="contained" onClick={() => onBookForCustomer(detail.customer)}>
              {t('admin.customersBookNew')}
            </Button>
          ) : null}
        </Box>
      </Paper>

      {isLoading ? <CircularProgress aria-label={t('admin.detailLoading')} /> : null}
      {isError ? <Alert severity="error">{t('admin.customersError')}</Alert> : null}

      {detail ? (
        <>
          <CustomerProfileForm
            key={detail.customer.updatedAt || detail.customer.id}
            customer={detail.customer}
            saving={saving}
            saved={saved}
            saveError={saveError}
            archiving={archiving}
            archiveError={archiveError}
            onSave={onSave}
            onRequestArchive={() => setConfirmArchive(true)}
          />

          <Paper sx={{ p: 3 }}>
            <Typography variant="h2" sx={{ fontSize: '1.15rem', mb: 2 }}>
              {t('admin.customersHistoryTitle', { count: detail.history.length })}
            </Typography>

            {detail.history.length === 0 ? (
              <Alert severity="info">{t('admin.customersHistoryEmpty')}</Alert>
            ) : (
              <Box sx={{ overflowX: 'auto' }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>{t('admin.time')}</TableCell>
                      <TableCell>{t('admin.services')}</TableCell>
                      <TableCell>{t('admin.customersDuration')}</TableCell>
                      <TableCell>{t('admin.status')}</TableCell>
                      <TableCell />
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {detail.history.map((item) =>
                      item.kind === 'reservation' ? (
                        <TableRow key={item.id} hover>
                          <TableCell>{formatViennaDateTime(item.startAt, intlLocale)}</TableCell>
                          <TableCell>
                            <Typography sx={{ fontWeight: 500 }}>{item.serviceName}</Typography>
                            {item.internalNote ? (
                              <Typography
                                variant="caption"
                                color="text.secondary"
                                sx={{ display: 'block' }}
                              >
                                {item.internalNote}
                              </Typography>
                            ) : null}
                            {item.notes ? (
                              <Typography
                                variant="caption"
                                color="text.secondary"
                                sx={{ display: 'block' }}
                              >
                                {item.notes}
                              </Typography>
                            ) : null}
                          </TableCell>
                          <TableCell>
                            {item.durationMinutes > 0
                              ? formatBookedTime(item.durationMinutes)
                              : '—'}
                          </TableCell>
                          <TableCell>
                            <Chip
                              size="small"
                              color={
                                reservationStatusColor[item.status as ReservationStatus] ??
                                'default'
                              }
                              label={t(`status.${item.status}` as MessageKey)}
                            />
                          </TableCell>
                          <TableCell align="right">
                            <Button
                              size="small"
                              onClick={() => onOpenReservation(item.reservationId)}
                            >
                              {t('admin.open')}
                            </Button>
                          </TableCell>
                        </TableRow>
                      ) : (
                        <TableRow key={item.id} hover>
                          <TableCell>{formatViennaDateTime(item.startAt, intlLocale)}</TableCell>
                          <TableCell>
                            <Typography sx={{ fontWeight: 500 }}>{item.title}</Typography>
                            {item.description ? (
                              <Typography
                                variant="caption"
                                color="text.secondary"
                                sx={{ display: 'block', whiteSpace: 'pre-wrap' }}
                              >
                                {item.description}
                              </Typography>
                            ) : null}
                          </TableCell>
                          <TableCell>
                            {item.durationMinutes > 0
                              ? formatBookedTime(item.durationMinutes)
                              : '—'}
                          </TableCell>
                          <TableCell>
                            <Chip
                              size="small"
                              variant="outlined"
                              label={t('admin.googleCalendarEventFallback')}
                            />
                          </TableCell>
                          <TableCell />
                        </TableRow>
                      ),
                    )}
                  </TableBody>
                </Table>
              </Box>
            )}
          </Paper>
        </>
      ) : null}

      <Dialog
        open={confirmArchive}
        onClose={() => {
          if (!archiving) setConfirmArchive(false)
        }}
        aria-labelledby="archive-customer-dialog-title"
      >
        <DialogTitle id="archive-customer-dialog-title">
          {t('admin.customersArchiveConfirmTitle')}
        </DialogTitle>
        <DialogContent>
          <DialogContentText>{t('admin.customersArchiveConfirmBody')}</DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button disabled={archiving} onClick={() => setConfirmArchive(false)}>
            {t('admin.dialogDismiss')}
          </Button>
          <Button
            color="error"
            variant="contained"
            disabled={archiving}
            onClick={() => {
              onArchive()
              setConfirmArchive(false)
            }}
          >
            {t('admin.customersArchive')}
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  )
}
