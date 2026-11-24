import { styled } from '@mui/material/styles'

import { brand } from '../../theme'

export const WeekTotals = styled('dl')(({ theme }) => ({
  display: 'flex',
  flexWrap: 'wrap',
  gap: theme.spacing(1, 3),
  margin: 0,
  '& > div': {
    display: 'flex',
    flexDirection: 'column-reverse',
  },
  '& dt': {
    fontSize: '0.8125rem',
    color: theme.palette.text.secondary,
  },
  '& dd': {
    margin: 0,
    whiteSpace: 'nowrap',
    fontSize: '1.25rem',
    [theme.breakpoints.down('sm')]: { fontSize: '1.125rem' },
    fontWeight: 700,
    letterSpacing: '-0.01em',
    fontVariantNumeric: 'tabular-nums',
    color: brand.espresso,
  },
}))

export const WeekTitle = styled('h1')(({ theme }) => ({
  margin: 0,
  fontSize: '2.25rem',
  fontWeight: 700,
  letterSpacing: '-0.02em',
  lineHeight: 1.05,
  fontVariantNumeric: 'tabular-nums',
  [theme.breakpoints.down('sm')]: {
    fontSize: '1.75rem',
  },
}))

/**
 * Week header. Phone: title, totals, week controls, then a full-width "add" button.
 * Desktop: one row, totals pushed right next to the primary action.
 */
export const Toolbar = styled('div')(({ theme }) => ({
  display: 'grid',
  gridTemplateColumns: '1fr',
  gridTemplateAreas: '"title" "totals" "controls" "cta"',
  rowGap: theme.spacing(2),
  alignItems: 'end',
  '& .toolbar-title': { gridArea: 'title', minWidth: 0 },
  '& .toolbar-controls': {
    gridArea: 'controls',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing(2),
  },
  '& .toolbar-totals': { gridArea: 'totals' },
  '& .toolbar-cta': { gridArea: 'cta', whiteSpace: 'nowrap' },
  [theme.breakpoints.down('md')]: {
    '& .toolbar-totals': {
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      paddingBlock: theme.spacing(1.5),
      borderBlock: `1px solid ${theme.palette.divider}`,
    },
  },
  [theme.breakpoints.up('md')]: {
    gridTemplateColumns: 'auto auto 1fr auto',
    gridTemplateAreas: '"title controls totals cta"',
    columnGap: theme.spacing(3),
    '& .toolbar-controls': { paddingBottom: theme.spacing(0.25) },
    '& .toolbar-totals': { justifySelf: 'end' },
  },
}))
