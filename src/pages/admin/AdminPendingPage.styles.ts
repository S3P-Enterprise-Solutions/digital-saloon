import { alpha, styled } from '@mui/material/styles'

import { brand } from '../../theme'

/** Pending request; the orange edge matches "Ausstehend" in the week planner legend. */
export const PendingItem = styled('li')(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-start',
  gap: theme.spacing(1.5),
  minWidth: 0,
  padding: theme.spacing(1.25, 1.5, 1.25, 2),
  borderLeft: `3px solid ${brand.orange}`,
  backgroundColor: alpha(brand.orange, 0.06),
}))
