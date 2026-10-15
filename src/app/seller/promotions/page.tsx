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
  Search,
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

  const [{ data: wallet }, { data: campaigns }, { data: attributions }] =
    await Promise.all([
      supabase.from('ad_wallets').select('*').eq('seller_id', user.id).maybeSingle(),
      supabase
        .from('ad_campaigns')
        .select('*, ad_campaign_products(product:products(*))')
        .eq('seller_id', user.id)
        .order('created_at', { ascending: false }),
      supabase.from('ad_attributions').select('*').eq('seller_id', user.id),
    ])

  const balance = Number(wallet?.balance || 0).toLocaleString()

  return (
    <div className="p-3 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full text-slate-900 dark:text-slate-100">
      {/* Top-up Confirmation Banner */}
      {(newlyCreditedAmount !== null || params?.wallet_topup === 'credited') && (
        <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-4 flex items-center justify-between text-emerald-800 dark:text-emerald-200 animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <div>
              <p className="text-xs font-bold">Payment Verified</p>
              <p className="text-[11px] text-emerald-700 dark:text-emerald-300">
                {newlyCreditedAmount
                  ? `₦${newlyCreditedAmount.toLocaleString()} has been added to your promotion balance.`
                  : 'Funds have been credited to your promotion balance.'}
              </p>
            </div>
          </div>
          <Link href="/seller/promotions" className="text-xs font-bold underline text-emerald-700 dark:text-emerald-400">
            Dismiss
          </Link>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            Product Promotions &amp; Ads
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Increase listing visibility across search results and catalog feeds.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl flex items-center gap-3">
            <Wallet className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Promo Balance</p>
              <p className="text-sm font-black text-slate-900 dark:text-slate-100">₦{balance}</p>
            </div>
          </div>
          <AddFundsModal currentBalance={balance} />
        </div>
      </div>

      {/* Promotion Options */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Model 1: Pay On Sale */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition rounded-3xl p-5 flex flex-col justify-between space-y-4 shadow-xs">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <Sparkles className="w-5 h-5" />
              </div>
              <Badge className="bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 text-[10px] font-bold">
                Performance Based
              </Badge>
            </div>

            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                Promote on Sale
              </h3>
              <p className="text-[11px] font-semibold text-blue-600 dark:text-blue-400">Pay When Sold</p>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Featured placement in category feeds. A 2.5% fee applies only when an attributed sale completes.
            </p>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1.5 text-[11px] text-slate-600 dark:text-slate-400">
              <p>• 2.5% fee on completed orders</p>
              <p>• 7-day buyer attribution window</p>
              <p className="font-bold text-slate-900 dark:text-slate-100">• No charge if item does not sell</p>
            </div>
          </div>

          <Link href="/seller/promotions/promote-product">
            <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl h-10 shadow-xs cursor-pointer">
              Promote Listing <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </Link>
        </div>

        {/* Model 2: Sponsored Search */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition rounded-3xl p-5 flex flex-col justify-between space-y-4 shadow-xs">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <Search className="w-5 h-5" />
              </div>
              <Badge className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 text-[10px] font-bold">
                Cost Per Click
              </Badge>
            </div>

            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                Sponsored Search
              </h3>
              <p className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">Keyword Bidding</p>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Place listings at the top of relevant search results when buyers search for specific device models.
            </p>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1.5 text-[11px] text-slate-600 dark:text-slate-400">
              <p>• ₦50 to ₦500 per valid click</p>
              <p>• Custom daily spending limits</p>
              <p className="font-bold text-slate-900 dark:text-slate-100">• Deducted from promotion wallet</p>
            </div>
          </div>

          <Link href="/seller/promotions/sponsored-search">
            <Button variant="outline" className="w-full border-slate-200 dark:border-slate-700 font-bold text-xs rounded-xl h-10 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer">
              Create Search Ad <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </Link>
        </div>

        {/* Model 3: Homepage Spotlight */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 flex flex-col justify-between space-y-4 shadow-xs">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-2xl bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                <Layers className="w-5 h-5" />
              </div>
              <Badge variant="outline" className="text-[10px] font-bold text-slate-400">
                Fixed Placement
              </Badge>
            </div>

            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">Homepage Spotlight</h3>
              <p className="text-[11px] font-semibold text-purple-600 dark:text-purple-400">Storefront Carousel</p>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Direct display on the main marketplace banner. Placement reservations for 7 to 30 days.
            </p>
          </div>

          <Button variant="ghost" disabled className="w-full text-xs font-bold rounded-xl h-10">
            Available Soon
          </Button>
        </div>
      </div>

      {/* Campaigns Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 space-y-4 shadow-xs">
        <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
          <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
            Campaign Performance
          </h3>
          <p className="text-xs text-slate-400">Overview of active placements, impressions, and sales.</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs whitespace-nowrap">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-bold uppercase text-[10px]">
                <th className="pb-3 pr-4">Campaign</th>
                <th className="pb-3 px-4">Type</th>
                <th className="pb-3 px-4">Status</th>
                <th className="pb-3 px-4">Budget / Rate</th>
                <th className="pb-3 px-4">Spend</th>
                <th className="pb-3 pl-4 text-right">Attributed Sales</th>
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
                      <td className="py-3 pr-4 font-bold text-slate-900 dark:text-slate-100">
                        <Link
                          href={`/seller/promotions/${c.id}`}
                          className="hover:text-blue-600 dark:hover:text-blue-400 transition flex items-center gap-1"
                        >
                          {c.campaign_name}
                          <ArrowRight className="w-3 h-3 text-slate-400" />
                        </Link>
                      </td>
                      <td className="py-3 px-4 capitalize">
                        {c.type === 'promote_product' ? 'Pay On Sale' : 'Sponsored Search'}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            c.status === 'active'
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                              : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                          }`}
                        >
                          {c.status}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {c.type === 'promote_product'
                          ? `${c.ad_rate_percentage}% per sale`
                          : `₦${Number(c.daily_budget).toLocaleString()}/day`}
                      </td>
                      <td className="py-3 px-4 font-semibold">₦{Number(c.spent_today || 0).toLocaleString()}</td>
                      <td className="py-3 pl-4 text-right font-bold text-blue-600 dark:text-blue-400">
                        ₦{gmv.toLocaleString()}
                      </td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    No active advertising campaigns.
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