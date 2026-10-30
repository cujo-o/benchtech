'use client'

import { useState } from 'react'
import { useCartStore } from '@/lib/store/useCartStore'
import { Button } from '@/components/ui/button'
import { ShoppingBag, Check } from 'lucide-react'

function extractFirstImage(images: any): string {
  if (!images) return ''
  if (Array.isArray(images)) return images[0] || ''
  if (typeof images === 'string') {
    try {
      const parsed = JSON.parse(images)
      if (Array.isArray(parsed)) return parsed[0] || ''
    } catch {
      return images.startsWith('http') ? images : ''
    }
  }
  return ''
}

interface AddToCartButtonProps {
  product: {
    id: string
    title: string
    price: number
    images?: any
    seller_id: string
    condition?: string
    brand?: string
    specs?: Record<string, any>
    profiles?: any
  }
  variant?: 'full' | 'icon'
}

export function AddToCartButton({
  product,
  variant = 'full',
}: AddToCartButtonProps) {
  const { addItem, items } = useCartStore()
  const [added, setAdded] = useState(false)

  const cartEntry = items.find((i) => i.id === product.id)
  const isAlreadyInCart = Boolean(cartEntry)

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    const sellerProfile = Array.isArray(product.profiles)
      ? product.profiles[0]
      : product.profiles

    addItem({
      id: product.id,
      title: product.title,
      price: Number(product.price || 0),
      image: extractFirstImage(product.images),
      seller_id: product.seller_id,
      seller_name:
        sellerProfile?.business_name || sellerProfile?.full_name || undefined,
      condition: product.condition,
      brand: product.brand,
      specs: product.specs || {},
    })

    fetch('/api/ads/event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        productId: product.id,
        eventType: 'add_to_cart',
      }),
      keepalive: true,
    }).catch(() => {})

    setAdded(true)
    setTimeout(() => setAdded(false), 1200)
  }

  if (variant === 'icon') {
    return (
      <button
        type="button"
        onClick={handleAdd}
        title={
          isAlreadyInCart
            ? `In Cart (${cartEntry?.quantity}) — Click to add another`
            : 'Add to Cart'
        }
        className={`relative w-8 h-8 rounded-xl flex items-center justify-center transition shadow-2xs cursor-pointer ${
          added || isAlreadyInCart
            ? 'bg-emerald-600 text-white'
            : 'bg-white/90 dark:bg-slate-800/90 text-slate-700 dark:text-slate-200 hover:bg-blue-600 hover:text-white border border-slate-200/80 dark:border-slate-700'
        }`}
      >
        {added || isAlreadyInCart ? (
          <Check className="w-3.5 h-3.5" />
        ) : (
          <ShoppingBag className="w-3.5 h-3.5" />
        )}
        {cartEntry && cartEntry.quantity > 1 && (
          <span className="absolute -top-1.5 -right-1.5 bg-blue-600 text-white text-[8px] font-black w-4 h-4 rounded-full flex items-center justify-center border border-white dark:border-slate-900">
            {cartEntry.quantity}
          </span>
        )}
      </button>
    )
  }

  return (
    <Button
      type="button"
      onClick={handleAdd}
      size="sm"
      className={`h-9 px-3.5 rounded-xl text-xs font-bold gap-1.5 transition shadow-2xs cursor-pointer ${
        added || isAlreadyInCart
          ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
          : 'bg-blue-600 hover:bg-blue-700 text-white'
      }`}
    >
      {added ? (
        <>
          <Check className="w-3.5 h-3.5" />
          <span>Added ({cartEntry?.quantity || 1})</span>
        </>
      ) : isAlreadyInCart ? (
        <>
          <Check className="w-3.5 h-3.5" />
          <span>In Cart ({cartEntry?.quantity}) • Add +1</span>
        </>
      ) : (
        <>
          <ShoppingBag className="w-3.5 h-3.5" />
          <span>Add to Cart</span>
        </>
      )}
    </Button>
  )
}