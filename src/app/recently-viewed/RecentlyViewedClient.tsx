'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createBrowserClient } from '@supabase/ssr'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { SaveButton } from '@/components/SaveButton'
import { AddToCartButton } from '@/components/cart/AddToCartButton'
import {
  Clock,
  Trash2,
  Package,
  MapPin,
  ArrowLeft,
  Loader2,
  Sparkles,
} from 'lucide-react'

export function RecentlyViewedClient() {
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const loadHistory = async () => {
    try {
      const raw = localStorage.getItem('benchtech_recently_viewed')
      if (!raw) {
        setProducts([])
        setLoading(false)
        return
      }

      const ids: string[] = JSON.parse(raw)
      if (!Array.isArray(ids) || ids.length === 0) {
        setProducts([])
        setLoading(false)
        return
      }

      const { data, error } = await supabase
        .from('products')
        .select('*, profiles!products_seller_id_fkey(business_name, district, tech_trust_status)')
        .in('id', ids)

      if (!error && data) {
        // Preserve chronological viewing order
        const sorted = ids
          .map((id) => data.find((p) => p.id === id))
          .filter(Boolean)
        setProducts(sorted)
      }
    } catch {
      setProducts([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadHistory()
    window.addEventListener('recentlyViewedUpdated', loadHistory)
    return () => window.removeEventListener('recentlyViewedUpdated', loadHistory)
  }, [])

  const handleClear = () => {
    localStorage.removeItem('benchtech_recently_viewed')
    setProducts([])
  }

  const handleRemoveItem = (id: string) => {
    try {
      const raw = localStorage.getItem('benchtech_recently_viewed')
      if (raw) {
        const ids: string[] = JSON.parse(raw)
        const updated = ids.filter((itemId) => itemId !== id)
        localStorage.setItem('benchtech_recently_viewed', JSON.stringify(updated))
        setProducts((prev) => prev.filter((p) => p.id !== id))
      }
    } catch {}
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-2xs">
        <div className="space-y-1">
          <Link
            href="/feed"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 mb-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Feed
          </Link>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
              Recently Viewed
            </h1>
            <Badge className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-none text-[10px] font-bold">
              {products.length} {products.length === 1 ? 'item' : 'items'}
            </Badge>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Hardware and electronics you recently inspected across Abuja.
          </p>
        </div>

        {products.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="text-xs font-bold text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 gap-1.5 rounded-xl h-9"
          >
            <Trash2 className="w-3.5 h-3.5" /> Clear History
          </Button>
        )}
      </div>

      {loading ? (
        <div className="min-h-[300px] flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      ) : products.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl p-12 text-center space-y-4 shadow-2xs">
          <div className="w-14 h-14 bg-blue-50 dark:bg-blue-950 text-blue-600 rounded-2xl flex items-center justify-center mx-auto">
            <Clock className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-black text-slate-900 dark:text-slate-100">
              No recently viewed devices
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
              As you browse phones, laptops, and accessories, your inspected devices will appear here automatically.
            </p>
          </div>
          <Link href="/products">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl h-10 px-5">
              Explore Products
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
          {products.map((item) => (
            <div key={item.id} className="relative group">
              <SaveButton product={item} />
              <Link href={`/products/${item.id}`}>
                <Card className="h-full rounded-2xl overflow-hidden hover:shadow-md transition bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 flex flex-col justify-between shadow-2xs">
                  <div className="aspect-square bg-slate-50 dark:bg-slate-800/40 relative overflow-hidden p-2 flex items-center justify-center">
                    <div className="absolute top-2 left-2 flex flex-col gap-1 z-10">
                      <Badge className="bg-slate-900/80 backdrop-blur-xs text-white border-none text-[8px] capitalize px-1.5 py-0">
                        {item.condition?.replace('_', ' ') || 'Good'}
                      </Badge>
                    </div>

                    {item.images?.[0] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.images[0]}
                        alt={item.title}
                        className="max-h-full object-contain group-hover:scale-105 transition duration-300"
                      />
                    ) : (
                      <Package className="w-8 h-8 text-slate-300 dark:text-slate-600" />
                    )}
                  </div>

                  <CardContent className="p-3 sm:p-3.5 flex-1 flex flex-col justify-between space-y-2">
                    <div>
                      <h3 className="font-bold text-[11px] sm:text-xs text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition line-clamp-1">
                        {item.title}
                      </h3>
                      <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1">
                        <span className="uppercase tracking-wider font-semibold truncate max-w-[80px]">
                          {item.brand || 'Device'}
                        </span>
                        {item.profiles?.district && (
                          <span className="flex items-center gap-0.5 text-[10px] shrink-0">
                            <MapPin className="w-2.5 h-2.5 text-slate-400" />
                            {item.profiles.district.split(' ')[0]}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                      <p className="text-xs sm:text-sm font-black text-slate-900 dark:text-slate-100">
                        ₦{Number(item.price).toLocaleString()}
                      </p>
                      <AddToCartButton product={item} variant="icon" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}