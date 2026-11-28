import { describe, expect, it } from 'vitest'

import type { CustomerHistoryItem } from './customersApi'
import { rankCustomerHistoryByService } from './serviceSimilarity'

describe('rankCustomerHistoryByService', () => {
  const history: CustomerHistoryItem[] = [
    {
      kind: 'reservation',
      id: 'res:1',
      reservationId: '1',
      startAt: '2026-09-10T09:00:00.000Z',
      endAt: '2026-09-10T09:45:00.000Z',
      durationMinutes: 45,
      serviceName: 'Damenschnitt',
      status: 'COMPLETED',
      employeeName: 'Anna',
      notes: null,
      internalNote: null,
    },
    {
      kind: 'googleCalendar',
      id: 'gcal:1',
      startAt: '2026-07-05T08:00:00.000Z',
      endAt: '2026-07-05T11:15:00.000Z',
      durationMinutes: 195,
      title: 'Maria Rossi — Balayage + Glossing',
      description: 'Dickes Haar, 3h 15m',
      employeeId: 'emp-1',
    },
    {
      kind: 'reservation',
      id: 'res:cancelled',
      reservationId: 'cancelled',
      startAt: '2026-10-01T09:00:00.000Z',
      endAt: '2026-10-01T11:00:00.000Z',
      durationMinutes: 120,
      serviceName: 'Balayage',
      status: 'CANCELLED',
      employeeName: 'Anna',
      notes: null,
      internalNote: null,
    },
  ]

  it('ranks matching Balayage Google Calendar appointment first and recommends its duration', () => {
    const result = rankCustomerHistoryByService(history, ['Balayage'])
    expect(result.items.map((entry) => entry.item.id)).toEqual(['gcal:1', 'res:1'])
    expect(result.items[0].matchQuality).toBe('exact')
    expect(result.recommendedMatch?.item.id).toBe('gcal:1')
    expect(result.recommendedMatch?.item.durationMinutes).toBe(195)
  })

  it('matches cross-language DE/IT categories (Colore -> Glossing/Färben, Taglio -> Damenschnitt)', () => {
    const cutResult = rankCustomerHistoryByService(history, ['Taglio donna'])
    expect(cutResult.recommendedMatch?.item.id).toBe('res:1')
    expect(cutResult.recommendedMatch?.matchQuality).toBe('similar')

    const colorResult = rankCustomerHistoryByService(history, ['Colore completo'])
    expect(colorResult.recommendedMatch?.item.id).toBe('gcal:1')
    expect(colorResult.recommendedMatch?.matchQuality).toBe('similar')
  })

  it('returns null recommendation when no service is selected yet', () => {
    const result = rankCustomerHistoryByService(history, [])
    expect(result.recommendedMatch).toBeNull()
    expect(result.items.map((entry) => entry.item.id)).toEqual(['res:1', 'gcal:1'])
  })
})
