import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { parseDurationOverride } from './lib/booking/reservationWrite.js'
import {
  customerDocIdForEmail,
  doesCalendarTitleMatchCustomer,
  doesReservationMatchCustomerTarget,
  extractCustomerNameFromCalendarTitle,
  extractRecurringCalendarCustomers,
  isLikelyPrivateOrNonCustomerEvent,
  nameOrderInsensitiveKey,
} from './lib/customers/matching.js'

describe('customer smart calendar matching & seeding', () => {
  it('identifies likely private or non-customer events in DE, IT, and EN', () => {
    assert.equal(isLikelyPrivateOrNonCustomerEvent('Zahnarzt'), true)
    assert.equal(isLikelyPrivateOrNonCustomerEvent('Mittagspause'), true)
    assert.equal(isLikelyPrivateOrNonCustomerEvent('Urlaub Sommer'), true)
    assert.equal(isLikelyPrivateOrNonCustomerEvent('Pausa pranzo'), true)
    assert.equal(isLikelyPrivateOrNonCustomerEvent('Ferie agosto'), true)
    assert.equal(isLikelyPrivateOrNonCustomerEvent('Maria Rossi - Balayage'), false)
    assert.equal(isLikelyPrivateOrNonCustomerEvent('Anna Gruber'), false)
  })

  it('extracts customer names from messy Google Calendar titles', () => {
    assert.deepEqual(extractCustomerNameFromCalendarTitle('Maria Rossi — Balayage'), {
      firstName: 'Maria',
      lastName: 'Rossi',
      fullName: 'Maria Rossi',
      normalizedFullName: 'maria rossi',
      orderInsensitiveKey: 'maria rossi',
    })

    assert.deepEqual(extractCustomerNameFromCalendarTitle('Anna Gruber (Färben + Schnitt)'), {
      firstName: 'Anna',
      lastName: 'Gruber',
      fullName: 'Anna Gruber',
      normalizedFullName: 'anna gruber',
      orderInsensitiveKey: 'anna gruber',
    })

    assert.deepEqual(extractCustomerNameFromCalendarTitle('Colore: Giulia Bianchi'), {
      firstName: 'Giulia',
      lastName: 'Bianchi',
      fullName: 'Giulia Bianchi',
      normalizedFullName: 'giulia bianchi',
      orderInsensitiveKey: 'bianchi giulia',
    })

    assert.equal(extractCustomerNameFromCalendarTitle('Zahnarzt'), null)
    assert.equal(extractCustomerNameFromCalendarTitle('Balayage + Föhnen'), null)
  })

  it('auto-seeds only recurring customers (2+ occurrences) and skips private/all-day events', () => {
    const events = [
      { title: 'Maria Rossi - Balayage', startAt: '2025-05-10T09:00:00.000Z' },
      { title: 'Rossi Maria (Ansatz)', startAt: '2026-01-12T10:00:00.000Z' },
      { title: 'Maria Rossi — Schnitt', startAt: '2026-06-20T14:00:00.000Z' },
      { title: 'Einmal Kunde', startAt: '2026-02-01T09:00:00.000Z' },
      { title: 'Zahnarzt', startAt: '2026-03-01T09:00:00.000Z' },
      { title: 'Zahnarzt', startAt: '2026-04-01T09:00:00.000Z' },
      { title: 'Secret Friend', startAt: '2026-03-05T09:00:00.000Z', isPrivate: true },
      { title: 'Secret Friend', startAt: '2026-04-05T09:00:00.000Z', isPrivate: true },
      { title: 'Anna Gruber', startAt: '2026-03-10T00:00:00.000Z', allDay: true },
      { title: 'Anna Gruber', startAt: '2026-04-10T00:00:00.000Z', allDay: true },
    ]

    const candidates = extractRecurringCalendarCustomers(events, 2)
    assert.equal(candidates.length, 1)
    assert.equal(candidates[0].firstName, 'Maria')
    assert.equal(candidates[0].lastName, 'Rossi')
    assert.equal(candidates[0].visitCount, 3)
    assert.equal(candidates[0].lastVisitAt, '2026-06-20T14:00:00.000Z')
  })

  it('matches calendar event titles in both First Last and Last First order', () => {
    assert.equal(nameOrderInsensitiveKey('Rossi Maria'), nameOrderInsensitiveKey('Maria Rossi'))
    assert.equal(doesCalendarTitleMatchCustomer('Maria Rossi — Balayage', 'Maria', 'Rossi'), true)
    assert.equal(doesCalendarTitleMatchCustomer('Rossi Maria (Färben)', 'Maria', 'Rossi'), true)
    assert.equal(doesCalendarTitleMatchCustomer('Anna Gruber — Schnitt', 'Maria', 'Rossi'), false)
  })

  it('validates admin duration overrides within 5..600 integer minutes', () => {
    assert.equal(parseDurationOverride(180), 180)
    assert.equal(parseDurationOverride(5), 5)
    assert.equal(parseDurationOverride(600), 600)
    assert.equal(parseDurationOverride(4), null)
    assert.equal(parseDurationOverride(601), null)
    assert.equal(parseDurationOverride(90.5), null)
    assert.equal(parseDurationOverride(null), null)
    assert.equal(parseDurationOverride(undefined), null)
  })

  it('prevents homonym history bleed between customers sharing the same name', () => {
    const maria1Target = {
      customerId: 'cust-maria-1',
      email: 'maria1@example.com',
      nameKey: 'maria rossi',
    }

    // Same customerId matches
    assert.equal(
      doesReservationMatchCustomerTarget(
        {
          customerId: 'cust-maria-1',
          firstName: 'Maria',
          lastName: 'Rossi',
          email: 'maria1@example.com',
        },
        maria1Target,
      ),
      true,
    )

    // Different customerId with same name MUST NOT match
    assert.equal(
      doesReservationMatchCustomerTarget(
        {
          customerId: 'cust-maria-2',
          firstName: 'Maria',
          lastName: 'Rossi',
          email: 'maria2@example.com',
        },
        maria1Target,
      ),
      false,
    )

    // Legacy reservation without customerId but different email MUST NOT match
    assert.equal(
      doesReservationMatchCustomerTarget(
        {
          customerId: null,
          firstName: 'Maria',
          lastName: 'Rossi',
          email: 'maria2@example.com',
        },
        maria1Target,
      ),
      false,
    )

    // Legacy reservation without customerId and matching email DOES match
    assert.equal(
      doesReservationMatchCustomerTarget(
        {
          customerId: null,
          firstName: 'Maria',
          lastName: 'Rossi',
          email: 'MARIA1@example.com',
        },
        maria1Target,
      ),
      true,
    )

    // Legacy reservation without customerId and without email falls back to nameKey
    assert.equal(
      doesReservationMatchCustomerTarget(
        {
          customerId: null,
          firstName: 'Maria',
          lastName: 'Rossi',
          email: null,
        },
        maria1Target,
      ),
      true,
    )
  })

  it('generates deterministic email-keyed customer doc IDs case-insensitively', () => {
    const id1 = customerDocIdForEmail('Maria@Example.com')
    const id2 = customerDocIdForEmail('  maria@example.com ')
    assert.equal(id1, id2)
    assert.match(id1, /^cust_email_[0-9a-f]{24}$/)
    assert.notEqual(id1, customerDocIdForEmail('other@example.com'))
  })
})
