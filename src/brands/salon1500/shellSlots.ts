import type { BrandShellSlots } from '../types'
import { salon1500Profile } from './profile'
import { FooterBrand, HeaderWordmark, HeroWordmark } from './shell'

export const salon1500Shell: BrandShellSlots = {
  HeaderWordmark,
  HeroWordmark,
  FooterBrand,
  documentTitle: `${salon1500Profile.name} – Online-Terminbuchung`,
  faviconHref: '/favicon-salon1500.svg',
  themeColor: salon1500Profile.colors.accent,
}
