import type * as React from 'react'
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Container,
  Link,
  Stack,
  Typography,
} from '@mui/material'

import { HeroWordmark } from '../components/Wordmark'
import { parseYmd, viennaTodayYmd } from '../data/bookingCalendar'
import type { BrandProfile } from '../data/brands'
import { isSectionVisible, resolveGalleryImages } from '../data/homepageConfig'
import type { OpeningHoursByWeekday } from '../data/openingHours'
import { weekdays } from '../data/openingRules'
import { arePricesVisible } from '../data/salonConfig'
import type { HomepageConfig, Salon } from '../data/schemas'
import {
  formatServiceDurationRange,
  formatServicePriceRange,
  localizedServiceDescription,
  localizedServiceName,
} from '../data/serviceForm'
import type { ServiceWithId } from '../data/services'
import { useLocale } from '../i18n'

export type HairboutiqueHomePageProps = {
  brandProfile: BrandProfile
  salon: Salon | null | undefined
  services: ServiceWithId[] | undefined
  servicesLoading: boolean
  servicesError: boolean
  openingHours: Partial<OpeningHoursByWeekday> | undefined
  homepageConfig: HomepageConfig | undefined
  onEditHomepageClick?: () => void
  onBookClick: () => void
  onServiceClick: (serviceId: string) => void
}

