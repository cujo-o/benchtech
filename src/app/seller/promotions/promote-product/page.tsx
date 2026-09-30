'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { createPromoteProductCampaign } from '@/app/actions/ads'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  ArrowLeft,
  Sparkles,
  CheckCircle2,
  Package,
  TrendingUp,
  ShieldCheck,
  Search,
  Eye,
  Loader2,
} from 'lucide-react'

export default function PromoteProductPage() {
  const router = useRouter()
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [search, setSearch] = useState('')
  const [selectedProductId, setSelectedProductId] = useState<string>('')
  const [duration, setDuration] = useState('30')
  const [adFeeRate] = useState(2.5) // 2.5% per specification

  useEffect(() => {
    async function loadProducts() {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        const { data } = await supabase
          .from('products')
          .select('id, title, price, images, views_count, condition, status')
          .eq('seller_id', user.id)
          .eq('status', 'published')
          .order('created_at', { ascending: false })

        setProducts(data || [])
        if (data && data.length > 0) {
          setSelectedProductId(data[0].id)
        }
      }
      setLoading(false)
    }
    loadProducts()
  }, [])

  const filteredProducts = products.filter((p) =>
    p.title?.toLowerCase().includes(search.toLowerCase())
  )

  const selectedProduct = products.find((p) => p.id === selectedProductId)

  async function handleLaunch() {
    if (!selectedProductId) return
    setSubmitting(true)

    const res = await createPromoteProductCampaign({
      productId: selectedProductId,
      durationDays: Number(duration),
    })

    if (res.success) {
      router.push('/seller/promotions')
    } else {
      alert(res.error || 'Failed to launch promotion')
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Top Breadcrumb Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/seller/promotions"
          className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-black flex items-center justify-center">
              1
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100">
              Promote a Product
            </h1>
            <Badge className="bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 text-[10px] font-bold">
              Pay When You Sell
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Turn your listing into sales. You only pay an ad fee when an attributed order is completed.
          </p>
        </div>
      </div>

      {/* Progress Indicators */}
      <div className="flex items-center gap-3 text-xs font-bold border-b border-slate-100 dark:border-slate-800 pb-3">
        <span className="text-blue-600 flex items-center gap-1.5">
          <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-950 flex items-center justify-center text-[10px]">
            1
          </span>
          Select Product
        </span>
        <span className="text-slate-300 dark:text-slate-700">→</span>
        <span className="text-blue-600 flex items-center gap-1.5">
          <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-950 flex items-center justify-center text-[10px]">
            2
          </span>
          Set Ad Details
        </span>
        <span className="text-slate-300 dark:text-slate-700">→</span>
        <span className="text-slate-400 flex items-center gap-1.5">
          <span className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[10px]">
            3
          </span>
          Review &amp; Launch
        </span>
      </div>

      {/* Main Grid: Selection vs Settings */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Select a Product */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl p-5 space-y-4 shadow-2xs">
          <div className="space-y-2">
            <h2 className="font-black text-sm text-slate-900 dark:text-slate-100">
              Select a Product
            </h2>
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Search your inventory..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="space-y-2 max-h-[460px] overflow-y-auto [scrollbar-width:thin] pr-1">
            {loading ? (
              <div className="py-12 text-center text-xs text-slate-400">Loading listings...</div>
            ) : filteredProducts.length > 0 ? (
              filteredProducts.map((p) => {
                const isSelected = selectedProductId === p.id
                return (
                  <div
                    key={p.id}
                    onClick={() => setSelectedProductId(p.id)}
                    className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center gap-3 ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/40 shadow-2xs ring-1 ring-blue-500'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                    }`}
                  >
                    <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 shrink-0 overflow-hidden flex items-center justify-center">
                      {p.images?.[0] ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={p.images[0]}
                          alt={p.title}
                          className="w-full h-full object-contain p-1"
                        />
                      ) : (
                        <Package className="w-5 h-5 text-slate-400" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                        {p.title}
                      </p>
                      <p className="text-[11px] font-black text-blue-600 dark:text-blue-400">
                        ₦{Number(p.price).toLocaleString()}
                      </p>
                      <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                        <span className="flex items-center gap-0.5">
                          <Eye className="w-2.5 h-2.5" /> {p.views_count || 0} views
                        </span>
                        <span>•</span>
                        <span className="capitalize">{p.condition?.replace('_', ' ')}</span>
                      </div>
                    </div>

                    <div
                      className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                        isSelected
                          ? 'border-blue-600 bg-blue-600 text-white'
                          : 'border-slate-300 dark:border-slate-600'
                      }`}
                    >
                      {isSelected && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="py-8 text-center text-xs text-slate-400">No matching products found.</div>
            )}
          </div>
        </div>

        {/* Right Column: Ad Settings & Launch */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl p-5 sm:p-6 space-y-5 shadow-2xs">
            <h2 className="font-black text-sm text-slate-900 dark:text-slate-100">
              Ad Settings
            </h2>

            {/* Selected Ad Type Card */}
            <div className="p-4 rounded-2xl border-2 border-blue-600/70 bg-blue-50/40 dark:bg-blue-950/30 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-blue-600" />
                  Shopbench Ads (Pay when you sell)
                </span>
                <Badge className="bg-blue-600 text-white text-[9px] font-black uppercase">
                  Recommended
                </Badge>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                We'll promote your product across search results, category pages, and related gadget discovery feeds. You only pay an ad fee when a buyer purchase is completed.
              </p>
            </div>

            {/* Ad Fee Transparent Breakdown */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Ad fee per sale
                </span>
                <span className="text-sm font-black text-blue-600 dark:text-blue-400">
                  {adFeeRate}%
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                You will only be charged {adFeeRate}% of the product price when a sale occurs within the 7-day buyer attribution window. If no sale occurs, you pay ₦0.
              </p>
              {selectedProduct && (
                <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs">
                  <span className="text-slate-500">Calculated fee per sale:</span>
                  <span className="font-bold text-slate-900 dark:text-slate-100">
                    ₦{((Number(selectedProduct.price) * adFeeRate) / 100).toLocaleString()}
                  </span>
                </div>
              )}
            </div>

            {/* Duration Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Campaign Duration
              </label>
              <select
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="14">14 Days</option>
                <option value="30">30 Days (Recommended)</option>
                <option value="60">60 Days</option>
                <option value="90">90 Days</option>
              </select>
            </div>

            {/* Estimated Lift */}
            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <TrendingUp className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <div>
                  <p className="text-xs font-black text-emerald-950 dark:text-emerald-200">
                    Estimated Results
                  </p>
                  <p className="text-[11px] text-emerald-800 dark:text-emerald-300">
                    2x – 5x More Listing Views • Higher Checkout Intent
                  </p>
                </div>
              </div>
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
            </div>

            {/* Launch Action */}
            <Button
              onClick={handleLaunch}
              disabled={submitting || !selectedProductId}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs h-11 rounded-xl shadow-xs cursor-pointer gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Activating Promotion...
                </>
              ) : (
                <>Start Promotion →</>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}