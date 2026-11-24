export type BalayagePackageContent = {
  id: string
  size: string
  title: string
  subtitleDe: string
  subtitleIt: string
  duration: string
  price: string
  includesDe: readonly string[]
  includesIt: readonly string[]
}

/** Visual tokens for the balayage page — supplied by the enabling brand. */
export type BalayageAppearance = {
  scriptFont: string
  bodyFont: string
  accent: string
  surface: string
  ink: string
  muted: string
}

export type BalayageContent = {
  heroImageUrls: readonly string[]
  packages: readonly BalayagePackageContent[]
  appearance: BalayageAppearance
}
