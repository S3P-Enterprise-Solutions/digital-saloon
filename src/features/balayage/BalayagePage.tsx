import type * as React from 'react'
import { useEffect, useState } from 'react'
import { Box, Button, Container, Typography } from '@mui/material'

import { arePricesVisible } from '../../data/salonConfig'
import { useLocale } from '../../i18n'

import type { BalayageContent } from './content'

export type BalayagePageProps = {
  content: BalayageContent
  onSelectPackage: (serviceId: string) => void
  onBookClick: () => void
}

export const BalayagePage: React.FunctionComponent<BalayagePageProps> = ({
  content,
  onSelectPackage,
  onBookClick,
}) => {
  const { t, locale } = useLocale()
  const pricesVisible = arePricesVisible()
  const [modelIndex, setModelIndex] = useState(0)
  const packages = content.packages
  const modelSlides = content.heroImageUrls
  const { scriptFont, bodyFont, accent, surface, ink, muted } = content.appearance

  useEffect(() => {
    if (modelSlides.length <= 1) return
    const timer = window.setInterval(() => {
      setModelIndex((prev) => (prev + 1) % modelSlides.length)
    }, 5000)
    return () => window.clearInterval(timer)
  }, [modelSlides.length])

  return (
    <Box sx={{ fontFamily: bodyFont, color: ink, bgcolor: '#FFFFFF' }}>
      <Box
        component="section"
        sx={{
          bgcolor: surface,
          py: { xs: 6, md: 9 },
          textAlign: 'center',
          borderBottom: `1px solid ${accent}`,
        }}
      >
        <Container maxWidth="md">
          <Typography
            component="h1"
            sx={{
              fontFamily: scriptFont,
              fontSize: { xs: '4.5rem', sm: '6.5rem', md: '8rem' },
              fontWeight: 100,
              lineHeight: 0.95,
              color: ink,
              mb: 2,
            }}
          >
            Balayage
          </Typography>
          <Typography
            sx={{
              fontFamily: bodyFont,
              fontSize: { xs: '1.1rem', md: '1.3rem' },
              fontWeight: 300,
              fontStyle: 'italic',
              color: muted,
              maxWidth: '46ch',
              mx: 'auto',
            }}
          >
            “balayer” – to dye like an artist painting a masterpiece
          </Typography>
        </Container>
      </Box>

      <Container maxWidth="lg" component="section" sx={{ py: { xs: 6, md: 9 } }}>
        <Typography
          component="h2"
          sx={{
            fontFamily: scriptFont,
            fontSize: { xs: '3rem', md: '4rem' },
            fontWeight: 400,
            color: muted,
            textAlign: 'center',
            mb: 5,
          }}
        >
          Price List
        </Typography>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
            gap: 3.5,
          }}
        >
          {packages.map((pkg) => {
            const subtitle = locale === 'it' ? pkg.subtitleIt : pkg.subtitleDe
            const includes = locale === 'it' ? pkg.includesIt : pkg.includesDe
            return (
              <Box
                key={pkg.id}
                sx={{
                  border: `1px solid ${accent}`,
                  bgcolor: '#FFFFFF',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}
              >
                <Box
                  sx={{
                    bgcolor: surface,
                    px: 3.5,
                    py: 3,
                    borderBottom: `1px solid ${accent}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 2,
                  }}
                >
                  <Box>
                    <Typography
                      component="h3"
                      sx={{
                        fontFamily: scriptFont,
                        fontSize: '1.85rem',
                        fontWeight: 600,
                        color: ink,
                        lineHeight: 1.1,
                      }}
                    >
                      {pkg.title}
                    </Typography>
                    <Typography sx={{ color: muted, fontSize: '0.95rem', mt: 0.5 }}>
                      {subtitle}
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      width: 52,
                      height: 52,
                      flexShrink: 0,
                      border: `1px solid ${ink}`,
                      bgcolor: '#FFFFFF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontFamily: scriptFont,
                      fontSize: '1.25rem',
                      fontWeight: 600,
                      color: ink,
                    }}
                  >
                    {pkg.size}
                  </Box>
                </Box>

                <Box sx={{ p: 3.5, display: 'flex', flexDirection: 'column', flex: 1 }}>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'baseline',
                      justifyContent: 'space-between',
                      pb: 2,
                      mb: 2,
                      borderBottom: '1px solid rgba(0,0,0,0.1)',
                    }}
                  >
                    <Typography sx={{ color: muted, fontSize: '1rem' }}>{pkg.duration}</Typography>
                    <Typography
                      sx={{
                        fontSize: '1.5rem',
                        fontWeight: 600,
                        color: ink,
                        fontVariantNumeric: 'tabular-nums',
                      }}
                    >
                      {pricesVisible ? pkg.price : t('price.onRequest')}
                    </Typography>
                  </Box>

                  <Box
                    component="ul"
                    sx={{
                      m: 0,
                      mb: 3,
                      pl: 2.25,
                      color: muted,
                      fontSize: '0.95rem',
                      lineHeight: 1.75,
                      flex: 1,
                    }}
                  >
                    {includes.map((step) => (
                      <li key={step}>{step}</li>
                    ))}
                  </Box>

                  <Button
                    variant="contained"
                    fullWidth
                    onClick={() => onSelectPackage(pkg.id)}
                    sx={{
                      bgcolor: ink,
                      color: '#FFFFFF',
                      borderRadius: 0,
                      py: 1.25,
                      letterSpacing: '0.04em',
                      '&:hover': { bgcolor: ink },
                    }}
                  >
                    {t('home.book')}
                  </Button>
                </Box>
              </Box>
            )
          })}
        </Box>

        <Box sx={{ textAlign: 'center', mt: 6 }}>
          <Button
            variant="outlined"
            size="large"
            onClick={onBookClick}
            sx={{
              borderColor: ink,
              color: ink,
              borderRadius: 0,
              px: 4,
              py: 1.25,
            }}
          >
            {t('home.book')}
          </Button>
        </Box>
      </Container>

      <Box
        component="section"
        sx={{
          bgcolor: surface,
          py: { xs: 6, md: 9 },
          borderTop: `1px solid ${accent}`,
        }}
      >
        <Container maxWidth="lg">
          <Typography
            component="h2"
            sx={{
              fontFamily: scriptFont,
              fontSize: { xs: '3rem', md: '4rem' },
              fontWeight: 400,
              color: muted,
              textAlign: 'center',
              mb: 4,
            }}
          >
            Models
          </Typography>

          <Box
            sx={{
              position: 'relative',
              maxWidth: 920,
              mx: 'auto',
              border: `1px solid ${accent}`,
              bgcolor: surface,
              overflow: 'hidden',
            }}
          >
            <Box
              sx={{
                position: 'relative',
                width: '100%',
                height: { xs: 360, sm: 480, md: 580 },
              }}
            >
              {modelSlides.map((src, idx) => (
                <Box
                  key={src}
                  component="img"
                  src={src}
                  alt={`Balayage model ${idx + 1}`}
                  sx={{
                    position: 'absolute',
                    inset: 0,
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain',
                    objectPosition: 'center',
                    p: { xs: 1, sm: 2 },
                    opacity: idx === modelIndex ? 1 : 0,
                    transition: 'opacity 500ms ease',
                  }}
                />
              ))}
            </Box>

            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                px: 2,
                py: 1.25,
                bgcolor: '#FFFFFF',
                borderTop: `1px solid ${accent}`,
                gap: 2,
              }}
            >
              <Button
                size="small"
                onClick={() =>
                  setModelIndex((prev) => (prev - 1 + modelSlides.length) % modelSlides.length)
                }
                sx={{ color: ink, minWidth: 0, px: 1.5, borderRadius: 0 }}
              >
                ‹
              </Button>

              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                {modelSlides.map((src, idx) => (
                  <Box
                    key={src}
                    component="button"
                    type="button"
                    aria-label={`Model ${idx + 1}`}
                    onClick={() => setModelIndex(idx)}
                    sx={{
                      width: 48,
                      height: 36,
                      p: 0,
                      border: idx === modelIndex ? `2px solid ${ink}` : `1px solid ${accent}`,
                      bgcolor: surface,
                      cursor: 'pointer',
                      overflow: 'hidden',
                      opacity: idx === modelIndex ? 1 : 0.65,
                      transition: 'opacity 150ms ease, border-color 150ms ease',
                    }}
                  >
                    <Box
                      component="img"
                      src={src}
                      alt=""
                      aria-hidden
                      sx={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        objectPosition: 'center top',
                        display: 'block',
                      }}
                    />
                  </Box>
                ))}
              </Box>

              <Button
                size="small"
                onClick={() => setModelIndex((prev) => (prev + 1) % modelSlides.length)}
                sx={{ color: ink, minWidth: 0, px: 1.5, borderRadius: 0 }}
              >
                ›
              </Button>
            </Box>
          </Box>
        </Container>
      </Box>
    </Box>
  )
}
