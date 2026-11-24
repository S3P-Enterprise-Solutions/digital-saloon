import { styled } from '@mui/material/styles'

import { brand } from '../theme'

/** One pixel per minute keeps a 30-minute haircut readable and the arithmetic trivial. */
export const pixelsPerMinute = 1
export const gutterWidth = '3.5rem'

const hourLine = 'rgba(74, 54, 49, 0.14)'
const halfHourLine = 'rgba(74, 54, 49, 0.06)'
const closedHatch = `repeating-linear-gradient(135deg, rgba(74, 54, 49, 0.07) 0 1px, transparent 1px 7px)`

export const PlannerScroller = styled('div')(({ theme }) => ({
  overflowX: 'auto',
  border: `1px solid ${theme.palette.divider}`,
  borderRadius: theme.shape.borderRadius,
  backgroundColor: brand.paper,
}))

export const PlannerGrid = styled('div')({
  display: 'grid',
  gridTemplateColumns: `${gutterWidth} repeat(7, minmax(7.5rem, 1fr))`,
  minWidth: '58rem',
})

export const DayHeader = styled('div')(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: 2,
  padding: theme.spacing(1.25, 1.25, 1),
  borderLeft: `1px solid ${theme.palette.divider}`,
  borderBottom: `1px solid ${theme.palette.divider}`,
  borderTop: '3px solid transparent',
  '& .day-name': {
    display: 'flex',
    alignItems: 'baseline',
    gap: theme.spacing(0.75),
    fontSize: '0.8125rem',
    color: theme.palette.text.secondary,
  },
  '& .day-number': {
    fontSize: '1.5rem',
    fontWeight: 700,
    lineHeight: 1,
    letterSpacing: '-0.02em',
    color: brand.espresso,
    fontVariantNumeric: 'tabular-nums',
  },
  '& .day-total': {
    fontSize: '0.75rem',
    color: theme.palette.text.secondary,
    fontVariantNumeric: 'tabular-nums',
    whiteSpace: 'nowrap',
  },
  '&.is-today': {
    borderTopColor: brand.orange,
    '& .day-number': { color: brand.orangeDeep },
    '& .day-name': { color: brand.orangeDeep, fontWeight: 600 },
  },
  '&.is-closed .day-number': {
    color: theme.palette.text.secondary,
    fontWeight: 500,
  },
}))

export const GutterHeader = styled('div')(({ theme }) => ({
  position: 'sticky',
  left: 0,
  zIndex: 5,
  backgroundColor: brand.paper,
  borderBottom: `1px solid ${theme.palette.divider}`,
  borderTop: '3px solid transparent',
}))

export const HourGutter = styled('div')(({ theme }) => ({
  position: 'sticky',
  left: 0,
  zIndex: 5,
  backgroundColor: brand.paper,
  '& span': {
    position: 'absolute',
    right: theme.spacing(1),
    transform: 'translateY(-50%)',
    fontSize: '0.75rem',
    color: theme.palette.text.secondary,
    fontVariantNumeric: 'tabular-nums',
    lineHeight: 1,
  },
  '& span:first-of-type': {
    transform: 'none',
    top: 4,
  },
}))

export const DayColumn = styled('div')(({ theme }) => ({
  position: 'relative',
  borderLeft: `1px solid ${theme.palette.divider}`,
  backgroundImage: closedHatch,
  '&::after': {
    content: '""',
    position: 'absolute',
    inset: 0,
    pointerEvents: 'none',
    zIndex: 1,
    backgroundImage: `linear-gradient(to bottom, ${hourLine} 1px, transparent 1px), linear-gradient(to bottom, transparent ${30 * pixelsPerMinute}px, ${halfHourLine} ${30 * pixelsPerMinute}px, ${halfHourLine} ${30 * pixelsPerMinute + 1}px, transparent ${30 * pixelsPerMinute + 1}px)`,
    backgroundSize: `100% ${60 * pixelsPerMinute}px`,
  },
}))

export const OpenBand = styled('div')({
  position: 'absolute',
  left: 0,
  right: 0,
  backgroundColor: brand.paper,
})

export const AddSlot = styled('button')(({ theme }) => ({
  position: 'absolute',
  left: 2,
  right: 2,
  zIndex: 2,
  display: 'flex',
  alignItems: 'center',
  padding: theme.spacing(0, 1),
  border: '1px dashed transparent',
  borderRadius: 3,
  background: 'none',
  color: 'transparent',
  font: 'inherit',
  fontSize: '0.75rem',
  fontWeight: 600,
  fontVariantNumeric: 'tabular-nums',
  cursor: 'pointer',
  '&:hover, &:focus-visible': {
    borderColor: brand.orange,
    backgroundColor: 'rgba(226, 112, 31, 0.08)',
    color: brand.orangeDeep,
    outline: 'none',
  },
}))

