import type * as React from 'react'
import { Box, CircularProgress } from '@mui/material'

import { usePullToRefresh } from '../hooks/usePullToRefresh'
import { useLocale } from '../i18n'
import { brand } from '../theme'

export type PullToRefreshProps = {
  onRefresh: () => void | Promise<void>
  children: React.ReactNode
}

/**
 * Touch pull-to-refresh wrapper for installed / mobile PWA use.
 * Shows a small spinner above the content while pulling or refreshing.
 */
export const PullToRefresh: React.FunctionComponent<PullToRefreshProps> = ({
  onRefresh,
  children,
}) => {
  const { t } = useLocale()
  const { pullDistance, refreshing, handlers } = usePullToRefresh({ onRefresh })
  const visible = pullDistance > 4 || refreshing

  return (
    <Box
      {...handlers}
      sx={{
        position: 'relative',
        flexGrow: 1,
        display: 'flex',
        flexDirection: 'column',
        // While pulling, block native scroll so the gesture owns the page.
        touchAction: pullDistance > 0 || refreshing ? 'none' : 'pan-y',
      }}
    >
      <Box
        aria-live="polite"
        aria-busy={refreshing}
        aria-label={refreshing ? t('app.refreshing') : t('app.pullToRefresh')}
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 20,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'flex-end',
          height: visible ? pullDistance : 0,
          overflow: 'hidden',
          pointerEvents: 'none',
          transition: refreshing ? 'none' : 'height 120ms ease-out',
        }}
      >
        <Box
          sx={{
            mb: 1,
            width: 36,
            height: 36,
            borderRadius: '50%',
            bgcolor: brand.paper,
            border: `1px solid ${brand.espresso}22`,
            display: 'grid',
            placeItems: 'center',
            opacity: visible ? 1 : 0,
            transform: `scale(${Math.min(1, pullDistance / 56)})`,
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          }}
        >
          <CircularProgress size={18} thickness={5} />
        </Box>
      </Box>
      <Box
        sx={{
          flexGrow: 1,
          transform: pullDistance > 0 ? `translateY(${pullDistance}px)` : 'none',
          transition: refreshing ? 'none' : 'transform 120ms ease-out',
        }}
      >
        {children}
      </Box>
    </Box>
  )
}
