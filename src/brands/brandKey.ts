import type { BrandKey } from './types'

export const KNOWN_BRAND_KEYS = [
  'kimm',
  'salon1500',
  'hairboutique',
] as const satisfies readonly BrandKey[]

function isBrandKey(value: string): value is BrandKey {
  return (KNOWN_BRAND_KEYS as readonly string[]).includes(value)
}

/** Sole place that maps `VITE_BRAND` → key (besides intentional tests). */
export function getActiveBrandKey(): BrandKey {
  const raw = import.meta.env.VITE_BRAND
  if (typeof raw !== 'string' || raw.trim().length === 0) {
    return 'kimm'
  }
  const normalized = raw.trim().toLowerCase()
  if (isBrandKey(normalized)) {
    return normalized
  }
  throw new Error(
    `Unknown VITE_BRAND="${raw.trim()}". Expected one of: ${KNOWN_BRAND_KEYS.join(', ')}`,
  )
}

/** Default Firestore salon ids — kept here so `data/` need not import brand modules. */
export const defaultSalonIdByBrand: Record<BrandKey, string> = {
  kimm: 'pilot',
  salon1500: 'salon1500',
  hairboutique: 'hairboutique',
}
