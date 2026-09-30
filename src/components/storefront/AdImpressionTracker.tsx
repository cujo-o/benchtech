'use client'

import { useEffect, useRef } from 'react'

interface AdImpressionTrackerProps {
  productId: string
  campaignId?: string
  sellerId?: string
  isSponsored?: boolean
}

export function AdImpressionTracker({
  productId,
  campaignId,
  sellerId,
  isSponsored,
}: AdImpressionTrackerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const hasLogged = useRef(false)

  useEffect(() => {
    if (!isSponsored || !campaignId || !sellerId || hasLogged.current) return

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries
        if (entry.isIntersecting && !hasLogged.current) {
          hasLogged.current = true

          // Non-blocking impression dispatch
          fetch('/api/ads/event', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              productId,
              campaignId,
              sellerId,
              eventType: 'impression',
            }),
            keepalive: true,
          }).catch(() => {})

          observer.disconnect()
        }
      },
      { threshold: 0.5 } // Trigger when at least 50% of the card is visible
    )

    if (containerRef.current) {
      observer.observe(containerRef.current)
    }

    return () => observer.disconnect()
  }, [productId, campaignId, sellerId, isSponsored])

  return <div ref={containerRef} className="contents" />
}