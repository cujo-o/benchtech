'use client'

import { useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'

export function ProductViewTracker({ productId }: { productId: string }) {
  useEffect(() => {
    if (!productId) return

    // 1. Record in local history for Recently Viewed page
    try {
      const rawHistory = localStorage.getItem('benchtech_recently_viewed')
      let history: string[] = rawHistory ? JSON.parse(rawHistory) : []
      history = [productId, ...history.filter((id) => id !== productId)].slice(0, 30)
      localStorage.setItem('benchtech_recently_viewed', JSON.stringify(history))
      window.dispatchEvent(new Event('recentlyViewedUpdated'))
    } catch {
      // Ignore localStorage restrictions
    }

    // 2. Increment global views counter in database (session debounced)
    const sessionKey = `viewed_product_${productId}`
    if (sessionStorage.getItem(sessionKey)) return
    sessionStorage.setItem(sessionKey, 'true')

    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    supabase.rpc('increment_product_views', { p_id: productId }).then(({ error }) => {
      if (error) {
        console.error('Failed to log product view:', error.message)
      }
    })
  }, [productId])

  return null
}