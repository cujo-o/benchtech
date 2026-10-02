'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createPromoteProductCampaign } from '@/app/actions/ads'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  ArrowLeft,
  Sparkles,
  Package,
  TrendingUp,
  ShieldCheck,
  Search,
  Eye,
  Loader2,
  Check,
  MapPin,
  Plus,
} from 'lucide-react'

function resolveFirstImage(images: any): string | null {
  if (!images) return null
  if (Array.isArray(images)) return images[0] || null
  if (typeof images === 'string') {
    try {
      const parsed = JSON.parse(images)
      if (Array.isArray(parsed)) return parsed[0] || null
    } catch {
      return images.startsWith('http') ? images : null
    }
  }
  return null
}

export function PromoteProductClient({
  initialProducts,
  initialSettings,
}: {
  initialProducts: any[]
  initialSettings: any
}) {
  const router = useRouter()
  const [products] = useState<any[]>(initialProducts)
  const [search, setSearch] = useState('')
  const [selectedProductId, setSelectedProductId] = useState<string>(
    initialProducts[0]?.id || ''
  )
  const [duration, setDuration] = useState('30')
  const [submitting, setSubmitting] = useState(false)

  const adFeeRate = Number(initialSettings?.promote_product_rate || 2.5)
  const attributionDays = Number(initialSettings?.attribution_window_days || 7)

  const filteredProducts = products.filter((p) =>
    p.title?.toLowerCase().includes(search.toLowerCase())
  )

  const selectedProduct = products.find((p) => p.id === selectedProductId)
  const productPrice = Number(selectedProduct?.price || 0)
  const calculatedAdFee = Math.round((productPrice * adFeeRate) / 100)
  const calculatedCommission = Math.round((productPrice * 0.07)) // 7% standard commission
  const netEarnings = productPrice - calculatedAdFee - calculatedCommission

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
      {/* Top Header without the Figma step number */}
      <div className="flex items-center gap-3">
        <Link
          href="/seller/promotions"
          className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100">
              Promote a Product
            </h1>
            <Badge className="bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 text-[10px] font-bold">
              Pay When You Sell
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Increase discovery across search and category feeds. You only pay an ad fee when an attributed order is completed.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Product Selector */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl p-5 space-y-4 shadow-2xs">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h2 className="font-black text-sm text-slate-900 dark:text-slate-100">
                Select a Product ({products.length})
              </h2>
              <Link
                href="/seller/listings/new"
                className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-0.5"
              >
                <Plus className="w-3 h-3" /> Add Listing
              </Link>
            </div>

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

          <div className="space-y-2 max-h-[480px] overflow-y-auto [scrollbar-width:thin] pr-1">
            {filteredProducts.length > 0 ? (
              filteredProducts.map((p) => {
                const isSelected = selectedProductId === p.id
                const firstImg = resolveFirstImage(p.images)

                return (
                  <div
                    key={p.id}
                    onClick={() => setSelectedProductId(p.id)}
                    className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center gap-3 ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/40 shadow-2xs ring-1 ring-blue-500'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 shrink-0 overflow-hidden flex items-center justify-center">
                      {firstImg ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={firstImg}
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
                          <Eye className="w-2.5 h-2.5" /> {p.views || 0} views
                        </span>
                        <span>•</span>
                        <span className="capitalize">{p.condition?.replace('_', ' ') || 'Device'}</span>
                      </div>
                    </div>

                    <div
                      className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
                        isSelected
                          ? 'border-blue-600 bg-blue-600 text-white'
                          : 'border-slate-300 dark:border-slate-600'
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="py-12 text-center text-xs text-slate-400 space-y-2">
                <Package className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="font-bold text-slate-700 dark:text-slate-300">
                  {products.length === 0 ? 'No active listings found' : 'No matching products'}
                </p>
                <p className="text-[11px]">
                  {products.length === 0
                    ? 'Add products to your store first before promoting.'
                    : 'Try searching with a different gadget name.'}
                </p>
                {products.length === 0 && (
                  <Link href="/seller/listings/new">
                    <Button size="sm" className="bg-blue-600 text-white text-xs font-bold rounded-xl mt-1">
                      + Create Your First Listing
                    </Button>
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Dynamic Live Configuration & Math */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl p-5 sm:p-6 space-y-5 shadow-2xs">
            <h2 className="font-black text-sm text-slate-900 dark:text-slate-100">
              Promotion Details &amp; Profit Calculator
            </h2>

            {/* Selected Product Card Preview */}
            {selectedProduct ? (
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-white dark:bg-slate-700 shrink-0 overflow-hidden flex items-center justify-center border border-slate-200 dark:border-slate-600">
                  {resolveFirstImage(selectedProduct.images) ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={resolveFirstImage(selectedProduct.images)!}
                      alt={selectedProduct.title}
                      className="w-full h-full object-contain p-1"
                    />
                  ) : (
                    <Package className="w-5 h-5 text-slate-400" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-black text-slate-900 dark:text-slate-100 truncate">
                    {selectedProduct.title}
                  </p>
                  <p className="text-xs font-black text-blue-600 dark:text-blue-400 mt-0.5">
                    ₦{productPrice.toLocaleString()}
                  </p>
                </div>
                <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 text-[10px] font-bold">
                  Selected
                </Badge>
              </div>
            ) : null}

            {/* Dynamic Financial Math Breakdown */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200/80 dark:border-slate-700 space-y-2.5 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-700">
                <span className="font-bold text-slate-800 dark:text-slate-200">Listing Price</span>
                <span className="font-black text-slate-900 dark:text-slate-100">
                  ₦{productPrice.toLocaleString()}
                </span>
              </div>

              <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                <span>Ad Promotion Fee ({adFeeRate}%)</span>
                <span className="font-bold text-red-500">-₦{calculatedAdFee.toLocaleString()}</span>
              </div>

              <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                <span>Standard Marketplace Commission (7%)</span>
                <span className="font-bold text-red-500">-₦{calculatedCommission.toLocaleString()}</span>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-700 text-sm">
                <span className="font-black text-slate-900 dark:text-slate-100">Estimated Net Payout</span>
                <span className="font-black text-emerald-600 dark:text-emerald-400">
                  ₦{netEarnings.toLocaleString()}
                </span>
              </div>

              <p className="text-[11px] text-slate-400 pt-1 leading-relaxed">
                Fees are deducted automatically from buyer checkout proceeds only if the sale occurs within the {attributionDays}-day attribution window. If no sale occurs, you pay ₦0.
              </p>
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

            {/* Estimated Results */}
            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <TrendingUp className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <div>
                  <p className="text-xs font-black text-emerald-950 dark:text-emerald-200">
                    Estimated Results
                  </p>
                  <p className="text-[11px] text-emerald-800 dark:text-emerald-300">
                    2x – 5x More Views • Top Placement in Gadget Feeds
                  </p>
                </div>
              </div>
              <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
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
                <>Start Promotion (₦0 Upfront) →</>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}