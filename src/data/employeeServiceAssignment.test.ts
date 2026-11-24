import { describe, expect, it } from 'vitest'

import { toggleServiceAssignment } from './employeeServiceAssignment'

describe('toggleServiceAssignment', () => {
  it('adds serviceId when absent', () => {
    expect(toggleServiceAssignment(['a'], 'b')).toEqual(['a', 'b'])
  })

  it('removes serviceId when present', () => {
    expect(toggleServiceAssignment(['a', 'b'], 'a')).toEqual(['b'])
  })

  it('returns empty when removing the only id', () => {
    expect(toggleServiceAssignment(['x'], 'x')).toEqual([])
  })
})
