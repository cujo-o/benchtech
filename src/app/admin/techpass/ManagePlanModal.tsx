'use client'

import { useState } from 'react'
import { updateSellerSubscription } from '@/app/admin/actions'
import { Button } from '@/components/ui/button'
import {
  Crown,
  X,
  Loader2,
  Check,
  Boxes,
  Percent,
} from 'lucide-react'

interface ManagePlanModalProps {
  seller: {
    id: string
    business_name?: string
    full_name?: string
    email?: string
    seller_plan?: string
    subscription_tier?: string
    listing_credits?: number
  }
}

export function ManagePlanModal({ seller }: ManagePlanModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [plan, setPlan] = useState<'free' | 'pro'>(
    seller.seller_plan === 'pro' || seller.subscription_tier === 'pro' ? 'pro' : 'free'
  )
  const [credits, setCredits] = useState<number>(seller.listing_credits ?? (plan === 'pro' ? 25 : 5))
  const [loading, setLoading] = useState(false)

  const sellerName = seller.business_name || seller.full_name || 'Vendor'

  async function handleSave() {
    setLoading(true)
    const res = await updateSellerSubscription(seller.id, plan, credits)
    setLoading(false)

    if (res.success) {
      setIsOpen(false)
    } else {
      alert(res.error || 'Failed to update plan')
    }
  }

  return (
    <>
      <Button
        size="sm"
        variant="outline"
        onClick={() => setIsOpen(true)}
        className="text-xs font-bold h-8 px-3 rounded-xl border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
      >
        Manage Plan
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs animate-in fade-in"
            onClick={() => setIsOpen(false)}
          />

          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl z-10 space-y-5 animate-in zoom-in-95 duration-150 text-slate-900 dark:text-slate-100">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="font-black text-sm">Manage Merchant Plan</h3>
                <p className="text-xs text-slate-400 mt-0.5 truncate max-w-[260px]">
                  {sellerName} • {seller.email}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Plan Tier Selector */}
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Select Subscription Tier
              </label>

              <div className="grid grid-cols-2 gap-3">
                {/* Free Tier */}
                <div
                  onClick={() => {
                    setPlan('free')
                    setCredits(5)
                  }}
                  className={`p-3.5 rounded-2xl border cursor-pointer transition flex flex-col justify-between space-y-2 ${
                    plan === 'free'
                      ? 'border-slate-900 dark:border-slate-100 bg-slate-50 dark:bg-slate-800/80 shadow-2xs ring-1 ring-slate-900 dark:ring-slate-100'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs">Standard Free</span>
                    {plan === 'free' && <Check className="w-3.5 h-3.5 text-blue-600" />}
                  </div>
                  <p className="text-lg font-black">₦0 <span className="text-[10px] text-slate-400 font-normal">/mo</span></p>
                  <span className="text-[10px] text-slate-400">7% commission • 5 listings</span>
                </div>

                {/* Pro Tier */}
                <div
                  onClick={() => {
                    setPlan('pro')
                    setCredits(25)
                  }}
                  className={`p-3.5 rounded-2xl border cursor-pointer transition flex flex-col justify-between space-y-2 ${
                    plan === 'pro'
                      ? 'border-purple-600 bg-purple-50/50 dark:bg-purple-950/40 shadow-2xs ring-1 ring-purple-600'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-purple-600 dark:text-purple-400 flex items-center gap-1">
                      <Crown className="w-3.5 h-3.5 fill-amber-400 text-amber-500" /> Pro Tier
                    </span>
                    {plan === 'pro' && <Check className="w-3.5 h-3.5 text-purple-600" />}
                  </div>
                  <p className="text-lg font-black text-purple-600 dark:text-purple-300">
                    ₦5,000 <span className="text-[10px] text-slate-400 font-normal">/mo</span>
                  </p>
                  <span className="text-[10px] text-purple-700 dark:text-purple-300 font-medium">5% commission • 25 listings</span>
                </div>
              </div>
            </div>

            {/* Manual Listing Credits Override */}
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <Boxes className="w-3.5 h-3.5 text-blue-600" /> Active Listing Credits
                </label>
                <span className="text-xs font-black">{credits} slots</span>
              </div>
              <input
                type="number"
                min="1"
                max="200"
                value={credits}
                onChange={(e) => setCredits(Math.max(1, Number(e.target.value)))}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-purple-500"
              />
              <p className="text-[10px] text-slate-400">
                Number of simultaneous gadgets this vendor can publish in the Abuja catalog.
              </p>
            </div>

            {/* Commit Button */}
            <Button
              onClick={handleSave}
              disabled={loading}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs h-11 rounded-xl shadow-xs cursor-pointer gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving Changes...
                </>
              ) : (
                <>Apply Subscription Changes →</>
              )}
            </Button>
          </div>
        </div>
      )}
    </>
  )
}