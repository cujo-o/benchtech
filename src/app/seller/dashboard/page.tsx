import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Boxes,
  Wallet,
  Crown,
  ShieldCheck,
  PackagePlus,
  Megaphone,
  ArrowRight,
  Eye,
  ClipboardList,
  Store,
  Settings,
  Package,
} from 'lucide-react'

export const dynamic = 'force-dynamic'

function resolveFirstImage(images: any): string | null {
  if (!images) return null
  if (Array.isArray(images)) return images[0] || null
  if (typeof images === 'string') {
    try {
      const parsed = JSON.parse(images)
      if (Array.isArray(parsed)) return parsed[0] || null
    } catch {
      return images.startsWith('http') ? images : null
    }
  }
  return null
}

export default async function SellerDashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login?next=/seller/dashboard')

  const [
    { data: profile },
    { data: products },
    { data: orders },
    { data: adWallet },
  ] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).maybeSingle(),
    supabase
      .from('products')
      .select('*')
      .eq('seller_id', user.id)
      .order('created_at', { ascending: false }),
    supabase
      .from('orders')
      .select('*, product:products(title)')
      .eq('seller_id', user.id)
      .order('created_at', { ascending: false }),
    supabase
      .from('ad_wallets')
      .select('balance')
      .eq('seller_id', user.id)
      .maybeSingle(),
  ])

  const allProducts = products || []
  const publishedProducts = allProducts.filter((p) => p.status === 'published')
  const allOrders = orders || []

  const isPro =
    profile?.seller_plan === 'pro' ||
    profile?.subscription_tier === 'pro' ||
    profile?.subscription_plan === 'professional'
  const isVerified = profile?.tech_trust_status === 'verified'

  const maxListings = isPro ? 25 : 5
  const remainingSlots = Math.max(0, maxListings - publishedProducts.length)
  const commissionRate = isPro ? '5%' : '7%'

  const availablePayout = Number(profile?.available_payout || 0)
  const promoBalance = Number(adWallet?.balance || 0)

  const settledEarnings = allOrders
    .filter((o) => o.status === 'completed' || o.payout_status === 'paid')
    .reduce((sum, o) => sum + Number(o.seller_payout || 0), 0)

  const pendingProtectionHold = allOrders
    .filter((o) => o.payout_status === 'on_hold')
    .reduce((sum, o) => sum + Number(o.seller_payout || 0), 0)

  const totalViews = allProducts.reduce(
    (sum, p) => sum + Number(p.views || p.view_count || 0),
    0
  )

  const storeName = profile?.business_name || profile?.full_name || 'My Store'

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-blue-600 text-white font-black text-lg flex items-center justify-center overflow-hidden shrink-0 border border-slate-200 dark:border-slate-700">
            {profile?.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profile.avatar_url}
                alt={storeName}
                className="w-full h-full object-cover"
              />
            ) : (
              storeName[0]?.toUpperCase() || 'S'
            )}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                {storeName}
              </h1>
              {isVerified && (
                <Badge className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-[10px] font-bold">
                  <ShieldCheck className="w-3 h-3 mr-1" /> Verified
                </Badge>
              )}
              {isPro && (
                <Badge className="bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300 border border-purple-200 dark:border-purple-800 text-[10px] font-bold">
                  <Crown className="w-3 h-3 mr-1 text-amber-500 fill-amber-400" /> Pro Plan
                </Badge>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {profile?.district ? `${profile.district}, Abuja` : 'Abuja'} • Manage inventory, orders, and payouts
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link href="/seller/listings/new">
            <Button
              size="sm"
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl h-9 px-3.5 gap-1.5 cursor-pointer"
            >
              <PackagePlus className="w-3.5 h-3.5" />
              <span>Add Listing</span>
            </Button>
          </Link>
          <Link href="/seller/store">
            <Button
              size="sm"
              variant="outline"
              className="text-xs font-bold rounded-xl h-9 px-3 border-slate-200 dark:border-slate-700 gap-1.5 cursor-pointer"
            >
              <Store className="w-3.5 h-3.5 text-blue-600" />
              <span>Storefront</span>
            </Button>
          </Link>
          <Link href="/seller/settings">
            <Button
              size="sm"
              variant="outline"
              className="text-xs font-bold rounded-xl h-9 px-2.5 border-slate-200 dark:border-slate-700 cursor-pointer"
              title="Store Settings & Theme"
            >
              <Settings className="w-3.5 h-3.5" />
            </Button>
          </Link>
        </div>
      </div>

      {/* 4 Primary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Listing Slots */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                Active Listings
              </span>
              <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <Boxes className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
              {publishedProducts.length}{' '}
              <span className="text-sm font-bold text-slate-400">/ {maxListings}</span>
            </p>
            <p className="text-[11px] text-slate-400">
              {remainingSlots} listing slots available
            </p>
          </div>
          <Link href="/seller/listings/new">
            <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl h-9 cursor-pointer">
              Add New Listing
            </Button>
          </Link>
        </div>

        {/* Card 2: Sales Settlement Balance */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                Available Payout
              </span>
              <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <Wallet className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400">
              ₦{availablePayout.toLocaleString()}
            </p>
            <p className="text-[11px] text-slate-400">
              Pending Inspection: ₦{pendingProtectionHold.toLocaleString()}
            </p>
          </div>
          <Link href="/seller/wallet">
            <Button
              variant="outline"
              className="w-full border-slate-200 dark:border-slate-700 font-bold text-xs rounded-xl h-9 cursor-pointer"
            >
              Open Payout Wallet
            </Button>
          </Link>
        </div>

        {/* Card 3: Promotion Wallet */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                Promotion Wallet
              </span>
              <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                <Megaphone className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
              ₦{promoBalance.toLocaleString()}
            </p>
            <p className="text-[11px] text-slate-400">
              Available for search &amp; catalog ads
            </p>
          </div>
          <Link href="/seller/promotions">
            <Button
              variant="outline"
              className="w-full border-slate-200 dark:border-slate-700 font-bold text-xs rounded-xl h-9 cursor-pointer"
            >
              Manage Promotions
            </Button>
          </Link>
        </div>

        {/* Card 4: Plan & Commission Rate */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                Commission Rate
              </span>
              <Badge
                className={
                  isPro
                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 text-[10px]'
                    : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 text-[10px]'
                }
              >
                {isPro ? 'Pro Discount Active' : 'Standard Plan'}
              </Badge>
            </div>
            <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
              {commissionRate}
            </p>
            <p className="text-[11px] text-slate-400">
              {isPro
                ? 'Reduced from 7% standard rate'
                : 'Upgrade to Pro for 5% commission'}
            </p>
          </div>
          <Link href="/seller/subscription">
            <Button
              variant="outline"
              className="w-full border-slate-200 dark:border-slate-700 font-bold text-xs rounded-xl h-9 cursor-pointer"
            >
              Manage Subscription
            </Button>
          </Link>
        </div>
      </div>

      {/* Middle Section: Sales Summary + Top Products */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: Sales & Recent Orders */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xs space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div>
              <h2 className="text-sm font-black text-slate-900 dark:text-white">
                Sales &amp; Activity Summary
              </h2>
              <p className="text-xs text-slate-400">
                Performance across your published listings
              </p>
            </div>
            <Link
              href="/seller/orders"
              className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
            >
              <span>All Orders</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
              <span className="text-[10px] font-bold uppercase text-slate-400 block">
                Settled Revenue
              </span>
              <p className="text-base sm:text-lg font-black text-slate-900 dark:text-white mt-1">
                ₦{settledEarnings.toLocaleString()}
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
              <span className="text-[10px] font-bold uppercase text-slate-400 block">
                Total Orders
              </span>
              <p className="text-base sm:text-lg font-black text-slate-900 dark:text-white mt-1">
                {allOrders.length}
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
              <span className="text-[10px] font-bold uppercase text-slate-400 block">
                Listing Views
              </span>
              <p className="text-base sm:text-lg font-black text-slate-900 dark:text-white mt-1">
                {totalViews.toLocaleString()}
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
              <span className="text-[10px] font-bold uppercase text-slate-400 block">
                Store Status
              </span>
              <p className="text-sm font-black text-emerald-600 dark:text-emerald-400 mt-1 capitalize">
                {profile?.tech_trust_status || 'Unverified'}
              </p>
            </div>
          </div>

          {/* Recent Orders List */}
          <div className="space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
              Recent Orders
            </span>
            {allOrders.length > 0 ? (
              allOrders.slice(0, 4).map((o) => (
                <div
                  key={o.id}
                  className="p-3 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="min-w-0">
                    <p className="font-bold text-slate-900 dark:text-white truncate">
                      {o.product?.title || 'Hardware Order'}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Ref: {o.order_number || o.id.slice(0, 8)} •{' '}
                      {new Date(o.created_at).toLocaleDateString('en-NG')}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-black text-emerald-600 dark:text-emerald-400">
                      ₦{Number(o.seller_payout || o.amount || 0).toLocaleString()}
                    </p>
                    <span className="text-[10px] text-slate-400 capitalize">
                      {o.delivery_status?.replace(/_/g, ' ') || 'Pending'}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-6 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-center text-xs text-slate-400">
                No orders yet. Share your storefront or promote a product to reach Abuja shoppers.
              </div>
            )}
          </div>
        </div>

        {/* Right: Top Products */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xs flex flex-col justify-between space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h2 className="text-sm font-black text-slate-900 dark:text-white">
                  Top Products
                </h2>
                <p className="text-xs text-slate-400">
                  Your most viewed active listings
                </p>
              </div>
              <Link
                href="/seller/listings"
                className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline"
              >
                View All
              </Link>
            </div>

            <div className="space-y-2.5">
              {allProducts.length > 0 ? (
                [...allProducts]
                  .sort(
                    (a, b) =>
                      Number(b.views || b.view_count || 0) -
                      Number(a.views || a.view_count || 0)
                  )
                  .slice(0, 4)
                  .map((item) => {
                    const img = resolveFirstImage(item.images)
                    return (
                      <Link
                        key={item.id}
                        href={`/seller/listings/${item.id}/edit`}
                        className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-800 hover:border-blue-500/50 flex items-center justify-between gap-3 transition"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-11 h-11 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center p-1 shrink-0 overflow-hidden">
                            {img ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={img}
                                alt={item.title}
                                className="w-full h-full object-contain"
                              />
                            ) : (
                              <Package className="w-4 h-4 text-slate-400" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                              {item.title}
                            </p>
                            <p className="text-xs font-black text-blue-600 dark:text-blue-400">
                              ₦{Number(item.price).toLocaleString()}
                            </p>
                          </div>
                        </div>

                        <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1 shrink-0">
                          <Eye className="w-3 h-3" />
                          {Number(item.views || item.view_count || 0)}
                        </span>
                      </Link>
                    )
                  })
              ) : (
                <p className="text-xs text-slate-400 py-8 text-center">
                  No products listed yet.
                </p>
              )}
            </div>
          </div>

          <Link href="/seller/listings/new" className="block pt-2">
            <Button
              variant="outline"
              className="w-full border-slate-200 dark:border-slate-700 font-bold text-xs rounded-xl h-10 cursor-pointer"
            >
              + Add Another Product
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}