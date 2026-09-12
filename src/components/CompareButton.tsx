'use client'

import { useCompareStore, ProductItem } from '@/lib/store/useCompareStore'
import { Button } from '@/components/ui/button'
import { Scale, Check } from 'lucide-react'

export function CompareButton({ product }: { product: ProductItem }) {
  const { items, addItem, removeItem } = useCompareStore()
  const isCompared = items.some((i) => i.id === product.id)

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={() => (isCompared ? removeItem(product.id) : addItem(product))}
      className={`gap-1.5 text-xs ${isCompared ? 'border-blue-600 text-blue-600 bg-blue-50' : ''}`}
    >
      {isCompared ? <Check className="w-3.5 h-3.5" /> : <Scale className="w-3.5 h-3.5" />}
      {isCompared ? 'In Compare Tray' : 'Compare Specs[cite: 1]'}
    </Button>
  )
}