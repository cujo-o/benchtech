import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  PackagePlus,
  Boxes,
  Eye,
  ShieldCheck,
  ArrowUpRight,
  Zap,
  Sparkles,
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

  const isPro = profile?.seller_plan === 'pro' || profile?.subscription_tier === 'pro' || profile?.subscription_plan === 'professional'
  const isAdmin = profile?.is_admin === true || profile?.role === 'admin'

  // Fetch listings
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

  const totalEarnings = (orders || []).reduce((acc, curr) => acc + (Number(curr.total_amount) || 0), 0)

  return (
    <div className="space-y-6 sm:space-y-8 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header with Admin Quick Switch */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {isPro ? 'Pro Seller Dashboard' : 'Free Seller Dashboard'}
            </h1>
            <Badge className={`text-[10px] font-black uppercase ${
              isPro ? 'bg-purple-100 text-purple-800' : 'bg-slate-100 text-slate-700'
            }`}>
              {isPro ? 'Pro Active' : 'Free Plan'}
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {isPro ? 'Manage your Abuja technology business and scale sales.' : 'Start listing and selling your tech devices in Abuja.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Admin Switch Button */}
          {isAdmin && (
            <Link href="/admin">
              <Button variant="outline" className="border-purple-300 text-purple-700 bg-purple-50 hover:bg-purple-100 font-bold text-xs gap-1.5 h-10 rounded-xl">
                <ShieldAlert className="w-4 h-4 text-purple-600" /> Admin Dashboard
              </Button>
            </Link>
          )}

          <Link href="/seller/listings/new">
            <Button className="bg-blue-600 hover:bg-blue-700 gap-1.5 font-bold text-xs h-10 rounded-xl shadow-xs">
              <PackagePlus className="w-4 h-4" /> Add New Listing
            </Button>
          </Link>
        </div>
      </div>

      {/* TechTrust Verification Status Banner */}
      {profile?.tech_trust_status !== 'verified' && (
        <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700 shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-amber-900">
                {profile?.tech_trust_status === 'pending'
                  ? 'Verification Under Review'
                  : 'Your store is unverified'}
              </p>
              <p className="text-[11px] text-amber-700 mt-0.5">
                {profile?.tech_trust_status === 'pending'
                  ? 'We are reviewing your business documents. Approval takes under 24 hours.'
                  : 'Complete TechTrust verification to earn the verified badge and boost buyer confidence.'}
              </p>
            </div>
          </div>
          <Link href="/seller/verify" className="shrink-0">
            <Button
              size="sm"
              variant="outline"
              className="text-xs border-amber-300 text-amber-900 bg-white hover:bg-amber-100 font-bold h-8 rounded-xl"
            >
              {profile?.tech_trust_status === 'pending' ? 'Check Status' : 'Verify Store'}
            </Button>
          </Link>
        </div>
      )}

      {/* Pro Economics & Metrics Bar */}
      {isPro ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="rounded-2xl border-slate-200/80 bg-white p-4 shadow-xs space-y-2">
            <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
              <span>Listing Credits</span>
              <Boxes className="w-4 h-4 text-blue-600" />
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black text-slate-900">{listingCredits}</span>
              <span className="text-xs text-slate-400 font-bold">/ 25 remaining</span>
            </div>
            <p className="text-[10px] text-emerald-600 font-semibold">Included in your ₦5,000 plan</p>
          </Card>

          <Card className="rounded-2xl border-slate-200/80 bg-white p-4 shadow-xs space-y-2">
            <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
              <span>Promo Balance</span>
              <Megaphone className="w-4 h-4 text-purple-600" />
            </div>
            <p className="text-2xl font-black text-purple-600">₦{Number(promoBalance).toLocaleString()}</p>
            <p className="text-[10px] text-slate-400">For featured &amp; clearance placement</p>
          </Card>

          <Card className="rounded-2xl border-slate-200/80 bg-white p-4 shadow-xs space-y-2">
            <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
              <span>Commission Rate</span>
              <Percent className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-black text-emerald-600">{commissionRate}%</span>
              <Badge className="bg-emerald-50 text-emerald-700 text-[10px] font-bold">50% Savings</Badge>
            </div>
            <p className="text-[10px] text-slate-400">vs 10% on Free Plan</p>
          </Card>

          <Card className="rounded-2xl border-slate-200/80 bg-white p-4 shadow-xs space-y-2">
            <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
              <span>Subscription</span>
              <Crown className="w-4 h-4 text-amber-500 fill-amber-400" />
            </div>
            <div className="flex items-center gap-1.5 text-xs font-black text-emerald-600">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Active Pro
            </div>
            <Link href="/seller/subscription" className="text-[11px] text-blue-600 font-bold hover:underline block pt-0.5">
              Manage Subscription &rarr;
            </Link>
          </Card>
        </div>
      ) : (
        /* Free Plan Metrics & Capacity */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="rounded-2xl border-slate-200/80 bg-white p-4 shadow-xs">
            <span className="text-xs font-bold text-slate-400">Active Listings</span>
            <p className="text-2xl font-black text-slate-900 mt-1">{activeListings}</p>
            <p className="text-[10px] text-slate-400 mt-0.5">₦250–₦300 per standard listing</p>
          </Card>

          <Card className="rounded-2xl border-slate-200/80 bg-white p-4 shadow-xs">
            <span className="text-xs font-bold text-slate-400">Total Orders</span>
            <p className="text-2xl font-black text-slate-900 mt-1">{orders?.length || 0}</p>
            <p className="text-[10px] text-slate-400 mt-0.5">Completed transactions</p>
          </Card>

          <Card className="rounded-2xl border-slate-200/80 bg-white p-4 shadow-xs">
            <span className="text-xs font-bold text-slate-400">Gross Sales</span>
            <p className="text-2xl font-black text-slate-900 mt-1">₦{totalEarnings.toLocaleString()}</p>
            <p className="text-[10px] text-slate-400 mt-0.5">Standard 10% commission</p>
          </Card>

          <Card className="rounded-2xl border-slate-200/80 bg-white p-4 shadow-xs flex flex-col justify-between">
            <div>
              <span className="text-xs font-bold text-slate-400">Store Tier</span>
              <p className="text-base font-black text-slate-900 mt-1">Free Seller</p>
            </div>
            <Link href="/seller/subscription" className="text-[11px] font-bold text-blue-600 hover:underline">
              Upgrade to Pro &rarr;
            </Link>
          </Card>
        </div>
      )}

      {/* Quick Actions Grid */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Quick Actions</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <Link href="/seller/listings/new">
            <Card className="p-3 text-center rounded-2xl hover:border-blue-500 hover:shadow-xs transition bg-white border-slate-200 flex flex-col items-center gap-1.5">
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <PackagePlus className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-slate-800">Add Listing</span>
            </Card>
          </Link>

          <Link href={isPro ? '/seller/bulk-upload' : '/seller/subscription'}>
            <Card className="p-3 text-center rounded-2xl hover:border-purple-500 hover:shadow-xs transition bg-white border-slate-200 flex flex-col items-center gap-1.5 relative">
              {!isPro && <span className="absolute top-1.5 right-1.5 text-[8px] font-black uppercase px-1 rounded-sm bg-purple-100 text-purple-700">Pro</span>}
              <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <Upload className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-slate-800">Bulk Upload</span>
            </Card>
          </Link>

          <Link href={isPro ? '/seller/inventory' : '/seller/subscription'}>
            <Card className="p-3 text-center rounded-2xl hover:border-emerald-500 hover:shadow-xs transition bg-white border-slate-200 flex flex-col items-center gap-1.5 relative">
              {!isPro && <span className="absolute top-1.5 right-1.5 text-[8px] font-black uppercase px-1 rounded-sm bg-purple-100 text-purple-700">Pro</span>}
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Boxes className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-slate-800">Inventory</span>
            </Card>
          </Link>

          <Link href={isPro ? '/seller/promotions' : '/seller/subscription'}>
            <Card className="p-3 text-center rounded-2xl hover:border-amber-500 hover:shadow-xs transition bg-white border-slate-200 flex flex-col items-center gap-1.5 relative">
              {!isPro && <span className="absolute top-1.5 right-1.5 text-[8px] font-black uppercase px-1 rounded-sm bg-purple-100 text-purple-700">Pro</span>}
              <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <Sparkles className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-slate-800">Promotions</span>
            </Card>
          </Link>

          <Link href={isPro ? '/seller/reports' : '/seller/subscription'}>
            <Card className="p-3 text-center rounded-2xl hover:border-indigo-500 hover:shadow-xs transition bg-white border-slate-200 flex flex-col items-center gap-1.5 relative">
              {!isPro && <span className="absolute top-1.5 right-1.5 text-[8px] font-black uppercase px-1 rounded-sm bg-purple-100 text-purple-700">Pro</span>}
              <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <FileText className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-slate-800">Reports</span>
            </Card>
          </Link>

          <Link href="/seller/store">
            <Card className="p-3 text-center rounded-2xl hover:border-slate-400 hover:shadow-xs transition bg-white border-slate-200 flex flex-col items-center gap-1.5">
              <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
                <Store className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-slate-800">My Storefront</span>
            </Card>
          </Link>
        </div>
      </div>

      {/* Recent Orders & Listings Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders Table */}
        <Card className="rounded-3xl border-slate-200/80 bg-white p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-slate-900">Recent Orders</h3>
            <Link href="/seller/orders" className="text-xs font-bold text-blue-600 hover:underline">
              View All
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-semibold">
                  <th className="pb-2">Order ID</th>
                  <th className="pb-2">Amount</th>
                  <th className="pb-2">Status</th>
                  <th className="pb-2">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders && orders.length > 0 ? (
                  orders.map((o) => (
                    <tr key={o.id} className="hover:bg-slate-50 transition">
                      <td className="py-2.5 font-bold text-slate-900">#{o.id.slice(0, 6)}</td>
                      <td className="py-2.5 font-bold">₦{Number(o.total_amount).toLocaleString()}</td>
                      <td className="py-2.5">
                        <Badge className="bg-blue-50 text-blue-700 border-none capitalize text-[10px]">
                          {o.status}
                        </Badge>
                      </td>
                      <td className="py-2.5 text-slate-400">{new Date(o.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-slate-400">
                      No orders received yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Recent Listings Preview */}
        <Card className="rounded-3xl border-slate-200/80 bg-white p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-slate-900">Recent Listings</h3>
            <Link href="/seller/listings" className="text-xs font-bold text-blue-600 hover:underline">
              View All ({totalListings || 0})
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {products && products.length > 0 ? (
              products.slice(0, 4).map((item) => (
                <div key={item.id} className="border border-slate-100 rounded-2xl p-2.5 space-y-2 bg-slate-50/50">
                  <div className="aspect-square bg-white rounded-xl overflow-hidden flex items-center justify-center p-1">
                    {item.images?.[0] ? (
                      <img src={item.images[0]} alt={item.title} className="max-h-full object-contain" />
                    ) : (
                      <Boxes className="w-5 h-5 text-slate-300" />
                    )}
                  </div>
                  <div className="space-y-0.5">
                    <p className="font-bold text-[11px] text-slate-900 truncate">{item.title}</p>
                    <p className="text-[10px] font-black text-blue-600">₦{Number(item.price).toLocaleString()}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full py-8 text-center text-xs text-slate-400">
                You have no listings yet. Add your first tech device!
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Bottom Upgrade Banner */}
      {!isPro && (
        <div className="bg-gradient-to-r from-blue-700 to-indigo-800 text-white rounded-3xl p-6 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="space-y-1">
            <h4 className="text-base font-black">Ready to scale your tech dealership in Abuja?</h4>
            <p className="text-xs text-blue-100">
              Unlock 25 included listings, drop commission to 5%, and get branded storefront tools with BenchTech Pro.
            </p>
          </div>
          <Link href="/seller/subscription" className="shrink-0">
            <Button className="bg-white text-slate-950 hover:bg-slate-100 font-bold text-xs h-10 px-5 rounded-xl gap-1.5 shadow-md">
              Upgrade for ₦5,000/mo <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </Link>
        </div>
      )}
    </div>
  )
}