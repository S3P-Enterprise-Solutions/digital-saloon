import { createRoute, useNavigate } from '@tanstack/react-router'

import { useAuth } from '../auth/AuthProvider'
import { getActiveBrandModule } from '../brands/active'
import { useActiveServices } from '../hooks/useActiveServices'
import { useHomepageConfig } from '../hooks/useHomepageConfig'
import { useOpeningHours } from '../hooks/useOpeningHours'
import { useSalon } from '../hooks/useSalon'
import { useUserProfile } from '../hooks/useUserProfile'
import { customerOnly } from './customerOnly'
import { rootRoute } from './root'

export const homeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: customerOnly(function HomeRoute() {
    const navigate = useNavigate()
    const { user, isOperator } = useAuth()
    const profile = useUserProfile(!isOperator && user ? user.uid : null)
    const salon = useSalon()
    const services = useActiveServices()
    const openingHours = useOpeningHours(true)
    const homepageConfig = useHomepageConfig()
    const isAdmin = isOperator || profile.data?.role === 'admin'
    const HomePage = getActiveBrandModule().HomePage

    return (
      <HomePage
        salon={salon.data ?? null}
        services={services.data}
        servicesLoading={services.isLoading}
        servicesError={services.isError}
        openingHours={openingHours.data}
        openingHoursLoading={openingHours.isLoading}
        openingHoursError={openingHours.isError}
        homepageConfig={homepageConfig.data}
        onEditHomepageClick={
          isAdmin
            ? () => {
                void navigate({ to: '/admin/homepage' })
              }
            : undefined
        }
        onBookClick={() => {
          void navigate({ to: '/book' })
        }}
        onServiceClick={(serviceId) => {
          void navigate({ to: '/book', search: { serviceId } })
        }}
      />
    )
  }),
})
