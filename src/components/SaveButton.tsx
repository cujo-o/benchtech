'use client'

import { useState, useEffect } from 'react'
import { Bookmark } from 'lucide-react'

interface SaveButtonProps {
  product: {
    id: string
    title: string
    price: number | string
    images?: string[]
    brand?: string
    condition?: string
    [key: string]: any
  }
  className?: string
}

export function SaveButton({ product, className = '' }: SaveButtonProps) {
  const [isSaved, setIsSaved] = useState(false)

  useEffect(() => {
    try {
      const raw =
        localStorage.getItem('benchtech_saved') ||
        localStorage.getItem('techmart_saved_items')
      if (raw) {
        const items = JSON.parse(raw)
        if (Array.isArray(items)) {
          setIsSaved(items.some((item: any) => (typeof item === 'string' ? item === product.id : item.id === product.id)))
        }
      }
    } catch {
      // Ignore localStorage errors
    }
  }, [product.id])

  const toggleSave = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    try {
      const raw =
        localStorage.getItem('benchtech_saved') ||
        localStorage.getItem('techmart_saved_items')
      let items: any[] = raw ? JSON.parse(raw) : []
      if (!Array.isArray(items)) items = []

      const exists = items.some((item: any) =>
        typeof item === 'string' ? item === product.id : item.id === product.id
      )

      if (exists) {
        items = items.filter((item: any) =>
          typeof item === 'string' ? item !== product.id : item.id !== product.id
        )
        setIsSaved(false)
      } else {
        items.push(product)
        setIsSaved(true)
      }

      localStorage.setItem('benchtech_saved', JSON.stringify(items))
      window.dispatchEvent(new Event('savedItemsUpdated'))
    } catch {
      // Ignore storage errors
    }
  }

  return (
    <button
      type="button"
      onClick={toggleSave}
      aria-label={isSaved ? 'Remove from saved' : 'Save gadget'}
      title={isSaved ? 'Saved' : 'Save'}
      className={`absolute top-2.5 right-2.5 z-20 w-8 h-8 rounded-full flex items-center justify-center transition-all backdrop-blur-md shadow-xs ${
        isSaved
          ? 'bg-blue-600 text-white shadow-blue-500/20'
          : 'bg-white/90 dark:bg-slate-900/90 text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 hover:scale-105'
      } ${className}`}
    >
      <Bookmark
        className={`w-4 h-4 transition-transform active:scale-75 ${
          isSaved ? 'fill-white stroke-white' : ''
        }`}
      />
    </button>
  )
}