import type * as React from 'react'
import { Alert, Chip, CircularProgress, Paper, Stack, Typography } from '@mui/material'

import { bilingualServiceName } from '../../data/serviceForm'
import type { ServiceWithId } from '../../data/services'
import { useLocale } from '../../i18n'

export type EmployeeServicesPageProps = {
  serviceIds: string[]
  services: ServiceWithId[] | undefined
  servicesLoading: boolean
  servicesError: boolean
}

export const EmployeeServicesPage: React.FunctionComponent<EmployeeServicesPageProps> = ({
  serviceIds,
  services,
  servicesLoading,
  servicesError,
}) => {
  const { t } = useLocale()
  const assigned =
    services?.filter((service) => serviceIds.includes(service.id) && service.active) ?? []

  return (
    <Stack spacing={2} sx={{ maxWidth: 640 }}>
      <Typography variant="h2" sx={{ fontSize: '1.15rem' }}>
        {t('employee.servicesTitle')}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        {t('employee.servicesHint')}
      </Typography>
      {servicesLoading ? <CircularProgress aria-label={t('employee.loading')} size={28} /> : null}
      {servicesError ? <Alert severity="error">{t('employee.servicesError')}</Alert> : null}
      {!servicesLoading && !servicesError && assigned.length === 0 ? (
        <Alert severity="info">{t('employee.servicesEmpty')}</Alert>
      ) : null}
      {!servicesLoading && assigned.length > 0 ? (
        <Paper sx={{ p: 2 }}>
          <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
            {assigned.map((service) => (
              <Chip key={service.id} label={bilingualServiceName(service)} />
            ))}
          </Stack>
        </Paper>
      ) : null}
    </Stack>
  )
}
