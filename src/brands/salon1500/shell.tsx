import type * as React from 'react'
import { Box, Typography } from '@mui/material'

import { HeaderMark } from '../../components/Wordmark.styles'
import { salon1500Profile } from './profile'

export const HeroWordmark: React.FunctionComponent = () => (
  <Box
    role="img"
    aria-label="Salon 1500 — Mauls, Freienfeld"
    sx={{
      display: 'flex',
      alignItems: 'center',
      gap: 3,
      borderLeft: `4px solid ${salon1500Profile.colors.accent}`,
      pl: 3,
      py: 0.5,
    }}
  >
    {salon1500Profile.logoUrl ? (
      <Box
        component="img"
        src={salon1500Profile.logoUrl}
        alt="Salon 1500 Logo"
        sx={{
          width: { xs: 84, sm: 112 },
          height: 'auto',
          borderRadius: 1,
          border: `1px solid ${salon1500Profile.colors.divider}`,
          display: 'block',
        }}
      />
    ) : null}
    <Box>
      <Typography
        component="span"
        sx={{
          display: 'block',
          fontFamily: salon1500Profile.typography.headingFontFamily,
          fontSize: { xs: '2.75rem', sm: '4rem', md: '4.75rem' },
          fontWeight: 400,
          lineHeight: 0.95,
          letterSpacing: '0.02em',
          color: salon1500Profile.colors.primary,
        }}
      >
        Salon 1500
      </Typography>
      <Typography
        component="span"
        sx={{
          display: 'block',
          mt: 1,
          fontSize: '0.9rem',
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          color: salon1500Profile.colors.primaryDeep,
        }}
      >
        Styles · Mauls
      </Typography>
    </Box>
  </Box>
)

export const HeaderWordmark: React.FunctionComponent<{ label: string; onClick: () => void }> = ({
  label,
  onClick,
}) => (
  <HeaderMark type="button" aria-label={label} onClick={onClick}>
    <Box
      component="span"
      sx={{
        fontFamily: salon1500Profile.typography.headingFontFamily,
        fontSize: { xs: '1.15rem', sm: '1.5rem' },
        fontWeight: 600,
        letterSpacing: '0.04em',
        whiteSpace: 'nowrap',
        color: salon1500Profile.colors.primary,
      }}
    >
      Salon 1500
    </Box>
  </HeaderMark>
)

export const FooterBrand: React.FunctionComponent = () => (
  <Typography sx={{ fontWeight: 700, fontSize: '1.125rem' }}>
    <Box component="span" sx={{ color: salon1500Profile.colors.accent }}>
      Salon
    </Box>{' '}
    <Box component="span" sx={{ fontWeight: 300 }}>
      1500
    </Box>
  </Typography>
)
