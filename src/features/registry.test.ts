import { describe, expect, it } from 'vitest'

import type { BalayageContent } from './balayage/content'
import { resolveEnabledBalayageContent } from './registry'

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
  packages: [],
}

describe('resolveEnabledBalayageContent', () => {
  it('returns null when the feature flag is off', () => {
    expect(
      resolveEnabledBalayageContent({
        key: 'kimm',
        features: { balayage: false },
        featureContent: { balayage: sampleContent },
      }),
    ).toBeNull()
  })

  it('returns content when the feature flag is on', () => {
    expect(
      resolveEnabledBalayageContent({
        key: 'salon1500',
        features: { balayage: true },
        featureContent: { balayage: sampleContent },
      }),
    ).toBe(sampleContent)
  })

  it('throws when balayage is enabled without featureContent', () => {
    expect(() =>
      resolveEnabledBalayageContent({
        key: 'salon1500',
        features: { balayage: true },
      }),
    ).toThrow(/featureContent\.balayage is missing/)
  })
})
