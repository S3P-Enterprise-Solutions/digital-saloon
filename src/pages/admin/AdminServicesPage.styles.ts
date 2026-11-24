import { styled } from '@mui/material/styles'

import { brand } from '../../theme'

export const ServiceList = styled('ul')(({ theme }) => ({
  margin: 0,
  padding: 0,
  listStyle: 'none',
  borderTop: `1px solid ${theme.palette.divider}`,
  '& > li': {
    borderBottom: `1px solid ${theme.palette.divider}`,
  },
}))

export const ServiceRow = styled('div')(({ theme }) => ({
  display: 'grid',
  gridTemplateColumns: 'auto 1fr auto auto auto',
  columnGap: theme.spacing(2),
  alignItems: 'center',
  padding: theme.spacing(2, 0),
  '& .service-reorder': {
    display: 'flex',
    flexDirection: 'column',
    gap: 0,
    marginLeft: theme.spacing(-1),
  },
  '& .service-name': {
    fontWeight: 600,
    fontSize: '1.0625rem',
  },
  '& .service-description': {
    marginTop: 2,
    fontSize: '0.875rem',
    color: theme.palette.text.secondary,
  },
  '& .service-duration': {
    fontSize: '0.875rem',
    color: theme.palette.text.secondary,
    fontVariantNumeric: 'tabular-nums',
    whiteSpace: 'nowrap',
  },
  '& .service-price': {
    fontWeight: 700,
    fontVariantNumeric: 'tabular-nums',
    whiteSpace: 'nowrap',
    minWidth: '4.5rem',
    textAlign: 'right',
  },
  '& .service-inactive': {
    display: 'inline-block',
    marginLeft: theme.spacing(1),
    padding: '1px 8px',
    borderRadius: 999,
    border: `1px solid ${theme.palette.divider}`,
    fontSize: '0.75rem',
    fontWeight: 500,
    color: theme.palette.text.secondary,
    verticalAlign: 'middle',
  },
  '&.is-inactive .service-name, &.is-inactive .service-price': {
    color: brand.espressoMuted,
  },
  [theme.breakpoints.down('sm')]: {
    gridTemplateColumns: 'auto 1fr auto',
    rowGap: theme.spacing(0.5),
    '& .service-text': { gridColumn: '2 / -1' },
    '& .service-duration': { gridColumn: 2 },
    '& .service-price': { gridColumn: 3 },
    '& .service-edit': { gridColumn: '2 / -1', justifySelf: 'start' },
  },
}))

export const ServiceEditor = styled('form')(({ theme }) => ({
  display: 'grid',
  gap: theme.spacing(2.5),
  margin: theme.spacing(1, 0, 2),
  padding: theme.spacing(3),
  backgroundColor: brand.stone,
  borderLeft: `3px solid ${brand.orange}`,
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(2),
  },
  '& .editor-numbers': {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, minmax(0, 12rem))',
    gap: theme.spacing(2),
    [theme.breakpoints.down('sm')]: {
      gridTemplateColumns: '1fr 1fr',
    },
  },
  '& .MuiTextField-root .MuiInputBase-root': {
    backgroundColor: brand.paper,
  },
}))
