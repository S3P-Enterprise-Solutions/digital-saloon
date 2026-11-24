import type * as React from 'react'
import { Typography } from '@mui/material'

export type EmployeePlaceholderPageProps = {
  title: string
  description: string
}

export const EmployeePlaceholderPage: React.FunctionComponent<EmployeePlaceholderPageProps> = ({
  title,
  description,
}) => (
  <Typography component="h1" sx={{ fontSize: '1.25rem' }}>
    {title}
    <Typography component="p" color="text.secondary" sx={{ mt: 1, fontSize: '1rem' }}>
      {description}
    </Typography>
  </Typography>
)
