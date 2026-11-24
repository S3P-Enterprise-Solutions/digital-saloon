import type * as React from 'react'
import { useState } from 'react'
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  FormControlLabel,
  InputLabel,
  ListItemText,
  MenuItem,
  OutlinedInput,
  Select,
  type SelectChangeEvent,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@mui/material'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import PersonAddAlt1OutlinedIcon from '@mui/icons-material/PersonAddAlt1Outlined'

import type { EmployeeAccountInput, StaffMember } from '../../data/adminAccessApi'
import { EmployeeDayExceptionForm } from '../../components/EmployeeDayExceptionForm'
import { WeeklyHoursForm, type HoursSaveState } from '../../components/WeeklyHoursForm'
import type { CreateEmployeeProfileForAdminInput } from '../../data/employeeAdminApi'
import type {
  EmployeeDayExceptionWithId,
  EmployeeWorkingHoursByWeekday,
} from '../../data/employeeSchedule'
import { weeklyDraftOf, type WeeklyDraft } from '../../data/openingHoursForm'
import type { EmployeeWithId } from '../../data/employees'
import { bilingualServiceName } from '../../data/serviceForm'
import type { ServiceWithId } from '../../data/services'
import { translateEmployeeCallableError } from '../../data/employeeCallableErrors'
import type { TimeInterval } from '../../data/schemas'
import { useLocale } from '../../i18n'

export type AdminEmployeesPageProps = {
  employees: EmployeeWithId[] | undefined
  isLoading: boolean
  isError: boolean
  linkableAdmins: StaffMember[]
  services: ServiceWithId[] | undefined
  servicesLoading: boolean
  isPrimaryAdmin: boolean
  selectedEmployeeId: string | null
  onSelectEmployee: (employeeId: string | null) => void
  onBackClick: () => void
  onCreateEmployeeAccount: (input: EmployeeAccountInput) => Promise<void>
  onLinkAdminProfile: (input: CreateEmployeeProfileForAdminInput) => Promise<void>
  onSaveProfile: (input: {
    employeeUid: string
    firstName: string
    lastName: string
    serviceIds: string[]
  }) => Promise<void>
  onSetBookable: (employeeUid: string, active: boolean) => Promise<void>
  onSetAuthDisabled: (employeeUid: string, disabled: boolean) => Promise<void>
  onSetPassword: (employeeUid: string, password: string) => Promise<void>
  onSoftRemove: (employeeUid: string) => Promise<void>
  employeeWeekly: EmployeeWorkingHoursByWeekday | undefined
  employeeWeeklyLoading: boolean
  employeeWeeklyError: boolean
  weeklyHoursSave: HoursSaveState
  onSaveWeeklyHours: (draft: WeeklyDraft) => void
  employeeDayExceptions: EmployeeDayExceptionWithId[] | undefined
  employeeDayExceptionsLoading: boolean
  employeeDayExceptionsError: boolean
  onSaveDayException: (input: {
    employeeUid: string
    exceptionId: string
    date: string
    closed: boolean
    intervals?: TimeInterval[]
  }) => Promise<void>
  onDeleteDayException: (input: { employeeUid: string; exceptionId: string }) => Promise<void>
  todayYmd: string
  bookableBusy: boolean
  authBusy: boolean
  profileBusy: boolean
  createBusy: boolean
  linkBusy: boolean
  removeBusy: boolean
  passwordBusy: boolean
  dayExceptionBusy: boolean
}

