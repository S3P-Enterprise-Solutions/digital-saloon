import { createRootRoute } from '@tanstack/react-router'
import { describe, expect, it } from 'vitest'

import type { BrandModule } from '../brands/types'
import type { BalayageContent } from '../features/balayage/content'

const sampleContent: BalayageContent = {
  appearance: {
    scriptFont: 'serif',
    bodyFont: 'sans-serif',
    accent: '#ccc',
    surface: '#eee',
    ink: '#000',
    muted: '#666',
  },
  heroImageUrls: ['https://example.com/a.jpg'],
  packages: [
    {
      id: 'balayage-xs',
      size: 'XS',
      title: 'Paket XS',
      subtitleDe: 'de',
      subtitleIt: 'it',
      duration: '180 min',
      price: '140€',
      includesDe: ['a'],
      includesIt: ['a'],
    },
  ],
}

function fakeModule(partial: Pick<BrandModule, 'features' | 'featureContent'>): BrandModule {
  return {
    key: 'kimm',
    HomePage: () => null,
    theme: {} as BrandModule['theme'],
    brandColors: {
      orange: '#000',
      orangeDeep: '#000',
      espresso: '#000',
      espressoMuted: '#000',
      stone: '#000',
      paper: '#fff',
    },
    profile: {
      key: 'kimm',
      defaultSalonId: 'pilot',
      name: 'Test',
      place: { de: '', it: '' },
      heroIntro: { de: '', it: '' },
      heroSlides: [],
      stylists: [],
      gallery: [],
      colors: {
        primary: '#000',
        primaryDeep: '#000',
        accent: '#000',
        accentDeep: '#000',
        surface: '#fff',
        paper: '#fff',
        divider: '#000',
      },
      typography: { fontFamily: 'sans-serif', headingFontFamily: 'sans-serif' },
    },
    ...partial,
  }
}

describe('buildFeatureRoutes', () => {
  const parent = createRootRoute()

  it('omits balayage when the feature flag is off', async () => {
    const { buildFeatureRoutes } = await import('./buildFeatureRoutes')
    const routes = buildFeatureRoutes(
      parent,
      fakeModule({ features: { balayage: false }, featureContent: { balayage: sampleContent } }),
    )
    expect(routes.map((route) => route.options.path)).not.toContain('/balayage')
  })

  it('registers /balayage when the feature flag is on and content is present', async () => {
    const { buildFeatureRoutes } = await import('./buildFeatureRoutes')
    const routes = buildFeatureRoutes(
      parent,
      fakeModule({ features: { balayage: true }, featureContent: { balayage: sampleContent } }),
    )
    expect(routes.map((route) => route.options.path)).toContain('/balayage')
  })

  it('wires real brand modules: kimm omits balayage, salon1500 registers it', async () => {
    const { buildFeatureRoutes } = await import('./buildFeatureRoutes')
    const { kimmModule } = await import('../brands/kimm/module')
    const { salon1500Module } = await import('../brands/salon1500/module')
    expect(buildFeatureRoutes(parent, kimmModule).map((route) => route.options.path)).not.toContain(
      '/balayage',
    )
    expect(
      buildFeatureRoutes(parent, salon1500Module).map((route) => route.options.path),
    ).toContain('/balayage')
  })
})
