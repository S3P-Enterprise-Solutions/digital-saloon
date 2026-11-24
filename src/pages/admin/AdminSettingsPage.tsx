import type * as React from 'react'
import { useState } from 'react'
import {
  Alert,
  Box,
  Button,
  ButtonBase,
  CircularProgress,
  Divider,
  FormControl,
  FormControlLabel,
  FormLabel,
  InputAdornment,
  MenuItem,
  Chip,
  Paper,
  Radio,
  Switch,
  RadioGroup,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import ContentCutOutlinedIcon from '@mui/icons-material/ContentCutOutlined'
import HistoryOutlinedIcon from '@mui/icons-material/HistoryOutlined'
import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined'
import GroupOutlinedIcon from '@mui/icons-material/GroupOutlined'
import ScheduleOutlinedIcon from '@mui/icons-material/ScheduleOutlined'
import type {
  EmployeeAccountInput,
  NewAccountInput,
  StaffOverview,
} from '../../data/adminAccessApi'
import { formatViennaDateTime } from '../../data/dateFormat'
import type { EmployeeWithId } from '../../data/employees'
import type { GoogleCalendarStatus } from '../../data/googleCalendarApi'
import { emptySalon } from '../../data/salon'
import type { BookingSettings, ConfirmationMode, Salon, SalonDetails } from '../../data/schemas'
import {
  bookingNumbersOf,
  defaultBookingSettings,
  salonDetailsInputOf,
  slotIntervalChoices,
  validateBookingRules,
  validateSalonDetails,
  type BookingNumberField,
  type SalonDetailsField,
} from '../../data/settingsForm'
import { fieldIssueMessages } from '../../components/fieldIssueMessages'
import { useLocale } from '../../i18n'

export type SaveState = {
  saving: boolean
  saved: boolean
  error: string | null
}

export type AdminSettingsPageProps = {
  settings: BookingSettings | null | undefined
  settingsLoading: boolean
  settingsError: boolean
  settingsSave: SaveState
  onSaveSettings: (settings: BookingSettings) => void
  salon: Salon | null | undefined
  salonLoading: boolean
  salonSave: SaveState
  onSaveSalon: (details: SalonDetails) => void
  isOperator?: boolean
  isPrimaryAdmin?: boolean
  demoMode?: {
    enabled: boolean
    loading: boolean
    saving: boolean
    error: string | null
    onToggle: (enabled: boolean) => void
  }
  staffOverview?: StaffOverview
  onCreateFirstAdmin?: (input: NewAccountInput) => Promise<void>
  onCreateEmployee?: (input: EmployeeAccountInput) => Promise<void>
  employeeManagementEnabled?: boolean
  onEmployeesClick?: () => void
  onServicesClick: () => void
  onHomepageClick: () => void
  onOpeningHoursClick: () => void
  onActivityLogsClick: () => void
  expireBusy: boolean
  expireMessage: string | null
  expireError: string | null
  onExpirePendingClick: () => void
  googleCalendar?: {
    employees?: EmployeeWithId[]
    selectedEmployeeId?: string | null
    onSelectEmployee?: (employeeId: string | null) => void
    status: GoogleCalendarStatus | undefined
    loading: boolean
    error: string | null
    oauthCallbackResult?: 'connected' | 'error'
    connecting: boolean
    selecting: boolean
    syncing: boolean
    disconnecting: boolean
    actionError: string | null
    syncMessage: string | null
    onConnect: () => void
    onSelectCalendar: (calendarId: string) => void
    onSyncNow: () => void
    onDisconnect: () => void
  }
}

type SettingsLinkProps = {
  icon: React.ReactNode
  title: string
  hint: string
  onClick: () => void
}

/** One row of the "Salon" index: a sub-page with its own editor. */
const SettingsLink: React.FunctionComponent<SettingsLinkProps> = ({
  icon,
  title,
  hint,
  onClick,
}) => (
  <ButtonBase
    onClick={onClick}
    sx={{
      width: '100%',
      display: 'flex',
      alignItems: 'center',
      gap: 2,
      px: { xs: 2, sm: 3 },
      py: 2,
      textAlign: 'left',
      justifyContent: 'flex-start',
      '&:hover, &.Mui-focusVisible': { bgcolor: 'action.hover' },
      '& .settings-link-chevron': { transition: 'transform 120ms ease' },
      '&:hover .settings-link-chevron': { transform: 'translateX(2px)' },
    }}
  >
    <Box sx={{ color: 'primary.main', display: 'flex' }}>{icon}</Box>
    <Box sx={{ flexGrow: 1, minWidth: 0 }}>
      <Typography sx={{ fontWeight: 600, fontSize: '1.0625rem' }}>{title}</Typography>
      <Typography variant="body2" color="text.secondary">
        {hint}
      </Typography>
    </Box>
    <ChevronRightIcon className="settings-link-chevron" color="action" />
  </ButtonBase>
)

type SaveFeedbackProps = {
  save: SaveState
  dirty: boolean
}

const SaveFeedback: React.FunctionComponent<SaveFeedbackProps> = ({ save, dirty }) => {
  const { t } = useLocale()
  if (save.error) {
    return <Alert severity="error">{t('admin.saveFailed', { message: save.error })}</Alert>
  }
  if (save.saved && !dirty) {
    return (
      <Typography role="status" sx={{ color: 'success.main', fontWeight: 600 }}>
        {t('admin.saved')}
      </Typography>
    )
  }
  return null
}

type BookingRulesFormProps = {
  initial: BookingSettings
  save: SaveState
  onSave: (settings: BookingSettings) => void
}

const BookingRulesForm: React.FunctionComponent<BookingRulesFormProps> = ({
  initial,
  save,
  onSave,
}) => {
  const { t } = useLocale()
  const [mode, setMode] = useState<ConfirmationMode>(initial.confirmationMode)
  const [slotInterval, setSlotInterval] = useState(initial.slotIntervalMinutes)
  const [numbers, setNumbers] = useState(bookingNumbersOf(initial))
  const [errors, setErrors] = useState<Partial<Record<BookingNumberField, string>>>({})
  const [dirty, setDirty] = useState(false)
  const intervalOptions = slotIntervalChoices(initial.slotIntervalMinutes)

  const numberField = (field: BookingNumberField, label: string, unit: string, hint: string) => (
    <TextField
      label={label}
      value={numbers[field]}
      onChange={(event) => {
        setNumbers((current) => ({ ...current, [field]: event.target.value }))
        setDirty(true)
      }}
      error={errors[field] !== undefined}
      helperText={errors[field] ?? hint}
      slotProps={{
        htmlInput: { inputMode: 'numeric' },
        input: { endAdornment: <InputAdornment position="end">{unit}</InputAdornment> },
      }}
      sx={{ maxWidth: 360 }}
    />
  )

  return (
    <Box
      component="form"
      noValidate
      onSubmit={(event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        const result = validateBookingRules({
          confirmationMode: mode,
          slotIntervalMinutes: slotInterval,
          numbers,
        })
        if (!result.ok) {
          setErrors(fieldIssueMessages(t, result.issues))
          return
        }
        setErrors({})
        setDirty(false)
        onSave(result.value)
      }}
    >
      <Stack spacing={3}>
        <FormControl>
          <FormLabel id="settings-mode" sx={{ mb: 1, color: 'text.primary', fontWeight: 600 }}>
            {t('admin.confirmationMode')}
          </FormLabel>
          <RadioGroup
            aria-labelledby="settings-mode"
            value={mode}
            onChange={(event) => {
              setMode(event.target.value === 'MANUAL' ? 'MANUAL' : 'AUTOMATIC')
              setDirty(true)
            }}
          >
            <FormControlLabel
              value="AUTOMATIC"
              control={<Radio />}
              label={
                <Box>
                  <Typography>{t('admin.modeAutomatic')}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {t('admin.modeAutomaticHint')}
                  </Typography>
                </Box>
              }
              sx={{ alignItems: 'flex-start', mb: 1, '& .MuiRadio-root': { pt: 0.5 } }}
            />
            <FormControlLabel
              value="MANUAL"
              control={<Radio />}
              label={
                <Box>
                  <Typography>{t('admin.modeManual')}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {t('admin.modeManualHint')}
                  </Typography>
                </Box>
              }
              sx={{ alignItems: 'flex-start', '& .MuiRadio-root': { pt: 0.5 } }}
            />
          </RadioGroup>
        </FormControl>

        <TextField
          select
          label={t('admin.slotInterval')}
          value={slotInterval}
          onChange={(event) => {
            setSlotInterval(Number(event.target.value))
            setDirty(true)
          }}
          helperText={t('admin.slotIntervalHint')}
          sx={{ maxWidth: 360 }}
        >
          {intervalOptions.map((minutes) => (
            <MenuItem key={minutes} value={minutes}>
              {minutes} {t('admin.unitMinutes')}
            </MenuItem>
          ))}
        </TextField>

        {numberField(
          'minAdvanceBookingMinutes',
          t('admin.minAdvance'),
          t('admin.unitMinutes'),
          t('admin.minAdvanceHint'),
        )}
        {numberField(
          'maxAdvanceBookingDays',
          t('admin.maxAdvance'),
          t('admin.unitDays'),
          t('admin.maxAdvanceHint'),
        )}
        {numberField(
          'pendingExpirationHours',
          t('admin.pendingExpiration'),
          t('admin.unitHours'),
          t('admin.pendingExpirationHint'),
        )}

        <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
          <Button type="submit" variant="contained" disabled={save.saving}>
            {save.saving ? t('admin.saving') : t('admin.save')}
          </Button>
          <SaveFeedback save={save} dirty={dirty} />
        </Stack>
      </Stack>
    </Box>
  )
}

type SalonDetailsFormProps = {
  initial: Salon
  save: SaveState
  onSave: (details: SalonDetails) => void
}

const SalonDetailsForm: React.FunctionComponent<SalonDetailsFormProps> = ({
  initial,
  save,
  onSave,
}) => {
  const { t } = useLocale()
  const [values, setValues] = useState(salonDetailsInputOf(initial))
  const [errors, setErrors] = useState<Partial<Record<SalonDetailsField, string>>>({})
  const [dirty, setDirty] = useState(false)

  const field = (name: SalonDetailsField, label: string, autoComplete: string) => (
    <TextField
      label={label}
      value={values[name]}
      onChange={(event) => {
        setValues((current) => ({ ...current, [name]: event.target.value }))
        setDirty(true)
      }}
      error={errors[name] !== undefined}
      helperText={errors[name]}
      required={name !== 'vatId'}
      autoComplete={autoComplete}
      fullWidth
    />
  )

  return (
    <Box
      component="form"
      noValidate
      onSubmit={(event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        const result = validateSalonDetails(values)
        if (!result.ok) {
          setErrors(fieldIssueMessages(t, result.issues))
          return
        }
        setErrors({})
        setDirty(false)
        onSave(result.value)
      }}
    >
      <Stack spacing={2.5}>
        {field('name', t('admin.fieldName'), 'organization')}
        {field('address', t('admin.fieldAddress'), 'street-address')}
        {field('phone', t('admin.fieldPhone'), 'tel')}
        {field('email', t('admin.fieldEmail'), 'email')}
        {field('vatId', t('admin.fieldVatId'), 'off')}
        <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
          <Button type="submit" variant="contained" disabled={save.saving}>
            {save.saving ? t('admin.saving') : t('admin.save')}
          </Button>
          <SaveFeedback save={save} dirty={dirty} />
        </Stack>
      </Stack>
    </Box>
  )
}

type NewAccountFormProps =
  | {
      buttonLabel: string
      successMessage: string
      nameFields: 'displayName'
      onCreate: (input: NewAccountInput) => Promise<void>
    }
  | {
      buttonLabel: string
      successMessage: string
      nameFields: 'firstLast'
      onCreate: (input: EmployeeAccountInput) => Promise<void>
    }

const NewAccountForm: React.FunctionComponent<NewAccountFormProps> = (props) => {
  const { buttonLabel, successMessage, nameFields } = props
  const { t } = useLocale()
  const [displayName, setDisplayName] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [created, setCreated] = useState(false)

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    setCreated(false)
    setSubmitting(true)
    try {
      if (props.nameFields === 'displayName') {
        await props.onCreate({ displayName, email, password })
        setDisplayName('')
      } else {
        await props.onCreate({ firstName, lastName, email, password })
        setFirstName('')
        setLastName('')
      }
      setEmail('')
      setPassword('')
      setCreated(true)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Box component="form" onSubmit={(event) => void handleSubmit(event)} sx={{ maxWidth: 420 }}>
      <Stack spacing={2}>
        {nameFields === 'displayName' ? (
          <TextField
            label={t('admin.accountDisplayName')}
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
            required
            fullWidth
            size="small"
          />
        ) : (
          <>
            <TextField
              label={t('admin.fieldFirstName')}
              value={firstName}
              onChange={(event) => setFirstName(event.target.value)}
              required
              fullWidth
              size="small"
            />
            <TextField
              label={t('admin.fieldLastName')}
              value={lastName}
              onChange={(event) => setLastName(event.target.value)}
              required
              fullWidth
              size="small"
            />
          </>
        )}
        <TextField
          label={t('admin.accountEmail')}
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
          fullWidth
          size="small"
        />
        <TextField
          label={t('admin.accountPassword')}
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
          fullWidth
          size="small"
          slotProps={{ htmlInput: { minLength: 8 } }}
        />
        {error ? <Alert severity="error">{error}</Alert> : null}
        {created ? (
          <Typography role="status" sx={{ color: 'success.main', fontWeight: 600 }}>
            {successMessage}
          </Typography>
        ) : null}
        <Box>
          <Button type="submit" variant="contained" disabled={submitting}>
            {submitting ? t('admin.saving') : buttonLabel}
          </Button>
        </Box>
      </Stack>
    </Box>
  )
}

type GoogleCalendarSectionProps = {
  state: NonNullable<AdminSettingsPageProps['googleCalendar']>
}

const GoogleCalendarSection: React.FunctionComponent<GoogleCalendarSectionProps> = ({ state }) => {
  const { t, locale } = useLocale()
  const [customCalendarId, setCustomCalendarId] = useState('')
  const status = state.status

  return (
    <Paper
      component="section"
      aria-labelledby="settings-google-calendar"
      sx={{ p: { xs: 2, sm: 3 } }}
    >
      <Typography id="settings-google-calendar" variant="h2" sx={{ mb: 0.5 }}>
        {t('admin.googleCalendarTitle')}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {t('admin.googleCalendarHint')}
      </Typography>

      {state.employees && state.employees.length > 0 && state.onSelectEmployee ? (
        <TextField
          select
          label={t('admin.googleCalendarForEmployee')}
          value={state.selectedEmployeeId ?? ''}
          onChange={(event) => state.onSelectEmployee?.(event.target.value || null)}
          sx={{ mb: 2.5, maxWidth: 420 }}
          fullWidth
        >
          <MenuItem value="">{t('admin.googleCalendarSalonWide')}</MenuItem>
          {state.employees.map((emp) => (
            <MenuItem key={emp.id} value={emp.id}>
              {emp.displayName}
            </MenuItem>
          ))}
        </TextField>
      ) : null}

      {state.oauthCallbackResult === 'connected' ? (
        <Alert severity="success" sx={{ mb: 2 }}>
          {t('admin.googleCalendarConnectedBanner')}
        </Alert>
      ) : null}
      {state.oauthCallbackResult === 'error' ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          {t('admin.googleCalendarErrorBanner')}
        </Alert>
      ) : null}

      {state.loading ? <CircularProgress size={24} /> : null}
      {state.error ? <Alert severity="error">{state.error}</Alert> : null}

      {!state.loading && !state.error && status ? (
        <Stack spacing={2}>
          {!status.oauthConfigured ? (
            <Alert severity="info">{t('admin.googleCalendarNotConfigured')}</Alert>
          ) : null}

          {!status.connected ? (
            <Box>
              <Button
                variant="contained"
                disabled={!status.oauthConfigured || state.connecting}
                onClick={state.onConnect}
              >
                {t('admin.googleCalendarConnect')}
              </Button>
            </Box>
          ) : (
            <Stack spacing={2}>
              <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
                <Chip color="success" size="small" label={status.calendarSummary ?? 'Google'} />
                {status.accountEmail ? (
                  <Typography variant="body2" color="text.secondary">
                    {t('admin.googleCalendarConnectedAs', { email: status.accountEmail })}
                  </Typography>
                ) : null}
              </Stack>

              {status.availableCalendars.length > 0 ? (
                <TextField
                  select
                  label={t('admin.googleCalendarSelectLabel')}
                  value={status.calendarId ?? ''}
                  disabled={state.selecting || state.syncing}
                  onChange={(event) => {
                    if (event.target.value) state.onSelectCalendar(event.target.value)
                  }}
                  sx={{ maxWidth: 420 }}
                >
                  {status.availableCalendars.map((cal) => (
                    <MenuItem key={cal.id} value={cal.id}>
                      {cal.summary}
                      {cal.primary ? ' (Primary)' : ''}
                    </MenuItem>
                  ))}
                </TextField>
              ) : null}

              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                spacing={1.5}
                sx={{ alignItems: { sm: 'center' } }}
              >
                <TextField
                  label={t('admin.googleCalendarCustomIdLabel')}
                  value={customCalendarId}
                  onChange={(event) => setCustomCalendarId(event.target.value)}
                  size="small"
                  sx={{ flexGrow: 1, maxWidth: 360 }}
                />
                <Button
                  variant="outlined"
                  disabled={!customCalendarId.trim() || state.selecting}
                  onClick={() => {
                    state.onSelectCalendar(customCalendarId.trim())
                    setCustomCalendarId('')
                  }}
                >
                  {t('admin.googleCalendarUseId')}
                </Button>
              </Stack>

              {status.lastSyncAt ? (
                <Typography variant="body2" color="text.secondary">
                  {t('admin.googleCalendarLastSync', {
                    time: formatViennaDateTime(status.lastSyncAt, locale),
                  })}
                </Typography>
              ) : null}

              {status.lastSyncStatus === 'ERROR' && status.lastSyncError ? (
                <Alert severity="warning">{status.lastSyncError}</Alert>
              ) : null}

              <Stack direction="row" spacing={1.5} sx={{ flexWrap: 'wrap' }}>
                <Button
                  variant="contained"
                  disabled={!status.calendarId || state.syncing || state.disconnecting}
                  onClick={state.onSyncNow}
                >
                  {t('admin.googleCalendarSyncNow')}
                </Button>
                <Button
                  variant="outlined"
                  color="error"
                  disabled={state.disconnecting || state.syncing}
                  onClick={state.onDisconnect}
                >
                  {t('admin.googleCalendarDisconnect')}
                </Button>
              </Stack>
            </Stack>
          )}

          {state.syncMessage ? <Alert severity="success">{state.syncMessage}</Alert> : null}
          {state.actionError ? <Alert severity="error">{state.actionError}</Alert> : null}
        </Stack>
      ) : null}
    </Paper>
  )
}

