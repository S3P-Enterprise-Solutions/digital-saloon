import { afterEach, describe, expect, it, vi } from 'vitest'

describe('brands registry', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.resetModules()
  })

  it('defaults to kimm when VITE_BRAND is unset', async () => {
    vi.stubEnv('VITE_BRAND', '')
    const { getActiveBrand } = await import('./brands')
    expect(getActiveBrand().key).toBe('kimm')
    expect(getActiveBrand().name).toBe('KIMM Hair')
  })

  it('selects hairboutique when VITE_BRAND=hairboutique', async () => {
    vi.stubEnv('VITE_BRAND', 'hairboutique')
    const { getActiveBrand } = await import('./brands')
    const brand = getActiveBrand()
    expect(brand.key).toBe('hairboutique')
    expect(brand.defaultSalonId).toBe('hairboutique')
  })

  it('selects salon1500 when VITE_BRAND=salon1500', async () => {
    vi.stubEnv('VITE_BRAND', 'salon1500')
    const { getActiveBrand } = await import('./brands')
    const brand = getActiveBrand()
    expect(brand.key).toBe('salon1500')
    expect(brand.name).toBe('Salon 1500')
    expect(brand.stylists).toHaveLength(2)
  })
})
