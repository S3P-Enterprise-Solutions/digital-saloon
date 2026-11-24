import { describe, expect, it } from 'vitest'
import * as v from 'valibot'

import { serviceSchema } from './schemas'
import {
  bilingualServiceName,
  emptyServiceFormInput,
  localizedServiceDescription,
  localizedServiceName,
  nextServiceSortOrder,
  normalizeServiceDocument,
  parsePriceCents,
  serviceFormInputOf,
  sortServicesByOrder,
  splitBilingual,
  validateServiceForm,
  type ServiceFormInput,
} from './serviceForm'

const validInput: ServiceFormInput = {
  nameDe: ' Herrenschnitt ',
  nameIt: ' Taglio uomo ',
  descriptionDe: ' Waschen, Schneiden, Finish ',
  descriptionIt: ' Lavaggio, taglio, finish ',
  duration: '30',
  durationMax: '',
  price: '26',
  priceMax: '',
  active: true,
}

describe('splitBilingual / normalizeServiceDocument', () => {
  it('splits Deutsch / Italiano names from the old single field', () => {
    expect(splitBilingual('Herrenschnitt / Taglio uomo')).toEqual({
      de: 'Herrenschnitt',
      it: 'Taglio uomo',
    })
    expect(splitBilingual('Farbe')).toEqual({ de: 'Farbe', it: 'Farbe' })
  })

  it('normalizes legacy documents and already bilingual ones', () => {
    expect(
      normalizeServiceDocument({
        name: 'Herrenschnitt / Taglio uomo',
        description: 'Waschen / Lavaggio',
        durationMinutes: 30,
        priceCents: 2600,
        active: true,
        createdAt: 'a',
        updatedAt: 'b',
      }),
    ).toMatchObject({
      nameDe: 'Herrenschnitt',
      nameIt: 'Taglio uomo',
      descriptionDe: 'Waschen',
      descriptionIt: 'Lavaggio',
    })

    const bilingual = normalizeServiceDocument({
      nameDe: 'Farbe',
      nameIt: 'Colore',
      descriptionDe: '',
      descriptionIt: 'Tinta',
      durationMinutes: 120,
      priceCents: 8500,
      active: true,
      sortOrder: 2,
      createdAt: 'a',
      updatedAt: 'b',
    })
    expect(v.is(serviceSchema, bilingual)).toBe(true)
    expect(bilingual.sortOrder).toBe(2)
    expect(localizedServiceName(bilingual, 'it')).toBe('Colore')
    expect(localizedServiceDescription(bilingual, 'it')).toBe('Tinta')
    expect(localizedServiceDescription(bilingual, 'de')).toBe('')
  })
})

describe('parsePriceCents', () => {
  it.each([
    ['26', 2600],
    ['26,5', 2650],
    ['26,50', 2650],
    ['26.05', 2605],
    ['0', 0],
    [' 48 € ', 4800],
    ['€ 9,90', 990],
  ])('reads %j as %i cents', (raw, cents) => {
    expect(parsePriceCents(raw)).toBe(cents)
  })

  it.each(['', 'abc', '-5', '26,555', '1.000,00', '26,', '10000'])('rejects %j', (raw) => {
    expect(parsePriceCents(raw)).toBeNull()
  })
})

