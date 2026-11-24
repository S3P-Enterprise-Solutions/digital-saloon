import type * as React from 'react'
import { Box, Button, CircularProgress, Container, Link, Typography } from '@mui/material'

import EditOutlinedIcon from '@mui/icons-material/EditOutlined'

import { parseYmd, viennaTodayYmd } from '../../data/bookingCalendar'
import { isSectionVisible, resolveGalleryImages } from '../../data/homepageConfig'
import { arePricesVisible } from '../../data/salonConfig'
import {
  formatServiceDurationRange,
  formatServicePriceRange,
  localizedServiceDescription,
  localizedServiceName,
} from '../../data/serviceForm'
import { telHref } from '../../data/phone'
import type { Salon, Weekday } from '../../data/schemas'
import { HeroWordmark } from './shell'
import { useLocale } from '../../i18n'
import { createSalonTheme } from '../createSalonTheme'
import { HoursList, PriceList, PriceRow } from './HomePage.styles'
import type { HomePageProps } from '../types'
import { kimmProfile } from './profile'

const { brandColors: brand } = createSalonTheme({
  colors: kimmProfile.colors,
  typography: kimmProfile.typography,
})

const weekdaysFromMonday: readonly Weekday[] = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
]

function mapsHref(salon: Salon): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${salon.name}, ${salon.address}`,
  )}`
}