const CreateAccountSection: React.FunctionComponent<{
  busy: boolean
  onCreate: (input: EmployeeAccountInput) => Promise<void>
}> = ({ busy, onCreate }) => {
  const { t } = useLocale()
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  return (
    <Box
      component="form"
      noValidate
      onSubmit={(event) => {
        event.preventDefault()
        setError(null)
        setDone(false)
        void onCreate({ firstName, lastName, email, password })
          .then(() => {
            setFirstName('')
            setLastName('')
            setEmail('')
            setPassword('')
            setDone(true)
          })
          .catch((err: unknown) => {
            setError(translateEmployeeCallableError(err, t))
          })
      }}
    >
      <Typography component="h3" sx={{ fontWeight: 600, mb: 1 }}>
        {t('admin.employeesCreateAccountTitle')}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {t('admin.employeesCreateAccountHint')}
      </Typography>
      <Stack spacing={2}>
        <TextField
          label={t('admin.fieldFirstName')}
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          required
          fullWidth
          size="small"
        />
        <TextField
          label={t('admin.fieldLastName')}
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          required
          fullWidth
          size="small"
        />
        <TextField
          label={t('admin.accountEmail')}
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          fullWidth
          size="small"
        />
        <TextField
          label={t('admin.accountPassword')}
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          fullWidth
          size="small"
          slotProps={{ htmlInput: { minLength: 8 } }}
        />
        {error ? <Alert severity="error">{error}</Alert> : null}
        {done ? (
          <Typography role="status" sx={{ color: 'success.main', fontWeight: 600 }}>
            {t('admin.employeeCreated')}
          </Typography>
        ) : null}
        <Button type="submit" variant="contained" disabled={busy}>
          {busy ? t('admin.saving') : t('admin.employeeCreateButton')}
        </Button>
      </Stack>
    </Box>
  )
}

const LinkAdminSection: React.FunctionComponent<{
  linkableAdmins: StaffMember[]
  busy: boolean
  onLink: (input: CreateEmployeeProfileForAdminInput) => Promise<void>
}> = ({ linkableAdmins, busy, onLink }) => {
  const { t } = useLocale()
  const [adminUid, setAdminUid] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  if (linkableAdmins.length === 0) {
    return (
      <Box>
        <Typography component="h3" sx={{ fontWeight: 600, mb: 1 }}>
          {t('admin.employeesLinkAdminTitle')}
        </Typography>
        <Alert severity="info">{t('admin.employeesNoLinkableAdmins')}</Alert>
      </Box>
    )
  }

  return (
    <Box
      component="form"
      noValidate
      onSubmit={(event) => {
        event.preventDefault()
        setError(null)
        setDone(false)
        void onLink({ adminUid, firstName, lastName })
          .then(() => {
            setAdminUid('')
            setFirstName('')
            setLastName('')
            setDone(true)
          })
          .catch((err: unknown) => {
            setError(translateEmployeeCallableError(err, t))
          })
      }}
    >
      <Typography component="h3" sx={{ fontWeight: 600, mb: 1 }}>
        {t('admin.employeesLinkAdminTitle')}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {t('admin.employeesLinkAdminHint')}
      </Typography>
      <Stack spacing={2}>
        <TextField
          select
          label={t('admin.employeesLinkAdminPick')}
          value={adminUid}
          onChange={(e) => setAdminUid(e.target.value)}
          required
          fullWidth
          size="small"
        >
          {linkableAdmins.map((admin) => (
            <MenuItem key={admin.uid} value={admin.uid}>
              {admin.displayName} ({admin.email})
            </MenuItem>
          ))}
        </TextField>
        <TextField
          label={t('admin.fieldFirstName')}
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          required
          fullWidth
          size="small"
        />
        <TextField
          label={t('admin.fieldLastName')}
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          required
          fullWidth
          size="small"
        />
        {error ? <Alert severity="error">{error}</Alert> : null}
        {done ? (
          <Typography role="status" sx={{ color: 'success.main', fontWeight: 600 }}>
            {t('admin.employeesLinkAdminDone')}
          </Typography>
        ) : null}
        <Button type="submit" variant="outlined" disabled={busy || !adminUid}>
          {busy ? t('admin.saving') : t('admin.employeesLinkAdminButton')}
        </Button>
      </Stack>
    </Box>
  )
}

type AccessDialogProps = {
  open: boolean
  isPrimaryAdmin: boolean
  linkableAdmins: StaffMember[]
  createBusy: boolean
  linkBusy: boolean
  onClose: () => void
  onCreateEmployeeAccount: (input: EmployeeAccountInput) => Promise<void>
  onLinkAdminProfile: (input: CreateEmployeeProfileForAdminInput) => Promise<void>
}

