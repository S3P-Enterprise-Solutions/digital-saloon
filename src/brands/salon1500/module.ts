import { createSalonTheme } from '../createSalonTheme'
import type { BrandModule } from '../types'
import { salon1500BalayageContent } from './balayageContent'
import { HomePage } from './HomePage'
import { salon1500Profile } from './profile'
import { salon1500Shell } from './shellSlots'

const { theme, brandColors } = createSalonTheme({
  colors: salon1500Profile.colors,
  typography: salon1500Profile.typography,
})

export const salon1500Module: BrandModule = {
  key: 'salon1500',
  HomePage,
  theme,
  brandColors,
  profile: salon1500Profile,
  features: {
    balayage: true,
  },
  featureContent: {
    balayage: salon1500BalayageContent,
  },
  shell: salon1500Shell,
}
