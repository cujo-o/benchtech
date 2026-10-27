import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Wallet,
  Boxes,
  ClipboardList,
  Plus,
  ShieldCheck,
  Clock,
  TrendingUp,
  ArrowRight,
  Store,
  Megaphone,
} from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function SellerDashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login?next=/seller/dashboard')
  }

  const [{ data: profile }, { data: products }, { data: orders }, { data: enquiries }] =
    await Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).maybeSingle(),
      supabase
        .from('products')
        .select('id, title, price, status, condition, created_at')
        .eq('seller_id', user.id)
        .order('created_at', { ascending: false }),
      supabase
        .from('orders')
        .select('*, product:products(title), buyer:profiles!orders_buyer_id_fkey(full_name, district)')
        .eq('seller_id', user.id)
        .order('created_at', { ascending: false }),
      supabase
        .from('enquiries')
        .select('id, status')
        .eq('seller_id', user.id)
        .eq('status', 'new'),
    ])

  const allProducts = products || []
  const allOrders = orders || []
  const storeName = profile?.business_name || profile?.full_name || 'My Store'
  const isVerified = profile?.tech_trust_status === 'verified'

  const activeListingsCount = allProducts.filter((p) => p.status === 'published').length
  const availablePayout = Number(profile?.available_payout || 0)

  const heldInInspection = allOrders
    .filter((o) => o.payout_status === 'on_hold')
    .reduce((sum, o) => sum + Number(o.seller_payout || 0), 0)

  const pendingDispatchCount = allOrders.filter(
    (o) =>
      o.delivery_status !== 'verified' &&
      o.order_status !== 'cancelled' &&
      o.order_status !== 'refunded'
  ).length

  const totalCompletedSales = allOrders
    .filter((o) => o.order_status === 'completed' || o.payout_status === 'paid')
    .reduce((sum, o) => sum + Number(o.seller_payout || 0), 0)

  return (
    <div className="space-y-6">
      {/* Top Store Banner */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white">
              {storeName}
            </h1>
            {isVerified ? (
              <Badge className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-[10px] font-bold flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" />
                <span>Verified Store</span>
              </Badge>
            ) : (
              <Link href="/seller/onboarding">
                <Badge className="bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border border-amber-200 text-[10px] font-bold cursor-pointer">
                  Verification Pending
                </Badge>
              </Link>
            )}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Manage your Abuja hardware inventory, dispatch paid orders, and track bank payouts.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link href="/seller/listings/new">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl h-10 px-4 gap-1.5 cursor-pointer">
              <Plus className="w-4 h-4" />
              <span>Add Listing</span>
            </Button>
          </Link>
          <Link href={`/sellers/${user.id}`} target="_blank">
            <Button
              variant="outline"
              className="text-xs font-bold rounded-xl h-10 px-4 border-slate-200 dark:border-slate-700 gap-1.5 cursor-pointer"
            >
              <Store className="w-3.5 h-3.5" />
              <span>Public Store</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* 4 Key Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Available to Withdraw
            </span>
            <Wallet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white">
            ₦{availablePayout.toLocaleString()}
          </p>
          <Link
            href="/seller/wallet"
            className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline block pt-1"
          >
            Withdraw to Bank &rarr;
          </Link>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              In Buyer Inspection
            </span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white">
            ₦{heldInInspection.toLocaleString()}
          </p>
          <span className="text-[11px] text-slate-400 block pt-1">
            Settled Earnings: ₦{totalCompletedSales.toLocaleString()}
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Awaiting Dispatch
            </span>
            <ClipboardList className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </div>
          <p className="text-2xl font-black text-blue-600 dark:text-blue-400">
            {pendingDispatchCount} Orders
          </p>
          <Link
            href="/seller/orders"
            className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline block pt-1"
          >
            Manage Fulfillment &rarr;
          </Link>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Active Inventory
            </span>
            <Boxes className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white">
            {activeListingsCount} Listings
          </p>
          <Link
            href="/seller/listings"
            className="text-[11px] font-bold text-purple-600 dark:text-purple-400 hover:underline block pt-1"
          >
            View All Stock ({allProducts.length}) &rarr;
          </Link>
        </div>
      </div>

      {/* Recent Orders & Active Inventory Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Recent Orders */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div>
              <h2 className="text-sm font-black text-slate-900 dark:text-white">
                Recent Orders
              </h2>
              <p className="text-xs text-slate-400">
                Paid orders awaiting dispatch or inspection completion
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

          <div className="space-y-2.5">
            {allOrders.slice(0, 5).map((o) => (
              <div
                key={o.id}
                className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-800 flex items-center justify-between gap-3 text-xs"
              >
                <div className="min-w-0">
                  <p className="font-bold text-slate-900 dark:text-white truncate">
                    {o.product?.title || 'Hardware Order'}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Buyer: {o.buyer?.full_name || 'Customer'} •{' '}
                    {o.delivery_area || o.buyer?.district || 'Abuja'}
                  </p>
                </div>

                <div className="text-right shrink-0">
                  <p className="font-black text-emerald-600 dark:text-emerald-400">
                    ₦{Number(o.seller_payout || o.amount || 0).toLocaleString()}
                  </p>
                  <span className="text-[10px] font-bold uppercase text-slate-400">
                    {o.delivery_status?.replace(/_/g, ' ') || 'Pending'}
                  </span>
                </div>
              </div>
            ))}

            {allOrders.length === 0 && (
              <p className="text-xs text-slate-400 py-8 text-center">
                No orders yet. Share your storefront or promote a listing to reach Abuja shoppers.
              </p>
            )}
          </div>
        </div>

        {/* Quick Store Tools */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
            <h2 className="text-sm font-black text-slate-900 dark:text-white">
              Quick Actions
            </h2>
            <p className="text-xs text-slate-400">
              Manage your store profile, promotions, and enquiries
            </p>
          </div>

          <div className="space-y-2.5 text-xs">
            <Link
              href="/seller/promotions"
              className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-800 hover:border-blue-500 flex items-center justify-between transition"
            >
              <div className="flex items-center gap-3">
                <Megaphone className="w-4 h-4 text-blue-600" />
                <div>
                  <p className="font-bold text-slate-900 dark:text-white">
                    Promote Products
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Pay-on-sale or sponsored search placement
                  </p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400" />
            </Link>

            <Link
              href="/seller/store"
              className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-800 hover:border-blue-500 flex items-center justify-between transition"
            >
              <div className="flex items-center gap-3">
                <Store className="w-4 h-4 text-purple-600" />
                <div>
                  <p className="font-bold text-slate-900 dark:text-white">
                    Customize Storefront
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Update store bio, Abuja location, and delivery policy
                  </p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400" />
            </Link>

            <Link
              href="/seller/enquiries"
              className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-800 hover:border-blue-500 flex items-center justify-between transition"
            >
              <div className="flex items-center gap-3">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
                <div>
                  <p className="font-bold text-slate-900 dark:text-white">
                    Buyer Enquiries ({(enquiries || []).length} New)
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Respond to buyer questions about your listings
                  </p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}