export const HairboutiqueHomePage: React.FunctionComponent<HairboutiqueHomePageProps> = ({
  brandProfile,
  salon,
  services,
  servicesLoading,
  servicesError,
  openingHours,
  homepageConfig,
  onEditHomepageClick,
  onBookClick,
  onServiceClick,
}) => {
  const { t, locale, intlLocale } = useLocale()
  const pricesVisible = arePricesVisible()
  const weekdayFormat = new Intl.DateTimeFormat(intlLocale, { weekday: 'long', timeZone: 'UTC' })
  const today = parseYmd(viennaTodayYmd())
  const todayIndex =
    (new Date(Date.UTC(today.year, today.monthIndex, today.day)).getUTCDay() + 6) % 7
  const sortedServices = services ?? []
  const galleryImages = resolveGalleryImages(homepageConfig, brandProfile.gallery)

  const phone = salon?.phone ?? '+39 0472 055770'
  const address = salon?.address ?? 'Frundsbergstraße 24/A, 39049 Sterzing (BZ)'
  const email = salon?.email ?? 'hairboutiqueohg@libero.it'
  const telHref = `tel:${phone.replace(/[^+\d]/g, '')}`
  const mapsHref = brandProfile.mapsUrl ?? 'https://share.google/c5eTEwBVNVrUw3FaK'

  return (
    <Box sx={{ bgcolor: brandProfile.colors.paper }}>
      {onEditHomepageClick ? (
        <Container maxWidth="lg" sx={{ py: 1.5, display: 'flex', justifyContent: 'flex-end' }}>
          <Button size="small" variant="outlined" onClick={onEditHomepageClick}>
            {t('admin.homepageEditButton')}
          </Button>
        </Container>
      ) : null}

      {isSectionVisible(homepageConfig, 'hero') ? (
        <Box
          component="section"
          sx={{
            bgcolor: brandProfile.colors.primary,
            color: brandProfile.colors.paper,
            py: { xs: 5, md: 9 },
          }}
        >
          <Container maxWidth="lg">
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', md: '1fr 1.15fr' },
                gap: { xs: 4, md: 7 },
                alignItems: 'center',
              }}
            >
              <Stack spacing={2.5}>
                <HeroWordmark />
                <Typography
                  variant="body2"
                  sx={{ color: 'rgba(249, 250, 250, 0.72)', fontSize: '0.95rem' }}
                >
                  {brandProfile.place[locale]}
                </Typography>
                <Typography
                  variant="body1"
                  sx={{
                    color: 'rgba(249, 250, 250, 0.9)',
                    maxWidth: '42ch',
                    lineHeight: 1.65,
                    fontSize: { xs: '1rem', sm: '1.08rem' },
                  }}
                >
                  {brandProfile.heroIntro[locale]}
                </Typography>
                <Stack direction="row" spacing={2} sx={{ pt: 1, flexWrap: 'wrap', gap: 1.5 }}>
                  <Button
                    variant="contained"
                    size="large"
                    onClick={onBookClick}
                    sx={{
                      bgcolor: brandProfile.colors.paper,
                      color: brandProfile.colors.primary,
                      px: 3.5,
                      py: 1.25,
                      '&:hover': { bgcolor: brandProfile.colors.surface },
                    }}
                  >
                    {t('home.book')}
                  </Button>
                  <Button
                    component="a"
                    href={telHref}
                    variant="outlined"
                    size="large"
                    sx={{
                      borderColor: 'rgba(249, 250, 250, 0.35)',
                      color: brandProfile.colors.paper,
                      px: 3,
                      py: 1.25,
                      '&:hover': {
                        borderColor: brandProfile.colors.paper,
                        bgcolor: 'rgba(249, 250, 250, 0.08)',
                      },
                    }}
                  >
                    {phone}
                  </Button>
                </Stack>
              </Stack>

              <Box
                component="img"
                src={galleryImages[0]?.src ?? brandProfile.heroSlides[0]}
                alt={
                  (locale === 'it' ? galleryImages[0]?.altIt : galleryImages[0]?.altDe) ??
                  'Hairboutique OHG Studio'
                }
                sx={{
                  width: '100%',
                  aspectRatio: '3 / 2',
                  objectFit: 'cover',
                  borderRadius: 1,
                  display: 'block',
                }}
              />
            </Box>
          </Container>
        </Box>
      ) : null}

      {isSectionVisible(homepageConfig, 'stylists') ? (
        <Container maxWidth="lg" component="section" sx={{ py: { xs: 6, md: 9 } }}>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: '1fr 1.15fr' },
              gap: { xs: 4, md: 7 },
              alignItems: 'center',
            }}
          >
            <Stack spacing={2.5}>
              <Typography variant="h2" sx={{ fontWeight: 700, color: brandProfile.colors.primary }}>
                {t('home.stylistsTitle')}
              </Typography>
              <Typography color="text.secondary" sx={{ maxWidth: '46ch', lineHeight: 1.65 }}>
                {locale === 'it'
                  ? 'Doris Hofer e Nadja Gschliesser guidano il team di Hairboutique OHG a Vipiteno.'
                  : 'Doris Hofer und Nadja Gschliesser führen das Team der Hairboutique OHG in Sterzing.'}
              </Typography>

              <Stack spacing={1.25} sx={{ pt: 0.5 }}>
                {brandProfile.stylists.map((stylist) => (
                  <Box
                    key={stylist.name}
                    sx={{
                      py: 1,
                      borderBottom: `1px solid ${brandProfile.colors.divider}`,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'baseline',
                      gap: 2,
                    }}
                  >
                    <Typography sx={{ fontWeight: 600 }}>{stylist.name}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {locale === 'it' ? stylist.roleIt : stylist.roleDe}
                    </Typography>
                  </Box>
                ))}
              </Stack>
              <Box
                component="img"
                src={galleryImages[1]?.src ?? brandProfile.heroSlides[1]}
                alt={(locale === 'it' ? galleryImages[1]?.altIt : galleryImages[1]?.altDe) ?? ''}
                sx={{
                  width: '100%',
                  aspectRatio: '3 / 2',
                  objectFit: 'cover',
                  borderRadius: 1,
                  display: 'block',
                  pt: 0.5,
                }}
              />
            </Stack>

            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 2.5,
              }}
            >
              <Box
                component="img"
                src={galleryImages[3]?.src ?? '/hairboutique/team.jpeg'}
                alt={(locale === 'it' ? galleryImages[3]?.altIt : galleryImages[3]?.altDe) ?? ''}
                sx={{
                  width: '100%',
                  aspectRatio: '3 / 4',
                  objectFit: 'cover',
                  objectPosition: 'center top',
                  borderRadius: 1,
                  display: 'block',
                }}
              />
              <Box
                sx={{
                  width: '100%',
                  aspectRatio: '3 / 4',
                  overflow: 'hidden',
                  borderRadius: 1,
                }}
              >
                <Box
                  component="img"
                  src={galleryImages[2]?.src ?? brandProfile.heroSlides[2]}
                  alt={(locale === 'it' ? galleryImages[2]?.altIt : galleryImages[2]?.altDe) ?? ''}
                  sx={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    transform: 'scale(1.42)',
                    display: 'block',
                  }}
                />
              </Box>
            </Box>
          </Box>
        </Container>
      ) : null}

      {isSectionVisible(homepageConfig, 'services') ? (
        <Container
          maxWidth="lg"
          component="section"
          sx={{
            py: { xs: 5, md: 8 },
            borderTop: `1px solid ${brandProfile.colors.divider}`,
          }}
        >
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={1}
            sx={{ justifyContent: 'space-between', alignItems: { sm: 'baseline' }, mb: 3 }}
          >
            <Typography variant="h2" sx={{ fontWeight: 700 }}>
              {t('home.servicesTitle')}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t('home.servicesHint')}
            </Typography>
          </Stack>

          {servicesLoading ? <CircularProgress size={28} /> : null}
          {servicesError ? <Alert severity="error">{t('home.servicesError')}</Alert> : null}
          {!servicesLoading && !servicesError && sortedServices.length === 0 ? (
            <Alert severity="info">{t('home.servicesEmpty')}</Alert>
          ) : null}

          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
              columnGap: 6,
            }}
          >
            {sortedServices.map((service) => {
              const desc = localizedServiceDescription(service, locale)
              return (
                <Box
                  key={service.id}
                  component="button"
                  type="button"
                  onClick={() => onServiceClick(service.id)}
                  sx={{
                    width: '100%',
                    textAlign: 'left',
                    background: 'none',
                    border: 0,
                    borderBottom: `1px solid ${brandProfile.colors.divider}`,
                    py: 2,
                    px: 1,
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'baseline',
                    gap: 2,
                    font: 'inherit',
                    color: 'inherit',
                    '&:hover': { bgcolor: brandProfile.colors.surface },
                  }}
                >
                  <Box sx={{ minWidth: 0 }}>
                    <Typography sx={{ fontWeight: 600 }}>
                      {localizedServiceName(service, locale)}
                    </Typography>
                    {desc ? (
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
                        {desc}
                      </Typography>
                    ) : null}
                  </Box>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}
                  >
                    {formatServiceDurationRange(
                      service.durationMinutes,
                      service.durationMaxMinutes,
                    )}{' '}
                    min
                    {pricesVisible
                      ? ` · ${formatServicePriceRange(service.priceCents, service.priceMaxCents)}`
                      : ''}
                  </Typography>
                </Box>
              )
            })}
          </Box>
        </Container>
      ) : null}

      {isSectionVisible(homepageConfig, 'visit') ? (
        <Box
          component="section"
          sx={{
            bgcolor: brandProfile.colors.surface,
            py: { xs: 6, md: 9 },
          }}
        >
          <Container maxWidth="lg">
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
                gap: { xs: 4, md: 8 },
              }}
            >
              <Stack spacing={1.5} sx={{ maxWidth: 480 }}>
                <Typography variant="h2" sx={{ fontWeight: 700, mb: 0.5 }}>
                  {t('home.hoursTitle')}
                </Typography>
                {weekdays.map((day, idx) => {
                  const intervals = openingHours?.[day]?.intervals ?? []
                  const label = weekdayFormat.format(new Date(Date.UTC(2026, 0, 5 + idx)))
                  const isToday = idx === todayIndex
                  return (
                    <Box
                      key={day}
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        py: 0.5,
                        borderBottom: `1px solid ${brandProfile.colors.divider}`,
                        fontWeight: isToday ? 700 : 400,
                      }}
                    >
                      <span>{label}</span>
                      <span style={{ fontVariantNumeric: 'tabular-nums' }}>
                        {intervals.length > 0
                          ? intervals.map((i) => `${i.start}–${i.end}`).join(', ')
                          : t('home.closed')}
                      </span>
                    </Box>
                  )
                })}
              </Stack>

              <Stack spacing={1.5}>
                <Typography variant="h2" sx={{ fontWeight: 700, mb: 0.5 }}>
                  {t('home.visitTitle')}
                </Typography>
                <Typography sx={{ fontWeight: 600 }}>{salon?.name ?? brandProfile.name}</Typography>
                <Typography color="text.secondary">{address}</Typography>
                <Typography>
                  <Link href={telHref} underline="hover" color="inherit">
                    {phone}
                  </Link>
                </Typography>
                <Typography>
                  <Link href={`mailto:${email}`} underline="hover" color="inherit">
                    {email}
                  </Link>
                </Typography>
                <Box sx={{ pt: 1 }}>
                  <Button
                    component="a"
                    href={mapsHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    variant="outlined"
                  >
                    {t('home.directions')}
                  </Button>
                </Box>
              </Stack>
            </Box>
          </Container>
        </Box>
      ) : null}
    </Box>
  )
}
