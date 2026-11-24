import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

const rulesPath = join(dirname(fileURLToPath(import.meta.url)), '../firestore.rules')

test('reservations collection is not readable by employees via rules', () => {
  const rules = readFileSync(rulesPath, 'utf8')
  const block = rules.match(/match \/reservations\/\{reservationId\} \{[\s\S]*?^\s{6}\}/m)
  assert.ok(block, 'reservations rules block present')
  assert.ok(block[0].includes('allow read: if isAdmin()'))
  assert.ok(!block[0].includes('role') || !block[0].includes('employee'))
})
