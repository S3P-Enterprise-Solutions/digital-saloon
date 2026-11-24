import type * as React from 'react'
import { useState } from 'react'
import {
  Box,
  Button,
  Container,
  IconButton,
  Link,
  Menu,
  MenuItem,
  Stack,
  Typography,
} from '@mui/material'
import { alpha } from '@mui/material/styles'
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined'
import LogoutOutlinedIcon from '@mui/icons-material/LogoutOutlined'
import MarkEmailUnreadOutlinedIcon from '@mui/icons-material/MarkEmailUnreadOutlined'
import MenuIcon from '@mui/icons-material/Menu'
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined'
import { useQueryClient } from '@tanstack/react-query'

import { getActiveBrand } from '../data/brands'
import { telHref } from '../data/phone'
import type { Salon } from '../data/schemas'
import { useLocale } from '../i18n'
import { localeLabels, locales } from '../i18n'
import { brand } from '../theme'
import { FooterLink, Header, LanguageSwitch, NavIconButton, NavLink } from './AppShell.styles'
import { PullToRefresh } from './PullToRefresh'
import { HeaderWordmark } from './Wordmark'

/** Staff header entry matching the current page; `null` outside the admin area. */
export type AdminNavItem = 'calendar' | 'pending' | 'settings'

export type AppShellProps = {
  salon: Salon | null
  email: string | null
  activeAdminNav: AdminNavItem | null
  /** `full` lets the page own its width (home page bands); `wide` suits dashboards. */
  contentWidth: 'contained' | 'wide' | 'full'
  onHomeClick: () => void
  onBalayageClick: () => void
  onBookClick: () => void
  onLoginClick: () => void
  onPrivacyClick: () => void
  onAdminClick: () => void
  onAdminPendingClick: () => void
  onAdminSettingsClick: () => void
  onSignOutClick: () => void
  children: React.ReactNode
}

