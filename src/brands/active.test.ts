import { afterEach, describe, expect, it, vi } from 'vitest'

import type { BrandModule } from './types'

function assertBrandModuleContract(module: BrandModule): void {
  expect(module.key).toEqual(expect.any(String))
  expect(module.profile.name).toEqual(expect.any(String))
  expect(module.features).toEqual(expect.any(Object))
  expect(module.theme).toBeTruthy()
  expect(module.brandColors).toBeTruthy()
  expect(typeof module.HomePage).toBe('function')
  expect(module.shell).toBeTruthy()
  expect(module.shell?.documentTitle).toContain(module.profile.name)
  expect(typeof module.shell?.HeaderWordmark).toBe('function')
  expect(module.shell?.themeColor).toEqual(expect.any(String))
}

describe('active brand module', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.resetModules()
  })

  it('defaults to kimm when VITE_BRAND is unset', async () => {
    vi.stubEnv('VITE_BRAND', '')
    const { getActiveBrandKey } = await import('./brandKey')
    const { getActiveBrandModule } = await import('./active')
    expect(getActiveBrandKey()).toBe('kimm')
    const module = getActiveBrandModule()
    expect(module.key).toBe('kimm')
    expect(module.profile.name).toBe('KIMM Hair')
    assertBrandModuleContract(module)
  })

  it('selects salon1500 when VITE_BRAND=salon1500', async () => {
    vi.stubEnv('VITE_BRAND', 'salon1500')
    const { getActiveBrandKey } = await import('./brandKey')
    const { getActiveBrandModule } = await import('./active')
    expect(getActiveBrandKey()).toBe('salon1500')
    const module = getActiveBrandModule()
    expect(module.key).toBe('salon1500')
    expect(module.profile.name).toBe('Salon 1500')
    expect(module.profile.stylists).toHaveLength(2)
    assertBrandModuleContract(module)
  })

  it('rejects unknown VITE_BRAND values instead of silently falling back to kimm', async () => {
    vi.stubEnv('VITE_BRAND', 'typo-salon')
    const { getActiveBrandKey } = await import('./brandKey')
    expect(() => getActiveBrandKey()).toThrow(/Unknown VITE_BRAND/)
  })

  it('selects hairboutique when VITE_BRAND=hairboutique', async () => {
    vi.stubEnv('VITE_BRAND', 'hairboutique')
    const { getActiveBrandKey } = await import('./brandKey')
    const { getActiveBrandModule } = await import('./active')
    expect(getActiveBrandKey()).toBe('hairboutique')
    const module = getActiveBrandModule()
    expect(module.key).toBe('hairboutique')
    expect(module.profile.name).toBe('Hairboutique OHG')
    expect(module.profile.stylists).toHaveLength(2)
    assertBrandModuleContract(module)
  })

  it('all brand modules satisfy the BrandModule contract', async () => {
    const { kimmModule } = await import('./kimm/module')
    const { salon1500Module } = await import('./salon1500/module')
    const { hairboutiqueModule } = await import('./hairboutique/module')
    assertBrandModuleContract(kimmModule)
    assertBrandModuleContract(salon1500Module)
    assertBrandModuleContract(hairboutiqueModule)
    expect(kimmModule.features).toEqual(expect.any(Object))
    expect(salon1500Module.features).toEqual(expect.any(Object))
    expect(hairboutiqueModule.features).toEqual(expect.any(Object))
  })

  it('does not leave Task 1 stub home pages behind', async () => {
    await expect(import('./kimm/StubHomePage')).rejects.toThrow()
    await expect(import('./salon1500/StubHomePage')).rejects.toThrow()
  })
})