const AccessDialog: React.FunctionComponent<AccessDialogProps> = ({
  open,
  isPrimaryAdmin,
  linkableAdmins,
  createBusy,
  linkBusy,
  onClose,
  onCreateEmployeeAccount,
  onLinkAdminProfile,
}) => {
  const { t } = useLocale()

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      aria-labelledby="employee-access-dialog-title"
    >
      <DialogTitle id="employee-access-dialog-title">{t('admin.employeesAccessTitle')}</DialogTitle>
      <DialogContent>
        <Stack spacing={3} sx={{ pt: 1 }}>
          {isPrimaryAdmin ? (
            <CreateAccountSection busy={createBusy} onCreate={onCreateEmployeeAccount} />
          ) : null}
          {isPrimaryAdmin ? <Divider /> : null}
          <LinkAdminSection
            linkableAdmins={linkableAdmins}
            busy={linkBusy}
            onLink={onLinkAdminProfile}
          />
        </Stack>
      </DialogContent>
    </Dialog>
  )
}

type EditorSectionProps = {
  title: string
  hint?: string
  children: React.ReactNode
}

const EditorSection: React.FunctionComponent<EditorSectionProps> = ({ title, hint, children }) => (
  <Box>
    <Typography component="h3" sx={{ fontWeight: 600, fontSize: '1rem', mb: hint ? 0.5 : 1.5 }}>
      {title}
    </Typography>
    {hint ? (
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
        {hint}
      </Typography>
    ) : null}
    {children}
  </Box>
)

type EmployeeEditorProps = {
  employee: EmployeeWithId
  services: ServiceWithId[] | undefined
  servicesLoading: boolean
  isPrimaryAdmin: boolean
  profileBusy: boolean
  bookableBusy: boolean
  authBusy: boolean
  passwordBusy: boolean
  removeBusy: boolean
  onSaveProfile: AdminEmployeesPageProps['onSaveProfile']
  onSetBookable: AdminEmployeesPageProps['onSetBookable']
  onSetAuthDisabled: AdminEmployeesPageProps['onSetAuthDisabled']
  onSetPassword: AdminEmployeesPageProps['onSetPassword']
  onSoftRemove: AdminEmployeesPageProps['onSoftRemove']
  employeeWeekly: EmployeeWorkingHoursByWeekday | undefined
  employeeWeeklyLoading: boolean
  employeeWeeklyError: boolean
  weeklyHoursSave: HoursSaveState
  onSaveWeeklyHours: (draft: WeeklyDraft) => void
  employeeDayExceptions: EmployeeDayExceptionWithId[] | undefined
  employeeDayExceptionsLoading: boolean
  employeeDayExceptionsError: boolean
  onSaveDayException: AdminEmployeesPageProps['onSaveDayException']
  onDeleteDayException: AdminEmployeesPageProps['onDeleteDayException']
  dayExceptionBusy: boolean
  todayYmd: string
}

