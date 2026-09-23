import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { SellerSidebar } from '@/components/seller/SellerSidebar'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
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
  ArrowRight,
  Package,
} from 'lucide-react'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Seller Dashboard | BenchTech Abuja',
}

export default async function SellerDashboard() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login?next=/seller')
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
    <div className="min-h-screen bg-[#f8fafc] flex flex-col lg:flex-row">
      {/* Responsive Sidebar */}
      <SellerSidebar profile={profile} />

      {/* Main Dashboard Area */}
      <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 space-y-5 max-w-7xl mx-auto w-full">
        {/* =========================================================
            1. DASHBOARD HEADER CARD (Pro vs Free)
        ========================================================= */}
        <div className={`p-6 sm:p-8 rounded-3xl border transition shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 ${
          isPro 
            ? 'bg-white border-slate-200/90' 
            : 'bg-white border-slate-200'
        }`}>
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                {isPro ? 'Pro Seller Dashboard' : 'Seller Dashboard'}
              </h1>
              {isPro ? (
                <Badge className="bg-[#f3e8ff] hover:bg-[#f3e8ff] text-[#9333ea] border-none text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full">
                  PRO ACTIVE
                </Badge>
              ) : (
                <Badge className="bg-slate-100 hover:bg-slate-100 text-slate-600 border-none text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full">
                  FREE PLAN
                </Badge>
              )}
            </div>
            <p className="text-xs text-slate-500 font-medium">
              Manage your Abuja technology business and live listings.
            </p>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            {isAdmin && (
              <Link href="/admin" className="flex-1 sm:flex-initial">
                <Button
                  variant="outline"
                  className="w-full sm:w-auto h-10 px-4 rounded-2xl border-purple-200 bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold text-xs gap-1.5 shadow-2xs"
                >
                  <ShieldAlert className="w-3.5 h-3.5 text-purple-600" /> Admin
                </Button>
              </Link>
            )}

            <Link href="/seller/listings/new" className="flex-1 sm:flex-initial">
              <Button className="w-full sm:w-auto h-10 px-5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs gap-1.5 shadow-xs">
                <Plus className="w-4 h-4" /> Add Listing
              </Button>
            </Link>
          </div>
        </div>

        {/* =========================================================
            2. STORE VERIFICATION ALERT (Matching screenshot)
        ========================================================= */}
        {profile?.tech_trust_status !== 'verified' && (
          <div className="bg-[#fffbeb] border border-[#fef3c7] rounded-3xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-2xl bg-amber-100/80 flex items-center justify-center text-amber-800 shrink-0 mt-0.5">
                <ShieldCheck className="w-4 h-4 text-amber-600" />
              </div>
              <div className="space-y-0.5">
                <p className="text-xs font-black text-amber-950">
                  {profile?.tech_trust_status === 'pending'
                    ? 'Verification Under Review'
                    : 'Store Verification Required'}
                </p>
                <p className="text-[11px] text-amber-800 leading-snug">
                  {profile?.tech_trust_status === 'pending'
                    ? 'Documents uploaded. Approval takes under 24 hours.'
                    : 'Upload identity details to earn the TechTrust Verified badge.'}
                </p>
              </div>
            </div>

            <Link href="/seller/verify" className="shrink-0 self-end sm:self-auto">
              <Button
                size="sm"
                variant="outline"
                className="h-8 px-4 rounded-xl text-xs font-bold border-amber-300 text-amber-900 bg-white hover:bg-amber-50"
              >
                {profile?.tech_trust_status === 'pending' ? 'Check Status' : 'Start Verification'}
              </Button>
            </Link>
          </div>
        )}

        {/* =========================================================
            3. 4-METRIC GRID (Screenshot Layout)
        ========================================================= */}
        {isPro ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {/* Credits Card */}
            <Card className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-2xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500">Credits</span>
                <div className="w-6 h-6 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Boxes className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="my-2">
                <p className="text-2xl sm:text-3xl font-black text-slate-900">
                  {listingCredits} <span className="text-xs font-bold text-slate-400">/25</span>
                </p>
              </div>
              <p className="text-[10px] text-emerald-600 font-bold">
                Included in ₦5k plan
              </p>
            </Card>

            {/* Promo Balance Card */}
            <Card className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-2xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500">Promo Balance</span>
                <div className="w-6 h-6 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                  <Megaphone className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="my-2">
                <p className="text-2xl sm:text-3xl font-black text-[#9333ea]">
                  ₦{Number(promoBalance).toLocaleString()}
                </p>
              </div>
              <p className="text-[10px] text-slate-400 font-medium">
                For featured ads
              </p>
            </Card>

            {/* Commission Card */}
            <Card className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-2xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500">Commission</span>
                <div className="w-6 h-6 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Percent className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="my-2 flex items-center gap-2">
                <span className="text-2xl sm:text-3xl font-black text-emerald-600">5%</span>
                <span className="bg-emerald-50 text-emerald-700 text-[9px] font-black px-1.5 py-0.5 rounded-full">
                  50% Off
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium">
                vs 10% on Free Plan
              </p>
            </Card>

            {/* Plan Card */}
            <Card className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-2xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500">Plan</span>
                <div className="w-6 h-6 rounded-lg bg-amber-50 text-amber-500 flex items-center justify-center">
                  <Crown className="w-3.5 h-3.5 fill-amber-400" />
                </div>
              </div>
              <div className="my-2 flex items-center gap-1.5 text-xs font-black text-emerald-600">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Active Pro</span>
              </div>
              <Link href="/seller/subscription" className="text-[11px] font-bold text-blue-600 hover:underline">
                Manage Plan &rarr;
              </Link>
            </Card>
          </div>
        ) : (
          /* Free Plan Metrics */
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <Card className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-2xs">
              <span className="text-xs font-bold text-slate-400">Active Listings</span>
              <p className="text-2xl sm:text-3xl font-black text-slate-900 mt-2">{activeListings}</p>
              <p className="text-[10px] text-slate-400 mt-1">₦250–₦300/listing</p>
            </Card>

            <Card className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-2xs">
              <span className="text-xs font-bold text-slate-400">Orders</span>
              <p className="text-2xl sm:text-3xl font-black text-slate-900 mt-2">{orders?.length || 0}</p>
              <p className="text-[10px] text-slate-400 mt-1">Completed sales</p>
            </Card>

            <Card className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-2xs">
              <span className="text-xs font-bold text-slate-400">Commission</span>
              <p className="text-2xl sm:text-3xl font-black text-slate-900 mt-2">10%</p>
              <p className="text-[10px] text-slate-400 mt-1">Pay-as-you-sell</p>
            </Card>

            <Card className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-2xs flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold text-slate-400">Current Plan</span>
                <p className="text-sm font-black text-slate-900 mt-1">Free Seller</p>
              </div>
              <Link href="/seller/subscription" className="text-[11px] font-bold text-blue-600 hover:underline">
                Upgrade to Pro &rarr;
              </Link>
            </Card>
          </div>
        )}

        {/* =========================================================
            4. QUICK ACTIONS SECTION
        ========================================================= */}
        <div className="space-y-2.5 pt-1">
          <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Quick Actions
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-3">
            <Link href="/seller/listings/new">
              <Card className="p-3.5 text-center rounded-2xl hover:border-blue-400 hover:shadow-xs transition bg-white border-slate-200/90 flex flex-col items-center gap-1.5 group">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-105 transition">
                  <PackagePlus className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-slate-800">Add Listing</span>
              </Card>
            </Link>

            <Link href={isPro ? '/seller/bulk-upload' : '/seller/subscription'}>
              <Card className="p-3.5 text-center rounded-2xl hover:border-purple-400 hover:shadow-xs transition bg-white border-slate-200/90 flex flex-col items-center gap-1.5 group">
                <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center group-hover:scale-105 transition">
                  <Upload className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-slate-800">Bulk Upload</span>
              </Card>
            </Link>

            <Link href={isPro ? '/seller/inventory' : '/seller/subscription'}>
              <Card className="p-3.5 text-center rounded-2xl hover:border-emerald-400 hover:shadow-xs transition bg-white border-slate-200/90 flex flex-col items-center gap-1.5 group">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-105 transition">
                  <Boxes className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-slate-800">Inventory</span>
              </Card>
            </Link>

            <Link href={isPro ? '/seller/promotions' : '/seller/subscription'}>
              <Card className="p-3.5 text-center rounded-2xl hover:border-amber-400 hover:shadow-xs transition bg-white border-slate-200/90 flex flex-col items-center gap-1.5 group">
                <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-105 transition">
                  <Megaphone className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-slate-800">Promotions</span>
              </Card>
            </Link>

            <Link href={isPro ? '/seller/reports' : '/seller/subscription'}>
              <Card className="p-3.5 text-center rounded-2xl hover:border-indigo-400 hover:shadow-xs transition bg-white border-slate-200/90 flex flex-col items-center gap-1.5 group">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-105 transition">
                  <FileText className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-slate-800">Reports</span>
              </Card>
            </Link>

            <Link href="/seller/store">
              <Card className="p-3.5 text-center rounded-2xl hover:border-slate-400 hover:shadow-xs transition bg-white border-slate-200/90 flex flex-col items-center gap-1.5 group">
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 pt-1">
          {/* Orders */}
          <Card className="rounded-3xl border border-slate-200/90 bg-white p-5 shadow-2xs space-y-3">
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

          {/* Listings */}
          <Card className="rounded-3xl border border-slate-200/90 bg-white p-5 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs sm:text-sm font-black text-slate-900">My Listings</h3>
              <Link href="/seller/listings" className="text-[11px] font-bold text-blue-600 hover:underline">
                View All ({totalListings || 0})
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {products && products.length > 0 ? (
                products.slice(0, 4).map((item) => (
                  <div key={item.id} className="border border-slate-100 rounded-2xl p-2 space-y-1.5 bg-slate-50/50">
                    <div className="aspect-square bg-white rounded-xl overflow-hidden flex items-center justify-center p-1 border border-slate-100/80">
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
    </div>
  )
}