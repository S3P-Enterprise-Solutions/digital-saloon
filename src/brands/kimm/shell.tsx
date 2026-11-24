import type * as React from 'react'
import { Box, Typography } from '@mui/material'

import {
  HeaderMark,
  HeroMark,
  MarkHair,
  MarkKimm,
  MarkStudio,
} from '../../components/Wordmark.styles'
import { kimmProfile } from './profile'

export const HeroWordmark: React.FunctionComponent = () => (
  <HeroMark role="img" aria-label="KIMM Hair, haarstudio capelli">
    <MarkKimm aria-hidden>KIMM</MarkKimm>
    <MarkHair aria-hidden>HAIR</MarkHair>
    <MarkStudio aria-hidden>
      haar<span>studio capelli</span>
    </MarkStudio>
  </HeroMark>
)

export const HeaderWordmark: React.FunctionComponent<{ label: string; onClick: () => void }> = ({
  label,
  onClick,
}) => (
  <HeaderMark type="button" aria-label={label} onClick={onClick}>
    <MarkKimm as="span" sx={{ display: 'inline' }}>
      KIMM
    </MarkKimm>
    <MarkHair as="span" sx={{ display: 'inline' }}>
      HAIR
    </MarkHair>
  </HeaderMark>
)

export const FooterBrand: React.FunctionComponent = () => (
  <Typography sx={{ fontWeight: 700, fontSize: '1.125rem' }}>
    <Box component="span" sx={{ color: kimmProfile.colors.accent }}>
      KIMM
    </Box>{' '}
    <Box component="span" sx={{ fontWeight: 300 }}>
      HAIR
    </Box>
  </Typography>
)