export const HomePage: React.FunctionComponent<HomePageProps> = ({
  salon,
  services,
  servicesLoading,
  servicesError,
  openingHours,
  openingHoursLoading,
  openingHoursError,
  homepageConfig,
  onEditHomepageClick,
  onBookClick,
  onServiceClick,
}) => {
  const { t, locale, intlLocale } = useLocale()
  const activeBrand = kimmProfile
  const pricesVisible = arePricesVisible()

  const weekdayFormat = new Intl.DateTimeFormat(intlLocale, { weekday: 'long', timeZone: 'UTC' })
  const today = parseYmd(viennaTodayYmd())
  const todayIndex =
    (new Date(Date.UTC(today.year, today.monthIndex, today.day)).getUTCDay() + 6) % 7
  const sortedServices = services ?? []
  const galleryImages = resolveGalleryImages(homepageConfig, activeBrand.gallery)
  const customSections = homepageConfig?.customSections ?? []

  return (
    <>
      {onEditHomepageClick ? (
        <Container maxWidth="lg" sx={{ pt: 2, display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            size="small"
            variant="outlined"
            startIcon={<EditOutlinedIcon />}
            onClick={onEditHomepageClick}
          >
            {t('admin.homepageEditButton')}
          </Button>
        </Container>
      ) : null}
      {isSectionVisible(homepageConfig, 'hero') ? (
        <Container
          maxWidth="lg"
          component="section"
          sx={{ pt: { xs: 6, md: 11 }, pb: { xs: 7, md: 12 } }}
        >
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: '7fr 5fr' },
              gap: { xs: 5, md: 6 },
              alignItems: 'end',
            }}
          >
            <Box component="h1" sx={{ m: 0, font: 'inherit' }}>
              <HeroWordmark />
            </Box>
            <Box sx={{ maxWidth: '44ch', pb: { md: 1.5 } }}>
              <Typography sx={{ fontSize: '1.375rem', fontWeight: 600, mb: 1.5 }}>
                {activeBrand.place[locale]}
              </Typography>
              <Typography sx={{ fontSize: '1.0625rem', lineHeight: 1.65, mb: 4 }}>
                {activeBrand.heroIntro[locale]}
              </Typography>
              <Button variant="contained" size="large" onClick={onBookClick}>
                {t('home.book')}
              </Button>
              {salon ? (
                <Typography variant="body2" sx={{ mt: 2 }}>
                  <Link href={telHref(salon.phone)}>{t('home.call', { phone: salon.phone })}</Link>
                </Typography>
              ) : null}
            </Box>
          </Box>
        </Container>
      ) : null}

      {isSectionVisible(homepageConfig, 'services') ? (
        <Container
          maxWidth="lg"
          component="section"
          aria-labelledby="home-services"
          sx={{ pb: { xs: 8, md: 12 } }}
        >
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: '4fr 8fr' },
              gap: { xs: 3, md: 6 },
            }}
          >
            <Box>
              <Typography id="home-services" variant="h2" sx={{ mb: 1 }}>
                {t('home.servicesTitle')}
              </Typography>
              <Typography color="text.secondary" sx={{ maxWidth: '32ch' }}>
                {t('home.servicesHint')}
              </Typography>
            </Box>
            <Box>
              {servicesLoading ? (
                <CircularProgress aria-label={t('book.servicesLoading')} size={28} />
              ) : null}
              {servicesError ? <Typography>{t('home.servicesError')}</Typography> : null}
              {!servicesLoading && !servicesError && sortedServices.length === 0 ? (
                <Typography>{t('home.servicesEmpty')}</Typography>
              ) : null}
              {sortedServices.length > 0 ? (
                <PriceList>
                  {sortedServices.map((service) => (
                    <li key={service.id}>
                      <PriceRow type="button" onClick={() => onServiceClick(service.id)}>
                        <Typography
                          component="span"
                          className="price-name"
                          sx={{ fontWeight: 600, fontSize: '1.125rem' }}
                        >
                          {localizedServiceName(service, locale)}
                        </Typography>
                        <Typography
                          component="span"
                          className="price-duration"
                          variant="body2"
                          color="text.secondary"
                        >
                          {t('book.durationMinutes', {
                            minutes: formatServiceDurationRange(
                              service.durationMinutes,
                              service.durationMaxMinutes,
                            ),
                          })}
                        </Typography>
                        <Typography
                          component="span"
                          sx={{
                            fontWeight: 600,
                            fontSize: '1.125rem',
                            fontVariantNumeric: 'tabular-nums',
                            textAlign: 'right',
                          }}
                        >
                          {pricesVisible
                            ? formatServicePriceRange(service.priceCents, service.priceMaxCents)
                            : t('price.onRequest')}
                        </Typography>
                        {localizedServiceDescription(service, locale) ? (
                          <Typography
                            component="span"
                            variant="body2"
                            color="text.secondary"
                            sx={{ gridColumn: '1 / -1', mt: 0.5 }}
                          >
                            {localizedServiceDescription(service, locale)}
                          </Typography>
                        ) : null}
                      </PriceRow>
                    </li>
                  ))}
                </PriceList>
              ) : null}
            </Box>
          </Box>
        </Container>
      ) : null}

      {isSectionVisible(homepageConfig, 'styles') && galleryImages.length > 0 ? (
        <Container
          maxWidth="lg"
          component="section"
          aria-labelledby="home-styles"
          sx={{ pb: { xs: 8, md: 12 } }}
        >
          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              alignItems: { sm: 'baseline' },
              justifyContent: 'space-between',
              gap: 1.5,
              mb: 3,
              pb: 1.5,
              borderBottom: 1,
              borderColor: 'divider',
            }}
          >
            <Typography id="home-styles" variant="h2">
              {t('home.stylesTitle')}
            </Typography>
            <Typography color="text.secondary" variant="body2">
              {t('home.stylesHint')}
            </Typography>
          </Box>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: 'repeat(2, minmax(0, 1fr))',
                sm: 'repeat(3, minmax(0, 1fr))',
                md: 'repeat(5, minmax(0, 1fr))',
              },
              gap: 1.5,
            }}
          >
            {galleryImages.map((item) => {
              const alt = locale === 'it' ? item.altIt : item.altDe
              return (
                <Box
                  key={item.id}
                  component="figure"
                  sx={{
                    m: 0,
                    overflow: 'hidden',
                    borderRadius: 1,
                    border: `1px solid ${brand.orange}`,
                    bgcolor: brand.stone,
                    aspectRatio: '3 / 4',
                    position: 'relative',
                    '&:hover img': {
                      transform: 'scale(1.04)',
                    },
                  }}
                >
                  <Box
                    component="img"
                    src={item.src}
                    alt={alt}
                    loading="lazy"
                    sx={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      display: 'block',
                      transition: 'transform 260ms ease',
                    }}
                  />
                </Box>
              )
            })}
          </Box>
        </Container>
      ) : null}

      {customSections.map((section) => {
        const title = locale === 'it' ? section.titleIt : section.titleDe
        const body = locale === 'it' ? section.bodyIt : section.bodyDe
        return (
          <Container
            key={section.id}
            maxWidth="lg"
            component="section"
            sx={{ pb: { xs: 7, md: 10 } }}
          >
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: {
                  xs: '1fr',
                  md: section.imageUrl ? '7fr 5fr' : '1fr',
                },
                gap: { xs: 3, md: 6 },
                alignItems: 'center',
              }}
            >
              <Box>
                <Typography variant="h2" sx={{ mb: 1.5 }}>
                  {title}
                </Typography>
                {body ? (
                  <Typography sx={{ whiteSpace: 'pre-line', lineHeight: 1.7 }}>{body}</Typography>
                ) : null}
              </Box>
              {section.imageUrl ? (
                <Box
                  component="img"
                  src={section.imageUrl}
                  alt={title}
                  loading="lazy"
                  sx={{
                    width: '100%',
                    maxHeight: 380,
                    objectFit: 'cover',
                    borderRadius: 1,
                    border: `1px solid ${brand.orange}`,
                  }}
                />
              ) : null}
            </Box>
          </Container>
        )
      })}

      {isSectionVisible(homepageConfig, 'visit') ? (
        <Box component="section" sx={{ bgcolor: brand.stone, py: { xs: 7, md: 10 } }}>
          <Container
            maxWidth="lg"
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
              gap: { xs: 6, md: 10 },
            }}
          >
            <Box>
              <Typography variant="h2" sx={{ mb: 2.5 }}>
                {t('home.hoursTitle')}
              </Typography>
              {openingHoursLoading ? <CircularProgress size={28} /> : null}
              {openingHoursError ? <Typography>{t('home.hoursError')}</Typography> : null}
              {openingHours ? (
                <HoursList>
                  {weekdaysFromMonday.map((weekday, index) => {
                    const intervals = openingHours[weekday]?.intervals ?? []
                    const isToday = index === todayIndex
                    const className = isToday ? 'is-today' : undefined
                    return (
                      <Box key={weekday} sx={{ display: 'contents' }}>
                        <dt className={className}>
                          {weekdayFormat.format(new Date(Date.UTC(2024, 0, 1 + index)))}
                          {isToday ? (
                            <Box
                              component="span"
                              sx={{ ml: 1, color: brand.orangeDeep, fontWeight: 600 }}
                            >
                              {t('home.today')}
                            </Box>
                          ) : null}
                        </dt>
                        <dd className={className}>
                          {intervals.length === 0 ? (
                            <Box component="span" sx={{ color: 'text.secondary' }}>
                              {t('home.closed')}
                            </Box>
                          ) : (
                            intervals
                              .map((interval) => `${interval.start}–${interval.end}`)
                              .join(', ')
                          )}
                        </dd>
                      </Box>
                    )
                  })}
                </HoursList>
              ) : null}
            </Box>

            <Box>
              <Typography variant="h2" sx={{ mb: 2.5 }}>
                {t('home.visitTitle')}
              </Typography>
              {salon ? (
                <>
                  <Typography
                    component="address"
                    sx={{ fontStyle: 'normal', fontSize: '1.375rem', lineHeight: 1.4, mb: 2 }}
                  >
                    {salon.name}
                    <br />
                    {salon.address}
                  </Typography>
                  <Typography sx={{ mb: 1 }}>
                    <Link href={telHref(salon.phone)}>{salon.phone}</Link>
                  </Typography>
                  <Typography>
                    <Link href={mapsHref(salon)} target="_blank" rel="noopener noreferrer">
                      {t('home.directions')}
                    </Link>
                  </Typography>
                </>
              ) : null}

              {isSectionVisible(homepageConfig, 'stylists') && activeBrand.stylists.length > 0 ? (
                <Box sx={{ mt: 4, pt: 3, borderTop: 1, borderColor: 'divider' }}>
                  <Typography variant="h2" sx={{ mb: 2 }}>
                    {t('home.stylistsTitle')}
                  </Typography>
                  <Box
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                      gap: 2.5,
                    }}
                  >
                    {activeBrand.stylists.map((stylist) => (
                      <Box key={stylist.name}>
                        <Typography sx={{ fontWeight: 700 }}>{stylist.name}</Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                          {locale === 'it' ? stylist.roleIt : stylist.roleDe}
                        </Typography>
                        <Link href={telHref(stylist.phone)} variant="body2">
                          {stylist.phone}
                        </Link>
                      </Box>
                    ))}
                  </Box>
                </Box>
              ) : null}
            </Box>
          </Container>
        </Box>
      ) : null}
    </>
  )
}
