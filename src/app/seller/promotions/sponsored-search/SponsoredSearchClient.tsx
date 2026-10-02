'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createSponsoredSearchCampaign } from '@/app/actions/ads'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  ArrowLeft,
  Search,
  Plus,
  X,
  Package,
  Sparkles,
  Loader2,
  Wallet,
  AlertCircle,
  MapPin,
  Check,
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

function generateDefaultKeywords(product: any): string[] {
  if (!product) return ['tech abuja', 'gadgets']
  const pool = new Set<string>()

  const titleLower = product.title?.toLowerCase() || ''
  pool.add(titleLower.slice(0, 30).trim())

  if (product.brand) {
    pool.add(product.brand.toLowerCase())
    pool.add(`${product.brand.toLowerCase()} abuja`)
  }

  if (product.category) {
    pool.add(product.category.toLowerCase())
  }

  // Common high-intent tech terms
  if (titleLower.includes('iphone') || titleLower.includes('apple')) {
    pool.add('iphone')
    pool.add('apple phone')
  } else if (titleLower.includes('laptop') || titleLower.includes('macbook')) {
    pool.add('laptop abuja')
  }

  return Array.from(pool).slice(0, 5)
}

export function SponsoredSearchClient({
  initialProducts,
  initialSettings,
  walletBalance,
  sellerDistrict,
}: {
  initialProducts: any[]
  initialSettings: any
  walletBalance: number
  sellerDistrict: string
}) {
  const router = useRouter()
  const [products] = useState<any[]>(initialProducts)
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>(
    initialProducts[0]?.id ? [initialProducts[0].id] : []
  )

  const firstProduct = initialProducts[0]

  const [campaignName, setCampaignName] = useState(
    firstProduct ? `${firstProduct.title.slice(0, 22)} Search Ad` : 'Search Campaign'
  )
  const [keywords, setKeywords] = useState<string[]>(
    generateDefaultKeywords(firstProduct)
  )
  const [activePreviewKeyword, setActivePreviewKeyword] = useState<string>(
    keywords[0] || 'gadget abuja'
  )
  const [keywordInput, setKeywordInput] = useState('')

  // Dynamic limits from database platform_settings
  const minCpc = Number(initialSettings?.cpc_min || 50)
  const maxCpcLimit = Number(initialSettings?.cpc_max || 500)
  const suggestedCpc = Number(initialSettings?.cpc_suggested || 100)
  const minDailyBudget = Number(initialSettings?.min_daily_budget || 2000)

  const [maxCpc, setMaxCpc] = useState(suggestedCpc)
  const [dailyBudget, setDailyBudget] = useState(minDailyBudget)
  const [duration, setDuration] = useState('30')
  const [submitting, setSubmitting] = useState(false)

  function toggleProduct(p: any) {
    if (selectedProductIds.includes(p.id)) {
      if (selectedProductIds.length === 1) return // Keep at least one selected
      const next = selectedProductIds.filter((id) => id !== p.id)
      setSelectedProductIds(next)
    } else {
      const next = [...selectedProductIds, p.id]
      setSelectedProductIds(next)
      // If it was empty or first select, auto-populate campaign name and keywords
      if (selectedProductIds.length === 0) {
        setCampaignName(`${p.title.slice(0, 22)} Search Ad`)
        const suggested = generateDefaultKeywords(p)
        setKeywords(suggested)
        setActivePreviewKeyword(suggested[0] || p.title)
      }
    }
  }

  function addKeyword() {
    const clean = keywordInput.trim().toLowerCase()
    if (clean && !keywords.includes(clean)) {
      const next = [...keywords, clean]
      setKeywords(next)
      setActivePreviewKeyword(clean)
      setKeywordInput('')
    }
  }

  function removeKeyword(kw: string) {
    const next = keywords.filter((k) => k !== kw)
    setKeywords(next)
    if (activePreviewKeyword === kw) {
      setActivePreviewKeyword(next[0] || 'gadget abuja')
    }
  }

  // Active product to showcase in the live preview
  const previewProduct = useMemo(() => {
    return products.find((p) => selectedProductIds.includes(p.id)) || products[0]
  }, [products, selectedProductIds])

  async function handleLaunch() {
    if (!selectedProductIds.length) {
      alert('Please select at least one product.')
      return
    }

    if (keywords.length === 0) {
      alert('Please add at least one search keyword.')
      return
    }

    if (dailyBudget < minDailyBudget) {
      alert(`Daily budget must be at least ₦${minDailyBudget.toLocaleString()}`)
      return
    }

    if (maxCpc < minCpc || maxCpc > maxCpcLimit) {
      alert(`Maximum CPC must be between ₦${minCpc} and ₦${maxCpcLimit}`)
      return
    }

    setSubmitting(true)
    const res = await createSponsoredSearchCampaign({
      campaignName,
      productIds: selectedProductIds,
      keywords,
      maxCpc: Number(maxCpc),
      dailyBudget: Number(dailyBudget),
      durationDays: Number(duration),
    })

    if (res.success) {
      router.push('/seller/promotions')
    } else {
      alert(res.error || 'Failed to launch search campaign')
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
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
                Create Search Campaign
              </h1>
              <Badge className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 text-[10px] font-bold">
                Pay Per Click (CPC)
              </Badge>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Appear at the top of buyer searches in Abuja. You are only charged when shoppers click your listing.
            </p>
          </div>
        </div>

        {/* Promotion Wallet Balance Display */}
        <div className="flex items-center gap-2.5 p-2.5 px-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xs">
          <Wallet className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <div className="text-right">
            <span className="text-[10px] font-bold text-slate-400 uppercase block leading-none">
              Ad Wallet
            </span>
            <span className="text-xs font-black text-slate-900 dark:text-slate-100">
              ₦{walletBalance.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Low balance alert if wallet is empty */}
      {walletBalance < minDailyBudget && (
        <div className="p-3.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 rounded-2xl flex items-center justify-between text-xs text-amber-800 dark:text-amber-200">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              Your ad wallet balance is below the minimum daily budget (₦{minDailyBudget.toLocaleString()}). Add funds so your ad can run continuously.
            </span>
          </div>
          <Link
            href="/seller/wallet"
            className="font-bold underline text-amber-900 dark:text-amber-100 shrink-0 hover:opacity-80"
          >
            Add Funds →
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Form Setup */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl p-5 sm:p-6 space-y-5 shadow-2xs">
          {/* Campaign Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
              Campaign Name
            </label>
            <input
              type="text"
              value={campaignName}
              onChange={(e) => setCampaignName(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          {/* Product Selection */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Eligible Products ({selectedProductIds.length} selected)
              </label>
              <span className="text-[11px] text-slate-400">Click to toggle products</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-52 overflow-y-auto [scrollbar-width:thin] pr-1">
              {products.map((p) => {
                const isChecked = selectedProductIds.includes(p.id)
                const firstImg = resolveFirstImage(p.images)

                return (
                  <div
                    key={p.id}
                    onClick={() => toggleProduct(p)}
                    className={`p-2.5 rounded-2xl border flex items-center gap-2.5 cursor-pointer transition ${
                      isChecked
                        ? 'border-emerald-600 bg-emerald-50/40 dark:bg-emerald-950/30 shadow-2xs ring-1 ring-emerald-500'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 shrink-0 overflow-hidden flex items-center justify-center">
                      {firstImg ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={firstImg}
                          alt={p.title}
                          className="w-full h-full object-contain p-0.5"
                        />
                      ) : (
                        <Package className="w-4 h-4 text-slate-400" />
                      )}
                    </div>

                    <div className="truncate text-xs flex-1 min-w-0">
                      <p className="font-bold text-slate-900 dark:text-slate-100 truncate">
                        {p.title}
                      </p>
                      <p className="text-[10px] font-black text-emerald-600 dark:text-emerald-400">
                        ₦{Number(p.price).toLocaleString()}
                      </p>
                    </div>

                    <div
                      className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                        isChecked
                          ? 'border-emerald-600 bg-emerald-600 text-white'
                          : 'border-slate-300 dark:border-slate-600'
                      }`}
                    >
                      {isChecked && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Keywords Engine */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Target Search Keywords ({keywords.length})
              </label>
              <span className="text-[10px] text-slate-400">Press enter or click Add</span>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                placeholder="e.g. iphone 13, macbook pro, apple store..."
                value={keywordInput}
                onChange={(e) => setKeywordInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addKeyword())}
                className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-medium focus:ring-1 focus:ring-emerald-500"
              />
              <Button
                type="button"
                onClick={addKeyword}
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl px-4 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Add
              </Button>
            </div>

            <div className="flex flex-wrap gap-1.5 pt-1">
              {keywords.map((kw) => {
                const isActive = activePreviewKeyword === kw
                return (
                  <span
                    key={kw}
                    onClick={() => setActivePreviewKeyword(kw)}
                    className={`px-2.5 py-1 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                      isActive
                        ? 'bg-emerald-600 text-white shadow-2xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                    }`}
                  >
                    <span>{kw}</span>
                    <X
                      className="w-3 h-3 cursor-pointer text-slate-400 hover:text-red-500 ml-0.5"
                      onClick={(e) => {
                        e.stopPropagation()
                        removeKeyword(kw)
                      }}
                    />
                  </span>
                )
              })}
            </div>
            <p className="text-[10px] text-slate-400">
              Click any keyword tag above to preview how it looks when a buyer searches for it.
            </p>
          </div>

          {/* Budget & Bid Constraints */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Daily Budget (₦)
              </label>
              <input
                type="number"
                min={minDailyBudget}
                step="500"
                value={dailyBudget}
                onChange={(e) => setDailyBudget(Number(e.target.value))}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold focus:ring-1 focus:ring-emerald-500"
              />
              <p className="text-[10px] text-slate-400">
                Minimum: ₦{minDailyBudget.toLocaleString()} / day
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Max CPC Bid (₦)
              </label>
              <input
                type="number"
                min={minCpc}
                max={maxCpcLimit}
                step="10"
                value={maxCpc}
                onChange={(e) => setMaxCpc(Number(e.target.value))}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold focus:ring-1 focus:ring-emerald-500"
              />
              <p className="text-[10px] text-slate-400">
                Suggested: ₦{suggestedCpc} (Range: ₦{minCpc} – ₦{maxCpcLimit})
              </p>
            </div>
          </div>

          {/* Launch Button */}
          <Button
            onClick={handleLaunch}
            disabled={submitting || !selectedProductIds.length || keywords.length === 0}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-11 rounded-xl shadow-xs cursor-pointer gap-2 mt-2"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Launching Campaign...
              </>
            ) : (
              <>Launch Sponsored Search Ad →</>
            )}
          </Button>
        </div>

        {/* Right Column: Live Buyer Search Preview */}
        <div className="lg:col-span-5 space-y-3 sticky top-20">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Where Your Ad Will Appear
          </p>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-4">
            {/* Live Synchronized Buyer Search Bar */}
            <div className="flex items-center gap-2 p-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200">
              <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="truncate">{activePreviewKeyword || 'search gadgets...'}</span>
            </div>

            {/* Sponsored Result Simulation */}
            <div className="p-3.5 border-2 border-emerald-500/60 rounded-2xl bg-emerald-50/15 dark:bg-emerald-950/20 space-y-2.5">
              <div className="flex items-center justify-between">
                <Badge className="bg-emerald-600 text-white text-[8px] font-black uppercase tracking-wider">
                  Sponsored
                </Badge>
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                  Top Position in Abuja
                </span>
              </div>

              {previewProduct ? (
                <div className="flex gap-3 items-center">
                  <div className="w-14 h-14 rounded-xl bg-slate-100 dark:bg-slate-800 overflow-hidden shrink-0 flex items-center justify-center border border-slate-200/80 dark:border-slate-700">
                    {resolveFirstImage(previewProduct.images) ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={resolveFirstImage(previewProduct.images)!}
                        alt={previewProduct.title}
                        className="w-full h-full object-contain p-1"
                      />
                    ) : (
                      <Package className="w-6 h-6 text-slate-400" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                      {previewProduct.title}
                    </p>
                    <p className="text-xs font-black text-slate-900 dark:text-slate-100 mt-0.5">
                      ₦{Number(previewProduct.price).toLocaleString()}
                    </p>
                    <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5 flex items-center gap-0.5">
                      <MapPin className="w-2.5 h-2.5" /> Verified {sellerDistrict} Dealer
                    </p>
                  </div>
                </div>
              ) : null}
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl space-y-1 text-[11px] text-slate-500">
              <p className="font-bold text-slate-700 dark:text-slate-300">
                Auction Scoring (AdRank)
              </p>
              <p className="leading-relaxed">
                Rank = Max Bid (₦{maxCpc}) × Relevance × Verified Dealer Trust. You are only charged actual CPC when a shopper clicks your listing.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}