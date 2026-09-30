import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  Boxes,
  Percent,
  Megaphone,
  Upload,
  Store,
  FileText,
  Plus,
  Crown,
  Eye,
  ShoppingBag,
  TrendingUp,
  Star,
  Package,
  Wallet,
} from 'lucide-react'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Seller Dashboard | BenchTech Abuja',
}

export default async function SellerDashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login?next=/seller/dashboard')
  }

  // Fetch profile, dynamic platform settings, ad wallet, products, and orders in parallel
  const [
    { data: profile },
    { data: settings },
    { data: adWallet },
    { data: products },
    { data: orders },
  ] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).maybeSingle(),
    supabase.from('platform_settings').select('marketplace_commission_rate').eq('id', 'global_config').maybeSingle(),
    supabase.from('ad_wallets').select('balance').eq('seller_id', user.id).maybeSingle(),
    supabase.from('products').select('*').eq('seller_id', user.id).order('created_at', { ascending: false }),
    supabase.from('orders').select('*').eq('seller_id', user.id).order('created_at', { ascending: false }),
  ])

  if (!profile?.business_name) {
    redirect('/seller/onboarding')
  }

  const isPro =
    profile?.seller_plan === 'pro' ||
    profile?.subscription_tier === 'pro' ||
    profile?.subscription_plan === 'professional'

  const allProducts = products || []
  const allOrders = orders || []

  // Calculations
  const activeListings = allProducts.filter((p) => p.status === 'published').length
  const totalEarnings = allOrders.reduce(
    (acc, curr) => acc + (Number(curr.seller_payout || curr.total_amount) || 0),
    0
  )
  const totalViews = allProducts.reduce(
    (acc, curr) => acc + (Number(curr.views || curr.views_count) || 0),
    0
  )
  const totalOrdersCount = allOrders.length

  const topProducts = [...allProducts]
    .sort((a, b) => (Number(b.views || b.views_count) || 0) - (Number(a.views || a.views_count) || 0))
    .slice(0, 4)

  const listingCredits = profile?.listing_credits ?? (isPro ? 25 : 5)
  // Promotion balance prioritized from ad_wallets, fallback to profile field
  const promoBalance = Number(adWallet?.balance ?? profile?.promotional_balance ?? (isPro ? 2500 : 0))
  const storeRating = profile?.rating ? Number(profile.rating).toFixed(1) : null

  // 7% standard commission rate per spec
  const standardCommission = Number(settings?.marketplace_commission_rate || 7.0)
  const sellerCommission = isPro ? 5.0 : standardCommission

  // =========================================================================
  // VIEW A: PRO SELLER DASHBOARD
  // =========================================================================
  if (isPro) {
    return (
      <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
        {/* Top Header Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-2xs">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
              Pro Seller Dashboard
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Sell more. Grow your store.</p>
          </div>

          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black bg-[#4f46e5] text-white shadow-xs">
              <Crown className="w-3.5 h-3.5 fill-amber-300 text-amber-300" /> Pro Plan Active
            </span>

            <div className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-800">
              <div className="w-9 h-9 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center">
                {(profile?.business_name || profile?.full_name || 'P')?.[0]?.toUpperCase()}
              </div>
              <div className="hidden sm:block text-left text-xs leading-tight">
                <p className="font-black text-slate-900 dark:text-slate-100 truncate max-w-[130px]">
                  {profile?.business_name || profile?.full_name}
                </p>
                <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400">Pro Merchant</span>
              </div>
            </div>
          </div>
        </div>

        {/* 4 Actionable Pro Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* 1. Listing Credits */}
          <Card className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-2xs flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Listing Credits</span>
              <div className="w-7 h-7 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                <Boxes className="w-4 h-4" />
              </div>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
                {activeListings} <span className="text-sm font-bold text-slate-400">/ {listingCredits}</span>
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                {Math.max(0, listingCredits - activeListings)} listing slots remaining
              </p>
            </div>
            <Link href="/seller/listings/new" className="block pt-1">
              <Button size="sm" className="w-full bg-[#4f46e5] hover:bg-[#4338ca] text-white font-bold text-xs h-8 rounded-xl shadow-2xs cursor-pointer">
                Add More Listings
              </Button>
            </Link>
          </Card>

          {/* 2. Promotion Ad Wallet */}
          <Card className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-2xs flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Promotion Wallet</span>
              <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <Megaphone className="w-4 h-4" />
              </div>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
                ₦{promoBalance.toLocaleString()}
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                Available for Sponsored Search CPC ads
              </p>
            </div>
            <Link href="/seller/promotions" className="block pt-1">
              <Button size="sm" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs h-8 rounded-xl shadow-2xs cursor-pointer">
                Manage Ads &amp; Campaigns
              </Button>
            </Link>
          </Card>

          {/* 3. Commission Rate */}
          <Card className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-2xs flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Marketplace Fee</span>
              <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <Percent className="w-4 h-4" />
              </div>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
                {sellerCommission}%
              </p>
              <p className="text-[11px] text-slate-400 mt-1">(vs {standardCommission}% standard rate)</p>
            </div>
            <div className="pt-1">
              <span className="inline-flex items-center gap-1 text-[11px] font-black text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 px-2.5 py-1 rounded-lg">
                ✓ Pro Commission Discount Active
              </span>
            </div>
          </Card>

          {/* 4. Pro Seller Status */}
          <Card className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-2xs flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                <Crown className="w-3.5 h-3.5 text-amber-500 fill-amber-400" /> Pro Verification
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] font-black text-emerald-600 dark:text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Active
              </span>
            </div>
            <div>
              <p className="text-xs text-slate-400 font-semibold">Store Trust</p>
              <p className="text-sm font-black text-slate-900 dark:text-slate-100 mt-0.5 capitalize">
                {profile?.tech_trust_status || 'Verified Abuja Vendor'}
              </p>
            </div>
            <Link href="/seller/subscription" className="block pt-1">
              <Button size="sm" variant="outline" className="w-full border-blue-600 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/50 font-bold text-xs h-8 rounded-xl cursor-pointer">
                Manage Plan
              </Button>
            </Link>
          </Card>
        </div>

        {/* Live Sales Overview + Top Products */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Sales Overview (8 Cols) */}
          <Card className="lg:col-span-8 rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-6 shadow-2xs space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h2 className="text-sm font-black text-slate-900 dark:text-slate-100">Sales Overview</h2>
                <p className="text-[11px] text-slate-400">Actual financial performance from your listings</p>
              </div>
              <Link href="/seller/wallet" className="flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:underline">
                <Wallet className="w-3.5 h-3.5" /> View Payout Wallet →
              </Link>
            </div>

            {/* Metrics Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-left">
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase">Net Settled</span>
                <p className="text-lg sm:text-xl font-black text-slate-900 dark:text-slate-100 mt-0.5">
                  ₦{totalEarnings.toLocaleString()}
                </p>
                <span className="text-[10px] font-medium text-slate-400">Completed payouts</span>
              </div>
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase">Orders</span>
                <p className="text-lg sm:text-xl font-black text-slate-900 dark:text-slate-100 mt-0.5">
                  {totalOrdersCount}
                </p>
                <span className="text-[10px] font-medium text-slate-400">Buyer purchases</span>
              </div>
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase">Listing Views</span>
                <p className="text-lg sm:text-xl font-black text-slate-900 dark:text-slate-100 mt-0.5">
                  {totalViews.toLocaleString()}
                </p>
                <span className="text-[10px] font-medium text-slate-400">Store visits</span>
              </div>
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase">Store Rating</span>
                <div className="flex items-center gap-1 mt-0.5">
                  {storeRating ? (
                    <>
                      <span className="text-lg sm:text-xl font-black text-slate-900 dark:text-slate-100">{storeRating}</span>
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    </>
                  ) : (
                    <span className="text-xs font-bold text-slate-500 py-1">Verified Seller</span>
                  )}
                </div>
                <span className="text-[10px] font-medium text-slate-400">Customer trust index</span>
              </div>
            </div>

            {/* Graph / Empty State */}
            <div className="pt-2">
              {allOrders.length > 0 ? (
                <div className="h-44 w-full flex items-end gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
                  {allOrders.slice(-8).map((ord, idx) => {
                    const maxAmount = Math.max(...allOrders.map((o) => Number(o.total_amount) || 1))
                    const heightPct = Math.max(Math.round(((Number(ord.total_amount) || 0) / maxAmount) * 100), 15)

                    return (
                      <div key={ord.id || idx} className="flex-1 flex flex-col items-center gap-1 group relative">
                        <div className="hidden group-hover:block absolute -top-8 bg-slate-900 dark:bg-slate-800 text-white text-[10px] font-bold px-2 py-0.5 rounded-md whitespace-nowrap z-10 shadow-xs">
                          ₦{Number(ord.total_amount).toLocaleString()}
                        </div>
                        <div
                          className="w-full bg-blue-600 hover:bg-blue-700 transition rounded-t-md"
                          style={{ height: `${heightPct}%` }}
                        />
                        <span className="text-[9px] text-slate-400 truncate w-full text-center">
                          #{ord.id.slice(0, 4)}
                        </span>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="py-12 px-4 text-center bg-slate-50/70 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 space-y-2">
                  <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-400 flex items-center justify-center mx-auto shadow-2xs">
                    <TrendingUp className="w-5 h-5 text-slate-400" />
                  </div>
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">No Sales Recorded Yet</h4>
                  <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                    When buyers complete order checkouts or pick up gadgets in Abuja, transaction volume will plot here automatically.
                  </p>
                </div>
              )}
            </div>
          </Card>

          {/* Top Products (4 Cols) */}
          <Card className="lg:col-span-4 rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-2xs flex flex-col justify-between">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h2 className="text-sm font-black text-slate-900 dark:text-slate-100">Top Products</h2>
              <Link href="/seller/listings" className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline">
                View All
              </Link>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800 my-2">
              {topProducts.length > 0 ? (
                topProducts.map((p) => (
                  <div key={p.id} className="py-2.5 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 flex items-center justify-center shrink-0 overflow-hidden">
                        {p.images?.[0] ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={p.images[0]} alt={p.title} className="max-h-full object-contain" />
                        ) : (
                          <Boxes className="w-4 h-4 text-slate-400" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">{p.title}</p>
                        <p className="text-[10px] text-slate-500 font-semibold">
                          ₦{Number(p.price).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 shrink-0">
                      {p.views || p.views_count || 0} views
                    </span>
                  </div>
                ))
              ) : (
                <div className="py-12 text-center text-xs text-slate-400 space-y-1">
                  <Package className="w-6 h-6 text-slate-300 mx-auto" />
                  <p className="font-semibold text-slate-600 dark:text-slate-400">No live listings</p>
                  <p className="text-[10px] text-slate-400">Add products to start tracking buyer views.</p>
                </div>
              )}
            </div>

            <Link href="/seller/listings/new" className="block pt-2">
              <Button size="sm" variant="outline" className="w-full text-xs font-bold h-8 rounded-xl border-slate-200 dark:border-slate-700 cursor-pointer">
                + Add Another Product
              </Button>
            </Link>
          </Card>
        </div>

        {/* Quick Actions (6 Cards) */}
        <div className="space-y-2">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Quick Actions
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <Link href="/seller/listings/new">
              <Card className="p-3 text-center rounded-2xl hover:border-blue-500 transition bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 flex flex-col items-center gap-1.5 shadow-2xs group">
                <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 flex items-center justify-center group-hover:scale-105 transition">
                  <Plus className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Add Listing</span>
              </Card>
            </Link>

            <Link href="/seller/promotions">
              <Card className="p-3 text-center rounded-2xl hover:border-purple-500 transition bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 flex flex-col items-center gap-1.5 shadow-2xs group relative">
                <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950 text-purple-600 flex items-center justify-center group-hover:scale-105 transition">
                  <Megaphone className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Shopbench Ads</span>
                <span className="text-[8px] font-black uppercase px-1 rounded-sm bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300">New</span>
              </Card>
            </Link>

            <Link href="/seller/wallet">
              <Card className="p-3 text-center rounded-2xl hover:border-emerald-500 transition bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 flex flex-col items-center gap-1.5 shadow-2xs group">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center group-hover:scale-105 transition">
                  <Wallet className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Payouts &amp; Bank</span>
              </Card>
            </Link>

            <Link href="/seller/bulk-upload">
              <Card className="p-3 text-center rounded-2xl hover:border-purple-500 transition bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 flex flex-col items-center gap-1.5 shadow-2xs group relative">
                <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950 text-purple-600 flex items-center justify-center group-hover:scale-105 transition">
                  <Upload className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Bulk Upload</span>
                <span className="text-[8px] font-black uppercase px-1 rounded-sm bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300">Pro</span>
              </Card>
            </Link>

            <Link href="/seller/reports">
              <Card className="p-3 text-center rounded-2xl hover:border-blue-500 transition bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 flex flex-col items-center gap-1.5 shadow-2xs group relative">
                <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 flex items-center justify-center group-hover:scale-105 transition">
                  <FileText className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">View Reports</span>
                <span className="text-[8px] font-black uppercase px-1 rounded-sm bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300">Pro</span>
              </Card>
            </Link>

            <Link href="/seller/store">
              <Card className="p-3 text-center rounded-2xl hover:border-blue-500 transition bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 flex flex-col items-center gap-1.5 shadow-2xs group relative">
                <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 flex items-center justify-center group-hover:scale-105 transition">
                  <Store className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">My Storefront</span>
              </Card>
            </Link>
          </div>
        </div>

        {/* Bottom Banner: Pro Plan */}
        <div className="bg-[#1e1b4b] text-white rounded-3xl p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-5 border border-indigo-900">
          <div className="space-y-3 max-w-2xl">
            <div className="flex items-center gap-2">
              <Crown className="w-5 h-5 text-amber-400 fill-amber-400" />
              <h2 className="text-base font-black text-white">Pro Plan</h2>
            </div>
            <p className="text-xs text-indigo-200">
              All the tools you need to scale your tech dealership across Abuja.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5 text-xs text-indigo-100 pt-1">
              <span className="flex items-center gap-2">✓ 25 additional listings</span>
              <span className="flex items-center gap-2">✓ Professional storefront badge</span>
              <span className="flex items-center gap-2">✓ Lower commission (5% vs 7%)</span>
              <span className="flex items-center gap-2">✓ Bulk upload &amp; editing</span>
              <span className="flex items-center gap-2">✓ Advanced analytics &amp; search bids</span>
              <span className="flex items-center gap-2">✓ ₦2,500 monthly ad credits</span>
            </div>
          </div>

          <Link href="/seller/subscription" className="shrink-0 w-full md:w-auto">
            <Button className="w-full md:w-auto bg-[#4f46e5] hover:bg-[#4338ca] text-white font-bold text-xs h-10 px-5 rounded-xl shadow-xs cursor-pointer">
              View All Features
            </Button>
          </Link>
        </div>
      </main>
    )
  }

  // =========================================================================
  // VIEW B: FREE SELLER DASHBOARD
  // =========================================================================
  return (
    <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            Free Seller Dashboard
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Start selling your tech inventory across Abuja.</p>
        </div>

        <div className="flex items-center gap-3">
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            Free Plan ₦0/month
          </span>

          <div className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-800">
            <div className="w-9 h-9 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center justify-center">
              {(profile?.business_name || profile?.full_name || 'U')?.[0]?.toUpperCase()}
            </div>
            <div className="hidden sm:block text-left text-xs leading-tight">
              <p className="font-bold text-slate-900 dark:text-slate-100 truncate max-w-[120px]">
                {profile?.business_name || profile?.full_name}
              </p>
              <span className="text-[10px] text-slate-500 dark:text-slate-400">Seller</span>
            </div>
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-lg font-black text-slate-900 dark:text-slate-100">
          Welcome back, {profile?.full_name?.split(' ')[0] || 'Seller'}!
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">Here&apos;s an overview of your store performance.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-2xs">
          <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center mb-3">
            <Boxes className="w-4 h-4" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100">{activeListings}</p>
          <span className="text-xs font-bold text-slate-400">Active Listings</span>
        </Card>

        <Card className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-2xs">
          <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 flex items-center justify-center mb-3">
            <ShoppingBag className="w-4 h-4" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100">{totalOrdersCount}</p>
          <span className="text-xs font-bold text-slate-400">Orders Received</span>
        </Card>

        <Card className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-2xs">
          <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950 text-purple-600 flex items-center justify-center mb-3">
            <TrendingUp className="w-4 h-4" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100">₦{totalEarnings.toLocaleString()}</p>
          <span className="text-xs font-bold text-slate-400">Total Net Earnings</span>
        </Card>

        <Card className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-2xs">
          <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950 text-amber-600 flex items-center justify-center mb-3">
            <Eye className="w-4 h-4" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100">{totalViews}</p>
          <span className="text-xs font-bold text-slate-400">Product Views</span>
        </Card>
      </div>

      {/* Free Plan Quick Actions */}
      <div className="space-y-2">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
          Quick Actions
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Link href="/seller/listings/new">
            <Card className="p-3 text-center rounded-2xl hover:border-blue-500 transition bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 flex flex-col items-center gap-1.5 shadow-2xs group">
              <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 flex items-center justify-center group-hover:scale-105 transition">
                <Plus className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Add New Listing</span>
            </Card>
          </Link>

          <Link href="/seller/promotions">
            <Card className="p-3 text-center rounded-2xl hover:border-purple-500 transition bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 flex flex-col items-center gap-1.5 shadow-2xs group">
              <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950 text-purple-600 flex items-center justify-center group-hover:scale-105 transition">
                <Megaphone className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Promote Products (2.5%)</span>
            </Card>
          </Link>

          <Link href="/seller/orders">
            <Card className="p-3 text-center rounded-2xl hover:border-blue-500 transition bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 flex flex-col items-center gap-1.5 shadow-2xs group">
              <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 flex items-center justify-center group-hover:scale-105 transition">
                <ShoppingBag className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">View Orders</span>
            </Card>
          </Link>

          <Link href="/seller/wallet">
            <Card className="p-3 text-center rounded-2xl hover:border-emerald-500 transition bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 flex flex-col items-center gap-1.5 shadow-2xs group">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center group-hover:scale-105 transition">
                <Wallet className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Payouts &amp; Bank</span>
            </Card>
          </Link>
        </div>
      </div>
    </main>
  )
}