export const Entry = styled('button')(({ theme }) => ({
  position: 'absolute',
  zIndex: 3,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-start',
  gap: 1,
  overflow: 'hidden',
  padding: theme.spacing(0.5, 0.75),
  border: 0,
  borderRadius: 3,
  font: 'inherit',
  textAlign: 'left',
  cursor: 'pointer',
  lineHeight: 1.2,
  '& .entry-time': {
    fontSize: '0.6875rem',
    fontVariantNumeric: 'tabular-nums',
    opacity: 0.8,
  },
  '& .entry-name': {
    fontSize: '0.8125rem',
    fontWeight: 650,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    maxWidth: '100%',
  },
  '& .entry-service': {
    fontSize: '0.75rem',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    maxWidth: '100%',
    opacity: 0.8,
  },
  '&:focus-visible': {
    outline: `2px solid ${brand.orange}`,
    outlineOffset: 1,
  },
  '&.is-confirmed': {
    backgroundColor: brand.espresso,
    color: brand.paper,
    '&:hover': { backgroundColor: '#3A2A26' },
  },
  '&.is-pending': {
    backgroundColor: '#FDF1E7',
    color: brand.espresso,
    boxShadow: `inset 0 0 0 1.5px ${brand.orange}`,
    backgroundImage: `repeating-linear-gradient(135deg, rgba(226, 112, 31, 0.10) 0 4px, transparent 4px 8px)`,
    '& .entry-time': { color: brand.orangeDeep, opacity: 1, fontWeight: 600 },
  },
  '&.is-completed': {
    backgroundColor: brand.stone,
    color: brand.espressoMuted,
    boxShadow: `inset 3px 0 0 ${brand.espressoMuted}`,
    '& .entry-name': { fontWeight: 550 },
  },
}))

export const BlockedEntry = styled('div')(({ theme }) => ({
  position: 'absolute',
  left: 2,
  right: 2,
  zIndex: 2,
  display: 'flex',
  flexDirection: 'column',
  gap: 1,
  overflow: 'hidden',
  padding: theme.spacing(0.5, 0.75),
  borderRadius: 3,
  border: `1px solid ${theme.palette.divider}`,
  backgroundColor: 'rgba(74, 54, 49, 0.08)',
  backgroundImage: `repeating-linear-gradient(135deg, rgba(74, 54, 49, 0.05) 0 4px, transparent 4px 8px)`,
  color: brand.espressoMuted,
  lineHeight: 1.2,
  pointerEvents: 'none',
  '& .entry-time': {
    fontSize: '0.6875rem',
    fontVariantNumeric: 'tabular-nums',
    opacity: 0.8,
  },
  '& .entry-name': {
    fontSize: '0.75rem',
    fontWeight: 600,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    maxWidth: '100%',
  },
}))

export const NowLine = styled('div')({
  position: 'absolute',
  left: 0,
  right: 0,
  zIndex: 4,
  height: 2,
  marginTop: -1,
  backgroundColor: brand.orange,
  pointerEvents: 'none',
  '&::before': {
    content: '""',
    position: 'absolute',
    left: -5,
    top: -4,
    width: 10,
    height: 10,
    borderRadius: '50%',
    backgroundColor: brand.orange,
  },
})

export const Legend = styled('ul')(({ theme }) => ({
  display: 'flex',
  flexWrap: 'wrap',
  gap: theme.spacing(1, 2.5),
  margin: theme.spacing(1.5, 0, 0),
  padding: 0,
  listStyle: 'none',
  fontSize: '0.8125rem',
  color: theme.palette.text.secondary,
  '& li': {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(0.75),
  },
  '& .swatch': {
    width: 14,
    height: 14,
    borderRadius: 2,
  },
  '& .swatch.is-confirmed': { backgroundColor: brand.espresso },
  '& .swatch.is-pending': {
    backgroundColor: '#FDF1E7',
    boxShadow: `inset 0 0 0 1.5px ${brand.orange}`,
  },
  '& .swatch.is-completed': {
    backgroundColor: brand.stone,
    boxShadow: `inset 3px 0 0 ${brand.espressoMuted}`,
  },
  '& .swatch.is-blocked': {
    backgroundColor: 'rgba(74, 54, 49, 0.12)',
    boxShadow: `inset 0 0 0 1px ${theme.palette.divider}`,
  },
  '& .swatch.is-closed': {
    backgroundImage: closedHatch,
    boxShadow: `inset 0 0 0 1px ${theme.palette.divider}`,
  },
}))
