import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { ManagePlanModal } from './ManagePlanModal'
import {
  Crown,
  Boxes,
  Percent,
  TrendingUp,
  ArrowLeft,
  ShieldCheck,
  Store,
  Users,
  Sparkles,
} from 'lucide-react'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Merchant Subscriptions & Pro Plans | BenchTech Admin',
}

export default async function AdminSubscriptionsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login?next=/admin/techpass')

  // Fetch all registered sellers
  const { data: sellers } = await supabase
    .from('profiles')
    .select('*')
    .or('role.eq.seller,seller_plan.eq.pro')
    .order('created_at', { ascending: false })

  const sellerList = sellers || []
  const proSellers = sellerList.filter(
    (s) => s.seller_plan === 'pro' || s.subscription_tier === 'pro'
  )
  const freeSellers = sellerList.filter(
    (s) => s.seller_plan !== 'pro' && s.subscription_tier !== 'pro'
  )

  // Real MRR = Active Pro Merchants * ₦5,000/mo
  const monthlyRate = 5000
  const estimatedMRR = proSellers.length * monthlyRate

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full text-slate-900 dark:text-slate-100">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-2xs">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/overview"
            className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black tracking-tight">
                Merchant Subscriptions &amp; Tiers
              </h1>
              <Badge className="bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300 border border-purple-200 dark:border-purple-800 text-[10px] font-black uppercase">
                Pro Hub
              </Badge>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Manage dealer plans, commission tiers (5% Pro vs 7% Standard), and live recurring SaaS revenue.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
            {sellerList.length} Total Merchants
          </span>
        </div>
      </div>

      {/* 2. Top Metric Cards Strip */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Standard Free Tier */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Standard Seller
            </span>
            <div className="w-7 h-7 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center font-black text-xs">
              {freeSellers.length}
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black tracking-tight">
            ₦0 <span className="text-xs font-bold text-slate-400">/mo</span>
          </p>
          <p className="text-[11px] text-slate-400">
            7% base commission • 5 active listings
          </p>
        </div>

        {/* Card 2: Pro Tier Specification */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-purple-200/80 dark:border-purple-900/60 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black text-purple-700 dark:text-purple-400 uppercase tracking-wider flex items-center gap-1">
              <Crown className="w-3.5 h-3.5 fill-amber-400 text-amber-500" /> Pro Merchant Tier
            </span>
            <Badge className="bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300 border border-purple-200 dark:border-purple-800 text-[10px] font-bold">
              {proSellers.length} Active
            </Badge>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-purple-600 dark:text-purple-400 tracking-tight">
            ₦5,000 <span className="text-xs font-bold text-slate-400">/mo</span>
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            5% commission • 25 listings • Pro storefront badge
          </p>
        </div>

        {/* Card 3: Real Estimated MRR */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Subscription MRR
            </span>
            <div className="w-7 h-7 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight">
            ₦{estimatedMRR.toLocaleString()}
          </p>
          <p className="text-[10px] text-slate-400">
            Recurring platform subscription revenue
          </p>
        </div>
      </div>

      {/* 3. Enrolled Merchants Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div>
            <h3 className="font-black text-sm">Enrolled Merchant Directory</h3>
            <p className="text-xs text-slate-400">Manage plan allocations and listing limits.</p>
          </div>
          <span className="text-xs font-bold text-slate-500">
            {proSellers.length} Pro • {freeSellers.length} Free
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-bold uppercase text-[10px]">
                <th className="pb-3">Store Details</th>
                <th className="pb-3">Contact</th>
                <th className="pb-3">Verification</th>
                <th className="pb-3">Active Tier</th>
                <th className="pb-3">Listing Quota</th>
                <th className="pb-3">Commission Rate</th>
                <th className="pb-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {sellerList.length > 0 ? (
                sellerList.map((seller) => {
                  const isPro =
                    seller.seller_plan === 'pro' || seller.subscription_tier === 'pro'
                  const sellerName =
                    seller.business_name || seller.full_name || 'Vendor Store'

                  return (
                    <tr key={seller.id} className="text-slate-700 dark:text-slate-300">
                      {/* Store Details */}
                      <td className="py-3.5 font-bold text-slate-900 dark:text-slate-100">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center font-bold text-xs shrink-0">
                            {sellerName[0]?.toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <span className="block truncate max-w-[150px]">{sellerName}</span>
                            <span className="text-[10px] text-slate-400 font-normal">
                              {seller.district || 'Abuja'}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Contact */}
                      <td className="py-3.5">
                        <span className="block text-slate-900 dark:text-slate-100">{seller.email || 'No email'}</span>
                        <span className="text-[10px] text-slate-400 font-mono">{seller.phone || '—'}</span>
                      </td>

                      {/* Verification Status */}
                      <td className="py-3.5">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold capitalize ${
                            seller.tech_trust_status === 'verified'
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                              : 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                          }`}
                        >
                          {seller.tech_trust_status === 'verified' ? 'Verified' : 'Unverified'}
                        </span>
                      </td>

                      {/* Tier Badge */}
                      <td className="py-3.5">
                        {isPro ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                            <Crown className="w-2.5 h-2.5 fill-amber-400 text-amber-500" /> Pro Tier
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                            Standard Free
                          </span>
                        )}
                      </td>

                      {/* Listing Quota */}
                      <td className="py-3.5 font-bold">
                        {seller.listing_credits ?? (isPro ? 25 : 5)} slots
                      </td>

                      {/* Marketplace Commission */}
                      <td className="py-3.5 font-black text-slate-900 dark:text-slate-100">
                        {isPro ? (
                          <span className="text-emerald-600 dark:text-emerald-400">5.0%</span>
                        ) : (
                          <span>7.0%</span>
                        )}
                      </td>

                      {/* Manage Plan Action Modal */}
                      <td className="py-3.5 text-right">
                        <ManagePlanModal seller={seller} />
                      </td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No registered vendors found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}