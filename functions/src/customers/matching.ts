/**
 * Pure customer name normalization, Google Calendar smart parsing, and recurring customer extraction.
 */

const LIKELY_PRIVATE_KEYWORDS = [
  // German
  'urlaub',
  'ferien',
  'pause',
  'mittag',
  'mittagspause',
  'arzt',
  'zahnarzt',
  'privat',
  'frei',
  'geschlossen',
  'fortbildung',
  'schulung',
  'seminar',
  'meeting',
  'besprechung',
  'feiertag',
  'krank',
  'krankenstand',
  'blockiert',
  'nicht verfügbar',
  'nicht verfuegbar',
  // Italian
  'ferie',
  'pausa',
  'pranzo',
  'medico',
  'dottore',
  'dentista',
  'privato',
  'privata',
  'chiuso',
  'chiusura',
  'formazione',
  'riposo',
  'malattia',
  'bloccato',
  'non disponibile',
  // English
  'vacation',
  'holiday',
  'lunch',
  'break',
  'doctor',
  'dentist',
  'private',
  'closed',
  'off',
  'busy',
]

const SERVICE_KEYWORDS = [
  // German
  'balayage',
  'strähnen',
  'straehnen',
  'färben',
  'faerben',
  'farbe',
  'ansatz',
  'ansatzfarbe',
  'tönung',
  'toenung',
  'glossing',
  'blondierung',
  'blondieren',
  'schneiden',
  'schnitt',
  'haarschnitt',
  'damenschnitt',
  'herrenschnitt',
  'kinderschnitt',
  'waschen',
  'föhnen',
  'foehnen',
  'styling',
  'dauerwelle',
  'pflege',
  'kur',
  'bart',
  'bartschnitt',
  'augenbrauen',
  'wimpern',
  'hochsteckfrisur',
  'beratung',
  // Italian
  'colore',
  'colorazione',
  'ricrescita',
  'taglio',
  'piega',
  'messa in piega',
  'colpi di sole',
  'schiaritura',
  'schiariture',
  'decolorazione',
  'tonalizzante',
  'trattamento',
  'lavaggio',
  'barba',
  'sopracciglia',
  'acconciatura',
  'consulenza',
  'permanente',
  // English
  'haircut',
  'cut',
  'color',
  'colour',
  'coloring',
  'colouring',
  'highlights',
  'blowout',
  'blowdry',
  'trim',
]

export function normalizeText(value: string): string {
  return value.normalize('NFKC').trim().replace(/\s+/g, ' ').toLowerCase()
}

export function normalizeCustomerEmail(email: string | null | undefined): string | null {
  if (typeof email !== 'string') return null
  const trimmed = email.trim().toLowerCase()
  return trimmed.length > 0 ? trimmed : null
}

export function normalizeFullName(fullName: string): string {
  return normalizeText(fullName)
}

export function normalizeCustomerName(firstName: string, lastName: string): string {
  return normalizeFullName(`${firstName} ${lastName}`)
}

/** Token-sorted key so "Maria Rossi" and "Rossi Maria" group together. */
export function nameOrderInsensitiveKey(fullName: string): string {
  return normalizeFullName(fullName).split(' ').filter(Boolean).sort().join(' ')
}

function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export function isLikelyPrivateOrNonCustomerEvent(title: string): boolean {
  const normalized = normalizeText(title)
  if (!normalized || normalized === 'google calendar' || normalized === 'google kalender') {
    return true
  }
  for (const keyword of LIKELY_PRIVATE_KEYWORDS) {
    const pattern = new RegExp(
      `(^|[\\s\\-–—:/|,()\\[\\]])${escapeRegExp(keyword)}($|[\\s\\-–—:/|,()\\[\\]])`,
      'i',
    )
    if (pattern.test(normalized)) {
      return true
    }
  }
  return false
}

