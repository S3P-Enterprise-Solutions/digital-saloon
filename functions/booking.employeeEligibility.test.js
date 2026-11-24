import assert from 'node:assert/strict'
import test from 'node:test'

import {
  coversRequestedServices,
  isBookingCandidateRecord,
  resolveEmployeeIdsToCheck,
} from './lib/booking/employeeBooking.js'

test('isBookingCandidateRecord requires active, auth enabled, not removed', () => {
  assert.equal(isBookingCandidateRecord({ active: true, authDisabled: false }), true)
  assert.equal(isBookingCandidateRecord({ active: false, authDisabled: false }), false)
  assert.equal(isBookingCandidateRecord({ active: true, authDisabled: true }), false)
  assert.equal(
    isBookingCandidateRecord({ active: true, authDisabled: false, removedAt: '2026-01-01' }),
    false,
  )
})

test('coversRequestedServices requires all services on one employee', () => {
  assert.equal(coversRequestedServices(['a', 'b', 'c'], ['a', 'b']), true)
  assert.equal(coversRequestedServices(['a'], ['a', 'b']), false)
})

test('resolveEmployeeIdsToCheck flag off uses salon-only', () => {
  const result = resolveEmployeeIdsToCheck({
    featureEnabled: false,
    candidates: [{ id: 'e1', displayName: 'E', serviceIds: ['haircut'] }],
    requestedEmployeeId: null,
  })
  assert.deepEqual(result, { ok: true, employeeIds: [null] })
})

test('resolveEmployeeIdsToCheck flag on with no candidates is unavailable', () => {
  const result = resolveEmployeeIdsToCheck({
    featureEnabled: true,
    candidates: [],
    requestedEmployeeId: null,
  })
  assert.deepEqual(result, { ok: true, employeeIds: [] })
})

test('resolveEmployeeIdsToCheck requested employee must be eligible', () => {
  const result = resolveEmployeeIdsToCheck({
    featureEnabled: true,
    candidates: [{ id: 'e1', displayName: 'E', serviceIds: ['haircut'] }],
    requestedEmployeeId: 'missing',
  })
  assert.deepEqual(result, { ok: false, code: 'NOT_FOUND' })
})