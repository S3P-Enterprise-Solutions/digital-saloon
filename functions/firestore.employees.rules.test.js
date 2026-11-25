import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

const rulesPath = join(dirname(fileURLToPath(import.meta.url)), '../firestore.rules')

test('employees collection has no public read', () => {
  const rules = readFileSync(rulesPath, 'utf8')
  const employeesBlock = rules.match(/match \/employees\/\{employeeId\} \{[\s\S]*?^\s{6}\}/m)
  assert.ok(employeesBlock, 'employees rules block present')
  assert.ok(!employeesBlock[0].includes('allow read: if true'), 'public employee read denied')
  assert.ok(employeesBlock[0].includes('allow write: if false'), 'client employee writes denied')
})
