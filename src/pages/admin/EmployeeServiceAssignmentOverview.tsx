import type * as React from 'react'
import { useState } from 'react'
import {
  Alert,
  Box,
  CircularProgress,
  Divider,
  FormControlLabel,
  FormGroup,
  Stack,
  Switch,
  Typography,
} from '@mui/material'

import { toggleServiceAssignment } from '../../data/employeeServiceAssignment'
import type { EmployeeWithId } from '../../data/employees'
import { bilingualServiceName } from '../../data/serviceForm'
import type { ServiceWithId } from '../../data/services'
import { useLocale } from '../../i18n'

export type EmployeeServiceAssignmentOverviewProps = {
  employees: EmployeeWithId[]
  services: ServiceWithId[] | undefined
  servicesLoading: boolean
  profileBusy: boolean
  onSaveProfile: (input: {
    employeeUid: string
    firstName: string
    lastName: string
    serviceIds: string[]
  }) => Promise<void>
}

export const EmployeeServiceAssignmentOverview: React.FunctionComponent<
  EmployeeServiceAssignmentOverviewProps
> = ({ employees, services, servicesLoading, profileBusy, onSaveProfile }) => {
  const { t } = useLocale()
  const [error, setError] = useState<string | null>(null)
  const assignable = employees.filter((emp) => !emp.removedAt)

  return (
    <Stack spacing={2}>
      <Box>
        <Typography component="h2" variant="h2" sx={{ mb: 0.5 }}>
          {t('admin.employeesServiceAssignmentTitle')}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {t('admin.employeesServiceAssignmentHint')}
        </Typography>
      </Box>
      {servicesLoading ? <CircularProgress size={24} /> : null}
      {!servicesLoading && (!services || services.length === 0) ? (
        <Typography variant="body2" color="text.secondary">
          {t('admin.employeesServiceAssignmentEmpty')}
        </Typography>
      ) : null}
      {error ? <Alert severity="error">{error}</Alert> : null}
      {services && services.length > 0 ? (
        <Stack spacing={2} divider={<Divider flexItem />}>
          {services.map((service) => (
            <Box key={service.id}>
              <Typography sx={{ fontWeight: 600, mb: 1 }}>
                {bilingualServiceName(service)}
              </Typography>
              {assignable.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  {t('admin.employeesServiceAssignmentNoEmployees')}
                </Typography>
              ) : (
                <FormGroup>
                  {assignable.map((employee) => (
                    <FormControlLabel
                      key={employee.id}
                      control={
                        <Switch
                          size="small"
                          checked={employee.serviceIds.includes(service.id)}
                          disabled={profileBusy}
                          onChange={() => {
                            setError(null)
                            void onSaveProfile({
                              employeeUid: employee.id,
                              firstName: employee.firstName,
                              lastName: employee.lastName,
                              serviceIds: toggleServiceAssignment(employee.serviceIds, service.id),
                            }).catch((err: unknown) => {
                              setError(err instanceof Error ? err.message : String(err))
                            })
                          }}
                        />
                      }
                      label={employee.displayName}
                    />
                  ))}
                </FormGroup>
              )}
            </Box>
          ))}
        </Stack>
      ) : null}
    </Stack>
  )
}
