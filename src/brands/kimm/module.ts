import { createSalonTheme } from '../createSalonTheme'
import type { BrandModule } from '../types'
import { HomePage } from './HomePage'
import { kimmProfile } from './profile'
import { kimmShell } from './shellSlots'

const { theme, brandColors } = createSalonTheme({
  colors: kimmProfile.colors,
  typography: kimmProfile.typography,
})

export const kimmModule: BrandModule = {
  key: 'kimm',
  HomePage,
  theme,
  brandColors,
  profile: kimmProfile,
  features: {},
  shell: kimmShell,
}
