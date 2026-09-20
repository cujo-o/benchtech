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
  Eye,
  ShieldCheck,
  ShieldAlert,
  Crown,
  Percent,
  Megaphone,
  Upload,
  Store,
  FileText,
  ArrowRight,
  TrendingUp,
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
  const soldListings = products?.filter((p) => p.status === 'sold').length || 0

  const listingCredits = profile?.listing_credits ?? (isPro ? 25 : 0)
  const promoBalance = profile?.promotional_balance ?? (isPro ? 2500 : 0)
  const commissionRate = isPro ? 5 : 10

  const totalEarnings = (orders || []).reduce(
    (acc, curr) => acc + (Number(curr.total_amount) || 0),
    0
  )

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row">
      {/* Responsive Sidebar (Mobile Header + Desktop Sidebar) */}
      <SellerSidebar profile={profile} />

      {/* Main Dashboard Area */}
      <main className="flex-1 min-w-0 p-3 sm:p-6 lg:p-8 space-y-4 sm:space-y-6 max-w-7xl mx-auto w-full">
        {/* Header with Responsive Buttons */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-200/80 shadow-xs">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-2xl font-black text-slate-900 tracking-tight">
                {isPro ? 'Pro Seller Dashboard' : 'Free Seller Dashboard'}
              </h1>
              <Badge className={`text-[9px] sm:text-[10px] font-black uppercase ${
                isPro ? 'bg-purple-100 text-purple-800' : 'bg-slate-100 text-slate-700'
              }`}>
                {isPro ? 'PRO ACTIVE' : 'FREE PLAN'}
              </Badge>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Manage your Abuja technology business and live listings.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            {isAdmin && (
              <Link href="/admin" className="flex-1 sm:flex-initial">
                <Button
                  variant="outline"
                  className="w-full sm:w-auto border-purple-300 text-purple-700 bg-purple-50 hover:bg-purple-100 font-bold text-xs gap-1.5 h-9 rounded-xl"
                >
                  <ShieldAlert className="w-3.5 h-3.5 text-purple-600" /> Admin
                </Button>
              </Link>
            )}

            <Link href="/seller/listings/new" className="flex-1 sm:flex-initial">
              <Button className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 gap-1.5 font-bold text-xs h-9 rounded-xl shadow-xs">
                <PackagePlus className="w-3.5 h-3.5" /> Add Listing
              </Button>
            </Link>
          </div>
        </div>

        {/* TechTrust Verification Status Alert */}
        {profile?.tech_trust_status !== 'verified' && (
          <div className="bg-amber-50/80 border border-amber-200/80 rounded-2xl p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700 shrink-0">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-amber-900">
                  {profile?.tech_trust_status === 'pending'
                    ? 'Verification Under Review'
                    : 'Your store is unverified'}
                </p>
                <p className="text-[11px] text-amber-700 mt-0.5 leading-snug">
                  {profile?.tech_trust_status === 'pending'
                    ? 'Documents uploaded. Approval takes under 24 hours.'
                    : 'Complete TechTrust verification to get the verified badge and build trust.'}
                </p>
              </div>
            </div>
            <Link href="/seller/verify" className="shrink-0 self-end sm:self-auto">
              <Button
                size="sm"
                variant="outline"
                className="text-xs border-amber-300 text-amber-900 bg-white hover:bg-amber-100 font-bold h-7 sm:h-8 rounded-xl"
              >
                {profile?.tech_trust_status === 'pending' ? 'Check Status' : 'Verify Store'}
              </Button>
            </Link>
          </div>
        )}

        {/* Key Metrics Row */}
        {isPro ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
            <Card className="rounded-2xl border-slate-200/80 bg-white p-3 sm:p-4 shadow-xs space-y-1">
              <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
                <span className="text-[10px] sm:text-xs">Credits</span>
                <Boxes className="w-3.5 h-3.5 text-blue-600" />
              </div>
              <p className="text-xl sm:text-2xl font-black text-slate-900">
                {listingCredits} <span className="text-xs font-bold text-slate-400">/ 25</span>
              </p>
              <p className="text-[9px] sm:text-[10px] text-emerald-600 font-semibold truncate">
                Included in ₦5k plan
              </p>
            </Card>

            <Card className="rounded-2xl border-slate-200/80 bg-white p-3 sm:p-4 shadow-xs space-y-1">
              <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
                <span className="text-[10px] sm:text-xs">Promo Balance</span>
                <Megaphone className="w-3.5 h-3.5 text-purple-600" />
              </div>
              <p className="text-xl sm:text-2xl font-black text-purple-600">
                ₦{Number(promoBalance).toLocaleString()}
              </p>
              <p className="text-[9px] sm:text-[10px] text-slate-400 truncate">For featured ads</p>
            </Card>

            <Card className="rounded-2xl border-slate-200/80 bg-white p-3 sm:p-4 shadow-xs space-y-1">
              <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
                <span className="text-[10px] sm:text-xs">Commission</span>
                <Percent className="w-3.5 h-3.5 text-emerald-600" />
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-xl sm:text-2xl font-black text-emerald-600">{commissionRate}%</span>
                <Badge className="bg-emerald-50 text-emerald-700 text-[9px] font-bold px-1 py-0">50% Off</Badge>
              </div>
              <p className="text-[9px] sm:text-[10px] text-slate-400 truncate">vs 10% on Free Plan</p>
            </Card>

            <Card className="rounded-2xl border-slate-200/80 bg-white p-3 sm:p-4 shadow-xs space-y-1">
              <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
                <span className="text-[10px] sm:text-xs">Plan</span>
                <Crown className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
              </div>
              <div className="flex items-center gap-1.5 text-xs font-black text-emerald-600">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Active Pro
              </div>
              <Link href="/seller/subscription" className="text-[10px] text-blue-600 font-bold hover:underline block truncate">
                Manage Plan &rarr;
              </Link>
            </Card>
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
            <Card className="rounded-2xl border-slate-200/80 bg-white p-3 sm:p-4 shadow-xs">
              <span className="text-[10px] sm:text-xs font-bold text-slate-400">Active Listings</span>
              <p className="text-xl sm:text-2xl font-black text-slate-900 mt-1">{activeListings}</p>
              <p className="text-[9px] sm:text-[10px] text-slate-400 mt-0.5">₦250–₦300/listing</p>
            </Card>

            <Card className="rounded-2xl border-slate-200/80 bg-white p-3 sm:p-4 shadow-xs">
              <span className="text-[10px] sm:text-xs font-bold text-slate-400">Total Orders</span>
              <p className="text-xl sm:text-2xl font-black text-slate-900 mt-1">{orders?.length || 0}</p>
              <p className="text-[9px] sm:text-[10px] text-slate-400 mt-0.5">Completed sales</p>
            </Card>

            <Card className="rounded-2xl border-slate-200/80 bg-white p-3 sm:p-4 shadow-xs">
              <span className="text-[10px] sm:text-xs font-bold text-slate-400">Gross Sales</span>
              <p className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
                ₦{totalEarnings.toLocaleString()}
              </p>
              <p className="text-[9px] sm:text-[10px] text-slate-400 mt-0.5">10% commission</p>
            </Card>

            <Card className="rounded-2xl border-slate-200/80 bg-white p-3 sm:p-4 shadow-xs flex flex-col justify-between">
              <div>
                <span className="text-[10px] sm:text-xs font-bold text-slate-400">Plan</span>
                <p className="text-sm sm:text-base font-black text-slate-900 mt-0.5">Free Seller</p>
              </div>
              <Link href="/seller/subscription" className="text-[10px] font-bold text-blue-600 hover:underline">
                Upgrade &rarr;
              </Link>
            </Card>
          </div>
        )}

        {/* Quick Actions Bar */}
        <div className="space-y-2">
          <h3 className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-400">
            Quick Actions
          </h3>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 sm:gap-3">
            <Link href="/seller/listings/new">
              <Card className="p-2 sm:p-3 text-center rounded-xl hover:border-blue-500 transition bg-white border-slate-200 flex flex-col items-center gap-1">
                <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <PackagePlus className="w-3.5 h-3.5" />
                </div>
                <span className="text-[10px] sm:text-xs font-bold text-slate-800 truncate w-full">Add Listing</span>
              </Card>
            </Link>

            <Link href={isPro ? '/seller/bulk-upload' : '/seller/subscription'}>
              <Card className="p-2 sm:p-3 text-center rounded-xl hover:border-purple-500 transition bg-white border-slate-200 flex flex-col items-center gap-1 relative">
                {!isPro && <span className="absolute top-1 right-1 text-[7px] font-black uppercase px-1 rounded-xs bg-purple-100 text-purple-700">Pro</span>}
                <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                  <Upload className="w-3.5 h-3.5" />
                </div>
                <span className="text-[10px] sm:text-xs font-bold text-slate-800 truncate w-full">Bulk Upload</span>
              </Card>
            </Link>

            <Link href={isPro ? '/seller/inventory' : '/seller/subscription'}>
              <Card className="p-2 sm:p-3 text-center rounded-xl hover:border-emerald-500 transition bg-white border-slate-200 flex flex-col items-center gap-1 relative">
                {!isPro && <span className="absolute top-1 right-1 text-[7px] font-black uppercase px-1 rounded-xs bg-purple-100 text-purple-700">Pro</span>}
                <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Boxes className="w-3.5 h-3.5" />
                </div>
                <span className="text-[10px] sm:text-xs font-bold text-slate-800 truncate w-full">Inventory</span>
              </Card>
            </Link>

            <Link href={isPro ? '/seller/promotions' : '/seller/subscription'}>
              <Card className="p-2 sm:p-3 text-center rounded-xl hover:border-amber-500 transition bg-white border-slate-200 flex flex-col items-center gap-1 relative">
                {!isPro && <span className="absolute top-1 right-1 text-[7px] font-black uppercase px-1 rounded-xs bg-purple-100 text-purple-700">Pro</span>}
                <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                  <Megaphone className="w-3.5 h-3.5" />
                </div>
                <span className="text-[10px] sm:text-xs font-bold text-slate-800 truncate w-full">Promotions</span>
              </Card>
            </Link>

            <Link href={isPro ? '/seller/reports' : '/seller/subscription'}>
              <Card className="p-2 sm:p-3 text-center rounded-xl hover:border-indigo-500 transition bg-white border-slate-200 flex flex-col items-center gap-1 relative">
                {!isPro && <span className="absolute top-1 right-1 text-[7px] font-black uppercase px-1 rounded-xs bg-purple-100 text-purple-700">Pro</span>}
                <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <FileText className="w-3.5 h-3.5" />
                </div>
                <span className="text-[10px] sm:text-xs font-bold text-slate-800 truncate w-full">Reports</span>
              </Card>
            </Link>

            <Link href="/seller/store">
              <Card className="p-2 sm:p-3 text-center rounded-xl hover:border-slate-400 transition bg-white border-slate-200 flex flex-col items-center gap-1">
                <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
                  <Store className="w-3.5 h-3.5" />
                </div>
                <span className="text-[10px] sm:text-xs font-bold text-slate-800 truncate w-full">Storefront</span>
              </Card>
            </Link>
          </div>
        </div>

        {/* Recent Orders & Listings Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* Recent Orders */}
          <Card className="rounded-2xl sm:rounded-3xl border-slate-200/80 bg-white p-4 sm:p-5 shadow-xs space-y-3">
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
                        <td className="py-2 font-bold text-slate-900">#{o.id.slice(0, 6)}</td>
                        <td className="py-2 font-bold">₦{Number(o.total_amount).toLocaleString()}</td>
                        <td className="py-2">
                          <Badge className="bg-blue-50 text-blue-700 border-none capitalize text-[9px] px-1.5 py-0">
                            {o.status}
                          </Badge>
                        </td>
                        <td className="py-2 text-slate-400">{new Date(o.created_at).toLocaleDateString()}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="py-6 text-center text-slate-400 text-xs">
                        No orders received yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Recent Listings */}
          <Card className="rounded-2xl sm:rounded-3xl border-slate-200/80 bg-white p-4 sm:p-5 shadow-xs space-y-3">
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
                    <div className="aspect-square bg-white rounded-lg overflow-hidden flex items-center justify-center p-1">
                      {item.images?.[0] ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={item.images[0]} alt={item.title} className="max-h-full object-contain" />
                      ) : (
                        <Boxes className="w-5 h-5 text-slate-300" />
                      )}
                    </div>
                    <div className="space-y-0.5">
                      <p className="font-bold text-[10px] text-slate-900 truncate">{item.title}</p>
                      <p className="text-[10px] font-black text-blue-600">₦{Number(item.price).toLocaleString()}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-full py-6 text-center text-xs text-slate-400">
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