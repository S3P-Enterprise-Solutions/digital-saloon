import type * as React from 'react'
import { Box, Button, Stack, Typography } from '@mui/material'

import { useLocale } from '../../i18n'

export type EmployeeNavSection = 'hours' | 'services' | 'bookings' | 'password'

export type EmployeeLayoutPageProps = {
  active: EmployeeNavSection
  displayName: string | null
  onHoursClick: () => void
  onServicesClick: () => void
  onBookingsClick: () => void
  onPasswordClick: () => void
  onSignOutClick: () => void
  children: React.ReactNode
}

export const EmployeeLayoutPage: React.FunctionComponent<EmployeeLayoutPageProps> = ({
  active,
  displayName,
  onHoursClick,
  onServicesClick,
  onBookingsClick,
  onPasswordClick,
  onSignOutClick,
  children,
}) => {
  const { t } = useLocale()
  const navButton = (section: EmployeeNavSection, label: string, onClick: () => void) => (
    <Button
      key={section}
      variant={active === section ? 'contained' : 'text'}
      onClick={onClick}
      sx={{ justifyContent: 'flex-start' }}
    >
      {label}
    </Button>
  )

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h1" sx={{ fontSize: '1.5rem' }}>
          {t('employee.title')}
        </Typography>
        {displayName ? (
          <Typography color="text.secondary">
            {t('employee.greeting', { name: displayName })}
          </Typography>
        ) : null}
      </Box>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={1}
        useFlexGap
        sx={{ flexWrap: 'wrap' }}
      >
        {navButton('hours', t('employee.navHours'), onHoursClick)}
        {navButton('services', t('employee.navServices'), onServicesClick)}
        {navButton('bookings', t('employee.navBookings'), onBookingsClick)}
        {navButton('password', t('employee.navPassword'), onPasswordClick)}
        <Button color="inherit" onClick={onSignOutClick} sx={{ ml: { sm: 'auto' } }}>
          {t('nav.signOut')}
        </Button>
      </Stack>
      {children}
    </Stack>
  )
}
