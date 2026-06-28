'use client'

import { useEffect } from 'react'

import { trackPixel } from '@/lib/analytics/meta-pixel'

/**
 * Dispara um evento do pixel uma vez, ao montar. Para usar dentro de
 * server components (ex.: ViewContent na página de checkout).
 */
export function PixelEvent({
  event,
  params,
}: {
  event: string
  params?: Record<string, unknown>
}) {
  useEffect(() => {
    trackPixel(event, params)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return null
}
