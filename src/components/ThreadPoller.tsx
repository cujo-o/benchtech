'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export function ThreadPoller({ intervalMs = 6000 }: { intervalMs?: number }) {
  const router = useRouter()

  useEffect(() => {
    const interval = setInterval(() => {
      // Only poll when the document tab is focused and active
      if (document.visibilityState === 'visible') {
        router.refresh()
      }
    }, intervalMs)

    return () => clearInterval(interval)
  }, [router, intervalMs])

  return null
}