import type { CustomerHistoryItem } from './customersApi'

export type ServiceMatchQuality = 'exact' | 'similar' | 'other'

export type RankedCustomerHistoryItem = {
  item: CustomerHistoryItem
  matchQuality: ServiceMatchQuality
}

export type RankedCustomerHistoryResult = {
  items: RankedCustomerHistoryItem[]
  /** Most recent exact or similar past appointment with a positive duration, if any. */
  recommendedMatch: RankedCustomerHistoryItem | null
}

type ServiceCategory =
  'balayage' | 'highlights' | 'coloring' | 'haircut' | 'styling' | 'perm' | 'beard' | 'treatment'

const CATEGORY_KEYWORDS: ReadonlyArray<{ category: ServiceCategory; keywords: readonly string[] }> =
  [
    {
      category: 'balayage',
      keywords: ['balayage', 'airtouch', 'babylights', 'ombré', 'ombre'],
    },
    {
      category: 'highlights',
      keywords: [
        'strähnen',
        'straehnen',
        'colpi di sole',
        'schiaritura',
        'schiariture',
        'highlights',
        'foliensträhnen',
      ],
    },
    {
      category: 'coloring',
      keywords: [
        'färben',
        'faerben',
        'farbe',
        'ansatz',
        'tönung',
        'toenung',
        'glossing',
        'blondierung',
        'blondieren',
        'colore',
        'colorazione',
        'ricrescita',
        'tonalizzante',
        'decolorazione',
        'color',
        'colour',
      ],
    },
    {
      category: 'haircut',
      keywords: [
        'schneiden',
        'schnitt',
        'haarschnitt',
        'damenschnitt',
        'herrenschnitt',
        'kinderschnitt',
        'taglio',
        'haircut',
        'cut',
        'trim',
      ],
    },
    {
      category: 'styling',
      keywords: [
        'föhnen',
        'foehnen',
        'styling',
        'hochsteck',
        'piega',
        'messa in piega',
        'acconciatura',
        'blowout',
        'blowdry',
      ],
    },
    {
      category: 'perm',
      keywords: ['dauerwelle', 'permanente', 'perm'],
    },
    {
      category: 'beard',
      keywords: ['bart', 'barba', 'beard'],
    },
    {
      category: 'treatment',
      keywords: ['pflege', 'kur', 'keratin', 'trattamento', 'treatment'],
    },
  ]

function normalize(text: string): string {
  return text.normalize('NFKC').trim().toLowerCase()
}

function detectCategories(text: string): Set<ServiceCategory> {
  const norm = normalize(text)
  const found = new Set<ServiceCategory>()
  for (const group of CATEGORY_KEYWORDS) {
    if (group.keywords.some((kw) => norm.includes(kw))) {
      found.add(group.category)
    }
  }
  return found
}

function historyItemText(item: CustomerHistoryItem): string {
  if (item.kind === 'reservation') {
    return item.serviceName
  }
  return `${item.title} ${item.description ?? ''}`
}

function scoreMatch(
  item: CustomerHistoryItem,
  selectedServiceNames: readonly string[],
  selectedCategories: ReadonlySet<ServiceCategory>,
): ServiceMatchQuality {
  if (selectedServiceNames.length === 0) return 'other'

  const itemNorm = normalize(historyItemText(item))
  for (const name of selectedServiceNames) {
    const target = normalize(name)
    if (target.length >= 3 && itemNorm.includes(target)) {
      return 'exact'
    }
  }

  if (selectedCategories.size > 0) {
    const itemCategories = detectCategories(itemNorm)
    for (const cat of selectedCategories) {
      if (itemCategories.has(cat)) {
        return 'similar'
      }
    }
  }

  return 'other'
}

const QUALITY_WEIGHT: Record<ServiceMatchQuality, number> = {
  exact: 0,
  similar: 1,
  other: 2,
}

/**
 * Ranks a customer's past SalonFlow + Google Calendar appointments against the currently
 * selected service name(s) so similar past appointments (e.g. previous Balayage / Colouring)
 * float to the top and provide a one-click duration recommendation.
 */
export function rankCustomerHistoryByService(
  history: readonly CustomerHistoryItem[],
  selectedServiceNames: readonly string[],
): RankedCustomerHistoryResult {
  const cleanedNames = selectedServiceNames.map((n) => n.trim()).filter(Boolean)
  const selectedCategories = new Set<ServiceCategory>()
  for (const name of cleanedNames) {
    for (const cat of detectCategories(name)) {
      selectedCategories.add(cat)
    }
  }

  const ranked: RankedCustomerHistoryItem[] = history
    .filter((item) => {
      if (item.kind === 'reservation') {
        return (
          item.status !== 'CANCELLED' && item.status !== 'DECLINED' && item.status !== 'EXPIRED'
        )
      }
      return true
    })
    .map((item) => ({
      item,
      matchQuality: scoreMatch(item, cleanedNames, selectedCategories),
    }))
    .sort((a, b) => {
      const qualityDiff = QUALITY_WEIGHT[a.matchQuality] - QUALITY_WEIGHT[b.matchQuality]
      if (qualityDiff !== 0) return qualityDiff
      return new Date(b.item.startAt).getTime() - new Date(a.item.startAt).getTime()
    })

  const recommendedMatch =
    ranked.find(
      (entry) =>
        (entry.matchQuality === 'exact' || entry.matchQuality === 'similar') &&
        entry.item.durationMinutes > 0,
    ) ?? null

  return { items: ranked, recommendedMatch }
}
