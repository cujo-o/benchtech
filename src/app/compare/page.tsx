'use client'

import { useEffect, useState, useTransition } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createBrowserClient } from '@supabase/ssr'
import { useCompareStore } from '@/lib/store/useCompareStore'
import { Button } from '@/components/ui/button'
import {
  Scale,
  X,
  Plus,
  ArrowLeft,
  Sparkles,
  Bot,
  Search,
  Check,
  Minus,
  Loader2,
  Store,
} from 'lucide-react'

export default function ComparePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { items: storeItems, removeItem, addItem, clearCompare } = useCompareStore()

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const [loading, setLoading] = useState(true)
  const [products, setProducts] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)

  // 1. Determine IDs from either URL or Zustand store
  const urlIds = searchParams.get('ids')?.split(',').filter(Boolean) || []
  const targetIds = urlIds.length > 0 ? urlIds : storeItems.map((i) => i.id)

  // 2. Fetch full specifications for all compared gadgets
  useEffect(() => {
    async function loadComparedProducts() {
      if (targetIds.length === 0) {
        setProducts([])
        setLoading(false)
        return
      }

      setLoading(true)
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .in('id', targetIds)

      if (!error && data) {
        setProducts(data)
      }
      setLoading(false)
    }

    loadComparedProducts()
  }, [searchParams.get('ids'), storeItems.length])

  // 3. Search and Add products into the matrix
  const handleSearch = async (query: string) => {
    setSearchQuery(query)
    if (!query.trim()) {
      setSearchResults([])
      return
    }

    setIsSearching(true)
    const { data } = await supabase
      .from('products')
      .select('id, title, brand, price, images, condition, specs')
      .ilike('title', `%${query}%`)
      .limit(5)

    setSearchResults(data || [])
    setIsSearching(false)
  }

  const handleAddProduct = (item: any) => {
    if (products.length >= 4) {
      alert('You can compare a maximum of 4 gadgets at a time.')
      return
    }

    addItem({
      id: item.id,
      title: item.title,
      price: item.price,
      images: item.images || [],
      category: item.category || 'tech',
      brand: item.brand || '',
      model: item.model || '',
      condition: item.condition || '',
      specs: item.specs || {},
    })

    const newIds = [...products.map((p) => p.id), item.id]
    router.replace(`/compare?ids=${newIds.join(',')}`)
    setSearchQuery('')
    setSearchResults([])
  }

  const handleRemoveProduct = (id: string) => {
    removeItem(id)
    const filtered = products.filter((p) => p.id !== id)
    setProducts(filtered)
    if (filtered.length > 0) {
      router.replace(`/compare?ids=${filtered.map((p) => p.id).join(',')}`)
    } else {
      router.replace('/compare')
    }
  }

  // Extract all unique technical spec keys across the compared items
  const allSpecKeys = Array.from(
    new Set(
      products.flatMap((p) =>
        p.specs && typeof p.specs === 'object' ? Object.keys(p.specs) : []
      )
    )
  )

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <Link
            href="/feed"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 mb-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Feed
          </Link>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Compare Tech</h1>
          <p className="text-xs text-slate-500">
            See the differences. Choose with confidence.
          </p>
        </div>

        {products.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              clearCompare()
              setProducts([])
              router.replace('/compare')
            }}
            className="text-xs font-bold text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            Clear All
          </Button>
        )}
      </div>

      {/* Search & Add Bar (From Mockup) */}
      <div className="relative max-w-xl">
        <div className="relative flex items-center">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search and add products to compare..."
            className="w-full text-xs h-11 pl-10 pr-20 rounded-2xl border border-slate-200 bg-white focus:outline-none focus:border-blue-600 shadow-sm"
          />
          {isSearching && (
            <Loader2 className="w-4 h-4 animate-spin text-slate-400 absolute right-16" />
          )}
        </div>

        {/* Search Results Dropdown */}
        {searchResults.length > 0 && (
          <div className="absolute top-12 left-0 right-0 bg-white rounded-2xl border border-slate-200 shadow-xl z-30 divide-y divide-slate-100 overflow-hidden">
            {searchResults.map((result) => {
              const alreadyIn = products.some((p) => p.id === result.id)
              return (
                <div
                  key={result.id}
                  className="p-3 flex items-center justify-between hover:bg-slate-50 transition"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-slate-100 overflow-hidden shrink-0">
                      {result.images?.[0] && (
                        <img
                          src={result.images[0]}
                          alt={result.title}
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 line-clamp-1">
                        {result.title}
                      </div>
                      <div className="text-[11px] font-black text-blue-600">
                        ₦{Number(result.price).toLocaleString()}
                      </div>
                    </div>
                  </div>

                  <Button
                    size="sm"
                    disabled={alreadyIn}
                    onClick={() => handleAddProduct(result)}
                    className="h-8 text-xs font-bold rounded-xl"
                  >
                    {alreadyIn ? 'Added' : 'Add to Compare'}
                  </Button>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {loading ? (
        <div className="min-h-[300px] flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      ) : products.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center space-y-4">
          <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto">
            <Scale className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-slate-900">No gadgets in comparison</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Search above or browse the feed and tap &quot;Compare Specs&quot; to inspect gadgets side by side.
            </p>
          </div>
          <Link href="/feed">
            <Button className="bg-blue-600 hover:bg-blue-700 text-xs font-bold rounded-xl">
              Browse Marketplace
            </Button>
          </Link>
        </div>
      ) : (
        /* Comparison Table */
        <div className="bg-white border border-slate-200/80 rounded-3xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="p-5 bg-slate-50/50 w-44 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Product
                  </th>
                  {products.map((item) => (
                    <th key={item.id} className="p-5 align-top w-64 min-w-[220px]">
                      <div className="space-y-3 relative">
                        <button
                          onClick={() => handleRemoveProduct(item.id)}
                          className="absolute -top-2 -right-2 w-6 h-6 bg-slate-100 hover:bg-red-50 hover:text-red-600 rounded-full flex items-center justify-center text-slate-400 transition"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>

                        <div className="w-full aspect-square bg-slate-50 rounded-2xl overflow-hidden border border-slate-100 relative">
                          {item.images?.[0] ? (
                            <img
                              src={item.images[0]}
                              alt={item.title}
                              className="w-full h-full object-contain p-2"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-xs text-slate-400">
                              No image
                            </div>
                          )}
                        </div>

                        <div>
                          <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider block">
                            {item.brand || 'Device'}
                          </span>
                          <h3 className="font-bold text-xs sm:text-sm text-slate-900 leading-snug line-clamp-2">
                            {item.title}
                          </h3>
                          <div className="text-base font-black text-slate-900 mt-1">
                            ₦{Number(item.price).toLocaleString()}
                          </div>
                        </div>

                        <Link href={`/products/${item.id}`} className="block">
                          <Button className="w-full text-xs h-9 rounded-xl bg-blue-600 hover:bg-blue-700 font-bold">
                            View Details
                          </Button>
                        </Link>
                      </div>
                    </th>
                  ))}

                  {/* Empty Slot Placeholder if < 4 */}
                  {products.length < 4 && (
                    <th className="p-5 align-middle w-64 min-w-[200px] border-l border-dashed border-slate-200">
                      <div className="text-center space-y-2 py-8">
                        <div className="w-10 h-10 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center mx-auto text-slate-400">
                          <Plus className="w-5 h-5" />
                        </div>
                        <p className="text-xs font-bold text-slate-600">Add Another</p>
                        <p className="text-[10px] text-slate-400">Search above to fill slot</p>
                      </div>
                    </th>
                  )}
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 text-xs">
                {/* Condition */}
                <tr>
                  <td className="p-4 bg-slate-50/50 font-bold text-slate-500 uppercase text-[10px] tracking-wider">
                    Condition
                  </td>
                  {products.map((item) => (
                    <td key={item.id} className="p-4 font-bold text-slate-800 capitalize">
                      {item.condition?.replace('_', ' ')}
                    </td>
                  ))}
                  {products.length < 4 && <td />}
                </tr>

                {/* Location */}
                <tr>
                  <td className="p-4 bg-slate-50/50 font-bold text-slate-500 uppercase text-[10px] tracking-wider">
                    Location
                  </td>
                  {products.map((item) => (
                    <td key={item.id} className="p-4 text-slate-600">
                      {item.location || 'Abuja'}
                    </td>
                  ))}
                  {products.length < 4 && <td />}
                </tr>

                {/* Dynamic Spec Rows (Storage, RAM, Battery, Processor, etc.) */}
                {allSpecKeys.map((key) => (
                  <tr key={key}>
                    <td className="p-4 bg-slate-50/50 font-bold text-slate-500 uppercase text-[10px] tracking-wider">
                      {key.replace(/_/g, ' ')}
                    </td>
                    {products.map((item) => (
                      <td key={item.id} className="p-4 text-slate-800 font-medium">
                        {item.specs?.[key] ? (
                          String(item.specs[key])
                        ) : (
                          <Minus className="w-3.5 h-3.5 text-slate-300" />
                        )}
                      </td>
                    ))}
                    {products.length < 4 && <td />}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* AI Recommendation Banner (From Mockup) */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-sm">
        <div className="flex items-center gap-4 text-center sm:text-left">
          <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-blue-500/20">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-base font-black text-slate-900">Not sure which one is better?</h4>
            <p className="text-xs text-slate-500 mt-0.5">
              Ask BenchTech AI to analyze specs, value for money, and battery life for your workflow.
            </p>
          </div>
        </div>

        <Link href="/assistant" className="shrink-0 w-full sm:w-auto">
          <Button className="w-full sm:w-auto h-11 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs gap-2 shadow-sm">
            <Sparkles className="w-3.5 h-3.5" /> Get AI Recommendation
          </Button>
        </Link>
      </div>
    </div>
  )
}