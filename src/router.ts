import { createRouter } from '@tanstack/react-router'

import { getActiveBrandModule } from './brands/active'
import {
  adminCalendarRoute,
  adminHolidaysRoute,
  adminHomepageRoute,
  adminIndexRoute,
  adminManualRoute,
  adminOpeningHoursRoute,
  adminPendingRoute,
  adminReservationDetailRoute,
  adminReservationsRoute,
  adminRoute,
  adminServicesRoute,
  adminSettingsRoute,
} from './routes/admin'
import { bookRoute } from './routes/book'
import { bookingConfirmedRoute } from './routes/bookingConfirmed'
import { buildFeatureRoutes } from './routes/buildFeatureRoutes'
import { homeRoute } from './routes/home'
import { loginRoute } from './routes/login'
import { manageRoute } from './routes/manage'
import { myBookingsRoute } from './routes/myBookings'
import { privacyRoute } from './routes/privacy'
import { rootRoute } from './routes/root'
import { RouteError } from './routes/routeError'

const featureRoutes = buildFeatureRoutes(rootRoute, getActiveBrandModule())

export const router = createRouter({
  scrollRestoration: true,
  defaultErrorComponent: RouteError,
  routeTree: rootRoute.addChildren([
    homeRoute,
    ...featureRoutes,
    bookRoute,
    bookingConfirmedRoute,
    myBookingsRoute,
    manageRoute,
    loginRoute,
    privacyRoute,
    adminRoute.addChildren([
      adminIndexRoute,
      adminCalendarRoute,
      adminPendingRoute,
      adminReservationsRoute,
      adminReservationDetailRoute,
      adminManualRoute,
      adminServicesRoute,
      adminOpeningHoursRoute,
      adminHolidaysRoute,
      adminSettingsRoute,
      adminHomepageRoute,
    ]),
  ]),
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