export const AppShell: React.FunctionComponent<AppShellProps> = ({
  salon,
  email,
  activeAdminNav,
  contentWidth,
  onHomeClick,
  onBalayageClick,
  onBookClick,
  onLoginClick,
  onPrivacyClick,
  onAdminClick,
  onAdminPendingClick,
  onAdminSettingsClick,
  onSignOutClick,
  children,
}) => {
  const { locale, setLocale, t } = useLocale()
  const queryClient = useQueryClient()
  const activeBrand = getActiveBrand()
  const [mobileMenuAnchor, setMobileMenuAnchor] = useState<HTMLElement | null>(null)

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', overflowX: 'clip' }}>
      <Header>
        <Container maxWidth="lg" className="header-inner">
          <HeaderWordmark label={t('nav.home')} onClick={onHomeClick} />
          <nav className="header-nav" aria-label={t('nav.main')}>
            {activeBrand.key === 'salon1500' ? (
              <NavLink
                type="button"
                onClick={onBalayageClick}
                sx={{ display: { xs: 'none', sm: 'inline-flex' } }}
              >
                Balayage
              </NavLink>
            ) : null}
            {email ? (
              <>
                <NavLink
                  type="button"
                  aria-current={activeAdminNav === 'calendar' ? 'page' : undefined}
                  onClick={onAdminClick}
                  sx={{ display: { xs: 'none', sm: 'inline-flex' } }}
                >
                  {t('nav.staffCalendar')}
                </NavLink>
                <NavIconButton
                  aria-label={t('nav.staffCalendar')}
                  aria-current={activeAdminNav === 'calendar' ? 'page' : undefined}
                  onClick={onAdminClick}
                  sx={{ display: { xs: 'inline-flex', sm: 'none' } }}
                >
                  <CalendarMonthOutlinedIcon />
                </NavIconButton>
                <NavLink
                  type="button"
                  aria-current={activeAdminNav === 'pending' ? 'page' : undefined}
                  onClick={onAdminPendingClick}
                  sx={{ display: { xs: 'none', sm: 'inline-flex' } }}
                >
                  {t('nav.staffPending')}
                </NavLink>
                <NavIconButton
                  aria-label={t('nav.staffPending')}
                  aria-current={activeAdminNav === 'pending' ? 'page' : undefined}
                  onClick={onAdminPendingClick}
                  sx={{ display: { xs: 'inline-flex', sm: 'none' } }}
                >
                  <MarkEmailUnreadOutlinedIcon />
                </NavIconButton>
                <NavLink
                  type="button"
                  aria-current={activeAdminNav === 'settings' ? 'page' : undefined}
                  onClick={onAdminSettingsClick}
                  sx={{ display: { xs: 'none', sm: 'inline-flex' } }}
                >
                  {t('nav.staffSettings')}
                </NavLink>
                <NavIconButton
                  aria-label={t('nav.staffSettings')}
                  aria-current={activeAdminNav === 'settings' ? 'page' : undefined}
                  onClick={onAdminSettingsClick}
                  sx={{ display: { xs: 'inline-flex', sm: 'none' } }}
                >
                  <SettingsOutlinedIcon />
                </NavIconButton>
              </>
            ) : null}
            <LanguageSwitch role="group" aria-label={t('nav.language')}>
              {locales.map((code) => (
                <button
                  key={code}
                  type="button"
                  lang={code}
                  aria-label={localeLabels[code]}
                  aria-pressed={code === locale}
                  onClick={() => setLocale(code)}
                >
                  {code.toUpperCase()}
                </button>
              ))}
            </LanguageSwitch>
            {email ? (
              <>
                <Button
                  variant="outlined"
                  color="primary"
                  title={t('nav.signedInAs', { email })}
                  onClick={onSignOutClick}
                  sx={{ display: { xs: 'none', sm: 'inline-flex' }, whiteSpace: 'nowrap', px: 2.5 }}
                >
                  {t('nav.signOut')}
                </Button>
                <IconButton
                  aria-label={t('nav.signOut')}
                  title={t('nav.signedInAs', { email })}
                  onClick={onSignOutClick}
                  sx={{ display: { xs: 'inline-flex', sm: 'none' }, color: 'primary.main' }}
                >
                  <LogoutOutlinedIcon />
                </IconButton>
              </>
            ) : (
              <>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={onBookClick}
                  sx={{
                    whiteSpace: 'nowrap',
                    px: { xs: 1.25, sm: 2.5 },
                    fontSize: { xs: '0.8125rem', sm: '0.875rem' },
                  }}
                >
                  {t('nav.book')}
                </Button>
                {activeBrand.key === 'salon1500' ? (
                  <>
                    <IconButton
                      aria-label={t('nav.main')}
                      onClick={(event) => setMobileMenuAnchor(event.currentTarget)}
                      sx={{
                        display: { xs: 'inline-flex', sm: 'none' },
                        color: 'primary.main',
                        p: 0.75,
                      }}
                    >
                      <MenuIcon />
                    </IconButton>
                    <Menu
                      anchorEl={mobileMenuAnchor}
                      open={Boolean(mobileMenuAnchor)}
                      onClose={() => setMobileMenuAnchor(null)}
                    >
                      <MenuItem
                        onClick={() => {
                          setMobileMenuAnchor(null)
                          onBalayageClick()
                        }}
                      >
                        Balayage
                      </MenuItem>
                    </Menu>
                  </>
                ) : null}
              </>
            )}
          </nav>
        </Container>
      </Header>

      <Box component="main" sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        <PullToRefresh
          onRefresh={async () => {
            await queryClient.invalidateQueries()
          }}
        >
          {contentWidth === 'full' ? (
            children
          ) : (
            <Container
              maxWidth={contentWidth === 'wide' ? 'lg' : 'md'}
              sx={{ py: { xs: 4, sm: 6 } }}
            >
              {children}
            </Container>
          )}
        </PullToRefresh>
      </Box>

      <Box component="footer" sx={{ bgcolor: brand.espresso, color: brand.paper, py: 5 }}>
        <Container maxWidth="lg">
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={{ xs: 2, sm: 6 }}
            sx={{ alignItems: { sm: 'baseline' } }}
          >
            {activeBrand.key === 'salon1500' ? (
              <Typography sx={{ fontWeight: 700, fontSize: '1.125rem' }}>
                <Box component="span" sx={{ color: brand.orange }}>
                  Salon
                </Box>{' '}
                <Box component="span" sx={{ fontWeight: 300 }}>
                  1500
                </Box>
              </Typography>
            ) : (
              <Typography sx={{ fontWeight: 700, fontSize: '1.125rem' }}>
                <Box component="span" sx={{ color: brand.orange }}>
                  KIMM
                </Box>{' '}
                <Box component="span" sx={{ fontWeight: 300 }}>
                  HAIR
                </Box>
              </Typography>
            )}
            {salon ? (
              <>
                <Typography variant="body2">{salon.address}</Typography>
                <Link href={telHref(salon.phone)} variant="body2" sx={{ color: 'inherit' }}>
                  {salon.phone}
                </Link>
                {salon.vatId ? (
                  <Typography variant="body2" sx={{ opacity: 0.7 }}>
                    {t('footer.vatId')} {salon.vatId}
                  </Typography>
                ) : null}
              </>
            ) : null}
          </Stack>
          <Box
            sx={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 3,
              mt: 4,
              pt: 2.5,
              borderTop: `1px solid ${alpha(brand.paper, 0.15)}`,
            }}
          >
            <FooterLink type="button" onClick={onPrivacyClick}>
              {t('footer.privacy')}
            </FooterLink>
            {email ? null : (
              <FooterLink type="button" onClick={onLoginClick}>
                {t('nav.staffLogin')}
              </FooterLink>
            )}
          </Box>
        </Container>
      </Box>
    </Box>
  )
}
