import { getActiveBrandModule } from './brands/active'

const active = getActiveBrandModule()

/** Active salon MUI theme (from the brand module selected by `VITE_BRAND`). */
export const theme = active.theme

/** Active salon brand color tokens for `sx` usage. */
export const brand = active.brandColors
