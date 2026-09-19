'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Check, Crown, Zap, Sparkles, Loader2, AlertCircle, ArrowRight } from 'lucide-react'

interface SubscriptionPlansProps {
  profile: any
  userEmail: string
}

export function SubscriptionPlans({ profile, userEmail }: SubscriptionPlansProps) {
  const router = useRouter()
  const currentPlan = profile?.seller_plan === 'pro' || profile?.subscription_tier === 'pro' || profile?.subscription_plan === 'professional' ? 'pro' : 'free'

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleUpgradeToPro = async () => {
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/checkout/paystack', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: 5000,
          email: userEmail,
          metadata: {
            purpose: 'seller_subscription',
            seller_id: profile?.id,
            plan: 'pro',
          },
        }),
      })

      const data = await res.json()

      if (!res.ok || !data.authorization_url) {
        throw new Error(data.message || 'Payment initialization failed.')
      }

      window.location.href = data.authorization_url
    } catch (err: any) {
      setError(err.message || 'Unable to connect to payment gateway')
      setLoading(false)
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 p-4 sm:p-6">
      {/* Header */}
      <div className="text-center space-y-2 max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-full">
          <Sparkles className="w-3.5 h-3.5" /> BenchTech Seller Economics
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          Select Your Store Plan
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">
          Start selling for free with pay-per-listing, or scale your tech business with Pro benefits and reduced commissions.
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-2xl font-medium max-w-md mx-auto">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Plan Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
        {/* FREE PLAN */}
        <Card className={`rounded-3xl bg-white border flex flex-col justify-between p-6 sm:p-7 shadow-xs ${currentPlan === 'free' ? 'border-slate-300 ring-2 ring-slate-200' : 'border-slate-200'}`}>
          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-black text-slate-900">Free Seller</h3>
                {currentPlan === 'free' && (
                  <Badge className="bg-slate-100 text-slate-700 border-slate-200 text-[10px] font-bold">
                    Active Plan
                  </Badge>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-1">Start selling tech with zero monthly commitment.</p>
              <div className="mt-4 flex items-baseline">
                <span className="text-3xl font-black text-slate-900">₦0</span>
                <span className="text-xs text-slate-400 font-bold ml-1">/ month</span>
              </div>
              <p className="text-[11px] text-blue-600 font-semibold mt-1">Pay ₦250–₦300 per listing + 10% commission</p>
            </div>

            <div className="space-y-3 text-xs text-slate-600 border-t border-slate-100 pt-5">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Pay-as-you-list marketplace access</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Standard seller profile &amp; policies</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>In-app buyer enquiries &amp; order processing</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Basic sales stats &amp; inventory tracking</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Full TechTrust verification eligibility</span>
              </div>
            </div>
          </div>

          <div className="pt-8">
            <Button disabled variant="outline" className="w-full text-xs font-bold rounded-xl h-11 bg-slate-50 text-slate-400">
              Current Plan
            </Button>
          </div>
        </Card>

        {/* PRO PLAN */}
        <Card className={`rounded-3xl bg-gradient-to-b from-blue-50/40 to-white border-2 border-blue-600 flex flex-col justify-between p-6 sm:p-7 shadow-xl relative ${currentPlan === 'pro' ? 'ring-4 ring-blue-500/20' : ''}`}>
          <Badge className="absolute -top-3 right-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black text-[10px] uppercase tracking-wider px-3 py-1 shadow-sm">
            RECOMMENDED FOR TECH DEALERS
          </Badge>

          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Crown className="w-5 h-5 text-amber-500 fill-amber-400" />
                  <h3 className="text-lg font-black text-slate-900">Pro Seller</h3>
                </div>
                {currentPlan === 'pro' && (
                  <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] font-bold">
                    Active Plan
                  </Badge>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-1">Scale your electronics business with pro tools &amp; lower commission.</p>
              <div className="mt-4 flex items-baseline">
                <span className="text-3xl font-black text-blue-600">₦5,000</span>
                <span className="text-xs text-slate-400 font-bold ml-1">/ month</span>
              </div>
              <p className="text-[11px] text-emerald-600 font-bold mt-1">Reduced 5% commission + 25 listing credits</p>
            </div>

            <div className="space-y-3 text-xs text-slate-700 border-t border-blue-100 pt-5">
              <div className="flex items-center gap-2 font-bold text-slate-900">
                <Check className="w-4 h-4 text-blue-600 shrink-0" />
                <span>25 included listing credits (₦7,500 value)</span>
              </div>
              <div className="flex items-center gap-2 font-bold text-slate-900">
                <Check className="w-4 h-4 text-blue-600 shrink-0" />
                <span>5% reduced commission rate (save 50%)</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-blue-600 shrink-0" />
                <span>₦2,500 monthly promotional credit</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-blue-600 shrink-0" />
                <span>Branded storefront (banner, custom collections)</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-blue-600 shrink-0" />
                <span>Advanced analytics (trends, conversion rates)</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-blue-600 shrink-0" />
                <span>Bulk CSV upload, editing &amp; duplicate listings</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-blue-600 shrink-0" />
                <span>Priority support queue &amp; Pro Seller badge</span>
              </div>
            </div>
          </div>

          <div className="pt-8">
            <Button
              onClick={handleUpgradeToPro}
              disabled={loading || currentPlan === 'pro'}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black text-xs rounded-xl h-11 shadow-md shadow-blue-500/20 gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Processing...
                </>
              ) : currentPlan === 'pro' ? (
                'Currently Subscribed'
              ) : (
                <>
                  Upgrade to Pro <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </div>
        </Card>

        {/* 3RD TIER — COMING SOON WITH NO DESCRIPTION */}
        <Card className="rounded-3xl bg-slate-50/80 border border-dashed border-slate-300 flex flex-col justify-between p-6 sm:p-7 relative overflow-hidden">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-slate-400">Enterprise</h3>
              <Badge variant="outline" className="bg-white text-slate-500 border-slate-300 text-[10px] font-black uppercase">
                Coming Soon
              </Badge>
            </div>
          </div>

          <div className="pt-8">
            <Button disabled variant="outline" className="w-full text-xs font-bold rounded-xl h-11 bg-white/60 text-slate-400 border-slate-200 cursor-not-allowed">
              Coming Soon
            </Button>
          </div>
        </Card>
      </div>
    </div>
  )
}