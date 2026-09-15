'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { SELLER_PLANS } from '@/lib/plans'
import { initiateSubscriptionUpgrade } from '@/app/actions/subscription'
import { Button } from '@/components/ui/button'
import { Check, Zap, Sparkles, Loader2, AlertCircle, ShieldCheck } from 'lucide-react'

interface SubscriptionPlansProps {
  profile: any
  userEmail: string
}

export function SubscriptionPlans({ profile, userEmail }: SubscriptionPlansProps) {
  const searchParams = useSearchParams()
  const router = useRouter()

  const [loadingTier, setLoadingTier] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isVerifying, setIsVerifying] = useState(false)

  const activePlanKey = profile?.subscription_plan || 'free'
  const expiresAt = profile?.subscription_expires_at
    ? new Date(profile.subscription_expires_at).toLocaleDateString('en-NG', {
        dateStyle: 'medium',
      })
    : null

  // Detect Paystack return and revalidate server data
  useEffect(() => {
    const status = searchParams.get('status')
    const reference = searchParams.get('reference') || searchParams.get('trxref')

    if (status === 'verifying' || reference) {
      setIsVerifying(true)

      const timer = setTimeout(() => {
        router.replace('/seller/subscription')
        router.refresh()
        setIsVerifying(false)
      }, 3500)

      return () => clearTimeout(timer)
    }
  }, [searchParams, router])

  const handleUpgrade = async (planKey: 'standard' | 'professional') => {
    setLoadingTier(planKey)
    setError(null)

    const res = await initiateSubscriptionUpgrade(planKey)

    if (res?.error) {
      setError(res.error)
      setLoadingTier(null)
      return
    }

    if (res?.authorizationUrl) {
      window.location.href = res.authorizationUrl
    }
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-full">
          <Sparkles className="w-3.5 h-3.5" /> BenchTech Seller Growth
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          Store Subscription & Visibility
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 max-w-2xl">
          Expand your catalog capacity, unlock promotional credits, and boost your gadget store
          placement across Abuja.
        </p>
      </div>

      {/* Syncing State Banner */}
      {isVerifying && (
        <div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200/80 text-blue-900 text-xs rounded-2xl font-semibold animate-pulse shadow-sm">
          <Loader2 className="w-4 h-4 animate-spin text-blue-600 shrink-0" />
          <span>Confirming payment with Paystack... Syncing your updated seller quotas now.</span>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 p-3.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-2xl font-medium">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Active Plan Quota Banner */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Current Tier
          </div>
          <div className="text-lg font-black text-slate-900 capitalize flex items-center gap-2">
            {activePlanKey} Plan
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
              <ShieldCheck className="w-3 h-3" /> Active
            </span>
          </div>
          {expiresAt && (
            <p className="text-xs text-slate-500">Renews / Expires: {expiresAt}</p>
          )}
        </div>

        <div className="flex items-center gap-6 border-t md:border-t-0 md:border-l border-slate-100 pt-3 md:pt-0 md:pl-6">
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase">Listings Limit</div>
            <div className="text-sm font-black text-slate-800">
              {profile?.max_listings ?? 5} Slots
            </div>
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase">Images / Item</div>
            <div className="text-sm font-black text-slate-800">
              {profile?.max_images_per_listing ?? 10} Photos
            </div>
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase">Promo Credits</div>
            <div className="text-sm font-black text-blue-600">
              ₦{(profile?.promotional_credits || 0).toLocaleString()}
            </div>
          </div>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {Object.values(SELLER_PLANS).map((plan) => {
          const isCurrent = activePlanKey === plan.id
          const isPaid = plan.price > 0
          const isPro = plan.id === 'professional'

          return (
            <div
              key={plan.id}
              className={`relative rounded-3xl border transition flex flex-col justify-between p-6 ${
                isCurrent
                  ? 'border-blue-600 ring-2 ring-blue-600/10 bg-white shadow-sm'
                  : isPro
                  ? 'border-slate-300 bg-gradient-to-b from-white to-blue-50/20 shadow-sm'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              {isPro && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                  Most Popular
                </span>
              )}

              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-400">
                    {plan.name}
                  </span>
                  {isCurrent && (
                    <span className="text-[10px] font-bold px-2.5 py-0.5 bg-blue-50 text-blue-700 rounded-full border border-blue-200">
                      Your Tier
                    </span>
                  )}
                </div>

                <div>
                  <span className="text-3xl font-black text-slate-900">
                    ₦{plan.price.toLocaleString()}
                  </span>
                  <span className="text-xs text-slate-400 font-bold"> / month</span>
                </div>

                <ul className="space-y-2.5 pt-4 border-t border-slate-100">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2.5 text-xs text-slate-600">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span className="leading-snug">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-8">
                {isCurrent ? (
                  <Button
                    disabled
                    className="w-full text-xs h-11 rounded-xl bg-slate-100 text-slate-400 font-bold"
                  >
                    Active Plan
                  </Button>
                ) : isPaid ? (
                  <Button
                    onClick={() => handleUpgrade(plan.id as 'standard' | 'professional')}
                    disabled={loadingTier !== null || isVerifying}
                    className="w-full text-xs h-11 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold gap-2 shadow-sm transition"
                  >
                    {loadingTier === plan.id ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" /> Initializing...
                      </>
                    ) : (
                      <>
                        <Zap className="w-4 h-4" /> Upgrade via Paystack
                      </>
                    )}
                  </Button>
                ) : (
                  <Button
                    disabled
                    variant="outline"
                    className="w-full text-xs h-11 rounded-xl border-slate-200 font-bold text-slate-400"
                  >
                    Free Default
                  </Button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}