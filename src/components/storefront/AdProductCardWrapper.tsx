'use client'

import { ReactNode } from 'react'

interface AdProductCardWrapperProps {
  children: ReactNode
  campaignId?: string
  productId: string
  sellerId: string
  isSponsored?: boolean
}

export function AdProductCardWrapper({
  children,
  campaignId,
  productId,
  sellerId,
  isSponsored,
}: AdProductCardWrapperProps) {
  function handleAdClick() {
    if (!isSponsored || !campaignId) return

    // Non-blocking beacon telemetry
    fetch('/api/ads/click', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ campaignId, productId, sellerId }),
      keepalive: true,
    }).catch(() => {})
  }

  return (
    <div onClick={handleAdClick} className="contents">
      {children}
    </div>
  )
}