import type * as React from 'react'
import { Outlet, createRootRoute, useNavigate, useRouterState } from '@tanstack/react-router'

import { useAuth } from '../auth/AuthProvider'
import { AppShell, type AdminNavItem } from '../components/AppShell'
import { useSignOut } from '../hooks/useSignOut'
import { useSalon } from '../hooks/useSalon'

const settingsPaths = [
  '/admin/settings',
  '/admin/services',
  '/admin/opening-hours',
  '/admin/holidays',
  '/admin/homepage',
]

function activeAdminNavOf(pathname: string): AdminNavItem | null {
  if (settingsPaths.some((path) => pathname.startsWith(path))) return 'settings'
  if (pathname.startsWith('/admin/pending')) return 'pending'
  if (pathname.startsWith('/admin')) return 'calendar'
  return null
}

const RootRoute: React.FunctionComponent = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const signOut = useSignOut()
  const salon = useSalon()

  const pathname = useRouterState({ select: (state) => state.location.pathname })

  return (
    <AppShell
      salon={salon.data ?? null}
      email={user?.email ?? null}
      activeAdminNav={activeAdminNavOf(pathname)}
      contentWidth={
        pathname === '/' || pathname === '/balayage'
          ? 'full'
          : pathname.startsWith('/admin')
            ? 'wide'
            : 'contained'
      }
      onHomeClick={() => {
        // Staff have no use for the customer home page; their start page is the calendar.
        void navigate({ to: user ? '/admin' : '/' })
      }}
      onBalayageClick={() => {
        void navigate({ to: '/balayage' })
      }}
      onBookClick={() => {
        void navigate({ to: '/book' })
      }}
      onLoginClick={() => {
        void navigate({ to: '/login', search: { redirect: '/admin' } })
      }}
      onPrivacyClick={() => {
        void navigate({ to: '/datenschutz' })
      }}
      onAdminClick={() => {
        void navigate({ to: '/admin' })
      }}
      onAdminPendingClick={() => {
        void navigate({ to: '/admin/pending' })
      }}
      onAdminSettingsClick={() => {
        void navigate({ to: '/admin/settings' })
      }}
      onSignOutClick={() => {
        // Leave admin pages first (their auth guard would race us to /login), but not for
        // the home page: it still sees the admin session and would send us back to /admin.
        void navigate({ to: '/login' }).then(() => {
          signOut.mutate(undefined, {
            onSuccess: () => {
              void navigate({ to: '/', replace: true })
            },
          })
        })
      }}
    >
      <Outlet />
    </AppShell>
  )
}

export const rootRoute = createRootRoute({
  component: RootRoute,
})
