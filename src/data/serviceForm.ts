import type { Locale } from '../i18n'
import type { FieldIssue, ValidationResult } from './settingsForm'
import type { Service } from './schemas'

export const serviceLimits = {
  nameMaxLength: 120,
  descriptionMaxLength: 1000,
  minDurationMinutes: 5,
  maxDurationMinutes: 480,
  maxPriceCents: 999_999,
} as const

/** Fields an admin can change. `createdAt` and the id never change after creation. */
export type ServiceDraft = Pick<
  Service,
  | 'nameDe'
  | 'nameIt'
  | 'descriptionDe'
  | 'descriptionIt'
  | 'durationMinutes'
  | 'durationMaxMinutes'
  | 'priceCents'
  | 'priceMaxCents'
  | 'active'
  | 'sortOrder'
>

/** Form output before `sortOrder` is attached on save. */
export type ServiceFormDraft = Omit<ServiceDraft, 'sortOrder'>

export type ServiceFormField =
  | 'nameDe'
  | 'nameIt'
  | 'descriptionDe'
  | 'descriptionIt'
  | 'duration'
  | 'durationMax'
  | 'price'
  | 'priceMax'

export type ServiceFormInput = {
  nameDe: string
  nameIt: string
  descriptionDe: string
  descriptionIt: string
  duration: string
  durationMax: string
  /** Euro amount as typed, e.g. `26`, `26,50`, or `26.5`. */
  price: string
  priceMax: string
  active: boolean
}

export const emptyServiceFormInput: ServiceFormInput = {
  nameDe: '',
  nameIt: '',
  descriptionDe: '',
  descriptionIt: '',
  duration: '30',
  durationMax: '',
  price: '',
  priceMax: '',
  active: true,
}

/**
 * Maps a Firestore service document to the current bilingual shape.
 * Old docs used a single `name` / `description`, often as `Deutsch / Italiano`.
 */
export function normalizeServiceDocument(raw: Record<string, unknown>): Service {
  const nameDe =
    typeof raw.nameDe === 'string'
      ? raw.nameDe
      : typeof raw.name === 'string'
        ? splitBilingual(raw.name).de
        : ''
  const nameIt =
    typeof raw.nameIt === 'string'
      ? raw.nameIt
      : typeof raw.name === 'string'
        ? splitBilingual(raw.name).it
        : nameDe
  const descriptionDe =
    typeof raw.descriptionDe === 'string'
      ? raw.descriptionDe
      : typeof raw.description === 'string'
        ? splitBilingual(raw.description).de
        : ''
  const descriptionIt =
    typeof raw.descriptionIt === 'string'
      ? raw.descriptionIt
      : typeof raw.description === 'string'
        ? splitBilingual(raw.description).it
        : descriptionDe

  const categoryDe = typeof raw.categoryDe === 'string' ? raw.categoryDe.trim() : undefined
  const categoryIt = typeof raw.categoryIt === 'string' ? raw.categoryIt.trim() : categoryDe

  const priceMaxCents =
    typeof raw.priceMaxCents === 'number' && Number.isFinite(raw.priceMaxCents)
      ? Math.round(raw.priceMaxCents)
      : undefined

  return {
    nameDe,
    nameIt,
    descriptionDe,
    descriptionIt,
    ...(categoryDe ? { categoryDe } : {}),
    ...(categoryIt ? { categoryIt } : {}),
    durationMinutes: Number(raw.durationMinutes),
    priceCents: Number(raw.priceCents),
    ...(priceMaxCents !== undefined ? { priceMaxCents } : {}),
    active: Boolean(raw.active),
    sortOrder:
      typeof raw.sortOrder === 'number' && Number.isFinite(raw.sortOrder)
        ? Math.max(0, Math.min(9999, Math.round(raw.sortOrder)))
        : 0,
    createdAt: String(raw.createdAt ?? ''),
    updatedAt: String(raw.updatedAt ?? ''),
  }
}

