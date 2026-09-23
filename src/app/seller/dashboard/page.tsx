import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  PackagePlus,
  Boxes,
  ShieldCheck,
  ShieldAlert,
  Crown,
  Percent,
  Megaphone,
  Upload,
  Store,
  FileText,
  Plus,
  Sparkles,
  ArrowUpRight,
  TrendingUp,
  Package,
  CheckCircle2,
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

  const userRoles: string[] = profile?.roles || (profile?.role ? [profile.role] : [])
  const isAdmin = profile?.is_admin === true || profile?.role === 'admin' || userRoles.includes('admin')

  // Fetch live products
  const { data: products, count: totalListings } = await supabase
    .from('products')
    .select('*', { count: 'exact' })
    .eq('seller_id', user.id)
    .order('created_at', { ascending: false })

  // Fetch recent orders
  const { data: orders } = await supabase
    .from('orders')
    .select('*')
    .eq('seller_id', user.id)
    .order('created_at', { ascending: false })
    .limit(5)

  const activeListings = products?.filter((p) => p.status === 'published').length || 0
  const listingCredits = profile?.listing_credits ?? (isPro ? 25 : 0)
  const promoBalance = profile?.promotional_balance ?? (isPro ? 1000 : 0)

  return (
    <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
      {/* =========================================================
          1. PRO HEADER: Sleek, Executive, Tech-Focused
      ========================================================= */}
      {isPro ? (
        <div className="relative overflow-hidden rounded-3xl bg-slate-900 border border-slate-800 text-white p-6 sm:p-8 shadow-sm">
          {/* Subtle background glow */}
          <div className="absolute top-0 right-0 -mt-10 -mr-10 w-72 h-72 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-1/3 -mb-10 w-72 h-72 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wider uppercase bg-amber-400 text-slate-950 shadow-xs">
                  <Crown className="w-3 h-3 fill-slate-950" /> Pro Merchant
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white/10 text-slate-300 border border-white/10">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Priority Indexing Active
                </span>
                <span className="text-xs text-slate-400">
                  {profile.business_name}
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                Pro Seller Dashboard
              </h1>
              <p className="text-xs text-slate-400 max-w-xl">
                Your store receives high-priority discovery in Banex &amp; Wuse searches, reduced 5% commission, and dedicated ad tooling.
              </p>
            </div>

            <div className="flex items-center gap-2.5 shrink-0">
              {isAdmin && (
                <Link href="/admin">
                  <Button
                    variant="outline"
                    className="h-10 px-4 rounded-xl border-purple-500/30 bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 font-bold text-xs gap-1.5"
                  >
                    <ShieldAlert className="w-3.5 h-3.5" /> Admin Console
                  </Button>
                </Link>
              )}

              <Link href="/seller/listings/new">
                <Button className="h-10 px-5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs gap-1.5 shadow-sm">
                  <Plus className="w-4 h-4" /> Add New Listing
                </Button>
              </Link>
            </div>
          </div>

          {/* Pro Benefits Ribbon */}
          <div className="mt-6 pt-5 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Commission Rate</span>
              <span className="font-black text-emerald-400 text-sm">5% Flat</span>
              <span className="text-[10px] text-slate-400 ml-1.5">(Standard: 10%)</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Search Priority</span>
              <span className="font-black text-amber-300 text-sm">Top Tier Boost</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Listing Capacity</span>
              <span className="font-black text-white text-sm">25 Slots Included</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">TechTrust Badge</span>
              <span className="font-black text-blue-400 text-sm capitalize">{profile.tech_trust_status || 'In Review'}</span>
            </div>
          </div>
        </div>
      ) : (
        /* Standard Free Header */
        <div className="p-6 sm:p-8 rounded-3xl border border-slate-200 bg-white shadow-2xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Seller Dashboard
              </h1>
              <Badge className="bg-slate-100 text-slate-700 text-[10px] font-bold uppercase">
                Free Tier
              </Badge>
            </div>
            <p className="text-xs text-slate-500">
              Manage your hardware inventory and buyer orders across Abuja.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <Link href="/seller/subscription">
              <Button variant="outline" className="h-10 px-4 rounded-xl text-xs font-bold border-amber-300 text-amber-900 bg-amber-50/50 hover:bg-amber-100 gap-1.5">
                <Crown className="w-3.5 h-3.5 text-amber-600 fill-amber-500" /> Upgrade to Pro
              </Button>
            </Link>
            <Link href="/seller/listings/new">
              <Button className="h-10 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs gap-1.5">
                <Plus className="w-4 h-4" /> Add Listing
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* =========================================================
          2. TECHTRUST VERIFICATION NOTICE (If Not Verified)
      ========================================================= */}
      {profile?.tech_trust_status !== 'verified' && (
        <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center text-amber-800 shrink-0">
              <ShieldCheck className="w-4 h-4 text-amber-700" />
            </div>
            <div>
              <p className="text-xs font-black text-amber-950">
                {profile?.tech_trust_status === 'pending'
                  ? 'Verification Documents Under Review'
                  : 'Get Verified for the TechTrust Shield'}
              </p>
              <p className="text-[11px] text-amber-800 mt-0.5">
                {profile?.tech_trust_status === 'pending'
                  ? 'Your store documents have been submitted. Final review usually completes within 24 hours.'
                  : 'Upload your business details or CAC/ID to give Abuja buyers confidence.'}
              </p>
            </div>
          </div>

          <Link href="/seller/verify" className="shrink-0 self-end sm:self-auto">
            <Button
              size="sm"
              variant="outline"
              className="h-8 px-3 rounded-xl text-xs font-bold border-amber-300 text-amber-950 bg-white hover:bg-amber-100"
            >
              {profile?.tech_trust_status === 'pending' ? 'Check Status' : 'Start Verification'}
            </Button>
          </Link>
        </div>
      )}

      {/* =========================================================
          3. METRICS CARDS: Clean, Elevated Data Display
      ========================================================= */}
      {isPro ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* Credits */}
          <Card className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-2xs flex flex-col justify-between space-y-2">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Listing Credits</span>
              <div className="w-6 h-6 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <Boxes className="w-3.5 h-3.5" />
              </div>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                {listingCredits} <span className="text-xs font-bold text-slate-400">/ 25</span>
              </p>
              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mt-2">
                <div
                  className="bg-blue-600 h-full rounded-full transition-all"
                  style={{ width: `${Math.min(100, (listingCredits / 25) * 100)}%` }}
                />
              </div>
            </div>
            <p className="text-[10px] text-emerald-600 font-bold">Included in Pro Plan</p>
          </Card>

          {/* Promo Balance */}
          <Card className="rounded-2xl border border-purple-100 bg-white p-4 sm:p-5 shadow-2xs flex flex-col justify-between space-y-2">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-[11px] font-bold uppercase tracking-wider text-purple-600">Promo Balance</span>
              <div className="w-6 h-6 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                <Megaphone className="w-3.5 h-3.5" />
              </div>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-black text-purple-700 tracking-tight">
                ₦{Number(promoBalance).toLocaleString()}
              </p>
              <p className="text-[10px] text-slate-400 mt-1">Available for Spotlight &amp; Hero ads</p>
            </div>
            <Link href="/seller/promotions" className="text-[10px] font-bold text-purple-600 hover:underline flex items-center gap-0.5">
              Launch Ad Boost <ArrowUpRight className="w-2.5 h-2.5" />
            </Link>
          </Card>

          {/* Commission */}
          <Card className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-2xs flex flex-col justify-between space-y-2">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Commission</span>
              <div className="w-6 h-6 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Percent className="w-3.5 h-3.5" />
              </div>
            </div>
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-black text-emerald-600">5%</span>
                <span className="bg-emerald-50 text-emerald-700 text-[9px] font-black px-1.5 py-0.5 rounded-md">
                  50% Lower
                </span>
              </div>
              <p className="text-[10px] text-slate-400 mt-1">Free tier pays 10% per sale</p>
            </div>
            <span className="text-[10px] text-slate-400 font-medium">Automatic at payout</span>
          </Card>

          {/* Pro Subscription */}
          <Card className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-2xs flex flex-col justify-between space-y-2">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Subscription</span>
              <div className="w-6 h-6 rounded-lg bg-amber-50 text-amber-500 flex items-center justify-center">
                <Crown className="w-3.5 h-3.5 fill-amber-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5 text-xs font-black text-emerald-600">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Active Pro Member
              </div>
              <p className="text-[10px] text-slate-400 mt-1">All Pro tools unlocked</p>
            </div>
            <Link href="/seller/subscription" className="text-[10px] font-bold text-blue-600 hover:underline">
              Manage Billing &rarr;
            </Link>
          </Card>
        </div>
      ) : (
        /* Free Metric Cards */
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <Card className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs">
            <span className="text-[11px] font-bold text-slate-400 uppercase">Live Listings</span>
            <p className="text-2xl sm:text-3xl font-black text-slate-900 mt-2">{activeListings}</p>
            <p className="text-[10px] text-slate-400 mt-1">₦250–₦300 per post</p>
          </Card>

          <Card className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs">
            <span className="text-[11px] font-bold text-slate-400 uppercase">Orders</span>
            <p className="text-2xl sm:text-3xl font-black text-slate-900 mt-2">{orders?.length || 0}</p>
            <p className="text-[10px] text-slate-400 mt-1">Completed orders</p>
          </Card>

          <Card className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs">
            <span className="text-[11px] font-bold text-slate-400 uppercase">Commission</span>
            <p className="text-2xl sm:text-3xl font-black text-slate-900 mt-2">10%</p>
            <p className="text-[10px] text-slate-400 mt-1">Standard rate</p>
          </Card>

          <Card className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs flex flex-col justify-between">
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase">Current Tier</span>
              <p className="text-sm font-black text-slate-900 mt-1">Free Seller</p>
            </div>
            <Link href="/seller/subscription" className="text-[10px] font-bold text-blue-600 hover:underline">
              Upgrade to Pro &rarr;
            </Link>
          </Card>
        </div>
      )}

      {/* =========================================================
          4. QUICK ACTIONS
      ========================================================= */}
      <div className="space-y-2">
        <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
          Quick Actions
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-3">
          <Link href="/seller/listings/new">
            <Card className="p-3 text-center rounded-2xl hover:border-blue-500 hover:shadow-xs transition bg-white border border-slate-200/80 flex flex-col items-center gap-1.5 group">
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-105 transition">
                <PackagePlus className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-slate-800">Add Listing</span>
            </Card>
          </Link>

          <Link href={isPro ? '/seller/bulk-upload' : '/seller/subscription'}>
            <Card className="p-3 text-center rounded-2xl hover:border-purple-500 hover:shadow-xs transition bg-white border border-slate-200/80 flex flex-col items-center gap-1.5 group relative">
              {!isPro && (
                <span className="absolute top-1.5 right-1.5 text-[8px] font-black uppercase px-1 rounded-sm bg-purple-100 text-purple-700">
                  Pro
                </span>
              )}
              <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center group-hover:scale-105 transition">
                <Upload className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-slate-800">Bulk Upload</span>
            </Card>
          </Link>

          <Link href={isPro ? '/seller/inventory' : '/seller/subscription'}>
            <Card className="p-3 text-center rounded-2xl hover:border-emerald-500 hover:shadow-xs transition bg-white border border-slate-200/80 flex flex-col items-center gap-1.5 group relative">
              {!isPro && (
                <span className="absolute top-1.5 right-1.5 text-[8px] font-black uppercase px-1 rounded-sm bg-purple-100 text-purple-700">
                  Pro
                </span>
              )}
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-105 transition">
                <Boxes className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-slate-800">Inventory</span>
            </Card>
          </Link>

          <Link href={isPro ? '/seller/promotions' : '/seller/subscription'}>
            <Card className="p-3 text-center rounded-2xl hover:border-amber-500 hover:shadow-xs transition bg-white border border-slate-200/80 flex flex-col items-center gap-1.5 group relative">
              {!isPro && (
                <span className="absolute top-1.5 right-1.5 text-[8px] font-black uppercase px-1 rounded-sm bg-purple-100 text-purple-700">
                  Pro
                </span>
              )}
              <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-105 transition">
                <Megaphone className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-slate-800">Promotions</span>
            </Card>
          </Link>

          <Link href={isPro ? '/seller/reports' : '/seller/subscription'}>
            <Card className="p-3 text-center rounded-2xl hover:border-indigo-500 hover:shadow-xs transition bg-white border border-slate-200/80 flex flex-col items-center gap-1.5 group relative">
              {!isPro && (
                <span className="absolute top-1.5 right-1.5 text-[8px] font-black uppercase px-1 rounded-sm bg-purple-100 text-purple-700">
                  Pro
                </span>
              )}
              <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-105 transition">
                <FileText className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-slate-800">Reports</span>
            </Card>
          </Link>

          <Link href="/seller/store">
            <Card className="p-3 text-center rounded-2xl hover:border-slate-400 hover:shadow-xs transition bg-white border border-slate-200/80 flex flex-col items-center gap-1.5 group">
              <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center group-hover:scale-105 transition">
                <Store className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-slate-800">Storefront</span>
            </Card>
          </Link>
        </div>
      </div>

      {/* =========================================================
          5. RECENT ORDERS & MY LISTINGS SPLIT
      ========================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Orders Card */}
        <Card className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs sm:text-sm font-black text-slate-900">Recent Orders</h3>
            <Link href="/seller/orders" className="text-[11px] font-bold text-blue-600 hover:underline">
              View All
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-semibold text-[10px]">
                  <th className="pb-2">Order</th>
                  <th className="pb-2">Amount</th>
                  <th className="pb-2">Status</th>
                  <th className="pb-2">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-[11px]">
                {orders && orders.length > 0 ? (
                  orders.map((o) => (
                    <tr key={o.id} className="hover:bg-slate-50 transition">
                      <td className="py-2.5 font-bold text-slate-900">#{o.id.slice(0, 6)}</td>
                      <td className="py-2.5 font-bold">₦{Number(o.total_amount).toLocaleString()}</td>
                      <td className="py-2.5">
                        <Badge className="bg-blue-50 text-blue-700 border-none capitalize text-[9px] px-1.5 py-0">
                          {o.status}
                        </Badge>
                      </td>
                      <td className="py-2.5 text-slate-400">{new Date(o.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-slate-400 text-xs">
                      No orders received yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Listings Card */}
        <Card className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs sm:text-sm font-black text-slate-900">My Listings</h3>
            <Link href="/seller/listings" className="text-[11px] font-bold text-blue-600 hover:underline">
              View All ({totalListings || 0})
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {products && products.length > 0 ? (
              products.slice(0, 4).map((item) => (
                <div key={item.id} className="border border-slate-100 rounded-xl p-2 space-y-1.5 bg-slate-50/50">
                  <div className="aspect-square bg-white rounded-lg overflow-hidden flex items-center justify-center p-1 border border-slate-100">
                    {item.images?.[0] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.images[0]} alt={item.title} className="max-h-full object-contain" />
                    ) : (
                      <Package className="w-5 h-5 text-slate-300" />
                    )}
                  </div>
                  <div className="space-y-0.5">
                    <p className="font-bold text-[10px] text-slate-900 truncate">{item.title}</p>
                    <p className="text-[10px] font-black text-blue-600">₦{Number(item.price).toLocaleString()}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full py-8 text-center text-xs text-slate-400">
                No listings published yet.
              </div>
            )}
          </div>
        </Card>
      </div>
    </main>
  )
}