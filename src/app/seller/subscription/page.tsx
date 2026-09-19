'use client'

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Check,
  Crown,
  Sparkles,
  Zap,
  ArrowRight,
  ShieldCheck,
  Layers,
  Loader2,
} from 'lucide-react'

export default function SellerSubscriptionPage() {
  const [currentPlan, setCurrentPlan] = useState<'free' | 'pro'>('free')
  const [loading, setLoading] = useState(false)
  const [userEmail, setUserEmail] = useState('')
  const [userId, setUserId] = useState('')

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    async function loadSeller() {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user) {
        setUserId(user.id)
        setUserEmail(user.email || '')
        const { data: profile } = await supabase
          .from('profiles')
          .select('seller_plan')
          .eq('id', user.id)
          .single()
        if (profile?.seller_plan) {
          setCurrentPlan(profile.seller_plan as 'free' | 'pro')
        }
      }
    }
    loadSeller()
  }, [supabase])

  const handleUpgradeToPro = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/checkout/paystack', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: 5000,
          email: userEmail,
          metadata: {
            purpose: 'seller_subscription',
            seller_id: userId,
            plan: 'pro',
          },
        }),
      })

      const data = await res.json()
      if (data.authorization_url) {
        window.location.href = data.authorization_url
      } else {
        alert(data.message || 'Payment initiation failed')
      }
    } catch {
      alert('Unable to connect to payment gateway')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 md:py-12 space-y-10">
      <div className="text-center space-y-3 max-w-2xl mx-auto">
        <Badge className="bg-blue-50 text-blue-700 border-blue-200 px-3 py-1 text-xs font-bold">
          Seller Plans &amp; Economics
        </Badge>
        <h1 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
          Choose How You Sell on BenchTech
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">
          Start for free and pay per listing, or upgrade to Pro to unlock 25 included listings, reduced commission, and professional management tools.
        </p>
      </div>

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
              <p className="text-xs text-slate-500 mt-1">Start selling tech products with zero monthly commitment.</p>
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
            <Button disabled variant="outline" className="w-full text-xs font-bold rounded-xl h-11">
              {currentPlan === 'free' ? 'Current Active Plan' : 'Downgrade to Free'}
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
              <p className="text-xs text-slate-500 mt-1">Scale your electronics business with pro tools and lower commission.</p>
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

        {/* ENTERPRISE / 3RD PLAN — COMING SOON WITH NO DESCRIPTION */}
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
            <Button disabled variant="outline" className="w-full text-xs font-bold rounded-xl h-11 bg-white/60 text-slate-400 border-slate-200">
              Coming Soon
            </Button>
          </div>
        </Card>
      </div>
    </div>
  )
}