/** Split `Deutsch / Italiano` once; if there is no separator, both sides share the text. */
export function splitBilingual(value: string): { de: string; it: string } {
  const trimmed = value.trim()
  const separator = ' / '
  const index = trimmed.indexOf(separator)
  if (index === -1) return { de: trimmed, it: trimmed }
  const de = trimmed.slice(0, index).trim()
  const it = trimmed.slice(index + separator.length).trim()
  return { de: de || trimmed, it: it || de || trimmed }
}

export function localizedServiceName(service: ServiceDraft, locale: Locale): string {
  return locale === 'it' ? service.nameIt : service.nameDe
}

export function localizedServiceDescription(service: ServiceDraft, locale: Locale): string {
  const text = locale === 'it' ? service.descriptionIt : service.descriptionDe
  return text.trim()
}

export function formatEuroAmount(cents: number): string {
  return cents % 100 === 0 ? `${cents / 100}€` : `${(cents / 100).toFixed(2).replace('.', ',')}€`
}

export function formatServicePriceRange(minCents: number, maxCents?: number): string {
  if (maxCents !== undefined && maxCents > minCents) {
    return `${formatEuroAmount(minCents)}–${formatEuroAmount(maxCents)}`
  }
  return formatEuroAmount(minCents)
}

export function formatServiceDurationRange(minMinutes: number, maxMinutes?: number): string {
  if (maxMinutes !== undefined && maxMinutes > minMinutes) {
    return `${minMinutes}–${maxMinutes}`
  }
  return String(minMinutes)
}

/** Compact bilingual label for reservations and the admin list (both languages at once). */
export function bilingualServiceName(service: ServiceDraft): string {
  const de = service.nameDe.trim()
  const it = service.nameIt.trim()
  if (!it || it === de) return de
  if (!de) return it
  return `${de} / ${it}`
}

function formatInputPrice(priceCents: number): string {
  const euros = Math.floor(priceCents / 100)
  const cents = priceCents % 100
  return cents === 0 ? String(euros) : `${euros},${String(cents).padStart(2, '0')}`
}

export function serviceFormInputOf(service: ServiceDraft): ServiceFormInput {
  return {
    nameDe: service.nameDe,
    nameIt: service.nameIt,
    descriptionDe: service.descriptionDe,
    descriptionIt: service.descriptionIt,
    duration: String(service.durationMinutes),
    durationMax:
      service.durationMaxMinutes !== undefined &&
      service.durationMaxMinutes > service.durationMinutes
        ? String(service.durationMaxMinutes)
        : '',
    price: formatInputPrice(service.priceCents),
    priceMax:
      service.priceMaxCents !== undefined && service.priceMaxCents > service.priceCents
        ? formatInputPrice(service.priceMaxCents)
        : '',
    active: service.active,
  }
}

/** Parses a euro amount with comma or dot decimals into cents; `null` when invalid. */
export function parsePriceCents(raw: string): number | null {
  const match = /^(\d{1,6})(?:[.,](\d{1,2}))?$/.exec(raw.trim().replace(/^€\s*|\s*€$/g, ''))
  if (!match) return null
  const cents = Number(match[1]) * 100 + Number((match[2] ?? '').padEnd(2, '0'))
  return cents <= serviceLimits.maxPriceCents ? cents : null
}

