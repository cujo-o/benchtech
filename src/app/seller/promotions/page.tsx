'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { createBrowserClient } from '@supabase/ssr'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import {
  Sparkles,
  Flame,
  Crown,
  Zap,
  CheckCircle2,
  AlertCircle,
  Plus,
  Loader2,
  Package,
  Clock,
  X,
} from 'lucide-react'

interface PromotionPackage {
  id: 'featured_listing' | 'deals_spotlight' | 'homepage_hero'
  name: string
  cost: number
  durationDays: number
  description: string
  icon: typeof Flame
  color: string
}

const PROMO_PACKAGES: PromotionPackage[] = [
  {
    id: 'featured_listing',
    name: 'Featured Listing Placement',
    cost: 500,
    durationDays: 3,
    description: 'Pins your gadget to the top of category and search results in Abuja.',
    icon: Flame,
    color: 'text-red-500',
  },
  {
    id: 'deals_spotlight',
    name: 'Deals & Clearance Spotlight',
    cost: 1000,
    durationDays: 7,
    description: 'Highlights your discounted hardware on the dedicated /deals showcase.',
    icon: Zap,
    color: 'text-purple-600',
  },
  {
    id: 'homepage_hero',
    name: 'Homepage Hero Showcase',
    cost: 2500,
    durationDays: 7,
    description: 'Maximum platform reach at the top of the buyer feed header.',
    icon: Crown,
    color: 'text-amber-500',
  },
]

