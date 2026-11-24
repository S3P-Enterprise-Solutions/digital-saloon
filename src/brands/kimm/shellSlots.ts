import type { BrandShellSlots } from '../types'
import { kimmProfile } from './profile'
import { FooterBrand, HeaderWordmark, HeroWordmark } from './shell'

export const kimmShell: BrandShellSlots = {
  HeaderWordmark,
  HeroWordmark,
  FooterBrand,
  documentTitle: `${kimmProfile.name} – Online-Terminbuchung`,
  themeColor: kimmProfile.colors.accent,
}