export function validateServiceForm(
  input: ServiceFormInput,
): ValidationResult<ServiceFormDraft, ServiceFormField> {
  const issues: Partial<Record<ServiceFormField, FieldIssue>> = {}
  const nameDe = input.nameDe.trim()
  const nameIt = input.nameIt.trim()
  const descriptionDe = input.descriptionDe.trim()
  const descriptionIt = input.descriptionIt.trim()

  if (nameDe.length === 0) issues.nameDe = { kind: 'required' }
  else if (nameDe.length > serviceLimits.nameMaxLength) {
    issues.nameDe = { kind: 'tooLong', max: serviceLimits.nameMaxLength }
  }
  if (nameIt.length === 0) issues.nameIt = { kind: 'required' }
  else if (nameIt.length > serviceLimits.nameMaxLength) {
    issues.nameIt = { kind: 'tooLong', max: serviceLimits.nameMaxLength }
  }
  if (descriptionDe.length > serviceLimits.descriptionMaxLength) {
    issues.descriptionDe = { kind: 'tooLong', max: serviceLimits.descriptionMaxLength }
  }
  if (descriptionIt.length > serviceLimits.descriptionMaxLength) {
    issues.descriptionIt = { kind: 'tooLong', max: serviceLimits.descriptionMaxLength }
  }

  const parseDuration = (raw: string): number | null => {
    if (!/^\d+$/.test(raw)) return null
    const val = Number(raw)
    return val >= serviceLimits.minDurationMinutes && val <= serviceLimits.maxDurationMinutes
      ? val
      : null
  }

  const durationRaw = input.duration.trim()
  const durationMaxRaw = input.durationMax.trim()
  const durationFrom = durationRaw.length > 0 ? parseDuration(durationRaw) : null
  const durationTo = durationMaxRaw.length > 0 ? parseDuration(durationMaxRaw) : null

  if (durationRaw.length === 0 && durationMaxRaw.length === 0) {
    issues.duration = {
      kind: 'range',
      min: serviceLimits.minDurationMinutes,
      max: serviceLimits.maxDurationMinutes,
    }
  } else {
    if (durationRaw.length > 0 && durationFrom === null) {
      issues.duration = {
        kind: 'range',
        min: serviceLimits.minDurationMinutes,
        max: serviceLimits.maxDurationMinutes,
      }
    }
    if (durationMaxRaw.length > 0 && durationTo === null) {
      issues.durationMax = {
        kind: 'range',
        min: serviceLimits.minDurationMinutes,
        max: serviceLimits.maxDurationMinutes,
      }
    }
    if (durationFrom !== null && durationTo !== null && durationTo < durationFrom) {
      issues.durationMax = {
        kind: 'range',
        min: durationFrom,
        max: serviceLimits.maxDurationMinutes,
      }
    }
  }

  const priceRaw = input.price.trim()
  const priceMaxRaw = input.priceMax.trim()
  const priceFrom = priceRaw.length > 0 ? parsePriceCents(priceRaw) : null
  const priceTo = priceMaxRaw.length > 0 ? parsePriceCents(priceMaxRaw) : null

  if (priceRaw.length === 0 && priceMaxRaw.length === 0) {
    issues.price = { kind: 'required' }
  } else {
    if (priceRaw.length > 0 && priceFrom === null) issues.price = { kind: 'price' }
    if (priceMaxRaw.length > 0 && priceTo === null) issues.priceMax = { kind: 'price' }
    if (priceFrom !== null && priceTo !== null && priceTo < priceFrom) {
      issues.priceMax = { kind: 'price' }
    }
  }

  const durationMinutes = durationFrom ?? durationTo
  const durationMaxMinutes =
    durationFrom !== null && durationTo !== null && durationTo > durationFrom
      ? durationTo
      : undefined
  const priceCents = priceFrom ?? priceTo
  const priceMaxCents =
    priceFrom !== null && priceTo !== null && priceTo > priceFrom ? priceTo : undefined

  if (Object.keys(issues).length > 0 || durationMinutes === null || priceCents === null) {
    return { ok: false, issues }
  }
  return {
    ok: true,
    value: {
      nameDe,
      nameIt,
      descriptionDe,
      descriptionIt,
      durationMinutes,
      ...(durationMaxMinutes !== undefined ? { durationMaxMinutes } : {}),
      priceCents,
      ...(priceMaxCents !== undefined ? { priceMaxCents } : {}),
      active: input.active,
    },
  }
}

/** Display order: `sortOrder` ascending, then German name. */
export function sortServicesByOrder<T extends Pick<ServiceDraft, 'sortOrder' | 'nameDe'>>(
  services: readonly T[],
): T[] {
  return [...services].sort(
    (a, b) => a.sortOrder - b.sortOrder || a.nameDe.localeCompare(b.nameDe, 'de'),
  )
}

/** Next `sortOrder` after the highest existing value (or `0` when empty). */
export function nextServiceSortOrder(services: readonly Pick<ServiceDraft, 'sortOrder'>[]): number {
  if (services.length === 0) return 0
  return Math.max(...services.map((service) => service.sortOrder)) + 1
}
