import { useEffect } from 'react'

import { logClientActivity } from '../data/activityLogApi'

let lastLoggedPath: string | null = null
let lastLoggedAt = 0

/**
 * Records a `page_view` event on initial page open and on every route change.
 * Module-level dedup avoids duplicate writes from React StrictMode double-mounts
 * while still recording subsequent visits to the same path after navigating away.
 */
export function usePageViewLogger(pathname: string): void {
  useEffect(() => {
    const now = Date.now()
    if (lastLoggedPath === pathname && now - lastLoggedAt < 1500) {
      return
    }
    lastLoggedPath = pathname
    lastLoggedAt = now
    void logClientActivity({
      action: 'page_view',
      path: pathname,
    })
  }, [pathname])
}
