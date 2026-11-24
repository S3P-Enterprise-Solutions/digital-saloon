import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

describe('BalayagePage brand-agnostic surface', () => {
  it('does not hard-code salon1500 brand chrome or brand-key checks', () => {
    const source = fs.readFileSync(path.join(__dirname, 'BalayagePage.tsx'), 'utf8')
    expect(source).not.toMatch(/salon1500|Luxurious Script|Roboto Condensed|#DFBFA4|brand\.key/)
    expect(source).toMatch(/content\.appearance/)
  })
})
