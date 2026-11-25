import assert from 'node:assert/strict'
import test from 'node:test'

import { assertValidIntervals } from './lib/domain/workingHoursValidation.js'

test('assertValidIntervals rejects inverted start/end', () => {
  assert.throws(
    () => assertValidIntervals([{ start: '10:00', end: '09:00' }]),
    (error) => {
      assert.equal(error.code, 'invalid-argument')
      return true
    },
  )
})

test('assertValidIntervals rejects overlapping intervals', () => {
  assert.throws(
    () =>
      assertValidIntervals([
        { start: '09:00', end: '12:00' },
        { start: '11:00', end: '13:00' },
      ]),
    (error) => {
      assert.equal(error.code, 'invalid-argument')
      return true
    },
  )
})

test('assertValidIntervals allows valid multi-gap day', () => {
  assert.doesNotThrow(() =>
    assertValidIntervals([
      { start: '09:00', end: '12:00' },
      { start: '13:00', end: '17:00' },
    ]),
  )
})
