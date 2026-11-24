import { createTheme, type Theme } from '@mui/material/styles'

import type { BrandColorTokens, BrandThemeTokens } from './types'

export function createSalonTheme(tokens: BrandThemeTokens): {
  theme: Theme
  brandColors: BrandColorTokens
} {
  const brandColors: BrandColorTokens = {
    orange: tokens.colors.accent,
    orangeDeep: tokens.colors.accentDeep,
    espresso: tokens.colors.primary,
    espressoMuted: tokens.colors.primaryDeep,
    stone: tokens.colors.surface,
    paper: tokens.colors.paper,
  }

  const theme = createTheme({
    palette: {
      mode: 'light',
      primary: {
        main: brandColors.espresso,
        contrastText: brandColors.paper,
      },
      secondary: {
        main: brandColors.orange,
        dark: brandColors.orangeDeep,
        contrastText: brandColors.espresso,
      },
      text: {
        primary: brandColors.espresso,
        secondary: brandColors.espressoMuted,
      },
      divider: tokens.colors.divider,
      background: {
        default: brandColors.paper,
        paper: brandColors.paper,
      },
    },
    typography: {
      fontFamily: tokens.typography.fontFamily,
      h1: {
        fontFamily: tokens.typography.headingFontFamily,
        fontSize: '2.25rem',
        fontWeight: 700,
        letterSpacing: '-0.02em',
        lineHeight: 1.1,
      },
      h2: {
        fontFamily: tokens.typography.headingFontFamily,
        fontSize: '1.5rem',
        fontWeight: 600,
        letterSpacing: '-0.01em',
      },
      button: {
        textTransform: 'none',
        fontWeight: 600,
        letterSpacing: 0,
      },
    },
    shape: {
      borderRadius: 4,
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          'html, body': {
            overscrollBehavior: 'none',
            touchAction: 'pan-x pan-y',
            WebkitTextSizeAdjust: '100%',
          },
          body: {
            WebkitTapHighlightColor: 'transparent',
          },
        },
      },
      MuiPaper: {
        defaultProps: {
          elevation: 0,
        },
        styleOverrides: {
          root: {
            border: `1px solid ${tokens.colors.divider}`,
          },
        },
      },
      MuiButton: {
        defaultProps: {
          disableElevation: true,
        },
        styleOverrides: {
          root: {
            borderRadius: 2,
          },
          sizeLarge: {
            padding: '12px 28px',
            fontSize: '1rem',
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            borderRadius: 2,
            fontWeight: 600,
          },
        },
      },
      MuiLink: {
        styleOverrides: {
          root: {
            color: brandColors.orangeDeep,
            textUnderlineOffset: '3px',
          },
        },
      },
    },
  })

  return { theme, brandColors }
}
