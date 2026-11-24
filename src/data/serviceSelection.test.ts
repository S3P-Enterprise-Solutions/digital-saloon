import { describe, expect, it } from 'vitest'

import { parseSelectedServiceIds, serializeServiceIds } from './serviceSelection'

describe('parseSelectedServiceIds', () => {
  it('parses comma-separated serviceIds and dedupes', () => {
    expect(parseSelectedServiceIds({ serviceIds: 'a,b, a' })).toEqual(['a', 'b'])
  })

  it('falls back to legacy serviceId', () => {
    expect(parseSelectedServiceIds({ serviceId: 'x' })).toEqual(['x'])
  })

  it('prefers serviceIds over serviceId', () => {
    expect(parseSelectedServiceIds({ serviceId: 'x', serviceIds: 'a,b' })).toEqual(['a', 'b'])
  })

  it('returns empty when neither is set', () => {
    expect(parseSelectedServiceIds({})).toEqual([])
  })
})

describe('serializeServiceIds', () => {
  it('joins ids or returns undefined when empty', () => {
    expect(serializeServiceIds(['a', 'b'])).toBe('a,b')
    expect(serializeServiceIds([])).toBeUndefined()
  })
})
