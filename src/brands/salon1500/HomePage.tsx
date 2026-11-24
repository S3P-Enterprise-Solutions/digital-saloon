import type * as React from 'react'
import { useEffect, useState } from 'react'
import { Box, Button, Container, IconButton, Link, Typography } from '@mui/material'
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'

import { isSectionVisible, resolveGalleryImages } from '../../data/homepageConfig'
import { telHref } from '../../data/phone'
import type { Salon } from '../../data/schemas'
import { useLocale } from '../../i18n'

import type { HomePageProps } from '../types'
import { salon1500Profile } from './profile'

const SCRIPT_FONT = '"Luxurious Script", "Cormorant SC", Georgia, serif'
const BODY_FONT = '"Roboto Condensed", "Helvetica Neue", Arial, sans-serif'

function mapsHref(salon: Salon): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${salon.name}, ${salon.address}`,
  )}`
}

export const HomePage: React.FunctionComponent<HomePageProps> = ({
  salon,
  homepageConfig,
  onEditHomepageClick,
  onBookClick,
}) => {
  const { t, locale } = useLocale()
  const [heroIndex, setHeroIndex] = useState(0)
  const [stylesIndex, setStylesIndex] = useState(0)
  const [stylesPaused, setStylesPaused] = useState(false)

  const heroImages = salon1500Profile.heroSlides
  useEffect(() => {
    if (heroImages.length <= 1) return
    const timer = window.setInterval(() => {
      setHeroIndex((prev) => (prev + 1) % heroImages.length)
    }, 5000)
    return () => window.clearInterval(timer)
  }, [heroImages.length])

  const currentHero = heroImages[heroIndex]
  const galleryImages = resolveGalleryImages(homepageConfig, salon1500Profile.gallery)
  const customSections = homepageConfig?.customSections ?? []
  const galleryCount = galleryImages.length
  const visibleStyleCount = Math.min(3, galleryCount)

  useEffect(() => {
    if (galleryCount <= 3 || stylesPaused) return
    const timer = window.setInterval(() => {
      setStylesIndex((prev) => (prev + 1) % galleryCount)
    }, 4000)
    return () => window.clearInterval(timer)
  }, [galleryCount, stylesPaused])

  const safeStylesIndex = galleryCount > 0 ? stylesIndex % galleryCount : 0
  const visibleGallery = Array.from({ length: visibleStyleCount }, (_, offset) => {
    const idx = (safeStylesIndex + offset) % galleryCount
    return { item: galleryImages[idx], key: `${idx}-${galleryImages[idx].id}` }
  })

  return (
    <Box sx={{ fontFamily: BODY_FONT, color: '#000000', bgcolor: '#FFFFFF' }}>
      {onEditHomepageClick ? (
        <Container maxWidth="lg" sx={{ py: 1.5, display: 'flex', justifyContent: 'flex-end' }}>
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
      {/* Full-bleed hero matching salon1500.it (5 interior slides + 0.52 white overlay + Luxurious Script) */}
      {isSectionVisible(homepageConfig, 'hero') ? (
        <Box
          component="section"
          sx={{
            position: 'relative',
            minHeight: { xs: 560, md: 700 },
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            overflow: 'hidden',
            bgcolor: '#FAF6F2',
          }}
        >
          {currentHero ? (
            <Box
              component="img"
              src={currentHero}
              alt=""
              aria-hidden
              sx={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                objectPosition: 'center',
              }}
            />
          ) : null}
          <Box
            aria-hidden
            sx={{
              position: 'absolute',
              inset: 0,
              bgcolor: 'rgba(255, 255, 255, 0.52)',
            }}
          />
          <Container maxWidth="md" sx={{ position: 'relative', zIndex: 1, py: { xs: 7, md: 10 } }}>
            {salon1500Profile.logoUrl ? (
              <Box
                component="img"
                src={salon1500Profile.logoUrl}
                alt="Salon 1500 Logo"
                sx={{
                  width: { xs: 110, sm: 136 },
                  height: 'auto',
                  mx: 'auto',
                  mb: 2,
                  display: 'block',
                  borderRadius: 1,
                  border: '1px solid rgba(0,0,0,0.12)',
                }}
              />
            ) : null}
            <Typography
              component="h1"
              sx={{
                fontFamily: SCRIPT_FONT,
                fontSize: { xs: '5.5rem', sm: '8.5rem', md: '10.5rem' },
                fontWeight: 100,
                lineHeight: 0.9,
                color: '#000000',
                mb: 2,
              }}
            >
              Salon 1500
            </Typography>
            <Typography
              sx={{
                fontFamily: BODY_FONT,
                fontSize: { xs: '1.125rem', md: '1.35rem' },
                fontWeight: 300,
                lineHeight: 1.6,
                maxWidth: '48ch',
                mx: 'auto',
                color: '#000000',
                mb: 4,
              }}
            >
              {salon1500Profile.heroIntro[locale]}
            </Typography>
            <Button
              variant="contained"
              size="large"
              onClick={onBookClick}
              sx={{
                bgcolor: '#000000',
                color: '#FFFFFF',
                px: 4,
                py: 1.5,
                fontSize: '1rem',
                letterSpacing: '0.06em',
                borderRadius: 0,
                '&:hover': { bgcolor: '#2B2B2B' },
              }}
            >
              {t('home.book')}
            </Button>
          </Container>
        </Box>
      ) : null}

      {/* Styles carousel (shows 3 and cycles through) */}
      {isSectionVisible(homepageConfig, 'styles') && galleryCount > 0 ? (
        <Container maxWidth="lg" component="section" sx={{ py: { xs: 7, md: 10 } }}>
          <Typography
            component="h2"
            sx={{
              fontFamily: SCRIPT_FONT,
              fontSize: { xs: '3.25rem', md: '4.25rem' },
              fontWeight: 400,
              color: '#54595F',
              textAlign: 'center',
              mb: 4,
            }}
          >
            Styles
          </Typography>
          <Box
            onMouseEnter={() => setStylesPaused(true)}
            onMouseLeave={() => setStylesPaused(false)}
            sx={{ position: 'relative' }}
          >
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: `repeat(${visibleStyleCount}, minmax(0, 1fr))`,
                gap: { xs: 1, sm: 2 },
              }}
            >
              {visibleGallery.map(({ item, key }) => (
                <Box
                  key={key}
                  component="figure"
                  sx={{
                    m: 0,
                    overflow: 'hidden',
                    aspectRatio: '3 / 4',
                    bgcolor: '#FAF6F2',
                    border: '1px solid #DFBFA4',
                    '&:hover img': { transform: 'scale(1.04)' },
                  }}
                >
                  <Box
                    component="img"
                    src={item.src}
                    alt={locale === 'it' ? item.altIt : item.altDe}
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
              ))}
            </Box>
            {galleryCount > 3 ? (
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 2,
                  mt: 2.5,
                }}
              >
                <IconButton
                  aria-label={t('home.carouselPrev')}
                  onClick={() => setStylesIndex((prev) => (prev - 1 + galleryCount) % galleryCount)}
                  sx={{ border: '1px solid #DFBFA4', color: '#000000' }}
                >
                  <ChevronLeftIcon />
                </IconButton>
                <Box sx={{ display: 'flex', gap: 0.75, alignItems: 'center' }}>
                  {galleryImages.map((img, idx) => (
                    <Box
                      key={img.id}
                      component="button"
                      type="button"
                      aria-label={`${idx + 1} / ${galleryCount}`}
                      onClick={() => setStylesIndex(idx)}
                      sx={{
                        width: idx === safeStylesIndex ? 18 : 8,
                        height: 8,
                        p: 0,
                        border: 0,
                        borderRadius: 999,
                        cursor: 'pointer',
                        bgcolor: idx === safeStylesIndex ? '#000000' : '#DFBFA4',
                        transition: 'width 200ms ease, background-color 200ms ease',
                      }}
                    />
                  ))}
                </Box>
                <IconButton
                  aria-label={t('home.carouselNext')}
                  onClick={() => setStylesIndex((prev) => (prev + 1) % galleryCount)}
                  sx={{ border: '1px solid #DFBFA4', color: '#000000' }}
                >
                  <ChevronRightIcon />
                </IconButton>
              </Box>
            ) : null}
          </Box>
        </Container>
      ) : null}

      {/* Stylistinnen with portrait photos */}
      {isSectionVisible(homepageConfig, 'stylists') ? (
        <Box component="section" sx={{ bgcolor: '#FAF6F2', py: { xs: 7, md: 9 } }}>
          <Container maxWidth="md" sx={{ textAlign: 'center' }}>
            <Typography
              component="h2"
              sx={{
                fontFamily: SCRIPT_FONT,
                fontSize: { xs: '3.25rem', md: '4.25rem' },
                fontWeight: 400,
                color: '#54595F',
                mb: 4,
              }}
            >
              {t('home.stylistsTitle')}
            </Typography>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                gap: 4,
              }}
            >
              {salon1500Profile.stylists.map((stylist) => (
                <Box
                  key={stylist.name}
                  sx={{
                    position: 'relative',
                    minHeight: { xs: 420, sm: 480 },
                    display: 'flex',
                    alignItems: 'flex-end',
                    textAlign: 'left',
                    overflow: 'hidden',
                    border: '1px solid #DFBFA4',
                    bgcolor: '#000000',
                  }}
                >
                  {stylist.imageUrl ? (
                    <Box
                      component="img"
                      src={stylist.imageUrl}
                      alt={stylist.name}
                      loading="lazy"
                      sx={{
                        position: 'absolute',
                        inset: 0,
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        objectPosition: 'center top',
                      }}
                    />
                  ) : null}
                  <Box
                    aria-hidden
                    sx={{
                      position: 'absolute',
                      inset: 0,
                      background:
                        'linear-gradient(to top, rgba(0, 0, 0, 0.78) 0%, rgba(0, 0, 0, 0.25) 45%, rgba(0, 0, 0, 0) 75%)',
                    }}
                  />
                  <Box sx={{ position: 'relative', zIndex: 1, p: 3, width: '100%' }}>
                    <Typography
                      sx={{
                        fontFamily: BODY_FONT,
                        fontSize: '1.5rem',
                        fontWeight: 500,
                        color: '#DFBFA4',
                        mb: 0.5,
                      }}
                    >
                      {stylist.name}
                    </Typography>
                    <Typography sx={{ color: '#FFFFFF', fontSize: '1rem', mb: 1 }}>
                      {locale === 'it' ? stylist.roleIt : stylist.roleDe}
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
                      <Link
                        href={telHref(stylist.phone)}
                        sx={{ color: '#FFFFFF', fontWeight: 600, textDecorationColor: '#DFBFA4' }}
                      >
                        T: {stylist.phone}
                      </Link>
                      {stylist.instagramUrl ? (
                        <Link
                          href={stylist.instagramUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          sx={{ color: '#DFBFA4', fontWeight: 600 }}
                        >
                          Instagram
                        </Link>
                      ) : null}
                    </Box>
                  </Box>
                </Box>
              ))}
            </Box>
          </Container>
        </Box>
      ) : null}

      {/* Custom sections */}
      {customSections.map((section, idx) => {
        const title = locale === 'it' ? section.titleIt : section.titleDe
        const body = locale === 'it' ? section.bodyIt : section.bodyDe
        return (
          <Box
            key={section.id}
            component="section"
            sx={{ bgcolor: idx % 2 === 0 ? '#FFFFFF' : '#FAF6F2', py: { xs: 6, md: 8 } }}
          >
            <Container maxWidth="md" sx={{ textAlign: section.imageUrl ? 'left' : 'center' }}>
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: {
                    xs: '1fr',
                    md: section.imageUrl ? '7fr 5fr' : '1fr',
                  },
                  gap: 4,
                  alignItems: 'center',
                }}
              >
                <Box>
                  <Typography
                    component="h2"
                    sx={{
                      fontFamily: SCRIPT_FONT,
                      fontSize: { xs: '3rem', md: '3.75rem' },
                      fontWeight: 400,
                      color: '#54595F',
                      mb: 2,
                    }}
                  >
                    {title}
                  </Typography>
                  {body ? (
                    <Typography
                      sx={{ fontSize: '1.0625rem', lineHeight: 1.7, whiteSpace: 'pre-line' }}
                    >
                      {body}
                    </Typography>
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
                      border: '1px solid #DFBFA4',
                    }}
                  />
                ) : null}
              </Box>
            </Container>
          </Box>
        )
      })}

      {/* Kontakt */}
      {isSectionVisible(homepageConfig, 'visit') ? (
        <Box component="section" sx={{ bgcolor: '#FFFFFF', py: { xs: 7, md: 9 } }}>
          <Container maxWidth="md" sx={{ textAlign: 'center' }}>
            <Typography
              component="h2"
              sx={{
                fontFamily: SCRIPT_FONT,
                fontSize: { xs: '3.25rem', md: '4.25rem' },
                fontWeight: 400,
                color: '#54595F',
                mb: 3,
              }}
            >
              {t('home.visitTitle')}
            </Typography>
            {salon ? (
              <>
                <Typography sx={{ fontSize: '1.25rem', fontWeight: 600, mb: 0.5 }}>
                  {salon.name}
                </Typography>
                <Typography sx={{ color: '#54595F', mb: 2 }}>{salon.address}</Typography>
                <Typography sx={{ mb: 1 }}>
                  <Link href={`mailto:${salon.email}`} sx={{ color: '#000000' }}>
                    {salon.email}
                  </Link>
                </Typography>
                {salon1500Profile.instagramUrl ? (
                  <Typography sx={{ mb: 1 }}>
                    <Link
                      href={salon1500Profile.instagramUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      sx={{ color: '#000000', fontWeight: 600, textDecorationColor: '#DFBFA4' }}
                    >
                      Instagram: {salon1500Profile.instagramHandle ?? salon1500Profile.instagramUrl}
                    </Link>
                  </Typography>
                ) : null}
                <Typography>
                  <Link
                    href={mapsHref(salon)}
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{ color: '#000000', fontWeight: 600, textDecorationColor: '#DFBFA4' }}
                  >
                    {t('home.directions')}
                  </Link>
                </Typography>
              </>
            ) : null}
          </Container>
        </Box>
      ) : null}
    </Box>
  )
}