const EmployeeEditor: React.FunctionComponent<EmployeeEditorProps> = ({
  employee,
  services,
  servicesLoading,
  isPrimaryAdmin,
  profileBusy,
  bookableBusy,
  authBusy,
  passwordBusy,
  removeBusy,
  onSaveProfile,
  onSetBookable,
  onSetAuthDisabled,
  onSetPassword,
  onSoftRemove,
  employeeWeekly,
  employeeWeeklyLoading,
  employeeWeeklyError,
  weeklyHoursSave,
  onSaveWeeklyHours,
  employeeDayExceptions,
  employeeDayExceptionsLoading,
  employeeDayExceptionsError,
  onSaveDayException,
  onDeleteDayException,
  dayExceptionBusy,
  todayYmd,
}) => {
  const { t } = useLocale()
  const [serviceIds, setServiceIds] = useState(employee.serviceIds)
  const [profileError, setProfileError] = useState<string | null>(null)
  const [accountDialogKey, setAccountDialogKey] = useState<number | null>(null)
  const [removeError, setRemoveError] = useState<string | null>(null)
  const removed = Boolean(employee.removedAt)
  const weeklyFormKey = `${employee.id}-${employeeWeeklyLoading ? 'loading' : 'ready'}`
  const serviceOptions = services ?? []

  const handleServicesChange = (event: SelectChangeEvent<string[]>) => {
    const value = event.target.value
    setServiceIds(typeof value === 'string' ? value.split(',') : value)
  }

  return (
    <Stack spacing={3} divider={<Divider />} sx={{ pt: 0.5 }}>
      <EditorSection
        title={t('admin.employeesProfileTitle')}
        hint={t('admin.employeesProfileHint')}
      >
        <Box
          component="form"
          noValidate
          onSubmit={(event) => {
            event.preventDefault()
            setProfileError(null)
            void onSaveProfile({
              employeeUid: employee.id,
              firstName: employee.firstName,
              lastName: employee.lastName,
              serviceIds,
            }).catch((err: unknown) => {
              setProfileError(translateEmployeeCallableError(err, t))
            })
          }}
        >
          <Stack spacing={2} sx={{ maxWidth: 520 }}>
            {servicesLoading ? <CircularProgress size={24} /> : null}
            {!servicesLoading && serviceOptions.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                {t('admin.employeesServiceAssignmentEmpty')}
              </Typography>
            ) : null}
            {serviceOptions.length > 0 ? (
              <FormControl fullWidth size="small">
                <InputLabel id={`employee-services-${employee.id}`}>
                  {t('admin.employeesServicesTitle')}
                </InputLabel>
                <Select
                  labelId={`employee-services-${employee.id}`}
                  multiple
                  value={serviceIds}
                  onChange={handleServicesChange}
                  input={<OutlinedInput label={t('admin.employeesServicesTitle')} />}
                  renderValue={(selected) =>
                    selected
                      .map((id) => {
                        const service = serviceOptions.find((item) => item.id === id)
                        return service ? bilingualServiceName(service) : id
                      })
                      .join(', ')
                  }
                  disabled={removed}
                >
                  {serviceOptions.map((service) => (
                    <MenuItem key={service.id} value={service.id}>
                      <Checkbox checked={serviceIds.includes(service.id)} size="small" />
                      <ListItemText primary={bilingualServiceName(service)} />
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            ) : null}
            <FormControlLabel
              control={
                <Switch
                  checked={employee.active}
                  disabled={bookableBusy || removed || employee.authDisabled}
                  onChange={(_, checked) => {
                    void onSetBookable(employee.id, checked)
                  }}
                />
              }
              label={
                employee.active ? t('admin.employeesBookableOn') : t('admin.employeesBookableOff')
              }
            />
            {employee.authDisabled ? (
              <Typography variant="body2" color="text.secondary">
                {t('admin.employeesBookableAuthBlocked')}
              </Typography>
            ) : null}
            {profileError ? <Alert severity="error">{profileError}</Alert> : null}
            <Button
              type="submit"
              variant="contained"
              disabled={profileBusy || removed}
              sx={{ alignSelf: 'flex-start' }}
            >
              {profileBusy ? t('admin.saving') : t('admin.save')}
            </Button>
          </Stack>
        </Box>
      </EditorSection>

      <EditorSection title={t('admin.employeesHoursTitle')} hint={t('admin.employeesHoursHint')}>
        {employeeWeeklyLoading ? (
          <CircularProgress aria-label={t('admin.openingHoursLoading')} size={28} />
        ) : null}
        {employeeWeeklyError ? (
          <Alert severity="error">{t('admin.openingHoursError')}</Alert>
        ) : null}
        {!employeeWeeklyLoading && !employeeWeeklyError ? (
          <WeeklyHoursForm
            key={weeklyFormKey}
            initial={weeklyDraftOf(employeeWeekly)}
            save={weeklyHoursSave}
            disabled={removed}
            onSave={onSaveWeeklyHours}
          />
        ) : null}
      </EditorSection>

      <EditorSection
        title={t('admin.employeesDayExceptionTitle')}
        hint={t('admin.employeesDayExceptionHint')}
      >
        <EmployeeDayExceptionForm
          todayYmd={todayYmd}
          weekly={employeeWeekly}
          weeklyLoading={employeeWeeklyLoading}
          exceptions={employeeDayExceptions}
          exceptionsLoading={employeeDayExceptionsLoading}
          exceptionsError={employeeDayExceptionsError}
          busy={dayExceptionBusy}
          disabled={removed}
          onSave={async (input) => {
            await onSaveDayException({ employeeUid: employee.id, ...input })
          }}
          onDelete={async (exceptionId) => {
            await onDeleteDayException({ employeeUid: employee.id, exceptionId })
          }}
        />
      </EditorSection>

      <Box>
        <Button
          size="small"
          variant="text"
          onClick={() => setAccountDialogKey(Date.now())}
          sx={{ px: 0, color: 'text.secondary' }}
        >
          {t('admin.employeesAccountManageButton')}
        </Button>
        {removeError ? (
          <Alert severity="error" sx={{ mt: 1 }}>
            {removeError}
          </Alert>
        ) : null}
        {accountDialogKey !== null ? (
          <EmployeeAccountDialog
            key={accountDialogKey}
            employee={employee}
            removed={removed}
            isPrimaryAdmin={isPrimaryAdmin}
            profileBusy={profileBusy}
            authBusy={authBusy}
            passwordBusy={passwordBusy}
            removeBusy={removeBusy}
            onClose={() => setAccountDialogKey(null)}
            onSaveProfile={onSaveProfile}
            onSetAuthDisabled={onSetAuthDisabled}
            onSetPassword={onSetPassword}
            onSoftRemove={async () => {
              setRemoveError(null)
              try {
                await onSoftRemove(employee.id)
                setAccountDialogKey(null)
              } catch (err: unknown) {
                setRemoveError(translateEmployeeCallableError(err, t))
              }
            }}
          />
        ) : null}
      </Box>
    </Stack>
  )
}

type EmployeeAccountDialogProps = {
  employee: EmployeeWithId
  removed: boolean
  isPrimaryAdmin: boolean
  profileBusy: boolean
  authBusy: boolean
  passwordBusy: boolean
  removeBusy: boolean
  onClose: () => void
  onSaveProfile: AdminEmployeesPageProps['onSaveProfile']
  onSetAuthDisabled: AdminEmployeesPageProps['onSetAuthDisabled']
  onSetPassword: AdminEmployeesPageProps['onSetPassword']
  onSoftRemove: () => Promise<void>
}

const EmployeeAccountDialog: React.FunctionComponent<EmployeeAccountDialogProps> = ({
  employee,
  removed,
  isPrimaryAdmin,
  profileBusy,
  authBusy,
  passwordBusy,
  removeBusy,
  onClose,
  onSaveProfile,
  onSetAuthDisabled,
  onSetPassword,
  onSoftRemove,
}) => {
  const { t } = useLocale()
  const [firstName, setFirstName] = useState(employee.firstName)
  const [lastName, setLastName] = useState(employee.lastName)
  const [profileError, setProfileError] = useState<string | null>(null)
  const [password, setPassword] = useState('')
  const [passwordError, setPasswordError] = useState<string | null>(null)

  return (
    <Dialog
      open
      onClose={onClose}
      fullWidth
      maxWidth="xs"
      aria-labelledby="employee-account-dialog-title"
    >
      <DialogTitle id="employee-account-dialog-title">
        {t('admin.employeesAccountTitle')} — {employee.displayName}
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2.5} sx={{ pt: 1 }}>
          <Box
            component="form"
            noValidate
            onSubmit={(event) => {
              event.preventDefault()
              setProfileError(null)
              void onSaveProfile({
                employeeUid: employee.id,
                firstName,
                lastName,
                serviceIds: employee.serviceIds,
              }).catch((err: unknown) => {
                setProfileError(translateEmployeeCallableError(err, t))
              })
            }}
          >
            <Stack spacing={2}>
              <TextField
                label={t('admin.fieldFirstName')}
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
                fullWidth
                size="small"
                disabled={removed}
              />
              <TextField
                label={t('admin.fieldLastName')}
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
                fullWidth
                size="small"
                disabled={removed}
              />
              {profileError ? <Alert severity="error">{profileError}</Alert> : null}
              <Button
                type="submit"
                variant="contained"
                disabled={profileBusy || removed}
                sx={{ alignSelf: 'flex-start' }}
              >
                {profileBusy ? t('admin.saving') : t('admin.save')}
              </Button>
            </Stack>
          </Box>

          {isPrimaryAdmin ? (
            <>
              <Divider />
              <Typography variant="body2" color="text.secondary">
                {t('admin.employeesAuthHint')}
              </Typography>
              <FormControlLabel
                control={
                  <Switch
                    checked={!employee.authDisabled}
                    disabled={authBusy || removed}
                    onChange={(_, checked) => {
                      void onSetAuthDisabled(employee.id, !checked)
                    }}
                  />
                }
                label={
                  employee.authDisabled
                    ? t('admin.employeesAuthDisabled')
                    : t('admin.employeesAuthEnabled')
                }
              />
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                <TextField
                  label={t('admin.accountPassword')}
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  size="small"
                  fullWidth
                  slotProps={{ htmlInput: { minLength: 8 } }}
                />
                <Button
                  variant="outlined"
                  disabled={passwordBusy || password.length < 8 || removed}
                  onClick={() => {
                    setPasswordError(null)
                    void onSetPassword(employee.id, password)
                      .then(() => setPassword(''))
                      .catch((err: unknown) => {
                        setPasswordError(translateEmployeeCallableError(err, t))
                      })
                  }}
                >
                  {passwordBusy ? t('admin.saving') : t('admin.employeesSetPassword')}
                </Button>
              </Stack>
              {passwordError ? <Alert severity="error">{passwordError}</Alert> : null}
              {!removed ? (
                <Button
                  color="error"
                  variant="outlined"
                  disabled={removeBusy}
                  onClick={() => {
                    void onSoftRemove()
                  }}
                  sx={{ alignSelf: 'flex-start' }}
                >
                  {removeBusy ? t('admin.saving') : t('admin.employeesSoftRemove')}
                </Button>
              ) : null}
            </>
          ) : null}
        </Stack>
      </DialogContent>
    </Dialog>
  )
}

export const AdminEmployeesPage: React.FunctionComponent<AdminEmployeesPageProps> = ({
  employees,
  isLoading,
  isError,
  linkableAdmins,
  services,
  servicesLoading,
  isPrimaryAdmin,
  selectedEmployeeId,
  onSelectEmployee,
  onBackClick,
  onCreateEmployeeAccount,
  onLinkAdminProfile,
  onSaveProfile,
  onSetBookable,
  onSetAuthDisabled,
  onSetPassword,
  onSoftRemove,
  employeeWeekly,
  employeeWeeklyLoading,
  employeeWeeklyError,
  weeklyHoursSave,
  onSaveWeeklyHours,
  employeeDayExceptions,
  employeeDayExceptionsLoading,
  employeeDayExceptionsError,
  onSaveDayException,
  onDeleteDayException,
  todayYmd,
  bookableBusy,
  authBusy,
  profileBusy,
  createBusy,
  linkBusy,
  removeBusy,
  passwordBusy,
  dayExceptionBusy,
}) => {
  const { t } = useLocale()
  const [accessDialogKey, setAccessDialogKey] = useState<number | null>(null)
  const selected = employees?.find((emp) => emp.id === selectedEmployeeId) ?? null

  return (
    <Stack spacing={3} sx={{ maxWidth: 860 }}>
      <Box>
        <Button onClick={onBackClick} sx={{ ml: -1, mb: 1 }}>
          {t('admin.backToSettings')}
        </Button>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={2}
          sx={{ alignItems: { sm: 'flex-start' }, justifyContent: 'space-between' }}
        >
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h1">{t('admin.employeesManageTitle')}</Typography>
            <Typography color="text.secondary" sx={{ mt: 0.5 }}>
              {t('admin.employeesManageSubtitle')}
            </Typography>
          </Box>
          <Button
            variant="outlined"
            startIcon={<PersonAddAlt1OutlinedIcon />}
            onClick={() => setAccessDialogKey(Date.now())}
            sx={{ alignSelf: { xs: 'stretch', sm: 'flex-start' } }}
          >
            {t('admin.employeesAccessButton')}
          </Button>
        </Stack>
      </Box>

      {accessDialogKey !== null ? (
        <AccessDialog
          key={accessDialogKey}
          open
          isPrimaryAdmin={isPrimaryAdmin}
          linkableAdmins={linkableAdmins}
          createBusy={createBusy}
          linkBusy={linkBusy}
          onClose={() => setAccessDialogKey(null)}
          onCreateEmployeeAccount={onCreateEmployeeAccount}
          onLinkAdminProfile={onLinkAdminProfile}
        />
      ) : null}

      <Box>
        <Typography component="h2" variant="h2" sx={{ mb: 2 }}>
          {t('admin.employeesListTitle')}
        </Typography>
        {isLoading ? <CircularProgress aria-label={t('admin.loading')} /> : null}
        {isError ? <Alert severity="error">{t('admin.employeesLoadError')}</Alert> : null}
        {!isLoading && !isError && employees && employees.length === 0 ? (
          <Alert severity="info">{t('admin.employeesListEmpty')}</Alert>
        ) : null}
        {employees && employees.length > 0 ? (
          <Stack spacing={1}>
            {employees.map((emp) => {
              const expanded = selectedEmployeeId === emp.id
              const removed = Boolean(emp.removedAt)
              return (
                <Accordion
                  key={emp.id}
                  disableGutters
                  elevation={0}
                  expanded={expanded}
                  onChange={(_, nextExpanded) => {
                    onSelectEmployee(nextExpanded ? emp.id : null)
                  }}
                  sx={{
                    border: 1,
                    borderColor: 'divider',
                    '&:before': { display: 'none' },
                  }}
                >
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Stack
                      direction="row"
                      spacing={1}
                      sx={{ alignItems: 'center', flexWrap: 'wrap', gap: 1, pr: 1 }}
                    >
                      <Typography sx={{ fontWeight: 600 }}>{emp.displayName}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {emp.email}
                      </Typography>
                      {emp.active ? (
                        <Chip size="small" color="success" label={t('admin.employeesBookableOn')} />
                      ) : (
                        <Chip size="small" label={t('admin.employeesBookableOff')} />
                      )}
                      {emp.authDisabled ? (
                        <Chip
                          size="small"
                          color="warning"
                          label={t('admin.employeesAuthDisabled')}
                        />
                      ) : null}
                      {removed ? (
                        <Chip size="small" color="error" label={t('admin.employeesRemoved')} />
                      ) : null}
                    </Stack>
                  </AccordionSummary>
                  <AccordionDetails>
                    {expanded && selected ? (
                      <EmployeeEditor
                        key={selected.updatedAt}
                        employee={selected}
                        services={services}
                        servicesLoading={servicesLoading}
                        isPrimaryAdmin={isPrimaryAdmin}
                        profileBusy={profileBusy}
                        bookableBusy={bookableBusy}
                        authBusy={authBusy}
                        passwordBusy={passwordBusy}
                        removeBusy={removeBusy}
                        onSaveProfile={onSaveProfile}
                        onSetBookable={onSetBookable}
                        onSetAuthDisabled={onSetAuthDisabled}
                        onSetPassword={onSetPassword}
                        onSoftRemove={onSoftRemove}
                        employeeWeekly={employeeWeekly}
                        employeeWeeklyLoading={employeeWeeklyLoading}
                        employeeWeeklyError={employeeWeeklyError}
                        weeklyHoursSave={weeklyHoursSave}
                        onSaveWeeklyHours={onSaveWeeklyHours}
                        employeeDayExceptions={employeeDayExceptions}
                        employeeDayExceptionsLoading={employeeDayExceptionsLoading}
                        employeeDayExceptionsError={employeeDayExceptionsError}
                        onSaveDayException={onSaveDayException}
                        onDeleteDayException={onDeleteDayException}
                        dayExceptionBusy={dayExceptionBusy}
                        todayYmd={todayYmd}
                      />
                    ) : null}
                  </AccordionDetails>
                </Accordion>
              )
            })}
          </Stack>
        ) : null}
      </Box>
    </Stack>
  )
}
