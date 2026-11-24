import { defaultSalonIdByBrand, getActiveBrandKey } from '../brands/brandKey'

const DEFAULT_SALON_ID = 'pilot'

/** Salon document id for this single-salon deployment. */
export function getSalonId(): string {
  const fromEnv = import.meta.env.VITE_SALON_ID
  if (typeof fromEnv === 'string' && fromEnv.trim().length > 0) {
    return fromEnv.trim()
  }
  return defaultSalonIdByBrand[getActiveBrandKey()] || DEFAULT_SALON_ID
}

export const defaultSalonId = DEFAULT_SALON_ID

/**
 * Global price visibility flag (`VITE_SHOW_PRICES=true|false`).
 * Defaults to `true` unless explicitly set to `'false'` or `'0'`.
 */
export function arePricesVisible(): boolean {
  const raw = import.meta.env.VITE_SHOW_PRICES
  if (typeof raw !== 'string') return true
  const normalized = raw.trim().toLowerCase()
  if (normalized === 'false' || normalized === '0') return false
  return true
}