export default function PromotionsPage() {
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<any>(null)
  const [products, setProducts] = useState<any[]>([])
  const [campaigns, setCampaigns] = useState<any[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Promotion Creation Form State
  const [selectedProductId, setSelectedProductId] = useState<string>('')
  const [selectedPackageId, setSelectedPackageId] = useState<string>('featured_listing')
  const [submitting, setSubmitting] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
  const [actionSuccess, setActionSuccess] = useState<string | null>(null)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const loadData = useCallback(async () => {
    setLoading(true)
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return

    // 1. Fetch Profile for real promotional_balance
    const { data: prof } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    setProfile(prof)

    // 2. Fetch Seller's active products
    const { data: prods } = await supabase
      .from('products')
      .select('id, title, price, category, images')
      .eq('seller_id', user.id)
      .eq('status', 'published')

    setProducts(prods || [])
    if (prods && prods.length > 0 && !selectedProductId) {
      setSelectedProductId(prods[0].id)
    }

    // 3. Fetch real promotions
    const { data: promos } = await supabase
      .from('promotions')
      .select('*, products(title, images, price)')
      .eq('seller_id', user.id)
      .order('created_at', { ascending: false })

    setCampaigns(promos || [])
    setLoading(false)
  }, [supabase, selectedProductId])

  useEffect(() => {
    loadData()
  }, [loadData])

  const currentPackage = PROMO_PACKAGES.find((p) => p.id === selectedPackageId)!
  const promoBalance = Number(profile?.promotional_balance || 0)

  // Execute Promotion Creation
  const handleLaunchPromotion = async (e: React.FormEvent) => {
    e.preventDefault()
    setActionError(null)
    setActionSuccess(null)

    if (!selectedProductId) {
      setActionError('Please select a gadget to promote.')
      return
    }

    if (promoBalance < currentPackage.cost) {
      setActionError(
        `Insufficient promotional credit. Balance is ₦${promoBalance.toLocaleString()}, but package costs ₦${currentPackage.cost.toLocaleString()}.`
      )
      return
    }

    setSubmitting(true)

    try {
      const selectedProduct = products.find((p) => p.id === selectedProductId)
      const endsAt = new Date()
      endsAt.setDate(endsAt.getDate() + currentPackage.durationDays)

      // 1. Deduct promotional balance from seller profile
      const newBalance = promoBalance - currentPackage.cost
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ promotional_balance: newBalance })
        .eq('id', profile.id)

      if (profileError) throw profileError

      // 2. Insert into promotions ledger
      const { error: promoError } = await supabase.from('promotions').insert({
        seller_id: profile.id,
        product_id: selectedProductId,
        package_type: currentPackage.id,
        title: `${selectedProduct?.title || 'Gadget'} (${currentPackage.name})`,
        cost: currentPackage.cost,
        status: 'active',
        starts_at: new Date().toISOString(),
        ends_at: endsAt.toISOString(),
      })

      if (promoError) throw promoError

      // 3. Mark the product as featured in marketplace
      await supabase
        .from('products')
        .update({
          is_featured: true,
          featured_until: endsAt.toISOString(),
        })
        .eq('id', selectedProductId)

      setActionSuccess(`Promotion launched! ₦${currentPackage.cost.toLocaleString()} deducted.`)
      setIsModalOpen(false)
      loadData()
    } catch (err: any) {
      setActionError(err.message || 'Failed to create promotion.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="py-24 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
        <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
        <span>Loading live promotional ledger...</span>
      </div>
    )
  }

  const isPro =
    profile?.seller_plan === 'pro' ||
    profile?.subscription_tier === 'pro' ||
    profile?.subscription_plan === 'professional'

  return (
    <div className="space-y-6 sm:space-y-8 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Promotions Studio
            </h1>
            <Badge className="bg-purple-100 text-purple-800 text-[10px] font-black uppercase">
              {isPro ? 'Pro Balance Active' : 'Standard'}
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Use your promotional credits to feature products, rank higher in Abuja search, and accelerate sales[cite: 10, 11].
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <span className="text-[10px] uppercase font-bold text-slate-400">Available Promo Credit</span>
            <p className="text-xl font-black text-purple-600">₦{promoBalance.toLocaleString()}</p>
          </div>

          <Button
            onClick={() => {
              setActionError(null)
              setActionSuccess(null)
              setIsModalOpen(true)
            }}
            disabled={products.length === 0}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs h-10 rounded-xl gap-1.5 shadow-xs"
          >
            <Plus className="w-4 h-4" /> Create Promotion
          </Button>
        </div>
      </div>

      {actionSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs rounded-2xl font-bold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{actionSuccess}</span>
          </div>
          <Button size="sm" variant="ghost" onClick={() => setActionSuccess(null)} className="h-7 text-xs">
            Dismiss
          </Button>
        </div>
      )}

      {/* Available Packages Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {PROMO_PACKAGES.map((pkg) => {
          const Icon = pkg.icon
          return (
            <Card
              key={pkg.id}
              className="rounded-3xl border-slate-200/80 bg-white p-5 shadow-xs space-y-3 flex flex-col justify-between"
            >
              <div className="space-y-2.5">
                <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center">
                  <Icon className={`w-5 h-5 ${pkg.color}`} />
                </div>
                <div>
                  <h4 className="font-black text-xs text-slate-900">{pkg.name}</h4>
                  <p className="text-[11px] text-slate-500 mt-1 leading-snug">{pkg.description}</p>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="font-black text-slate-900">₦{pkg.cost.toLocaleString()}</span>
                <span className="text-[11px] font-bold text-slate-400">{pkg.durationDays} Days</span>
              </div>
            </Card>
          )
        })}
      </div>

      {/* Real Campaigns Ledger */}
      <Card className="rounded-3xl border-slate-200/80 bg-white p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-black text-slate-900">Your Campaigns Ledger</h3>
          <span className="text-xs font-bold text-slate-400">
            {campaigns.length} {campaigns.length === 1 ? 'record' : 'records'}
          </span>
        </div>

        {campaigns.length > 0 ? (
          <div className="divide-y divide-slate-100 text-xs">
            {campaigns.map((c) => {
              const isExpired = new Date(c.ends_at) < new Date()
              const displayStatus = isExpired ? 'Completed' : c.status

              return (
                <div key={c.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 overflow-hidden flex items-center justify-center shrink-0">
                      {c.products?.images?.[0] ? (
                        <img
                          src={c.products.images[0]}
                          alt={c.title}
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <Package className="w-5 h-5 text-slate-300" />
                      )}
                    </div>
                    <div>
                      <p className="font-bold text-slate-900">{c.title}</p>
                      <p className="text-[11px] text-slate-400">
                        Runs until {new Date(c.ends_at).toLocaleDateString('en-NG', { dateStyle: 'medium' })}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <span className="font-black text-slate-900">₦{Number(c.cost).toLocaleString()}</span>
                    <Badge
                      className={
                        displayStatus === 'active'
                          ? 'bg-emerald-50 text-emerald-700 border-none'
                          : 'bg-slate-100 text-slate-600 border-none'
                      }
                    >
                      {displayStatus}
                    </Badge>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="py-14 text-center bg-slate-50/50 rounded-2xl border border-dashed border-slate-200 space-y-2">
            <Clock className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="font-semibold text-xs text-slate-700">No promotions run yet[cite: 8]</p>
            <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
              Select one of your published electronics and apply your promo credit balance to give it priority visibility[cite: 10, 11].
            </p>
          </div>
        )}
      </Card>

      {/* =========================================================
          LAUNCH PROMOTION MODAL
      ========================================================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-black text-slate-900">Launch New Promotion</h3>
                <p className="text-[11px] text-slate-400">Promote your hardware directly from your Abuja store.</p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-900 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {actionError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{actionError}</span>
              </div>
            )}

            <form onSubmit={handleLaunchPromotion} className="space-y-4">
              {/* Product Picker */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Select Gadget to Promote</label>
                <select
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-xl border border-slate-200 text-xs font-medium bg-white focus:border-blue-600 focus:outline-none"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title} — ₦{Number(p.price).toLocaleString()}
                    </option>
                  ))}
                </select>
              </div>

              {/* Package Selection */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Select Promotion Package</label>
                <div className="space-y-2">
                  {PROMO_PACKAGES.map((pkg) => {
                    const isSelected = selectedPackageId === pkg.id
                    return (
                      <div
                        key={pkg.id}
                        onClick={() => setSelectedPackageId(pkg.id)}
                        className={`p-3 rounded-2xl border text-xs cursor-pointer flex items-center justify-between transition ${
                          isSelected
                            ? 'border-blue-600 bg-blue-50/50 ring-2 ring-blue-500/20'
                            : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div>
                          <p className="font-bold text-slate-900">{pkg.name}</p>
                          <p className="text-[11px] text-slate-500">{pkg.durationDays} Days Duration</p>
                        </div>
                        <span className="font-black text-blue-600">₦{pkg.cost.toLocaleString()}</span>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Deduction Summary */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Current Balance</span>
                  <span className="font-bold text-slate-900">₦{promoBalance.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Package Cost</span>
                  <span className="font-bold text-purple-600">-₦{currentPackage.cost.toLocaleString()}</span>
                </div>
                <div className="flex justify-between border-t border-slate-200 pt-1 font-bold">
                  <span className="text-slate-700">Balance Remaining</span>
                  <span className={promoBalance - currentPackage.cost >= 0 ? 'text-emerald-600' : 'text-red-600'}>
                    ₦{(promoBalance - currentPackage.cost).toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsModalOpen(false)}
                  className="text-xs font-bold rounded-xl h-10"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={submitting || promoBalance < currentPackage.cost}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl h-10 px-5 gap-1.5"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Launching...
                    </>
                  ) : (
                    'Activate Promotion'
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}