import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Wallet,
  Plus,
  Sparkles,
  Search,
  Crown,
  Layers,
  ArrowRight,
  TrendingUp,
} from 'lucide-react'
import { AddFundsModal } from '@/components/ads/AddFundsModal'

export const dynamic = 'force-dynamic'

export default async function SellerPromotionsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: wallet }, { data: campaigns }, { data: attributions }] = await Promise.all([
    supabase.from('ad_wallets').select('*').eq('seller_id', user?.id).maybeSingle(),
    supabase.from('ad_campaigns').select('*, ad_campaign_products(product:products(*))').eq('seller_id', user?.id).order('created_at', { ascending: false }),
    supabase.from('ad_attributions').select('*').eq('seller_id', user?.id),
  ])

  const balance = Number(wallet?.balance || 0).toLocaleString()

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* 1. Header with Ad Wallet Balance */}
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
            Reach more tech shoppers across Abuja. Grow your sales with performance-backed visibility.
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

      {/* 2. Hero Marketing Banner */}
      <div className="bg-linear-to-r from-blue-900 via-indigo-900 to-slate-900 text-white p-6 sm:p-8 rounded-3xl relative overflow-hidden shadow-md">
        <div className="relative z-10 max-w-xl space-y-2">
          <span className="text-[10px] uppercase font-black tracking-widest text-blue-300">
            More Visibility. More Sales.
          </span>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight">
            Turn Your Listings Into Bigger Opportunities
          </h2>
          <p className="text-xs sm:text-sm text-slate-300">
            Choose the right promotion model for your inventory. Pay only when a buyer places an order, or bid on top search keywords.
          </p>
        </div>
      </div>

      {/* 3. The 4 Product Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Promote a Product (PPS) */}
        <div className="bg-white dark:bg-slate-900 border-2 border-blue-500/40 rounded-3xl p-5 flex flex-col justify-between space-y-4 shadow-2xs">
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950/70 text-blue-600 flex items-center justify-center font-black">
              1
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">Shopbench Ads</h3>
              <p className="text-[11px] font-semibold text-blue-600 dark:text-blue-400">(Pay When You Sell)</p>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Get targeted discovery in category pages and search results. Zero upfront costs—you only pay a 2.5% advertising fee when a verified sale occurs.
            </p>
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1.5 text-[11px] text-slate-600 dark:text-slate-400">
              <p className="flex items-center gap-1.5">✓ 2.5% fee per attributed sale</p>
              <p className="flex items-center gap-1.5">✓ 7-day buyer attribution window</p>
              <p className="flex items-center gap-1.5 font-bold text-emerald-600">✓ ₦0 risk if it doesn't sell</p>
            </div>
          </div>
          <Link href="/seller/promotions/promote-product">
            <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl h-10 shadow-xs">
              Promote a Product <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </Link>
        </div>

        {/* Card 2: Sponsored Search (CPC) */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 flex flex-col justify-between space-y-4 shadow-2xs">
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/70 text-emerald-600 flex items-center justify-center font-black">
              2
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">Sponsored Search</h3>
              <p className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">(Pay Per Click)</p>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Place your products at the top position when shoppers search for high-intent terms like "Gaming Laptop" or "iPhone 15".
            </p>
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1.5 text-[11px] text-slate-600 dark:text-slate-400">
              <p className="flex items-center gap-1.5">✓ ₦50 – ₦500 CPC bids</p>
              <p className="flex items-center gap-1.5">✓ ₦2,000 min daily budget</p>
              <p className="flex items-center gap-1.5">✓ Invalid click anti-fraud shield</p>
            </div>
          </div>
          <Link href="/seller/promotions/sponsored-search">
            <Button variant="outline" className="w-full border-slate-200 dark:border-slate-700 font-bold text-xs rounded-xl h-10 hover:bg-emerald-50 dark:hover:bg-emerald-950/40">
              Create Search Ad <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </Link>
        </div>

        {/* Card 3: Premium Placement (Fixed Price) */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 flex flex-col justify-between space-y-4 shadow-2xs opacity-85">
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-50 dark:bg-purple-950/70 text-purple-600 flex items-center justify-center font-black">
              3
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">Premium Placement</h3>
              <p className="text-[11px] font-semibold text-purple-600 dark:text-purple-400">(Fixed Price)</p>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Guaranteed top hero carousel placement on the Abuja marketplace homepage and deal drops for 7 to 30 days.
            </p>
          </div>
          <Button variant="ghost" disabled className="w-full text-xs font-bold rounded-xl h-10">
            Coming Soon
          </Button>
        </div>

        {/* Card 4: Seller Campaign */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 flex flex-col justify-between space-y-4 shadow-2xs opacity-85">
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-amber-950/70 text-amber-600 flex items-center justify-center font-black">
              4
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">Full Campaign Plan</h3>
              <p className="text-[11px] font-semibold text-amber-600 dark:text-amber-400">(Multi-Channel)</p>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Custom marketing bundles combining social blasts, Push notifications, and storefront hero takeovers.
            </p>
          </div>
          <Button variant="ghost" disabled className="w-full text-xs font-bold rounded-xl h-10">
            Enterprise Tier
          </Button>
        </div>
      </div>

      {/* 4. Active Campaigns Performance Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 space-y-4 shadow-2xs">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-slate-100">
              Campaign Performance
            </h3>
            <p className="text-xs text-slate-400">Track impressions, valid clicks, and attributed sales.</p>
          </div>
        </div>

        <Link
  href={`/seller/promotions/${c.id}`}
  className="font-bold text-slate-900 dark:text-slate-100 hover:text-blue-600 transition"
>
  {c.campaign_name} →
</Link>

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
              {campaigns?.length ? (
                campaigns.map((c) => (
                  <tr key={c.id} className="text-slate-700 dark:text-slate-300">
                    <td className="py-3 font-bold text-slate-900 dark:text-slate-100">
                      {c.campaign_name}
                    </td>
                    <td className="py-3 capitalize">
                      {c.type === 'promote_product' ? 'Pay When You Sell' : 'Sponsored Search (CPC)'}
                    </td>
                    <td className="py-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        c.status === 'active' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {c.status}
                      </span>
                    </td>
                    <td className="py-3">
                      {c.type === 'promote_product' ? `${c.ad_rate_percentage}% per sale` : `₦${Number(c.daily_budget).toLocaleString()}/day`}
                    </td>
                    <td className="py-3 font-semibold">₦{Number(c.spent_today || 0).toLocaleString()}</td>
                    <td className="py-3 font-bold text-blue-600">
                      ₦{attributions?.filter(a => a.campaign_id === c.id).reduce((acc, curr) => acc + Number(curr.gmv_amount), 0).toLocaleString() || 0}
                    </td>
                  </tr>
                ))
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