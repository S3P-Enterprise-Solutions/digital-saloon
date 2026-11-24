import type * as React from 'react'
import { Box } from '@mui/material'

import { HeaderMark } from '../../components/Wordmark.styles'
import { hairboutiqueProfile } from './profile'

const InlineMark: React.FunctionComponent<{
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

export const HeroWordmark: React.FunctionComponent = () => (
  <Box
    role="img"
    aria-label="Hairboutique OHG"
    sx={{ display: 'flex', alignItems: 'center', gap: 2.5 }}
  >
    {hairboutiqueProfile.logoUrl ? (
      <Box
        component="img"
        src={hairboutiqueProfile.logoUrl}
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
    <InlineMark
      scriptSize={{ xs: '2.5rem', sm: '3.25rem' }}
      sansSize={{ xs: '1.1rem', sm: '1.35rem' }}
      sansColor="inherit"
    />
  </Box>
)

export const HeaderWordmark: React.FunctionComponent<{ label: string; onClick: () => void }> = ({
  label,
  onClick,
}) => (
  <HeaderMark type="button" aria-label={label} onClick={onClick}>
    <InlineMark
      scriptSize={{ xs: '1.25rem', sm: '1.5rem' }}
      sansSize={{ xs: '0.7rem', sm: '0.8rem' }}
    />
  </HeaderMark>
)

export const FooterBrand: React.FunctionComponent = () => (
  <InlineMark scriptSize="1.35rem" sansSize="0.85rem" sansColor="rgba(249, 250, 250, 0.85)" />
)
