import type * as React from 'react'
import { useRef, useState } from 'react'

export type UsePullToRefreshOptions = {
  /** Called when the pull crosses the threshold and the finger lifts. */
  onRefresh: () => void | Promise<void>
  /** Pixels of resisted pull needed to trigger refresh. */
  thresholdPx?: number
  /** Max visual pull distance. */
  maxPullPx?: number
  enabled?: boolean
}

export type UsePullToRefreshHandlers = {
  onTouchStart: (event: React.TouchEvent<HTMLElement>) => void
  onTouchMove: (event: React.TouchEvent<HTMLElement>) => void
  onTouchEnd: () => void
  onTouchCancel: () => void
}

export type UsePullToRefreshResult = {
  pullDistance: number
  refreshing: boolean
  handlers: UsePullToRefreshHandlers
}

function isNestedScrollablePulled(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false
  let node: Element | null = target
  while (node && node !== document.body) {
    if (node instanceof HTMLElement) {
      const style = window.getComputedStyle(node)
      const canScrollY =
        (style.overflowY === 'auto' || style.overflowY === 'scroll') &&
        node.scrollHeight > node.clientHeight + 1
      if (canScrollY && node.scrollTop > 0) return true
    }
    node = node.parentElement
  }
  return false
}

function prefersTouchUi(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(pointer: coarse)').matches || navigator.maxTouchPoints > 0
}

/** Exported for unit tests. */
export function resistedPull(deltaPx: number, maxPullPx: number): number {
  if (deltaPx <= 0) return 0
  return Math.min(maxPullPx, deltaPx * 0.55)
}

/**
 * Custom pull-to-refresh for PWAs where `overscroll-behavior: none` disables
 * the browser gesture. Only active at the top of the page on touch devices.
 *
 * Gesture logic lives in touch callbacks (no subscription effects).
 */
export function usePullToRefresh(options: UsePullToRefreshOptions): UsePullToRefreshResult {
  const { onRefresh, thresholdPx = 64, maxPullPx = 112, enabled = true } = options
  const [pullDistance, setPullDistance] = useState(0)
  const [refreshing, setRefreshing] = useState(false)
  const startY = useRef<number | null>(null)
  const pullDistanceRef = useRef(0)
  const refreshingRef = useRef(false)
  const active = enabled && prefersTouchUi()

  const setPull = (value: number): void => {
    pullDistanceRef.current = value
    setPullDistance(value)
  }

  const reset = (): void => {
    startY.current = null
    setPull(0)
  }

  const onTouchStart = (event: React.TouchEvent<HTMLElement>): void => {
    if (!active || refreshingRef.current) return
    if (window.scrollY > 1) return
    if (isNestedScrollablePulled(event.target)) return
    startY.current = event.touches[0]?.clientY ?? null
  }

  const onTouchMove = (event: React.TouchEvent<HTMLElement>): void => {
    if (!active || refreshingRef.current || startY.current === null) return
    if (window.scrollY > 1) {
      reset()
      return
    }
    const currentY = event.touches[0]?.clientY ?? startY.current
    const delta = currentY - startY.current
    if (delta <= 0) {
      setPull(0)
      return
    }
    const resisted = resistedPull(delta, maxPullPx)
    if (resisted >= 8) {
      event.preventDefault()
    }
    setPull(resisted)
  }

  const onTouchEnd = (): void => {
    if (!active) return
    if (refreshingRef.current) {
      reset()
      return
    }
    if (pullDistanceRef.current < thresholdPx) {
      reset()
      return
    }
    refreshingRef.current = true
    setRefreshing(true)
    setPull(Math.min(52, maxPullPx * 0.45))
    void Promise.resolve(onRefresh())
      .catch(() => undefined)
      .finally(() => {
        refreshingRef.current = false
        setRefreshing(false)
        reset()
      })
  }

  const onTouchCancel = (): void => {
    if (!active) return
    reset()
  }

  return {
    pullDistance: refreshing ? Math.max(pullDistance, 48) : pullDistance,
    refreshing,
    handlers: {
      onTouchStart,
      onTouchMove,
      onTouchEnd,
      onTouchCancel,
    },
  }
}
