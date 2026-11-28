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
import AddIcon from '@mui/icons-material/Add'
import NotesOutlinedIcon from '@mui/icons-material/NotesOutlined'

import type { SaveCustomerInput } from '../../data/customersApi'
import { formatViennaDateTime } from '../../data/dateFormat'
import type { Customer } from '../../data/schemas'
import { useLocale } from '../../i18n'

export type AdminCustomersPageProps = {
  customers: Customer[] | undefined
  searchQuery: string
  onSearchChange: (next: string) => void
  isLoading: boolean
  isError: boolean
  saving: boolean
  saveError: string | null
  onSelectCustomer: (customerId: string) => void
  onCreateCustomer: (input: SaveCustomerInput) => Promise<void>
}

export const AdminCustomersPage: React.FunctionComponent<AdminCustomersPageProps> = ({
  customers,
  searchQuery,
  onSearchChange,
  isLoading,
  isError,
  saving,
  saveError,
  onSelectCustomer,
  onCreateCustomer,
}) => {
  const { t, intlLocale } = useLocale()
  const [createOpen, setCreateOpen] = useState(false)
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [stylistNotes, setStylistNotes] = useState('')

  const resetForm = () => {
    setFirstName('')
    setLastName('')
    setEmail('')
    setPhone('')
    setStylistNotes('')
  }

  const handleCreate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!firstName.trim()) return
    await onCreateCustomer({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim() || null,
      phone: phone.trim() || null,
      stylistNotes: stylistNotes.trim() || null,
    })
    resetForm()
    setCreateOpen(false)
  }

  return (
    <Stack spacing={3}>
      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 2,
          alignItems: 'flex-end',
          justifyContent: 'space-between',
        }}
      >
        <Box>
          <Typography variant="h1">{t('admin.customersTitle')}</Typography>
          <Typography color="text.secondary" sx={{ mt: 0.5 }}>
            {t('admin.customersSubtitle')}
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => {
            setCreateOpen(true)
          }}
        >
          {t('admin.customersAdd')}
        </Button>
      </Box>

      <TextField
        value={searchQuery}
        onChange={(event) => onSearchChange(event.target.value)}
        placeholder={t('admin.customersSearchPlaceholder')}
        size="small"
        sx={{ maxWidth: 460 }}
        fullWidth
      />

      {isLoading ? <CircularProgress aria-label={t('admin.loading')} /> : null}
      {isError ? <Alert severity="error">{t('admin.customersError')}</Alert> : null}

      {!isLoading && !isError && customers && customers.length === 0 ? (
        <Alert severity="info">{t('admin.customersEmpty')}</Alert>
      ) : null}

      {customers && customers.length > 0 ? (
        <Paper sx={{ overflowX: 'auto' }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>{t('admin.customer')}</TableCell>
                <TableCell>{t('admin.customersContact')}</TableCell>
                <TableCell>{t('admin.customersVisits')}</TableCell>
                <TableCell>{t('admin.customersLastVisit')}</TableCell>
                <TableCell />
              </TableRow>
            </TableHead>
            <TableBody>
              {customers.map((customer) => (
                <TableRow
                  key={customer.id}
                  hover
                  sx={{ cursor: 'pointer' }}
                  onClick={() => onSelectCustomer(customer.id)}
                >
                  <TableCell>
                    <Stack
                      direction="row"
                      spacing={1}
                      sx={{ alignItems: 'center', flexWrap: 'wrap' }}
                    >
                      <Typography sx={{ fontWeight: 600 }}>
                        {customer.firstName} {customer.lastName}
                      </Typography>
                      {customer.source === 'GOOGLE_CALENDAR' ? (
                        <Chip
                          size="small"
                          variant="outlined"
                          label={t('admin.googleCalendarEventFallback')}
                        />
                      ) : null}
                      {customer.stylistNotes ? (
                        <Chip
                          size="small"
                          icon={<NotesOutlinedIcon />}
                          label={t('admin.customersHasNotes')}
                        />
                      ) : null}
                    </Stack>
                  </TableCell>
                  <TableCell>
                    <Stack spacing={0.25}>
                      {customer.email ? (
                        <Typography variant="body2">{customer.email}</Typography>
                      ) : null}
                      {customer.phone ? (
                        <Typography variant="body2" color="text.secondary">
                          {customer.phone}
                        </Typography>
                      ) : null}
                      {!customer.email && !customer.phone ? (
                        <Typography variant="body2" color="text.secondary">
                          —
                        </Typography>
                      ) : null}
                    </Stack>
                  </TableCell>
                  <TableCell>{customer.visitCount}</TableCell>
                  <TableCell>
                    {customer.lastVisitAt
                      ? formatViennaDateTime(customer.lastVisitAt, intlLocale)
                      : '—'}
                  </TableCell>
                  <TableCell align="right">
                    <Button
                      size="small"
                      onClick={(event) => {
                        event.stopPropagation()
                        onSelectCustomer(customer.id)
                      }}
                    >
                      {t('admin.open')}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>
      ) : null}

      <Dialog
        open={createOpen}
        onClose={() => {
          if (!saving) setCreateOpen(false)
        }}
        maxWidth="sm"
        fullWidth
        aria-labelledby="create-customer-dialog-title"
      >
        <Box component="form" onSubmit={(event) => void handleCreate(event)}>
          <DialogTitle id="create-customer-dialog-title">{t('admin.customersAdd')}</DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ pt: 1 }}>
              <TextField
                label={t('book.firstName')}
                value={firstName}
                onChange={(event) => setFirstName(event.target.value)}
                required
                fullWidth
                size="small"
              />
              <TextField
                label={t('book.lastName')}
                value={lastName}
                onChange={(event) => setLastName(event.target.value)}
                fullWidth
                size="small"
              />
              <TextField
                label={t('admin.emailOptional')}
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                fullWidth
                size="small"
              />
              <TextField
                label={t('book.phone')}
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                fullWidth
                size="small"
              />
              <TextField
                label={t('admin.customersStylistNotes')}
                placeholder={t('admin.customersStylistNotesHint')}
                value={stylistNotes}
                onChange={(event) => setStylistNotes(event.target.value)}
                fullWidth
                multiline
                minRows={3}
                size="small"
              />
              {saveError ? <Alert severity="error">{saveError}</Alert> : null}
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button disabled={saving} onClick={() => setCreateOpen(false)}>
              {t('admin.dialogDismiss')}
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={saving || firstName.trim().length === 0}
            >
              {saving ? t('admin.saving') : t('admin.save')}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
    </Stack>
  )
}
