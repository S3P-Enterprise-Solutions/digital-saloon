import type * as React from 'react'
import { useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  FormControlLabel,
  FormGroup,
  MenuItem,
  Paper,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'

import type { EmployeeAccountInput, StaffMember } from '../../data/adminAccessApi'
import { EmployeeDayExceptionForm } from '../../components/EmployeeDayExceptionForm'
import { WeeklyHoursForm, type HoursSaveState } from '../../components/WeeklyHoursForm'
import type {
  BookableEmployeePublic,
  CreateEmployeeProfileForAdminInput,
} from '../../data/employeeAdminApi'
import type {
  EmployeeDayExceptionWithId,
  EmployeeWorkingHoursByWeekday,
} from '../../data/employeeSchedule'
import { weeklyDraftOf, type WeeklyDraft } from '../../data/openingHoursForm'
import type { EmployeeWithId } from '../../data/employees'
import { toggleServiceAssignment } from '../../data/employeeServiceAssignment'
import { bilingualServiceName } from '../../data/serviceForm'
import type { ServiceWithId } from '../../data/services'
import { EmployeeServiceAssignmentOverview } from './EmployeeServiceAssignmentOverview'
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
  bookablePreview?: BookableEmployeePublic[]
  bookablePreviewLoading?: boolean
  bookablePreviewError?: boolean
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
            setError(err instanceof Error ? err.message : String(err))
          })
      }}
    >
      <Typography component="h3" sx={{ fontWeight: 600, mb: 1.5 }}>
        {t('admin.employeesCreateAccountTitle')}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {t('admin.employeesCreateAccountHint')}
      </Typography>
      <Stack spacing={2} sx={{ maxWidth: 420 }}>
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
            setError(err instanceof Error ? err.message : String(err))
          })
      }}
    >
      <Typography component="h3" sx={{ fontWeight: 600, mb: 1.5 }}>
        {t('admin.employeesLinkAdminTitle')}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {t('admin.employeesLinkAdminHint')}
      </Typography>
      <Stack spacing={2} sx={{ maxWidth: 420 }}>
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
}) => {
  const { t } = useLocale()
  const [firstName, setFirstName] = useState(employee.firstName)
  const [lastName, setLastName] = useState(employee.lastName)
  const [serviceIds, setServiceIds] = useState(employee.serviceIds)
  const [password, setPassword] = useState('')
  const [profileError, setProfileError] = useState<string | null>(null)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [removeError, setRemoveError] = useState<string | null>(null)
  const removed = Boolean(employee.removedAt)
  const weeklyFormKey = `${employee.id}-${employeeWeeklyLoading ? 'loading' : 'ready'}`

  return (
    <Stack spacing={3} sx={{ mt: 2 }}>
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
            serviceIds,
          }).catch((err: unknown) => {
            setProfileError(err instanceof Error ? err.message : String(err))
          })
        }}
      >
        <Stack spacing={2} sx={{ maxWidth: 480 }}>
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
          {servicesLoading ? <CircularProgress size={24} /> : null}
          {services && services.length > 0 ? (
            <Box>
              <Typography sx={{ fontWeight: 600, mb: 1 }}>
                {t('admin.employeesServicesTitle')}
              </Typography>
              <FormGroup>
                {services.map((service) => (
                  <FormControlLabel
                    key={service.id}
                    control={
                      <Switch
                        size="small"
                        checked={serviceIds.includes(service.id)}
                        onChange={() => {
                          setServiceIds((current) => toggleServiceAssignment(current, service.id))
                        }}
                      />
                    }
                    label={bilingualServiceName(service)}
                  />
                ))}
              </FormGroup>
            </Box>
          ) : null}
          {profileError ? <Alert severity="error">{profileError}</Alert> : null}
          <Button type="submit" variant="contained" disabled={profileBusy || removed}>
            {profileBusy ? t('admin.saving') : t('admin.save')}
          </Button>
        </Stack>
      </Box>

      <Divider />

      <Box>
        <Typography sx={{ fontWeight: 600, mb: 0.5 }}>
          {t('admin.employeesBookableTitle')}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
          {t('admin.employeesBookableHint')}
        </Typography>
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
          label={employee.active ? t('admin.employeesBookableOn') : t('admin.employeesBookableOff')}
        />
        {employee.authDisabled ? (
          <Typography variant="body2" color="text.secondary">
            {t('admin.employeesBookableAuthBlocked')}
          </Typography>
        ) : null}
      </Box>

      {isPrimaryAdmin ? (
        <Box>
          <Typography sx={{ fontWeight: 600, mb: 0.5 }}>{t('admin.employeesAuthTitle')}</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
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
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={1.5}
            sx={{ mt: 2, maxWidth: 480 }}
          >
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
                    setPasswordError(err instanceof Error ? err.message : String(err))
                  })
              }}
            >
              {passwordBusy ? t('admin.saving') : t('admin.employeesSetPassword')}
            </Button>
          </Stack>
          {passwordError ? (
            <Alert severity="error" sx={{ mt: 1 }}>
              {passwordError}
            </Alert>
          ) : null}
        </Box>
      ) : null}

      <Box sx={{ maxWidth: 860 }}>
        <Typography sx={{ fontWeight: 600, mb: 0.5 }}>{t('admin.employeesHoursTitle')}</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {t('admin.employeesHoursHint')}
        </Typography>
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
        <Typography sx={{ fontWeight: 600, mt: 4, mb: 1 }}>
          {t('admin.employeesDayExceptionTitle')}
        </Typography>
        <EmployeeDayExceptionForm
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
      </Box>

      {isPrimaryAdmin && !removed ? (
        <Box>
          <Button
            color="error"
            variant="outlined"
            disabled={removeBusy}
            onClick={() => {
              setRemoveError(null)
              void onSoftRemove(employee.id).catch((err: unknown) => {
                setRemoveError(err instanceof Error ? err.message : String(err))
              })
            }}
          >
            {removeBusy ? t('admin.saving') : t('admin.employeesSoftRemove')}
          </Button>
          {removeError ? (
            <Alert severity="error" sx={{ mt: 1 }}>
              {removeError}
            </Alert>
          ) : null}
        </Box>
      ) : null}
    </Stack>
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
  bookablePreview,
  bookablePreviewLoading,
  bookablePreviewError,
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
  const selected = employees?.find((emp) => emp.id === selectedEmployeeId) ?? null

  return (
    <Stack spacing={4} sx={{ maxWidth: 900 }}>
      <Stack direction="row" spacing={2} sx={{ alignItems: 'flex-start' }}>
        <Button startIcon={<ArrowBackIcon />} onClick={onBackClick} sx={{ mt: 0.5 }}>
          {t('admin.backToSettings')}
        </Button>
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="h1">{t('admin.employeesManageTitle')}</Typography>
          <Typography color="text.secondary" sx={{ mt: 0.5 }}>
            {t('admin.employeesManageSubtitle')}
          </Typography>
        </Box>
      </Stack>

      {isPrimaryAdmin ? (
        <Paper sx={{ p: { xs: 2, sm: 3 } }}>
          <CreateAccountSection busy={createBusy} onCreate={onCreateEmployeeAccount} />
        </Paper>
      ) : null}

      <Paper sx={{ p: { xs: 2, sm: 3 } }}>
        <LinkAdminSection
          linkableAdmins={linkableAdmins}
          busy={linkBusy}
          onLink={onLinkAdminProfile}
        />
      </Paper>

      <Paper sx={{ p: { xs: 2, sm: 3 } }}>
        <Typography component="h2" variant="h2" sx={{ mb: 0.5 }}>
          {t('admin.employeesBookablePreviewTitle')}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {t('admin.employeesBookablePreviewHint')}
        </Typography>
        {bookablePreviewLoading ? <CircularProgress size={24} /> : null}
        {bookablePreviewError ? (
          <Alert severity="warning">{t('admin.employeesBookablePreviewError')}</Alert>
        ) : null}
        {bookablePreview && bookablePreview.length === 0 && !bookablePreviewLoading ? (
          <Typography variant="body2" color="text.secondary">
            {t('admin.employeesBookablePreviewEmpty')}
          </Typography>
        ) : null}
        {bookablePreview && bookablePreview.length > 0 ? (
          <Stack spacing={0.75}>
            {bookablePreview.map((item) => (
              <Typography key={item.id} variant="body2">
                {item.displayName}
                {item.serviceIds.length > 0
                  ? ` · ${t('admin.employeesBookablePreviewServices', { count: item.serviceIds.length })}`
                  : null}
              </Typography>
            ))}
          </Stack>
        ) : null}
      </Paper>

      {employees && employees.length > 0 ? (
        <Paper sx={{ p: { xs: 2, sm: 3 } }}>
          <EmployeeServiceAssignmentOverview
            employees={employees}
            services={services}
            servicesLoading={servicesLoading}
            profileBusy={profileBusy}
            onSaveProfile={onSaveProfile}
          />
        </Paper>
      ) : null}

      <Paper sx={{ p: { xs: 2, sm: 3 } }}>
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
                <Box key={emp.id} sx={{ borderBottom: 1, borderColor: 'divider', pb: 2 }}>
                  <Stack
                    direction="row"
                    spacing={1}
                    sx={{ alignItems: 'center', flexWrap: 'wrap', gap: 1 }}
                  >
                    <Button
                      variant={expanded ? 'contained' : 'text'}
                      onClick={() => onSelectEmployee(expanded ? null : emp.id)}
                      sx={{ textTransform: 'none', fontWeight: 600 }}
                    >
                      {emp.displayName}
                    </Button>
                    <Typography variant="body2" color="text.secondary">
                      {emp.email}
                    </Typography>
                    {emp.active ? (
                      <Chip size="small" color="success" label={t('admin.employeesBookableOn')} />
                    ) : (
                      <Chip size="small" label={t('admin.employeesBookableOff')} />
                    )}
                    {emp.authDisabled ? (
                      <Chip size="small" color="warning" label={t('admin.employeesAuthDisabled')} />
                    ) : null}
                    {removed ? (
                      <Chip size="small" color="error" label={t('admin.employeesRemoved')} />
                    ) : null}
                  </Stack>
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
                    />
                  ) : null}
                </Box>
              )
            })}
          </Stack>
        ) : null}
      </Paper>
    </Stack>
  )
}
