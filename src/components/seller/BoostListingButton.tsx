'use client'

import { useState } from 'react'
import { boostListingWithCredits } from '@/app/actions/promotions'
import { Button } from '@/components/ui/button'
import { Sparkles, Loader2, Check } from 'lucide-react'

export function BoostListingButton({
  productId,
  isFeatured,
}: {
  productId: string
  isFeatured: boolean
}) {
  const [loading, setLoading] = useState(false)
  const [featured, setFeatured] = useState(isFeatured)

  if (featured) {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200">
        <Sparkles className="w-3 h-3 text-blue-600" /> Promoted
      </span>
    )
  }

  const handleBoost = async () => {
    setLoading(true)
    const res = await boostListingWithCredits(productId)
    setLoading(false)

    if (res?.success) {
      setFeatured(true)
    } else if (res?.error) {
      alert(res.error)
    }
  }

  return (
    <Button
      size="sm"
      variant="outline"
      onClick={handleBoost}
      disabled={loading}
      className="h-8 text-xs font-bold border-blue-200 text-blue-700 hover:bg-blue-50 gap-1 rounded-lg"
    >
      {loading ? (
        <Loader2 className="w-3 h-3 animate-spin" />
      ) : (
        <Sparkles className="w-3 h-3 text-amber-500 fill-amber-500" />
      )}
      Boost (₦1,000)
    </Button>
  )
}