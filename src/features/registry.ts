import type { BalayageContent } from './balayage/content'

type FeatureBrandSlice = {
  key: string
  features: { balayage?: boolean }
  featureContent?: { balayage?: BalayageContent }
}

/**
 * Resolves catalog features enabled on a brand module.
 * Route objects are assembled in the routes layer (navigation + customerOnly).
 */
export function resolveEnabledBalayageContent(module: FeatureBrandSlice): BalayageContent | null {
  if (module.features.balayage !== true) return null
  const content = module.featureContent?.balayage
  if (!content) {
    throw new Error(
      `Brand "${module.key}" enables features.balayage but featureContent.balayage is missing`,
    )
  }
  return content
}
