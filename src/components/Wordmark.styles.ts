import { keyframes, styled } from '@mui/material/styles'

const drawRule = keyframes`
  from { transform: scaleY(0); }
  to { transform: scaleY(1); }
`

const settle = keyframes`
  from { opacity: 0; transform: translateX(-0.25em); }
  to { opacity: 1; transform: translateX(0); }
`

export const HeroMark = styled('span')(({ theme }) => ({
  display: 'block',
  position: 'relative',
  paddingLeft: 'clamp(1.25rem, 3.5vw, 2.5rem)',
  fontSize: 'clamp(4.25rem, 15vw, 10.5rem)',
  lineHeight: 0.86,
  color: theme.palette.primary.main,
  '&::before': {
    content: '""',
    position: 'absolute',
    left: 0,
    top: '0.04em',
    bottom: '0.02em',
    width: 2,
    backgroundColor: theme.palette.primary.main,
    transformOrigin: 'top',
    animation: `${drawRule} 700ms cubic-bezier(0.2, 0.7, 0.2, 1) both`,
  },
  '& > *': {
    animation: `${settle} 600ms 250ms cubic-bezier(0.2, 0.7, 0.2, 1) both`,
  },
  '@media (prefers-reduced-motion: reduce)': {
    '&::before, & > *': { animation: 'none' },
  },
  [theme.breakpoints.down('sm')]: {
    lineHeight: 0.9,
  },
}))

export const MarkKimm = styled('span')(({ theme }) => ({
  display: 'block',
  color: theme.palette.secondary.main,
  fontWeight: 800,
  letterSpacing: '-0.01em',
}))

export const MarkHair = styled('span')({
  display: 'block',
  fontWeight: 280,
  letterSpacing: '0.005em',
})

export const MarkStudio = styled('span')(({ theme }) => ({
  display: 'block',
  marginTop: '0.32em',
  fontSize: '0.235em',
  fontWeight: 400,
  lineHeight: 1,
  letterSpacing: '-0.005em',
  '& > span': {
    color: theme.palette.secondary.main,
  },
}))

export const HeaderMark = styled('button')(({ theme }) => ({
  display: 'inline-flex',
  alignItems: 'baseline',
  gap: '0.3em',
  padding: '2px 0 2px 12px',
  border: 0,
  borderLeft: `2px solid ${theme.palette.primary.main}`,
  background: 'none',
  color: theme.palette.primary.main,
  font: 'inherit',
  fontSize: '1.5rem',
  lineHeight: 1,
  cursor: 'pointer',
  '&:focus-visible': {
    outline: `2px solid ${theme.palette.secondary.main}`,
    outlineOffset: 4,
  },
  [theme.breakpoints.down('sm')]: {
    flexShrink: 0,
    paddingLeft: 10,
    fontSize: '1.25rem',
  },
}))
