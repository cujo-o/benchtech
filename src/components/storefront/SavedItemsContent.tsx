'use client'

import Link from 'next/link'
import { useCompareStore } from '@/store/useCompareStore'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Heart, Trash2 } from 'lucide-react'

export function SavedItemsContent() {
  const { items, removeItem } = useCompareStore()

  if (!items || items.length === 0) {
    return (
      <div className="p-12 text-center bg-white rounded-2xl border border-slate-200/80 max-w-xl mx-auto">
        <Heart className="w-10 h-10 text-slate-300 mx-auto mb-3" />
        <h3 className="font-bold text-slate-800 text-sm">No Saved Items Yet</h3>
        <p className="text-xs text-slate-500 mt-1">
          Click the heart icon on product cards while browsing to keep track of items here.
        </p>
        <Link href="/products" className="inline-block mt-4">
          <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-xs font-bold">
            Browse Catalog
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {items.map((item) => (
        <Card key={item.id} className="border border-slate-200/80 shadow-sm bg-white rounded-2xl overflow-hidden flex flex-col">
          <div className="aspect-[4/3] bg-slate-50 relative p-3 flex items-center justify-center">
            {item.images?.[0] ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={item.images[0]} alt={item.title} className="max-h-full object-contain" />
            ) : (
              <span className="text-xs text-slate-400">No Image</span>
            )}
            <button
              type="button"
              onClick={() => removeItem(item.id)}
              className="absolute top-2.5 right-2.5 w-8 h-8 rounded-full bg-white/80 backdrop-blur-md shadow-sm flex items-center justify-center text-red-500 hover:bg-red-50 transition"
              title="Remove from saved"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          <CardContent className="p-4 flex-1 flex flex-col justify-between space-y-3">
            <div>
              <h3 className="font-bold text-xs text-slate-900 line-clamp-1">{item.title}</h3>
              <p className="text-[11px] text-slate-400 capitalize mt-0.5">
                {item.brand} • {item.condition?.replace('_', ' ')}
              </p>
              <p className="text-sm font-black text-slate-900 mt-2">
                ₦{Number(item.price).toLocaleString()}
              </p>
            </div>

            <div className="pt-2 border-t border-slate-100 flex gap-2">
              <Link href={`/products/${item.id}`} className="flex-1">
                <Button size="sm" className="w-full bg-blue-600 hover:bg-blue-700 text-xs font-bold h-8">
                  View Details
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}