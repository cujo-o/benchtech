'use client'

import { useState, useEffect } from 'react'
import { useCompareStore } from '@/store/useCompareStore'
import { Heart } from 'lucide-react'

export function SaveButton({ product }: { product: any }) {
  const [mounted, setMounted] = useState(false)
  const { addItem, removeItem, isSaved } = useCompareStore()

  useEffect(() => {
    setMounted(true)
  }, [])

  const saved = mounted ? isSaved(product.id) : false

  function toggleSave(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    if (saved) {
      removeItem(product.id)
    } else {
      addItem({
        id: product.id,
        title: product.title,
        price: product.price,
        brand: product.brand,
        condition: product.condition,
        category: product.category,
        images: product.images,
        specs: product.specs,
      })
    }
  }

  return (
    <button
      type="button"
      onClick={toggleSave}
      aria-label={saved ? 'Remove from saved' : 'Save item'}
      className={`absolute top-2.5 right-2.5 w-8 h-8 rounded-full shadow-sm flex items-center justify-center transition z-10 ${
        saved ? 'bg-red-500 text-white' : 'bg-white/80 backdrop-blur-md text-slate-600 hover:text-red-500'
      }`}
      title={saved ? 'Remove from saved' : 'Save item'}
    >
      <Heart className={`w-4 h-4 ${saved ? 'fill-white' : ''}`} />
    </button>
  )
}