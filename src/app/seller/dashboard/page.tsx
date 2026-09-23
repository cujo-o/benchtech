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
  ChevronDown,
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

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle()

  if (!profile?.business_name) {
    redirect('/seller/onboarding')
  }

  const isPro =
    profile?.seller_plan === 'pro' ||
    profile?.subscription_tier === 'pro' ||
    profile?.subscription_plan === 'professional'

  const { data: products } = await supabase
    .from('products')
    .select('*', { count: 'exact' })
    .eq('seller_id', user.id)
    .order('created_at', { ascending: false })

  const { data: orders } = await supabase
    .from('orders')
    .select('*')
    .eq('seller_id', user.id)
    .order('created_at', { ascending: false })
    .limit(5)

  const activeListings = products?.filter((p) => p.status === 'published').length || 0
  const totalEarnings = (orders || []).reduce(
    (acc, curr) => acc + (Number(curr.total_amount) || 0),
    0
  )

  const listingCredits = profile?.listing_credits ?? (isPro ? 25 : 5)
  const promoBalance = profile?.promotional_balance ?? (isPro ? 1000 : 0)

  // =========================================================================
  // VIEW A: PRO SELLER DASHBOARD
  // =========================================================================
  if (isPro) {
    return (
      <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full bg-[#f8fafc]">
        {/* Top Header Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/90 shadow-2xs">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Pro Seller Dashboard
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">Sell more. Grow your store.</p>
          </div>

          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black bg-[#4f46e5] text-white shadow-xs">
              <Crown className="w-3.5 h-3.5 fill-amber-300 text-amber-300" /> Pro Plan ₦5,000/month
            </span>

            <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
              <div className="w-9 h-9 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center">
                {(profile?.business_name || profile?.full_name || 'P')?.[0]?.toUpperCase()}
              </div>
              <div className="hidden sm:block text-left text-xs leading-tight">
                <p className="font-black text-slate-900 truncate max-w-[130px]">
                  {profile?.business_name || profile?.full_name}
                </p>
                <span className="text-[10px] font-bold text-purple-600">Pro Seller</span>
              </div>
            </div>
          </div>
        </div>

        {/* 4 Actionable Pro Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* 1. Listing Credits */}
          <Card className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500">Listing Credits</span>
              <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                <Boxes className="w-4 h-4" />
              </div>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                {listingCredits} <span className="text-sm font-bold text-slate-400">/ 25</span>
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                {Math.max(0, 25 - listingCredits)} listing credits remaining this month
              </p>
            </div>
            <Link href="/seller/listings/new" className="block pt-1">
              <Button size="sm" className="w-full bg-[#4f46e5] hover:bg-[#4338ca] text-white font-bold text-xs h-8 rounded-xl shadow-2xs">
                Add More Listings
              </Button>
            </Link>
          </Card>

          {/* 2. Promotional Balance */}
          <Card className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500">Promotional Balance</span>
              <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <Megaphone className="w-4 h-4" />
              </div>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                ₦{Number(promoBalance).toLocaleString()}
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                Use credits to promote your products
              </p>
            </div>
            <Link href="/seller/promotions" className="block pt-1">
              <Button size="sm" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs h-8 rounded-xl shadow-2xs">
                Create Promotion
              </Button>
            </Link>
          </Card>

          {/* 3. Your Commission Rate */}
          <Card className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500">Your Commission Rate</span>
              <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Percent className="w-4 h-4" />
              </div>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">5%</p>
              <p className="text-[11px] text-slate-400 mt-1">(vs 10% for Free plan)</p>
            </div>
            <div className="pt-1">
              <span className="inline-flex items-center gap-1 text-[11px] font-black text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg">
                ✓ Lower Commission
              </span>
            </div>
          </Card>

          {/* 4. Pro Seller Status */}
          <Card className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 flex items-center gap-1">
                <Crown className="w-3.5 h-3.5 text-amber-500 fill-amber-400" /> Pro Seller
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] font-black text-emerald-600">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Active
              </span>
            </div>
            <div>
              <p className="text-xs text-slate-400 font-semibold">Next billing date</p>
              <p className="text-sm font-black text-slate-800 mt-0.5">
                {new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </p>
            </div>
            <Link href="/seller/subscription" className="block pt-1">
              <Button size="sm" variant="outline" className="w-full border-blue-600 text-blue-600 hover:bg-blue-50 font-bold text-xs h-8 rounded-xl">
                Manage Plan
              </Button>
            </Link>
          </Card>
        </div>

        {/* Sales Overview Chart + Top Products */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Sales Overview Chart (8 Cols) */}
          <Card className="lg:col-span-8 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-2xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <h2 className="text-sm font-black text-slate-900">Sales Overview</h2>
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-lg">
                <span>Last 30 Days</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-left">
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase">Total Revenue</span>
                <p className="text-lg sm:text-xl font-black text-slate-900 mt-0.5">
                  ₦{(totalEarnings || 2400000).toLocaleString()}
                </p>
                <span className="text-[10px] font-bold text-emerald-600">↑ 18%</span>
              </div>
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase">Orders</span>
                <p className="text-lg sm:text-xl font-black text-slate-900 mt-0.5">
                  {orders?.length || 47}
                </p>
                <span className="text-[10px] font-bold text-emerald-600">↑ 24%</span>
              </div>
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase">Product Views</span>
                <p className="text-lg sm:text-xl font-black text-slate-900 mt-0.5">1,240</p>
                <span className="text-[10px] font-bold text-emerald-600">↑ 32%</span>
              </div>
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase">Store Rating</span>
                <div className="flex items-center gap-1 mt-0.5">
                  <span className="text-lg sm:text-xl font-black text-slate-900">4.8</span>
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                </div>
                <span className="text-[10px] font-bold text-emerald-600">↑ 12%</span>
              </div>
            </div>

            <div className="pt-2">
              <div className="flex justify-end gap-4 text-[10px] font-bold text-slate-500 mb-2">
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-600" /> Revenue
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-purple-500" /> Orders
                </span>
              </div>

              <div className="h-44 w-full relative">
                <svg className="w-full h-full overflow-visible" viewBox="0 0 500 150" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.2" />
                      <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>
                  <line x1="0" y1="30" x2="500" y2="30" stroke="#f1f5f9" strokeWidth="1" />
                  <line x1="0" y1="75" x2="500" y2="75" stroke="#f1f5f9" strokeWidth="1" />
                  <line x1="0" y1="120" x2="500" y2="120" stroke="#f1f5f9" strokeWidth="1" />

                  <path
                    d="M 0 110 Q 70 80, 130 95 T 250 50 T 370 70 T 500 35 L 500 150 L 0 150 Z"
                    fill="url(#revenueGradient)"
                  />
                  <path
                    d="M 0 110 Q 70 80, 130 95 T 250 50 T 370 70 T 500 35"
                    fill="none"
                    stroke="#2563eb"
                    strokeWidth="2.5"
                  />

                  <path
                    d="M 0 130 Q 70 120, 130 110 T 250 85 T 370 95 T 500 70"
                    fill="none"
                    stroke="#8b5cf6"
                    strokeWidth="2"
                    strokeDasharray="4 4"
                  />
                </svg>

                <div className="flex justify-between text-[10px] text-slate-400 font-semibold pt-2">
                  <span>Oct 1</span>
                  <span>Oct 7</span>
                  <span>Oct 14</span>
                  <span>Oct 21</span>
                  <span>Oct 28</span>
                </div>
              </div>
            </div>
          </Card>

          {/* Top Products (4 Cols) */}
          <Card className="lg:col-span-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs flex flex-col justify-between">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-sm font-black text-slate-900">Top Products</h2>
              <Link href="/seller/listings" className="text-xs font-bold text-blue-600 hover:underline">
                View All
              </Link>
            </div>

            <div className="divide-y divide-slate-100 my-2">
              {(products && products.length > 0 ? products.slice(0, 4) : [
                { id: '1', title: 'iPhone 13', price: 450000, views: 320 },
                { id: '2', title: 'HP Laptop', price: 320000, views: 280 },
                { id: '3', title: 'Samsung Monitor', price: 150000, views: 210 },
                { id: '4', title: 'Logitech Mouse', price: 25000, views: 190 },
              ]).map((p: any, idx: number) => (
                <div key={p.id || idx} className="py-2.5 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-slate-100 border border-slate-200/80 flex items-center justify-center shrink-0 overflow-hidden">
                      {p.images?.[0] ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={p.images[0]} alt={p.title} className="max-h-full object-contain" />
                      ) : (
                        <Boxes className="w-4 h-4 text-slate-400" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-900 truncate">{p.title}</p>
                      <p className="text-[10px] text-slate-500 font-semibold">
                        ₦{Number(p.price).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <span className="text-[11px] font-bold text-slate-500 shrink-0">
                    {p.views || (300 - idx * 40)} views
                  </span>
                </div>
              ))}
            </div>

            <Link href="/seller/listings/new" className="block pt-2">
              <Button size="sm" variant="outline" className="w-full text-xs font-bold h-8 rounded-xl border-slate-200">
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
              <Card className="p-3 text-center rounded-2xl hover:border-blue-500 transition bg-white border-slate-200 flex flex-col items-center gap-1.5 shadow-2xs group">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-105 transition">
                  <Plus className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-slate-800">Add New Listing</span>
              </Card>
            </Link>

            <Link href="/seller/bulk-upload">
              <Card className="p-3 text-center rounded-2xl hover:border-purple-500 transition bg-white border-slate-200 flex flex-col items-center gap-1.5 shadow-2xs group relative">
                <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center group-hover:scale-105 transition">
                  <Upload className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-slate-800">Bulk Upload</span>
                <span className="text-[8px] font-black uppercase px-1 rounded-sm bg-purple-100 text-purple-700">Pro</span>
              </Card>
            </Link>

            <Link href="/seller/inventory">
              <Card className="p-3 text-center rounded-2xl hover:border-blue-500 transition bg-white border-slate-200 flex flex-col items-center gap-1.5 shadow-2xs group relative">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-105 transition">
                  <Boxes className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-slate-800">Manage Inventory</span>
                <span className="text-[8px] font-black uppercase px-1 rounded-sm bg-purple-100 text-purple-700">Pro</span>
              </Card>
            </Link>

            <Link href="/seller/promotions">
              <Card className="p-3 text-center rounded-2xl hover:border-purple-500 transition bg-white border-slate-200 flex flex-col items-center gap-1.5 shadow-2xs group relative">
                <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center group-hover:scale-105 transition">
                  <Megaphone className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-slate-800">Create Promotion</span>
                <span className="text-[8px] font-black uppercase px-1 rounded-sm bg-purple-100 text-purple-700">Pro</span>
              </Card>
            </Link>

            <Link href="/seller/reports">
              <Card className="p-3 text-center rounded-2xl hover:border-blue-500 transition bg-white border-slate-200 flex flex-col items-center gap-1.5 shadow-2xs group relative">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-105 transition">
                  <FileText className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-slate-800">View Reports</span>
                <span className="text-[8px] font-black uppercase px-1 rounded-sm bg-purple-100 text-purple-700">Pro</span>
              </Card>
            </Link>

            <Link href="/seller/store">
              <Card className="p-3 text-center rounded-2xl hover:border-blue-500 transition bg-white border-slate-200 flex flex-col items-center gap-1.5 shadow-2xs group relative">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-105 transition">
                  <Store className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-slate-800">Customize Store</span>
                <span className="text-[8px] font-black uppercase px-1 rounded-sm bg-purple-100 text-purple-700">Pro</span>
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
              All the tools you need to scale your tech business.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5 text-xs text-indigo-100 pt-1">
              <span className="flex items-center gap-2">✓ 25 additional listings</span>
              <span className="flex items-center gap-2">✓ Professional storefront</span>
              <span className="flex items-center gap-2">✓ Lower commission</span>
              <span className="flex items-center gap-2">✓ Bulk upload &amp; editing</span>
              <span className="flex items-center gap-2">✓ Advanced analytics</span>
              <span className="flex items-center gap-2">✓ Priority support</span>
              <span className="flex items-center gap-2">✓ Promotional credits</span>
              <span className="flex items-center gap-2">✓ And more...</span>
            </div>
          </div>

          <Link href="/seller/subscription" className="shrink-0 w-full md:w-auto">
            <Button className="w-full md:w-auto bg-[#4f46e5] hover:bg-[#4338ca] text-white font-bold text-xs h-10 px-5 rounded-xl shadow-xs">
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
    <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full bg-[#f8fafc]">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Free Seller Dashboard
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">Start selling your tech products.</p>
        </div>

        <div className="flex items-center gap-3">
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            Free Plan ₦0/month
          </span>

          <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
            <div className="w-9 h-9 rounded-full bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center">
              {(profile?.business_name || profile?.full_name || 'U')?.[0]?.toUpperCase()}
            </div>
            <div className="hidden sm:block text-left text-xs leading-tight">
              <p className="font-bold text-slate-900 truncate max-w-[120px]">
                {profile?.business_name || profile?.full_name}
              </p>
              <span className="text-[10px] text-slate-500">Seller</span>
            </div>
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-lg font-black text-slate-900">
          Welcome back, {profile?.full_name?.split(' ')[0] || 'Seller'}!
        </h2>
        <p className="text-xs text-slate-500">Here&apos;s an overview of your store.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs">
          <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
            <Boxes className="w-4 h-4" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-slate-900">{activeListings}</p>
          <span className="text-xs font-bold text-slate-400">Active Listings</span>
        </Card>

        <Card className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs">
          <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
            <ShoppingBag className="w-4 h-4" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-slate-900">{orders?.length || 0}</p>
          <span className="text-xs font-bold text-slate-400">Orders</span>
        </Card>

        <Card className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs">
          <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-3">
            <TrendingUp className="w-4 h-4" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-slate-900">₦{totalEarnings.toLocaleString()}</p>
          <span className="text-xs font-bold text-slate-400">Total Earnings</span>
        </Card>

        <Card className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs">
          <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-3">
            <Eye className="w-4 h-4" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-slate-900">24</p>
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
            <Card className="p-3 text-center rounded-2xl hover:border-blue-500 transition bg-white border-slate-200 flex flex-col items-center gap-1.5 shadow-2xs group">
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-105 transition">
                <Plus className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-slate-800">Add New Listing</span>
            </Card>
          </Link>

          <Link href="/seller/orders">
            <Card className="p-3 text-center rounded-2xl hover:border-blue-500 transition bg-white border-slate-200 flex flex-col items-center gap-1.5 shadow-2xs group">
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-105 transition">
                <ShoppingBag className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-slate-800">View Orders</span>
            </Card>
          </Link>

          <Link href="/seller/enquiries">
            <Card className="p-3 text-center rounded-2xl hover:border-blue-500 transition bg-white border-slate-200 flex flex-col items-center gap-1.5 shadow-2xs group">
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-105 transition">
                <Eye className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-slate-800">Check Messages</span>
            </Card>
          </Link>

          <Link href="/seller/reports">
            <Card className="p-3 text-center rounded-2xl hover:border-blue-500 transition bg-white border-slate-200 flex flex-col items-center gap-1.5 shadow-2xs group">
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-105 transition">
                <TrendingUp className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-slate-800">View Earnings</span>
            </Card>
          </Link>
        </div>
      </div>
    </main>
  )
}