import { createSalonTheme } from '../createSalonTheme'
import type { BrandModule } from '../types'
import { HomePage } from './HomePage'
import { hairboutiqueProfile } from './profile'
import { hairboutiqueShell } from './shellSlots'

const { theme, brandColors } = createSalonTheme({
  colors: hairboutiqueProfile.colors,
  typography: hairboutiqueProfile.typography,
})

export const hairboutiqueModule: BrandModule = {
  key: 'hairboutique',
  HomePage,
  theme,
  brandColors,
  profile: hairboutiqueProfile,
  features: {
    employeeManagement: false,
  },
  shell: hairboutiqueShell,
}
