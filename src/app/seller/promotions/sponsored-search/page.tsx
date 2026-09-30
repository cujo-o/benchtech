'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { createSponsoredSearchCampaign } from '@/app/actions/ads'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  ArrowLeft,
  Search,
  Sliders,
  DollarSign,
  Plus,
  X,
  Package,
  Sparkles,
  Loader2,
} from 'lucide-react'

export default function CreateSponsoredSearchPage() {
  const router = useRouter()
  const [products, setProducts] = useState<any[]>([])
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([])
  const [campaignName, setCampaignName] = useState('Gaming Laptops - Abuja')
  const [keywords, setKeywords] = useState<string[]>([
    'gaming laptop',
    'laptop abuja',
    'asus rog',
    'rtx gaming',
  ])
  const [keywordInput, setKeywordInput] = useState('')
  const [maxCpc, setMaxCpc] = useState(100)
  const [dailyBudget, setDailyBudget] = useState(5000)
  const [duration, setDuration] = useState('30')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    async function loadProducts() {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        const { data } = await supabase
          .from('products')
          .select('id, title, price, images, brand')
          .eq('seller_id', user.id)
          .eq('status', 'published')

        setProducts(data || [])
        if (data && data.length > 0) {
          setSelectedProductIds([data[0].id])
          setCampaignName(`${data[0].title.slice(0, 25)} Campaign`)
        }
      }
    }
    loadProducts()
  }, [])

  function addKeyword() {
    if (keywordInput.trim() && !keywords.includes(keywordInput.trim().toLowerCase())) {
      setKeywords([...keywords, keywordInput.trim().toLowerCase()])
      setKeywordInput('')
    }
  }

  function removeKeyword(kw: string) {
    setKeywords(keywords.filter((k) => k !== kw))
  }

  function toggleProduct(id: string) {
    if (selectedProductIds.includes(id)) {
      setSelectedProductIds(selectedProductIds.filter((p) => p !== id))
    } else {
      setSelectedProductIds([...selectedProductIds, id])
    }
  }

  async function handleLaunch() {
    if (!selectedProductIds.length) {
      alert('Please select at least one product.')
      return
    }

    setSubmitting(true)
    const res = await createSponsoredSearchCampaign({
      campaignName,
      productIds: selectedProductIds,
      keywords,
      maxCpc,
      dailyBudget,
      durationDays: Number(duration),
    })

    if (res.success) {
      router.push('/seller/promotions')
    } else {
      alert(res.error || 'Failed to launch search ad')
      setSubmitting(false)
    }
  }

  const previewProduct = products.find((p) => selectedProductIds.includes(p.id)) || products[0]

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Top Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/seller/promotions"
          className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-emerald-600 text-white text-xs font-black flex items-center justify-center">
              2
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100">
              Create Search Campaign
            </h1>
            <Badge className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 text-[10px] font-bold">
              Pay Per Click (CPC)
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Appear at the top of buyer searches in Abuja. You only pay when a shopper clicks your ad.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left 7 Columns: Form Setup */}
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
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-medium focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          {/* Product Selection */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
              Eligible Products ({selectedProductIds.length} selected)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto [scrollbar-width:thin]">
              {products.map((p) => {
                const isChecked = selectedProductIds.includes(p.id)
                return (
                  <div
                    key={p.id}
                    onClick={() => toggleProduct(p.id)}
                    className={`p-2.5 rounded-xl border flex items-center gap-2 cursor-pointer transition ${
                      isChecked
                        ? 'border-emerald-600 bg-emerald-50/40 dark:bg-emerald-950/30'
                        : 'border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => {}}
                      className="w-3.5 h-3.5 rounded text-emerald-600"
                    />
                    <div className="truncate text-xs">
                      <p className="font-bold text-slate-900 dark:text-slate-100 truncate">{p.title}</p>
                      <p className="text-[10px] text-slate-400">₦{Number(p.price).toLocaleString()}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Keywords Engine */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
              Target Search Keywords
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="e.g. macbook pro, iphone 14..."
                value={keywordInput}
                onChange={(e) => setKeywordInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addKeyword())}
                className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-emerald-500"
              />
              <Button
                type="button"
                onClick={addKeyword}
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl"
              >
                <Plus className="w-3.5 h-3.5" /> Add
              </Button>
            </div>

            <div className="flex flex-wrap gap-1.5 pt-1">
              {keywords.map((kw) => (
                <span
                  key={kw}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold flex items-center gap-1.5"
                >
                  {kw}
                  <X
                    className="w-3 h-3 cursor-pointer text-slate-400 hover:text-red-600"
                    onClick={() => removeKeyword(kw)}
                  />
                </span>
              ))}
            </div>
          </div>

          {/* Budget & Bid Constraints */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Daily Budget (₦)
              </label>
              <input
                type="number"
                min="2000"
                step="500"
                value={dailyBudget}
                onChange={(e) => setDailyBudget(Number(e.target.value))}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold focus:ring-1 focus:ring-emerald-500"
              />
              <p className="text-[10px] text-slate-400">Min ₦2,000 / day</p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Max CPC Bid (₦)
              </label>
              <input
                type="number"
                min="50"
                max="500"
                step="10"
                value={maxCpc}
                onChange={(e) => setMaxCpc(Number(e.target.value))}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold focus:ring-1 focus:ring-emerald-500"
              />
              <p className="text-[10px] text-slate-400">Suggested: ₦100 (Range: ₦50 – ₦500)</p>
            </div>
          </div>

          <Button
            onClick={handleLaunch}
            disabled={submitting || !selectedProductIds.length}
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

        {/* Right 5 Columns: Live Buyer Search Mockup */}
        <div className="lg:col-span-5 space-y-3 sticky top-20">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Where Your Ad Will Appear
          </p>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 shadow-sm space-y-3">
            {/* Fake Buyer Search Bar */}
            <div className="flex items-center gap-2 p-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs text-slate-500">
              <Search className="w-3.5 h-3.5 text-slate-400" />
              <span>{keywords[0] || 'gaming laptop'}</span>
            </div>

            {/* Sponsored Result Simulation Card */}
            <div className="p-3 border-2 border-emerald-500/50 rounded-2xl bg-emerald-50/10 dark:bg-emerald-950/20 space-y-2">
              <div className="flex items-center justify-between">
                <Badge className="bg-emerald-600 text-white text-[8px] font-black uppercase tracking-wider">
                  Sponsored
                </Badge>
                <span className="text-[10px] font-bold text-emerald-600">Top Result Placement</span>
              </div>

              {previewProduct ? (
                <div className="flex gap-3 items-center">
                  <div className="w-14 h-14 rounded-xl bg-slate-100 dark:bg-slate-800 overflow-hidden shrink-0 flex items-center justify-center">
                    {previewProduct.images?.[0] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={previewProduct.images[0]}
                        alt={previewProduct.title}
                        className="w-full h-full object-contain p-1"
                      />
                    ) : (
                      <Package className="w-6 h-6 text-slate-400" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                      {previewProduct.title}
                    </p>
                    <p className="text-xs font-black text-slate-900 dark:text-slate-100 mt-0.5">
                      ₦{Number(previewProduct.price).toLocaleString()}
                    </p>
                    <p className="text-[10px] text-emerald-600 font-semibold mt-0.5">
                      ✓ Verified Abuja Dealer
                    </p>
                  </div>
                </div>
              ) : null}
            </div>

            <p className="text-[11px] text-slate-400 text-center leading-relaxed">
              Paid ads receive high visibility but do not bypass buyer trust protections or genuine user reviews.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}