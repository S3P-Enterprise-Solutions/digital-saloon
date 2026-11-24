import { describe, expect, it } from 'vitest'

import { resistedPull } from './usePullToRefresh'

describe('pull-to-refresh resistance', () => {
  it('returns 0 for upward or zero movement', () => {
    expect(resistedPull(0, 112)).toBe(0)
    expect(resistedPull(-20, 112)).toBe(0)
  })

  it('applies resistance and caps at maxPullPx', () => {
    expect(resistedPull(100, 112)).toBeCloseTo(55)
    expect(resistedPull(400, 112)).toBe(112)
  })
})
