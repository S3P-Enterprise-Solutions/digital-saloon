import assert from 'node:assert/strict'
import test from 'node:test'

import {
  assertCanSetEmployeeBookable,
  authDisableEmployeePatch,
  authEnableEmployeePatch,
  filterBookableProjections,
  isBookableEmployeeRecord,
  toBookableProjection,
} from './lib/admin/employees.js'

test('assertCanSetEmployeeBookable rejects active true when authDisabled', () => {
  assert.throws(
    () => assertCanSetEmployeeBookable({ authDisabled: true }, true),
    (error) => {
      assert.equal(error.code, 'failed-precondition')
      return true
    },
  )
})

test('assertCanSetEmployeeBookable allows active false when authDisabled', () => {
  assert.doesNotThrow(() => assertCanSetEmployeeBookable({ authDisabled: true }, false))
})

test('assertCanSetEmployeeBookable allows active true when Auth enabled', () => {
  assert.doesNotThrow(() => assertCanSetEmployeeBookable({ authDisabled: false }, true))
})

test('authDisableEmployeePatch sets authDisabled and active false', () => {
  const at = '2026-11-24T12:00:00.000Z'
  assert.deepEqual(authDisableEmployeePatch(at), {
    authDisabled: true,
    active: false,
    updatedAt: at,
  })
})

test('authEnableEmployeePatch clears authDisabled without touching active', () => {
  const at = '2026-11-24T12:00:00.000Z'
  const patch = authEnableEmployeePatch(at)
  assert.deepEqual(patch, { authDisabled: false, updatedAt: at })
  assert.ok(!('active' in patch))
})

test('isBookableEmployeeRecord excludes inactive and auth-disabled', () => {
  assert.equal(isBookableEmployeeRecord({ active: false, authDisabled: false }), false)
  assert.equal(isBookableEmployeeRecord({ active: true, authDisabled: true }), false)
  assert.equal(
    isBookableEmployeeRecord({ active: true, authDisabled: false, removedAt: '2026-01-01' }),
    false,
  )
  assert.equal(isBookableEmployeeRecord({ active: true, authDisabled: false }), true)
})

test('listBookable projection omits email', () => {
  const projection = toBookableProjection('uid-1', {
    displayName: 'Jane Doe',
    email: 'secret@example.com',
    serviceIds: ['svc-a'],
    active: true,
  })
  assert.deepEqual(projection, {
    id: 'uid-1',
    displayName: 'Jane Doe',
    serviceIds: ['svc-a'],
  })
  assert.ok(!('email' in projection))
})

test('filterBookableProjections returns only bookable employees', () => {
  const result = filterBookableProjections([
    {
      id: 'a',
      data: { displayName: 'Active', active: true, authDisabled: false, serviceIds: [] },
    },
    {
      id: 'b',
      data: { displayName: 'Off', active: false, authDisabled: false, serviceIds: [] },
    },
    {
      id: 'c',
      data: { displayName: 'No login', active: true, authDisabled: true, serviceIds: [] },
    },
  ])
  assert.deepEqual(result, [{ id: 'a', displayName: 'Active', serviceIds: [] }])
})
