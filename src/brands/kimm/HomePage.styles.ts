import { styled } from '@mui/material/styles'

import { createSalonTheme } from '../createSalonTheme'
import { kimmProfile } from './profile'

const { brandColors: brand } = createSalonTheme({
  colors: kimmProfile.colors,
  typography: kimmProfile.typography,
})

export const PriceList = styled('ul')(({ theme }) => ({
  display: 'grid',
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  columnGap: theme.spacing(3),
  listStyle: 'none',
  margin: 0,
  padding: 0,
  borderTop: `1px solid ${brand.espresso}`,
  [theme.breakpoints.down('md')]: {
    gridTemplateColumns: '1fr',
  },
}))

export const PriceRow = styled('button')(({ theme }) => ({
  display: 'grid',
  gridTemplateColumns: '1fr auto auto',
  columnGap: theme.spacing(2),
  alignItems: 'baseline',
  width: '100%',
  height: '100%',
  padding: theme.spacing(1.5, 1),
  border: 0,
  borderBottom: `1px solid ${theme.palette.divider}`,
  background: 'none',
  color: 'inherit',
  font: 'inherit',
  textAlign: 'left',
  cursor: 'pointer',
  transition: 'background-color 160ms ease',
  '& .price-name': {
    transition: 'color 160ms ease',
  },
  '&:hover': {
    backgroundColor: brand.stone,
  },
  '&:hover .price-name': {
    color: brand.orangeDeep,
  },
  '&:focus-visible': {
    outline: `2px solid ${brand.orange}`,
    outlineOffset: -2,
  },
  [theme.breakpoints.down('sm')]: {
    gridTemplateColumns: '1fr auto',
    '& .price-duration': {
      gridColumn: 1,
      gridRow: 3,
    },
  },
}))

export const HoursList = styled('dl')(({ theme }) => ({
  display: 'grid',
  gridTemplateColumns: 'minmax(8rem, auto) 1fr',
  margin: 0,
  '& dt, & dd': {
    margin: 0,
    padding: theme.spacing(1.25, 0),
    borderBottom: `1px solid ${theme.palette.divider}`,
    fontVariantNumeric: 'tabular-nums',
  },
  '& .is-today': {
    fontWeight: 700,
  },
}))
