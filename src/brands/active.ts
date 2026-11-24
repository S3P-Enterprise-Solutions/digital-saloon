import { getActiveBrandKey } from './brandKey'
import type { BrandKey, BrandModule } from './types'
import { hairboutiqueModule } from './hairboutique/module'
import { kimmModule } from './kimm/module'
import { salon1500Module } from './salon1500/module'

const BRAND_MODULES: Record<BrandKey, BrandModule> = {
  kimm: kimmModule,
  salon1500: salon1500Module,
  hairboutique: hairboutiqueModule,
}

export { getActiveBrandKey }

export function getActiveBrandModule(): BrandModule {
  return BRAND_MODULES[getActiveBrandKey()]
}
