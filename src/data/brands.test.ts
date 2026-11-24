import { afterEach, describe, expect, it, vi } from 'vitest'

describe('brand key + default salon id', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.resetModules()
  })

  it('defaults to kimm salon id when VITE_BRAND is unset', async () => {
    vi.stubEnv('VITE_BRAND', '')
    vi.stubEnv('VITE_SALON_ID', '')
    const { getSalonId } = await import('./salonConfig')
    expect(getSalonId()).toBe('pilot')
  })

  it('uses salon1500 default salon id when VITE_BRAND=salon1500', async () => {
    vi.stubEnv('VITE_BRAND', 'salon1500')
    vi.stubEnv('VITE_SALON_ID', '')
    const { getSalonId } = await import('./salonConfig')
    expect(getSalonId()).toBe('salon1500')
  })

  it('uses hairboutique default salon id when VITE_BRAND=hairboutique', async () => {
    vi.stubEnv('VITE_BRAND', 'hairboutique')
    vi.stubEnv('VITE_SALON_ID', '')
    const { getSalonId } = await import('./salonConfig')
    expect(getSalonId()).toBe('hairboutique')
  })
})