describe('validateServiceForm', () => {
  it('trims both languages and converts duration and price', () => {
    const result = validateServiceForm(validInput)
    expect(result).toEqual({
      ok: true,
      value: {
        nameDe: 'Herrenschnitt',
        nameIt: 'Taglio uomo',
        descriptionDe: 'Waschen, Schneiden, Finish',
        descriptionIt: 'Lavaggio, taglio, finish',
        durationMinutes: 30,
        priceCents: 2600,
        active: true,
      },
    })
  })

  it('requires German and Italian names', () => {
    expect(validateServiceForm({ ...validInput, nameDe: ' ', nameIt: '' })).toEqual({
      ok: false,
      issues: {
        nameDe: { kind: 'required' },
        nameIt: { kind: 'required' },
      },
    })
  })

  it('produces data the service schema accepts', () => {
    const result = validateServiceForm(validInput)
    expect(result.ok).toBe(true)
    if (result.ok) {
      const stamped = { ...result.value, sortOrder: 0, createdAt: 'now', updatedAt: 'now' }
      expect(v.is(serviceSchema, stamped)).toBe(true)
      expect(bilingualServiceName(result.value)).toBe('Herrenschnitt / Taglio uomo')
    }
  })

  it('allows empty descriptions and a free service', () => {
    const result = validateServiceForm({
      ...validInput,
      descriptionDe: '',
      descriptionIt: '',
      price: '0',
    })
    expect(result.ok).toBe(true)
  })

  it('keeps the active flag', () => {
    const result = validateServiceForm({ ...validInput, active: false })
    expect(result.ok && result.value.active).toBe(false)
  })

  it('reports every invalid field', () => {
    expect(
      validateServiceForm({
        nameDe: '  ',
        nameIt: 'x'.repeat(121),
        descriptionDe: 'x'.repeat(1001),
        descriptionIt: '',
        duration: '4',
        durationMax: '',
        price: 'gratis',
        priceMax: '',
        active: true,
      }),
    ).toEqual({
      ok: false,
      issues: {
        nameDe: { kind: 'required' },
        nameIt: { kind: 'tooLong', max: 120 },
        descriptionDe: { kind: 'tooLong', max: 1000 },
        duration: { kind: 'range', min: 5, max: 480 },
        price: { kind: 'price' },
      },
    })
  })

  it('supports optional from/to duration and price ranges', () => {
    const both = validateServiceForm({
      ...validInput,
      duration: '30',
      durationMax: '45',
      price: '26',
      priceMax: '35,50',
    })
    expect(both).toEqual({
      ok: true,
      value: {
        nameDe: 'Herrenschnitt',
        nameIt: 'Taglio uomo',
        descriptionDe: 'Waschen, Schneiden, Finish',
        descriptionIt: 'Lavaggio, taglio, finish',
        durationMinutes: 30,
        durationMaxMinutes: 45,
        priceCents: 2600,
        priceMaxCents: 3550,
        active: true,
      },
    })

    const onlyTo = validateServiceForm({
      ...validInput,
      duration: '',
      durationMax: '45',
      price: '',
      priceMax: '40',
    })
    expect(onlyTo.ok).toBe(true)
    if (onlyTo.ok) {
      expect(onlyTo.value.durationMinutes).toBe(45)
      expect(onlyTo.value.durationMaxMinutes).toBeUndefined()
      expect(onlyTo.value.priceCents).toBe(4000)
      expect(onlyTo.value.priceMaxCents).toBeUndefined()
    }

    const inverted = validateServiceForm({
      ...validInput,
      duration: '45',
      durationMax: '30',
      price: '40',
      priceMax: '30',
    })
    expect(inverted).toEqual({
      ok: false,
      issues: {
        durationMax: { kind: 'range', min: 45, max: 480 },
        priceMax: { kind: 'price' },
      },
    })
  })
  it('starts new services as bookable 30-minute entries', () => {
    expect(validateServiceForm(emptyServiceFormInput)).toEqual({
      ok: false,
      issues: {
        nameDe: { kind: 'required' },
        nameIt: { kind: 'required' },
        price: { kind: 'required' },
      },
    })
  })
})

describe('serviceFormInputOf', () => {
  it('shows prices with a German decimal comma and round-trips', () => {
    const service = {
      nameDe: 'Farbe',
      nameIt: 'Colore',
      descriptionDe: 'Ansatz',
      descriptionIt: 'Radice',
      durationMinutes: 120,
      priceCents: 8505,
      active: false,
      sortOrder: 0,
    }
    const input = serviceFormInputOf(service)
    expect(input.price).toBe('85,05')
    expect(serviceFormInputOf({ ...service, priceCents: 8500 }).price).toBe('85')
    expect(validateServiceForm(input)).toEqual({
      ok: true,
      value: {
        nameDe: 'Farbe',
        nameIt: 'Colore',
        descriptionDe: 'Ansatz',
        descriptionIt: 'Radice',
        durationMinutes: 120,
        priceCents: 8505,
        active: false,
      },
    })

    const ranged = { ...service, durationMaxMinutes: 150, priceMaxCents: 11000 }
    const rangedInput = serviceFormInputOf(ranged)
    expect(rangedInput.durationMax).toBe('150')
    expect(rangedInput.priceMax).toBe('110')
    expect(validateServiceForm(rangedInput)).toEqual({
      ok: true,
      value: {
        nameDe: 'Farbe',
        nameIt: 'Colore',
        descriptionDe: 'Ansatz',
        descriptionIt: 'Radice',
        durationMinutes: 120,
        durationMaxMinutes: 150,
        priceCents: 8505,
        priceMaxCents: 11000,
        active: false,
      },
    })
  })
})

describe('sortServicesByOrder', () => {
  it('orders by sortOrder then German name', () => {
    const base = {
      descriptionDe: '',
      descriptionIt: '',
      durationMinutes: 30,
      priceCents: 1000,
      active: true,
      nameIt: 'x',
    }
    const sorted = sortServicesByOrder([
      { ...base, nameDe: 'Farbe', sortOrder: 2 },
      { ...base, nameDe: 'Bart', sortOrder: 1 },
      { ...base, nameDe: 'Schnitt', sortOrder: 1 },
    ])
    expect(sorted.map((service) => service.nameDe)).toEqual(['Bart', 'Schnitt', 'Farbe'])
  })
})

describe('nextServiceSortOrder', () => {
  it('returns 0 for an empty list and max+1 otherwise', () => {
    expect(nextServiceSortOrder([])).toBe(0)
    expect(nextServiceSortOrder([{ sortOrder: 0 }, { sortOrder: 3 }])).toBe(4)
  })
})
