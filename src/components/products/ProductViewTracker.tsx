'use client'

import { useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'

export function ProductViewTracker({ productId }: { productId: string }) {
  useEffect(() => {
    if (!productId) return

    // Debounce views per session to prevent refresh spamming
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