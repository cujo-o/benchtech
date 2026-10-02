import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { AddFundsModal } from '@/components/ads/AddFundsModal'
import {
  Wallet,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  TrendingUp,
  Search,
  Crown,
  Layers,
} from 'lucide-react'

export const dynamic = 'force-dynamic'

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  return createAdminClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

export default async function SellerPromotionsPage({
  searchParams,
}: {
  searchParams: Promise<{ reference?: string; trxref?: string; wallet_topup?: string }>
}) {
  const params = await searchParams
  const reference = params?.reference || params?.trxref
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // 1. Process Paystack Top-Up Verification if returning from Paystack
  let newlyCreditedAmount: number | null = null

  if (reference) {
    const secretKey = process.env.PAYSTACK_SECRET_KEY
    if (secretKey) {
      try {
        const paystackRes = await fetch(
          `https://api.paystack.co/transaction/verify/${reference}`,
          {
            headers: { Authorization: `Bearer ${secretKey}` },
            cache: 'no-store',
          }
        )
        const paystackData = await paystackRes.json()

        if (paystackData.status && paystackData.data?.status === 'success') {
          const txData = paystackData.data
          const topupAmount =
            Number(txData.metadata?.amount) || Number(txData.amount) / 100

          const supabaseAdmin = getSupabaseAdmin()

          const { data: existingTx } = await supabaseAdmin
            .from('ad_wallet_transactions')
            .select('id')
            .eq('reference', reference)
            .maybeSingle()

          if (!existingTx && topupAmount > 0) {
            await supabaseAdmin.from('ad_wallet_transactions').insert({
              seller_id: user.id,
              reference: reference,
              amount: topupAmount,
            })

            const { data: currentWallet } = await supabaseAdmin
              .from('ad_wallets')
              .select('balance')
              .eq('seller_id', user.id)
              .maybeSingle()

            const updatedBalance = Number(currentWallet?.balance || 0) + topupAmount

            await supabaseAdmin.from('ad_wallets').upsert(
              {
                seller_id: user.id,
                balance: updatedBalance,
                updated_at: new Date().toISOString(),
              },
              { onConflict: 'seller_id' }
            )

            newlyCreditedAmount = topupAmount
          }
        }
      } catch (err) {
        console.error('Paystack verification error:', err)
      }
    }
  }

  // 2. Fetch fresh data
  const [{ data: wallet }, { data: campaigns }, { data: attributions }] =
    await Promise.all([
      supabase
        .from('ad_wallets')
        .select('*')
        .eq('seller_id', user.id)
        .maybeSingle(),
      supabase
        .from('ad_campaigns')
        .select('*, ad_campaign_products(product:products(*))')
        .eq('seller_id', user.id)
        .order('created_at', { ascending: false }),
      supabase.from('ad_attributions').select('*').eq('seller_id', user.id),
    ])

  const balance = Number(wallet?.balance || 0).toLocaleString()

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top-up Confirmation Banner */}
      {(newlyCreditedAmount !== null || params?.wallet_topup === 'credited') && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-4 flex items-center justify-between text-emerald-400 animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
            <div>
              <p className="text-xs font-bold text-emerald-950 dark:text-emerald-200">
                Payment Verified &amp; Wallet Credited!
              </p>
              <p className="text-[11px] text-emerald-800 dark:text-emerald-300">
                {newlyCreditedAmount
                  ? `₦${newlyCreditedAmount.toLocaleString()} has been added to your Promotion Wallet.`
                  : 'Your promotion funds have been credited and are ready for CPC bidding.'}
              </p>
            </div>
          </div>
          <Link href="/seller/promotions" className="text-xs font-bold underline text-emerald-600 hover:text-emerald-500">
            Dismiss
          </Link>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100">
              Shopbench Ads
            </h1>
            <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 text-[10px] font-bold">
              BETA
            </Badge>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Reach tech buyers across Abuja. Choose a performance model to increase your sales velocity.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl flex items-center gap-3">
            <Wallet className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Promotion Wallet</p>
              <p className="text-sm font-black text-slate-900 dark:text-slate-100">₦{balance}</p>
            </div>
          </div>
          <AddFundsModal currentBalance={balance} />
        </div>
      </div>

      {/* Hero Banner */}
      <div className="bg-linear-to-r from-blue-900 via-indigo-900 to-slate-900 text-white p-6 sm:p-8 rounded-3xl relative overflow-hidden shadow-md">
        <div className="relative z-10 max-w-xl space-y-2">
          <span className="text-[10px] uppercase font-black tracking-widest text-blue-300">
            Performance Advertising
          </span>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight">
            Turn Your Listings Into Bigger Opportunities
          </h2>
          <p className="text-xs sm:text-sm text-slate-300">
            Pay only when an item sells, or bid on top search keywords across Abuja gadget shoppers.
          </p>
        </div>
      </div>

      {/* The 4 Promotion Options */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Model 1: Pay When You Sell */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-blue-500/60 dark:hover:border-blue-500/60 transition-all rounded-3xl p-5 flex flex-col justify-between space-y-4 shadow-2xs group">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950/70 text-blue-600 flex items-center justify-center">
                <Sparkles className="w-5 h-5" />
              </div>
              <Badge className="bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 text-[10px] font-bold">
                Zero Upfront Risk
              </Badge>
            </div>

            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 group-hover:text-blue-600 transition">
                Promote a Product
              </h3>
              <p className="text-[11px] font-semibold text-blue-600 dark:text-blue-400">Pay When You Sell</p>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              Targeted placement across discovery feeds and category results. You only pay a 2.5% ad fee when an attributed order is completed.
            </p>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1.5 text-[11px] text-slate-600 dark:text-slate-400">
              <p className="flex items-center gap-1.5">✓ 2.5% fee charged on sale only</p>
              <p className="flex items-center gap-1.5">✓ 7-day buyer attribution tracking</p>
              <p className="flex items-center gap-1.5 font-bold text-emerald-600 dark:text-emerald-400">✓ ₦0 charged if no sale occurs</p>
            </div>
          </div>

          <Link href="/seller/promotions/promote-product">
            <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl h-10 shadow-xs cursor-pointer">
              Promote a Product <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </Link>
        </div>

        {/* Model 2: Sponsored Search */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/60 dark:hover:border-emerald-500/60 transition-all rounded-3xl p-5 flex flex-col justify-between space-y-4 shadow-2xs group">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/70 text-emerald-600 flex items-center justify-center">
                <Search className="w-5 h-5" />
              </div>
              <Badge className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 text-[10px] font-bold">
                Cost Per Click
              </Badge>
            </div>

            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 group-hover:text-emerald-600 transition">
                Sponsored Search
              </h3>
              <p className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">Target Keywords</p>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              Place your listings at the top of search results when buyers search for high-intent queries like &quot;iPhone 14&quot; or &quot;HP Spectre&quot;.
            </p>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1.5 text-[11px] text-slate-600 dark:text-slate-400">
              <p className="flex items-center gap-1.5">✓ ₦50 – ₦500 CPC bids</p>
              <p className="flex items-center gap-1.5">✓ ₦2,000 min daily budget</p>
              <p className="flex items-center gap-1.5 font-bold text-emerald-600 dark:text-emerald-400">✓ Deducted from promo wallet</p>
            </div>
          </div>

          <Link href="/seller/promotions/sponsored-search">
            <Button variant="outline" className="w-full border-slate-200 dark:border-slate-700 hover:border-emerald-500 font-bold text-xs rounded-xl h-10 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 cursor-pointer">
              Create Search Ad <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </Link>
        </div>

        {/* Model 3: Premium Placement */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 flex flex-col justify-between space-y-4 shadow-2xs opacity-80">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-2xl bg-purple-50 dark:bg-purple-950/70 text-purple-600 flex items-center justify-center">
                <Crown className="w-5 h-5" />
              </div>
              <Badge variant="outline" className="text-[10px] font-bold text-slate-400">
                Fixed Slot
              </Badge>
            </div>

            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">Premium Placement</h3>
              <p className="text-[11px] font-semibold text-purple-600 dark:text-purple-400">Homepage Showcase</p>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              Guaranteed top hero carousel placement on the Abuja marketplace homepage and deal drops for 7 to 30 days.
            </p>
          </div>

          <Button variant="ghost" disabled className="w-full text-xs font-bold rounded-xl h-10">
            Coming Soon
          </Button>
        </div>

        {/* Model 4: Full Campaign Plan */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 flex flex-col justify-between space-y-4 shadow-2xs opacity-80">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-amber-950/70 text-amber-600 flex items-center justify-center">
                <Layers className="w-5 h-5" />
              </div>
              <Badge variant="outline" className="text-[10px] font-bold text-slate-400">
                Managed
              </Badge>
            </div>

            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">Full Campaign Plan</h3>
              <p className="text-[11px] font-semibold text-amber-600 dark:text-amber-400">Multi-Channel</p>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              Custom marketing bundles combining broadcast pushes, email highlights, and storefront brand takeovers.
            </p>
          </div>

          <Button variant="ghost" disabled className="w-full text-xs font-bold rounded-xl h-10">
            Enterprise Tier
          </Button>
        </div>
      </div>

      {/* Active Campaigns Performance Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 space-y-4 shadow-2xs">
        <div>
          <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-slate-100">
            Campaign Performance
          </h3>
          <p className="text-xs text-slate-400">Track impressions, valid clicks, and attributed sales.</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-bold uppercase text-[10px]">
                <th className="pb-3">Campaign</th>
                <th className="pb-3">Type</th>
                <th className="pb-3">Status</th>
                <th className="pb-3">Daily Budget / Rate</th>
                <th className="pb-3">Total Spend</th>
                <th className="pb-3">Attributed GMV</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {campaigns && campaigns.length > 0 ? (
                campaigns.map((c) => {
                  const gmv = (attributions || [])
                    .filter((a) => a.campaign_id === c.id)
                    .reduce((acc, curr) => acc + Number(curr.gmv_amount || 0), 0)

                  return (
                    <tr key={c.id} className="text-slate-700 dark:text-slate-300">
                      <td className="py-3 font-bold text-slate-900 dark:text-slate-100">
                        <Link
                          href={`/seller/promotions/${c.id}`}
                          className="hover:text-blue-600 dark:hover:text-blue-400 transition flex items-center gap-1"
                        >
                          {c.campaign_name}
                          <ArrowRight className="w-3 h-3 text-slate-400" />
                        </Link>
                      </td>
                      <td className="py-3 capitalize">
                        {c.type === 'promote_product' ? 'Pay When You Sell' : 'Sponsored Search (CPC)'}
                      </td>
                      <td className="py-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            c.status === 'active'
                              ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-300'
                              : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                          }`}
                        >
                          {c.status}
                        </span>
                      </td>
                      <td className="py-3">
                        {c.type === 'promote_product'
                          ? `${c.ad_rate_percentage}% per sale`
                          : `₦${Number(c.daily_budget).toLocaleString()}/day`}
                      </td>
                      <td className="py-3 font-semibold">₦{Number(c.spent_today || 0).toLocaleString()}</td>
                      <td className="py-3 font-bold text-blue-600 dark:text-blue-400">
                        ₦{gmv.toLocaleString()}
                      </td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    No advertising campaigns launched yet. Start by promoting an inventory item above.
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