import type * as React from 'react'
import { Box, Typography } from '@mui/material'

import { getActiveBrand } from '../data/brands'
import { HeaderMark, HeroMark, MarkHair, MarkKimm, MarkStudio } from './Wordmark.styles'

/** Active salon logo set in type (KIMM Hair or Salon 1500). */
export const HairboutiqueInlineMark: React.FunctionComponent<{
  scriptSize: string | Record<string, string>
  sansSize: string | Record<string, string>
  sansColor?: string
}> = ({ scriptSize, sansSize, sansColor = 'inherit' }) => (
  <Box
    component="span"
    sx={{ display: 'inline-flex', alignItems: 'baseline', gap: 0.75, whiteSpace: 'nowrap' }}
  >
    <Box
      component="span"
      sx={{ fontFamily: '"Satisfy", cursive', fontSize: scriptSize, lineHeight: 1 }}
    >
      Hair
    </Box>
    <Box
      component="span"
      sx={{
        fontWeight: 600,
        letterSpacing: '0.16em',
        fontSize: sansSize,
        textTransform: 'uppercase',
        color: sansColor,
      }}
    >
      Boutique
    </Box>
  </Box>
)

export const HeroWordmark: React.FunctionComponent = () => {
  const activeBrand = getActiveBrand()

  if (activeBrand.key === 'hairboutique') {
    return (
      <Box
        role="img"
        aria-label="Hairboutique OHG"
        sx={{ display: 'flex', alignItems: 'center', gap: 2.5 }}
      >
        {activeBrand.logoUrl ? (
          <Box
            component="img"
            src={activeBrand.logoUrl}
            alt="Hairboutique OHG Logo"
            sx={{
              width: { xs: 68, sm: 84 },
              height: { xs: 68, sm: 84 },
              borderRadius: 1,
              objectFit: 'cover',
              display: 'block',
            }}
          />
        ) : null}
        <HairboutiqueInlineMark
          scriptSize={{ xs: '2.5rem', sm: '3.25rem' }}
          sansSize={{ xs: '1.1rem', sm: '1.35rem' }}
          sansColor="inherit"
        />
      </Box>
    )
  }

  if (activeBrand.key === 'salon1500') {
    return (
      <Box
        role="img"
        aria-label="Salon 1500 — Mauls, Freienfeld"
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 3,
          borderLeft: `4px solid ${activeBrand.colors.accent}`,
          pl: 3,
          py: 0.5,
        }}
      >
        {activeBrand.logoUrl ? (
          <Box
            component="img"
            src={activeBrand.logoUrl}
            alt="Salon 1500 Logo"
            sx={{
              width: { xs: 84, sm: 112 },
              height: 'auto',
              borderRadius: 1,
              border: `1px solid ${activeBrand.colors.divider}`,
              display: 'block',
            }}
          />
        ) : null}
        <Box>
          <Typography
            component="span"
            sx={{
              display: 'block',
              fontFamily: activeBrand.typography.headingFontFamily,
              fontSize: { xs: '2.75rem', sm: '4rem', md: '4.75rem' },
              fontWeight: 400,
              lineHeight: 0.95,
              letterSpacing: '0.02em',
              color: activeBrand.colors.primary,
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
              color: activeBrand.colors.primaryDeep,
            }}
          >
            Styles · Mauls
          </Typography>
        </Box>
      </Box>
    )
  }

  return (
    <HeroMark role="img" aria-label="KIMM Hair, haarstudio capelli">
      <MarkKimm aria-hidden>KIMM</MarkKimm>
      <MarkHair aria-hidden>HAIR</MarkHair>
      <MarkStudio aria-hidden>
        haar<span>studio capelli</span>
      </MarkStudio>
    </HeroMark>
  )
}

export type HeaderWordmarkProps = {
  label: string
  onClick: () => void
}

export const HeaderWordmark: React.FunctionComponent<HeaderWordmarkProps> = ({
  label,
  onClick,
}) => {
  const activeBrand = getActiveBrand()

  if (activeBrand.key === 'hairboutique') {
    return (
      <HeaderMark type="button" aria-label={label} onClick={onClick}>
        <Box
          component="span"
          sx={{ display: 'inline-flex', alignItems: 'baseline', gap: 0.5, whiteSpace: 'nowrap' }}
        >
          <Box
            component="span"
            sx={{
              fontFamily: '"Satisfy", cursive',
              fontSize: { xs: '1.35rem', sm: '1.6rem' },
              lineHeight: 1,
              color: activeBrand.colors.primary,
            }}
          >
            Hair
          </Box>
          <Box
            component="span"
            sx={{
              fontFamily: activeBrand.typography.headingFontFamily,
              fontSize: { xs: '0.78rem', sm: '0.9rem' },
              fontWeight: 600,
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              color: activeBrand.colors.accent,
            }}
          >
            Boutique
          </Box>
        </Box>
      </HeaderMark>
    )
  }

  if (activeBrand.key === 'salon1500') {
    return (
      <HeaderMark type="button" aria-label={label} onClick={onClick}>
        <Box
          component="span"
          sx={{
            fontFamily: activeBrand.typography.headingFontFamily,
            fontSize: { xs: '1.15rem', sm: '1.5rem' },
            fontWeight: 600,
            letterSpacing: '0.04em',
            whiteSpace: 'nowrap',
            color: activeBrand.colors.primary,
          }}
        >
          Salon 1500
        </Box>
      </HeaderMark>
    )
  }

  return (
    <HeaderMark type="button" aria-label={label} onClick={onClick}>
      <MarkKimm as="span" sx={{ display: 'inline' }}>
        KIMM
      </MarkKimm>
      <MarkHair as="span" sx={{ display: 'inline' }}>
        HAIR
      </MarkHair>
    </HeaderMark>
  )
}
