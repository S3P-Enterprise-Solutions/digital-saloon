import type * as React from 'react'
import { useState } from 'react'
import { Alert, Button, Stack, TextField, Typography } from '@mui/material'

import { useLocale } from '../../i18n'

export type EmployeePasswordPageProps = {
  busy: boolean
  onChangePassword: (input: { currentPassword: string; newPassword: string }) => Promise<void>
}

export const EmployeePasswordPage: React.FunctionComponent<EmployeePasswordPageProps> = ({
  busy,
  onChangePassword,
}) => {
  const { t } = useLocale()
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  const mismatch = confirmPassword.length > 0 && newPassword !== confirmPassword
  const canSubmit =
    !busy &&
    currentPassword.length >= 8 &&
    newPassword.length >= 8 &&
    newPassword === confirmPassword

  return (
    <Stack
      component="form"
      spacing={2}
      sx={{ maxWidth: 420 }}
      onSubmit={(event) => {
        event.preventDefault()
        setError(null)
        setDone(false)
        void onChangePassword({ currentPassword, newPassword })
          .then(() => {
            setCurrentPassword('')
            setNewPassword('')
            setConfirmPassword('')
            setDone(true)
          })
          .catch((err: unknown) => {
            setError(err instanceof Error ? err.message : String(err))
          })
      }}
    >
      <Typography variant="h2" sx={{ fontSize: '1.15rem' }}>
        {t('employee.passwordTitle')}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        {t('employee.passwordHint')}
      </Typography>
      <TextField
        label={t('employee.currentPassword')}
        type="password"
        value={currentPassword}
        onChange={(e) => setCurrentPassword(e.target.value)}
        required
        fullWidth
        autoComplete="current-password"
        slotProps={{ htmlInput: { minLength: 8 } }}
      />
      <TextField
        label={t('employee.newPassword')}
        type="password"
        value={newPassword}
        onChange={(e) => setNewPassword(e.target.value)}
        required
        fullWidth
        autoComplete="new-password"
        slotProps={{ htmlInput: { minLength: 8 } }}
      />
      <TextField
        label={t('employee.confirmPassword')}
        type="password"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        required
        fullWidth
        autoComplete="new-password"
        error={mismatch}
        helperText={mismatch ? t('employee.passwordMismatch') : undefined}
      />
      {error ? <Alert severity="error">{error}</Alert> : null}
      {done ? <Alert severity="success">{t('employee.passwordSaved')}</Alert> : null}
      <Button type="submit" variant="contained" disabled={!canSubmit}>
        {busy ? t('admin.saving') : t('employee.passwordSubmit')}
      </Button>
    </Stack>
  )
}