function stripServiceKeywords(segment: string): string {
  let cleaned = segment
  // Sort longest first so multi-word terms like "colpi di sole" or "messa in piega" match before shorter ones.
  const sorted = [...SERVICE_KEYWORDS].sort((a, b) => b.length - a.length)
  for (const keyword of sorted) {
    const pattern = new RegExp(`(^|[\\s+&,/])${escapeRegExp(keyword)}(?=$|[\\s+&,/])`, 'gi')
    cleaned = cleaned.replace(pattern, ' ')
  }
  return cleaned
    .replace(/[+&/,]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export type ExtractedCalendarCustomerName = {
  firstName: string
  lastName: string
  fullName: string
  normalizedFullName: string
  orderInsensitiveKey: string
}

/**
 * Extracts a clean customer name from a Google Calendar event title such as:
 * - "Maria Rossi - Balayage" -> Maria Rossi
 * - "Anna Gruber (Färben + Schnitt)" -> Anna Gruber
 * - "Balayage: Julia Hofer" -> Julia Hofer
 * Returns null for likely private/non-customer events or pure service/numeric strings.
 */
export function extractCustomerNameFromCalendarTitle(
  rawTitle: string,
): ExtractedCalendarCustomerName | null {
  if (typeof rawTitle !== 'string') return null
  const trimmed = rawTitle.trim()
  if (!trimmed) return null
  if (isLikelyPrivateOrNonCustomerEvent(trimmed)) return null

  // Remove bracketed/parenthetical notes like "(Färben)" or "[Pending]".
  const withoutBrackets = trimmed
    .replace(/\[[^\]]*\]/g, ' ')
    .replace(/\([^)]*\)/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  if (!withoutBrackets) return null

  // Split on common separators and pick the first segment that still has name letters after stripping services.
  const segments = withoutBrackets
    .split(/\s*(?:—|–|-|:|\|)\s*/)
    .map((seg) => stripServiceKeywords(seg))
    .filter((seg) => /[a-zA-ZÀ-ÿ]{2,}/.test(seg))

  const candidate = segments[0]
  if (!candidate) return null

  // Reject pure numbers or titles with too many words (likely a sentence/note, not a name).
  const words = candidate
    .replace(/[^\p{L}\p{M}'’-]+/gu, ' ')
    .trim()
    .split(/\s+/)
    .filter((word) => word.length >= 2)

  if (words.length === 0 || words.length > 4) return null

  const firstName = words[0]!
  const lastName = words.slice(1).join(' ')
  const fullName = lastName ? `${firstName} ${lastName}` : firstName
  const normalizedFullName = normalizeFullName(fullName)
  const orderInsensitiveKey = nameOrderInsensitiveKey(fullName)

  return {
    firstName,
    lastName,
    fullName,
    normalizedFullName,
    orderInsensitiveKey,
  }
}

export type CalendarEventForSeeding = {
  title?: string | null
  startAt: string
  allDay?: boolean
  isPrivate?: boolean
}

export type RecurringCalendarCustomerCandidate = {
  firstName: string
  lastName: string
  normalizedFullName: string
  orderInsensitiveKey: string
  visitCount: number
  lastVisitAt: string
}

/**
 * Smart import: scans non-private, non-all-day Google Calendar events and returns
 * customer candidates that appear at least `minOccurrences` times (default: 2).
 */
export function extractRecurringCalendarCustomers(
  events: readonly CalendarEventForSeeding[],
  minOccurrences = 2,
): RecurringCalendarCustomerCandidate[] {
  const groups = new Map<
    string,
    {
      firstName: string
      lastName: string
      normalizedFullName: string
      orderInsensitiveKey: string
      visitCount: number
      lastVisitAt: string
    }
  >()

  for (const event of events) {
    if (event.isPrivate || event.allDay) continue
    if (!event.title) continue
    const extracted = extractCustomerNameFromCalendarTitle(event.title)
    if (!extracted) continue

    const existing = groups.get(extracted.orderInsensitiveKey)
    if (!existing) {
      groups.set(extracted.orderInsensitiveKey, {
        firstName: extracted.firstName,
        lastName: extracted.lastName,
        normalizedFullName: extracted.normalizedFullName,
        orderInsensitiveKey: extracted.orderInsensitiveKey,
        visitCount: 1,
        lastVisitAt: event.startAt,
      })
    } else {
      existing.visitCount += 1
      if (new Date(event.startAt).getTime() > new Date(existing.lastVisitAt).getTime()) {
        existing.lastVisitAt = event.startAt
      }
      // Prefer an occurrence that has both first and last name if earlier one had only one word.
      if (!existing.lastName && extracted.lastName) {
        existing.firstName = extracted.firstName
        existing.lastName = extracted.lastName
        existing.normalizedFullName = extracted.normalizedFullName
      }
    }
  }

  return Array.from(groups.values())
    .filter((entry) => entry.visitCount >= minOccurrences)
    .sort(
      (a, b) =>
        b.visitCount - a.visitCount || a.normalizedFullName.localeCompare(b.normalizedFullName),
    )
}

/**
 * Returns true if a non-private Google Calendar event title matches a customer's full name
 * (handling both "First Last" and "Last First" order).
 */
export function doesCalendarTitleMatchCustomer(
  eventTitle: string | null | undefined,
  firstName: string,
  lastName: string,
): boolean {
  if (!eventTitle) return false
  const normalizedTitle = normalizeText(eventTitle)
  const full = normalizeCustomerName(firstName, lastName)
  if (!full || full.length < 2) return false

  const boundaryMatch = (needle: string): boolean => {
    const pattern = new RegExp(
      `(^|[^\\p{L}\\p{M}])${escapeRegExp(needle)}($|[^\\p{L}\\p{M}])`,
      'iu',
    )
    return pattern.test(normalizedTitle)
  }

  if (boundaryMatch(full)) return true

  const trimmedLast = lastName.trim()
  const trimmedFirst = firstName.trim()
  if (trimmedFirst && trimmedLast) {
    const reversed = normalizeCustomerName(trimmedLast, trimmedFirst)
    if (boundaryMatch(reversed)) return true
  }

  const extracted = extractCustomerNameFromCalendarTitle(eventTitle)
  if (extracted && extracted.orderInsensitiveKey === nameOrderInsensitiveKey(full)) {
    return true
  }

  return false
}
