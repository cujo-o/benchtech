'use client'

import { useCartStore } from '@/lib/store/useCartStore'
import { Button } from '@/components/ui/button'
import { ShoppingBag, Check } from 'lucide-react'
import { useState } from 'react'

interface AddToCartButtonProps {
  product: {
    id: string
    title: string
    price: number
    images?: string[]
    seller_id: string
    condition?: string
  }
  variant?: 'full' | 'icon'
}

export function AddToCartButton({ product, variant = 'full' }: AddToCartButtonProps) {
  const { addItem, items } = useCartStore()
  const [added, setAdded] = useState(false)

  const isAlreadyInCart = items.some((i) => i.id === product.id)

  const handleAdd = (e: React.MouseEvent) => {
    // Prevent clicking from opening the /products/[id] page
    e.preventDefault()
    e.stopPropagation()

    addItem({
      id: product.id,
      title: product.title,
      price: product.price,
      image: product.images?.[0] || '',
      seller_id: product.seller_id,
      condition: product.condition,
    })
    setAdded(true)
    setTimeout(() => setAdded(false), 1500)
  }

  if (variant === 'icon') {
    return (
      <button
        onClick={handleAdd}
        title={isAlreadyInCart ? 'In Cart' : 'Add to Cart'}
        className={`w-8 h-8 rounded-xl flex items-center justify-center transition shadow-sm ${
          added || isAlreadyInCart
            ? 'bg-emerald-600 text-white'
            : 'bg-white/90 backdrop-blur-md text-slate-700 hover:bg-blue-600 hover:text-white border border-slate-200/80'
        }`}
      >
        {added || isAlreadyInCart ? (
          <Check className="w-3.5 h-3.5" />
        ) : (
          <ShoppingBag className="w-3.5 h-3.5" />
        )}
      </button>
    )
  }

  return (
    <Button
      onClick={handleAdd}
      size="sm"
      className={`h-9 px-3 rounded-xl text-xs font-bold gap-1.5 transition shadow-sm ${
        added || isAlreadyInCart
          ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
          : 'bg-blue-600 hover:bg-blue-700 text-white'
      }`}
    >
      {added || isAlreadyInCart ? (
        <>
          <Check className="w-3.5 h-3.5" /> In Cart
        </>
      ) : (
        <>
          <ShoppingBag className="w-3.5 h-3.5" /> Add
        </>
      )}
    </Button>
  )
}