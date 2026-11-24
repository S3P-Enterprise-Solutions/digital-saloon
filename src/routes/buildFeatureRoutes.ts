import type { AnyRoute } from '@tanstack/react-router'

import type { BrandModule } from '../brands/types'
import { resolveEnabledBalayageContent } from '../features/registry'
import { createBalayageRoute } from './balayage'

/** Mount catalog feature routes for the active brand module. */
export function buildFeatureRoutes(parent: AnyRoute, module: BrandModule): AnyRoute[] {
  const routes: AnyRoute[] = []
  const balayageContent = resolveEnabledBalayageContent(module)
  if (balayageContent) {
    routes.push(createBalayageRoute(parent, balayageContent))
  }
  return routes
}
