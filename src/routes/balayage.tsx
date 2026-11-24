import { createRoute, useNavigate, type AnyRoute } from '@tanstack/react-router'

import type { BalayageContent } from '../features/balayage/content'
import { BalayagePage } from '../features/balayage/BalayagePage'
import { customerOnly } from './customerOnly'

export function createBalayageRoute(parent: AnyRoute, content: BalayageContent): AnyRoute {
  return createRoute({
    getParentRoute: () => parent,
    path: '/balayage',
    component: customerOnly(function BalayageRoute() {
      const navigate = useNavigate()

      return (
        <BalayagePage
          content={content}
          onSelectPackage={(serviceId) => {
            void navigate({ to: '/book', search: { serviceId } })
          }}
          onBookClick={() => {
            void navigate({ to: '/book' })
          }}
        />
      )
    }),
  })
}
