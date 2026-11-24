import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { CssBaseline, ThemeProvider } from '@mui/material'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from '@tanstack/react-router'
import '@fontsource-variable/archivo'

import { AuthProvider } from './auth/AuthProvider'
import { LocaleProvider } from './i18n'
import { router } from './router'
import { brand, theme } from './theme'

const rawBrand =
  typeof import.meta.env.VITE_BRAND === 'string'
    ? import.meta.env.VITE_BRAND.trim().toLowerCase()
    : 'kimm'
const brandTitle =
  rawBrand === 'salon1500'
    ? 'Salon 1500'
    : rawBrand === 'hairboutique'
      ? 'Hairboutique OHG'
      : 'KIMM Hair'
document.title = `${brandTitle} – Online-Terminbuchung`
const iconLink = document.querySelector<HTMLLinkElement>('link[rel="icon"]')
if (iconLink && rawBrand === 'salon1500') {
  iconLink.href = '/favicon-salon1500.svg'
} else if (iconLink && rawBrand === 'hairboutique') {
  iconLink.href = '/favicon-hairboutique.svg'
}
const themeMeta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')
if (themeMeta) {
  themeMeta.content = brand.orange
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
    },
  },
})

// iOS Safari ignores `user-scalable=no`; its proprietary gesture events still allow pinch zoom.
for (const type of ['gesturestart', 'gesturechange', 'gestureend']) {
  document.addEventListener(type, (event) => {
    event.preventDefault()
  })
}

const rootElement = document.getElementById('root')
if (!rootElement) {
  throw new Error('Root element #root not found')
}

createRoot(rootElement).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <LocaleProvider>
          <AuthProvider>
            <RouterProvider router={router} />
          </AuthProvider>
        </LocaleProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </StrictMode>,
)
