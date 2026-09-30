'use client'

import { useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'

export function ProductViewTracker({ productId }: { productId: string }) {
  useEffect(() => {
    if (!productId) return

    // 1. Send Attribution & Ad Telemetry Beacon
    fetch('/api/ads/event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId, eventType: 'view' }),
      keepalive: true,
    }).catch(() => {})

    // 2. Record in Local Storage for Recently Viewed page
    try {
      const rawHistory = localStorage.getItem('benchtech_recently_viewed')
      let history: string[] = rawHistory ? JSON.parse(rawHistory) : []
      history = [productId, ...history.filter((id) => id !== productId)].slice(0, 30)
      localStorage.setItem('benchtech_recently_viewed', JSON.stringify(history))
      window.dispatchEvent(new Event('recentlyViewedUpdated'))
    } catch {
      // Ignore storage restrictions / private browsing mode
    }

    // 3. Increment Global Views Counter in Database (Session-debounced)
    try {
      const sessionKey = `viewed_product_${productId}`
      if (sessionStorage.getItem(sessionKey)) return
      sessionStorage.setItem(sessionKey, 'true')

      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )

      supabase
        .rpc('increment_product_views', { p_id: productId })
        .then(({ error }) => {
          if (error) {
            console.error('Failed to log product view:', error.message)
          }
        })
    } catch {
      // Ignore sessionStorage restrictions
    }
  }, [productId])

  return null
}