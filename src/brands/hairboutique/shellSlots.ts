import type { BrandShellSlots } from '../types'
import { hairboutiqueProfile } from './profile'
import { FooterBrand, HeaderWordmark, HeroWordmark } from './shell'

export const hairboutiqueShell: BrandShellSlots = {
  HeaderWordmark,
  HeroWordmark,
  FooterBrand,
  documentTitle: `${hairboutiqueProfile.name} – Online-Terminbuchung`,
  faviconHref: '/favicon-hairboutique.svg',
  themeColor: hairboutiqueProfile.colors.accent,
}