export const AdminSettingsPage: React.FunctionComponent<AdminSettingsPageProps> = ({
  settings,
  settingsLoading,
  settingsError,
  settingsSave,
  onSaveSettings,
  salon,
  salonLoading,
  salonSave,
  onSaveSalon,
  isOperator,
  isPrimaryAdmin,
  demoMode,
  staffOverview,
  onCreateFirstAdmin,
  onCreateEmployee,
  employeeManagementEnabled,
  onEmployeesClick,
  onServicesClick,
  onHomepageClick,
  onOpeningHoursClick,
  onActivityLogsClick,
  expireBusy,
  expireMessage,
  expireError,
  onExpirePendingClick,
  googleCalendar,
}) => {
  const { t } = useLocale()

  return (
    <Stack spacing={4} sx={{ maxWidth: 760 }}>
      <Box>
        <Typography variant="h1">{t('admin.settings')}</Typography>
        <Typography color="text.secondary" sx={{ mt: 0.5 }}>
          {t('admin.settingsSubtitle')}
        </Typography>
      </Box>

      <Paper component="nav" aria-label={t('admin.salonAreas')} sx={{ overflow: 'hidden' }}>
        <SettingsLink
          icon={<ContentCutOutlinedIcon />}
          title={t('admin.services')}
          hint={t('admin.servicesHint')}
          onClick={onServicesClick}
        />
        {employeeManagementEnabled && onEmployeesClick ? (
          <>
            <Divider />
            <SettingsLink
              icon={<GroupOutlinedIcon />}
              title={t('admin.employeesNavTitle')}
              hint={t('admin.employeesNavHint')}
              onClick={onEmployeesClick}
            />
          </>
        ) : null}
        <Divider />
        <SettingsLink
          icon={<ScheduleOutlinedIcon />}
          title={t('hours.title')}
          hint={t('hours.absencesHint')}
          onClick={onOpeningHoursClick}
        />
        <Divider />
        <SettingsLink
          icon={<HomeOutlinedIcon />}
          title={t('admin.homepage')}
          hint={t('admin.homepageSubtitle')}
          onClick={onHomepageClick}
        />
        <Divider />
        <SettingsLink
          icon={<HistoryOutlinedIcon />}
          title={t('admin.activityLogsLinkTitle')}
          hint={t('admin.activityLogsLinkHint')}
          onClick={onActivityLogsClick}
        />
      </Paper>

      <Paper component="section" aria-labelledby="settings-booking" sx={{ p: { xs: 2, sm: 3 } }}>
        <Typography id="settings-booking" variant="h2" sx={{ mb: 2.5 }}>
          {t('admin.bookingRulesTitle')}
        </Typography>
        {settingsLoading ? <CircularProgress aria-label={t('admin.settingsLoading')} /> : null}
        {settingsError ? <Alert severity="error">{t('admin.settingsError')}</Alert> : null}
        {!settingsLoading && !settingsError ? (
          <BookingRulesForm
            initial={settings ?? defaultBookingSettings}
            save={settingsSave}
            onSave={onSaveSettings}
          />
        ) : null}

        <Divider sx={{ my: 3 }} />
        <Box component="section" aria-labelledby="settings-expire">
          <Typography id="settings-expire" sx={{ fontWeight: 600 }}>
            {t('admin.maintenance')}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, mb: 2 }}>
            {t('admin.maintenanceHint')}
          </Typography>
          <Button variant="outlined" disabled={expireBusy} onClick={onExpirePendingClick}>
            {t('admin.expirePending')}
          </Button>
          {expireMessage ? (
            <Alert severity="success" sx={{ mt: 2 }}>
              {expireMessage}
            </Alert>
          ) : null}
          {expireError ? (
            <Alert severity="error" sx={{ mt: 2 }}>
              {expireError}
            </Alert>
          ) : null}
        </Box>
      </Paper>

      <Paper component="section" aria-labelledby="settings-salon" sx={{ p: { xs: 2, sm: 3 } }}>
        <Typography id="settings-salon" variant="h2" sx={{ mb: 0.5 }}>
          {t('admin.salonDetailsTitle')}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
          {t('admin.salonDetailsHint')}
        </Typography>
        {salonLoading ? <CircularProgress aria-label={t('admin.loading')} /> : null}
        {!salonLoading ? (
          <SalonDetailsForm
            key={salon ? 'loaded' : 'empty'}
            initial={salon ?? emptySalon}
            save={salonSave}
            onSave={onSaveSalon}
          />
        ) : null}
      </Paper>

      {googleCalendar ? <GoogleCalendarSection state={googleCalendar} /> : null}

      {isOperator && demoMode ? (
        <Paper component="section" aria-labelledby="settings-demo" sx={{ p: { xs: 2, sm: 3 } }}>
          <Typography id="settings-demo" variant="h2" sx={{ mb: 0.5 }}>
            {t('admin.demoModeTitle')}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {t('admin.demoModeHint')}
          </Typography>
          {demoMode.loading ? (
            <CircularProgress size={24} />
          ) : (
            <FormControlLabel
              control={
                <Switch
                  checked={demoMode.enabled}
                  disabled={demoMode.saving}
                  onChange={(event) => demoMode.onToggle(event.target.checked)}
                />
              }
              label={t('admin.demoModeSwitch')}
            />
          )}
          {demoMode.error ? (
            <Alert severity="error" sx={{ mt: 1.5 }}>
              {demoMode.error}
            </Alert>
          ) : null}
        </Paper>
      ) : null}

      {isOperator && onCreateFirstAdmin ? (
        <Paper
          component="section"
          aria-labelledby="settings-first-admin"
          sx={{ p: { xs: 2, sm: 3 } }}
        >
          <Typography id="settings-first-admin" variant="h2" sx={{ mb: 0.5 }}>
            {t('admin.firstAdminTitle')}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {t('admin.firstAdminHint')}
          </Typography>
          {staffOverview?.hasPrimaryAdmin ? (
            <Alert severity="info">{t('admin.firstAdminAlreadyExists')}</Alert>
          ) : (
            <NewAccountForm
              nameFields="displayName"
              buttonLabel={t('admin.firstAdminCreateButton')}
              successMessage={t('admin.firstAdminCreated')}
              onCreate={onCreateFirstAdmin}
            />
          )}
        </Paper>
      ) : null}

      {isPrimaryAdmin && onCreateEmployee && !employeeManagementEnabled ? (
        <Paper
          component="section"
          aria-labelledby="settings-employees"
          sx={{ p: { xs: 2, sm: 3 } }}
        >
          <Typography id="settings-employees" variant="h2" sx={{ mb: 0.5 }}>
            {t('admin.employeesTitle')}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {t('admin.employeesHint')}
          </Typography>
          {staffOverview && staffOverview.staff.length > 0 ? (
            <Stack spacing={1} sx={{ mb: 2.5 }}>
              {staffOverview.staff.map((member) => (
                <Box
                  key={member.uid}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                    py: 0.75,
                    borderBottom: 1,
                    borderColor: 'divider',
                  }}
                >
                  <Typography sx={{ fontWeight: 600 }}>{member.displayName}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {member.email}
                  </Typography>
                  {member.isPrimaryAdmin ? (
                    <Chip size="small" label={t('admin.primaryAdminBadge')} />
                  ) : null}
                </Box>
              ))}
            </Stack>
          ) : null}
          <NewAccountForm
            nameFields="firstLast"
            buttonLabel={t('admin.employeeCreateButton')}
            successMessage={t('admin.employeeCreated')}
            onCreate={onCreateEmployee}
          />
        </Paper>
      ) : null}
    </Stack>
  )
}
