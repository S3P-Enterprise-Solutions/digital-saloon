import type * as React from 'react'
import type { Theme } from '@mui/material/styles'

import type { Locale } from '../i18n'
import type { HomepageConfig, Salon } from '../data/schemas'
import type { OpeningHoursByWeekday } from '../data/openingHours'
import type { ServiceWithId } from '../data/services'
import type { BalayageContent } from '../features/balayage/content'

export type { BalayageContent }

export type BrandKey = 'kimm' | 'salon1500' | 'hairboutique'

export type BrandStylist = {
  name: string
  roleDe: string
  roleIt: string
  phone: string
  imageUrl?: string
  instagramUrl?: string
}

export type BrandGalleryItem = {
  src: string
  altDe: string
  altIt: string
}

export type BrandProfile = {
  key: BrandKey
  defaultSalonId: string
  name: string
  logoUrl?: string
  instagramUrl?: string
  instagramHandle?: string
  mapsUrl?: string
  facebookUrl?: string
  place: Record<Locale, string>
  heroIntro: Record<Locale, string>
  heroSlides: readonly string[]
  stylists: readonly BrandStylist[]
  gallery: readonly BrandGalleryItem[]
  colors: {
    primary: string
    primaryDeep: string
    accent: string
    accentDeep: string
    surface: string
    paper: string
    divider: string
  }
  typography: {
    fontFamily: string
    headingFontFamily: string
  }
}

/** sx helper tokens (legacy `brand` export from theme.ts). */
export type BrandColorTokens = {
  orange: string
  orangeDeep: string
  espresso: string
  espressoMuted: string
  stone: string
  paper: string
}

export type BrandThemeTokens = {
  colors: BrandProfile['colors']
  typography: BrandProfile['typography']
}

export type FeatureFlags = {
  balayage?: boolean
  // later: balayage?: boolean | BalayageFeatureConfig
}

/**
 * Controlled private-route descriptor. TanStack route objects stay in the
 * routes layer — not on the public brand contract.
 * Wiring helpers are deferred until a brand actually needs private routes.
 */
export type RouteDefinition = {
  id: string
  path: `/${string}`
}

export type HomePageProps = {
  salon: Salon | null
  services: ServiceWithId[] | undefined
  servicesLoading: boolean
  servicesError: boolean
  openingHours: OpeningHoursByWeekday | undefined
  openingHoursLoading: boolean
  openingHoursError: boolean
  homepageConfig?: HomepageConfig
  onEditHomepageClick?: () => void
  onBookClick: () => void
  onServiceClick: (serviceId: string) => void
}

export type BrandShellSlots = {
  HeaderWordmark: React.FunctionComponent<{ label: string; onClick: () => void }>
  HeroWordmark?: React.FunctionComponent
  FooterBrand: React.FunctionComponent
  documentTitle: string
  faviconHref?: string
  themeColor: string
}

export type BrandModule = {
  key: BrandKey
  HomePage: React.FunctionComponent<HomePageProps>
  theme: Theme
  brandColors: BrandColorTokens
  profile: BrandProfile
  features: FeatureFlags
  featureContent?: {
    balayage?: BalayageContent
  }
  shell?: BrandShellSlots
  privateRoutes?: readonly RouteDefinition[]
}
