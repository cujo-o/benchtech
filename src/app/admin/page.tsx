import Link from 'next/link'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  TrendingUp,
  ShieldCheck,
  Boxes,
  Users,
  Wallet,
  ClipboardList,
  ArrowRight,
  CheckCircle2,
  Clock,
  ShieldAlert,
  Megaphone,
} from 'lucide-react'

export const dynamic = 'force-dynamic'

function getAdminDb() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  return createAdminClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

export default async function AdminOverviewPage() {
  const adminDb = getAdminDb()

  const [
    { data: orders },
    { data: products },
    { data: profiles },
    { data: verifications },
    { data: adWallets },
    { data: auditEvents },
  ] = await Promise.all([
    adminDb
      .from('orders')
      .select('*, product:products(title), buyer:profiles!orders_buyer_id_fkey(full_name)')
      .order('created_at', { ascending: false }),
    adminDb.from('products').select('id, title, price, category, status, is_featured, created_at'),
    adminDb.from('profiles').select('id, full_name, business_name, role, is_seller, tech_trust_status, seller_plan, available_payout, created_at'),
    adminDb
      .from('seller_verifications')
      .select('*')
      .order('submitted_at', { ascending: false }),
    adminDb.from('ad_wallets').select('balance'),
    adminDb
      .from('audit_events')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(8),
  ])

  const allOrders = orders || []
  const allProducts = products || []
  const allProfiles = profiles || []
  const allVerifications = verifications || []

  // Financial Metrics
  const validOrders = allOrders.filter(
    (o) => o.order_status !== 'cancelled' && o.order_status !== 'refunded'
  )
  const totalGMV = validOrders.reduce(
    (sum, o) => sum + Number(o.total_amount || o.amount || 0),
    0
  )
  const platformFeeRevenue = validOrders.reduce(
    (sum, o) => sum + Number(o.marketplace_fee || 0) + Number(o.ad_fee || 0),
    0
  )
  const heldInProtection = validOrders
    .filter((o) => o.payout_status === 'on_hold')
    .reduce((sum, o) => sum + Number(o.seller_payout || 0), 0)

  const pendingSellerWithdrawals = allProfiles.reduce(
    (sum, p) => sum + Number(p.available_payout || 0),
    0
  )
  const totalAdWalletFloat = (adWallets || []).reduce(
    (sum, w) => sum + Number(w.balance || 0),
    0
  )

  // User & Store Metrics
  const totalUsers = allProfiles.length
  const verifiedSellersCount = allProfiles.filter(
    (p) => p.tech_trust_status === 'verified'
  ).length
  const proSellersCount = allProfiles.filter(
    (p) => p.seller_plan === 'pro'
  ).length
  const pendingVerifications = allVerifications.filter(
    (v) => v.status === 'under_review'
  )

  // Catalog Metrics
  const publishedProducts = allProducts.filter((p) => p.status === 'published')
  const totalCatalogValue = publishedProducts.reduce(
    (sum, p) => sum + Number(p.price || 0),
    0
  )

  // Category Distribution
  const categoryMap = new Map<string, number>()
  for (const prod of publishedProducts) {
    const cat = (prod.category || 'other').toLowerCase()
    categoryMap.set(cat, (categoryMap.get(cat) || 0) + 1)
  }
  const topCategories = Array.from(categoryMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            Marketplace Operations Overview
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Live transaction volume, seller verifications, catalog health, and settlement balances.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link href="/admin/verifications">
            <Button
              size="sm"
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl h-9 px-3.5 gap-1.5 cursor-pointer"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Verifications ({pendingVerifications.length})</span>
            </Button>
          </Link>
          <Link href="/admin/payouts">
            <Button
              size="sm"
              variant="outline"
              className="text-xs font-bold rounded-xl h-9 px-3.5 border-slate-200 dark:border-slate-700 gap-1.5 cursor-pointer"
            >
              <Wallet className="w-3.5 h-3.5 text-emerald-600" />
              <span>Payouts</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Primary KPI Grid (6 Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Card 1: GMV */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Gross Merchandise Volume
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
            ₦{totalGMV.toLocaleString()}
          </p>
          <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100 dark:border-slate-800">
            <span>Total Paid Orders:</span>
            <strong className="text-slate-900 dark:text-white">{validOrders.length}</strong>
          </div>
        </div>

        {/* Card 2: Platform Commission & Ad Revenue */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Net Platform Revenue
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400">
            ₦{platformFeeRevenue.toLocaleString()}
          </p>
          <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100 dark:border-slate-800">
            <span>Ad Wallet Float:</span>
            <strong className="text-slate-900 dark:text-white">
              ₦{totalAdWalletFloat.toLocaleString()}
            </strong>
          </div>
        </div>

        {/* Card 3: Protection Hold & Pending Payouts */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Held in Buyer Inspection
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
            ₦{heldInProtection.toLocaleString()}
          </p>
          <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100 dark:border-slate-800">
            <span>Ready for Bank Payout:</span>
            <strong className="text-emerald-600 dark:text-emerald-400">
              ₦{pendingSellerWithdrawals.toLocaleString()}
            </strong>
          </div>
        </div>

        {/* Card 4: Active Inventory */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Published Inventory
            </span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <Boxes className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
            {publishedProducts.length} Items
          </p>
          <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100 dark:border-slate-800">
            <span>Total Listed Value:</span>
            <strong className="text-slate-900 dark:text-white">
              ₦{totalCatalogValue.toLocaleString()}
            </strong>
          </div>
        </div>

        {/* Card 5: Users & Verified Sellers */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Accounts &amp; Merchants
            </span>
            <div className="w-8 h-8 rounded-xl bg-sky-50 dark:bg-sky-950 text-sky-600 dark:text-sky-400 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
            {totalUsers} Users
          </p>
          <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100 dark:border-slate-800">
            <span>Verified Sellers:</span>
            <strong className="text-emerald-600 dark:text-emerald-400">
              {verifiedSellersCount} ({proSellersCount} Pro)
            </strong>
          </div>
        </div>

        {/* Card 6: Seller Verification Queue */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Verification Queue
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-blue-600 dark:text-blue-400">
            {pendingVerifications.length} Pending
          </p>
          <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100 dark:border-slate-800">
            <span>Total Submissions:</span>
            <Link
              href="/admin/verifications"
              className="font-bold text-blue-600 hover:underline"
            >
              Review Queue &rarr;
            </Link>
          </div>
        </div>
      </div>

      {/* Middle 2-Column Section: Pending Verifications + Category Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Pending Seller Verifications */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div>
              <h2 className="text-sm font-black text-slate-900 dark:text-white">
                Seller Verification Applications
              </h2>
              <p className="text-xs text-slate-400">
                Latest Individual and Registered Business onboarding submissions
              </p>
            </div>
            <Link
              href="/admin/verifications"
              className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-2.5">
            {allVerifications.slice(0, 5).map((v) => (
              <div
                key={v.id}
                className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-800 flex items-center justify-between gap-3 text-xs"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 dark:text-white truncate">
                      {v.business_name || v.legal_name || 'Applicant'}
                    </span>
                    <Badge variant="outline" className="text-[10px] capitalize">
                      {v.seller_type}
                    </Badge>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5 truncate">
                    {v.city || 'Abuja'} • {v.bank_name} ({v.account_number})
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Badge
                    className={`text-[10px] font-bold capitalize ${
                      v.status === 'verified'
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                        : v.status === 'under_review'
                        ? 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                        : 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                    }`}
                  >
                    {v.status?.replace(/_/g, ' ')}
                  </Badge>
                  <Link href={`/admin/verifications?status=${v.status}`}>
                    <Button size="xs" variant="outline" className="rounded-lg text-[11px] font-bold">
                      Inspect
                    </Button>
                  </Link>
                </div>
              </div>
            ))}

            {allVerifications.length === 0 && (
              <p className="text-xs text-slate-400 py-8 text-center">
                No seller verification records submitted yet.
              </p>
            )}
          </div>
        </div>

        {/* Category Inventory Breakdown & Recent Audit Trail */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xs space-y-5">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
            <h2 className="text-sm font-black text-slate-900 dark:text-white">
              Inventory by Category
            </h2>
            <p className="text-xs text-slate-400">
              Active published listings across hardware verticals
            </p>
          </div>

          <div className="space-y-3">
            {topCategories.length > 0 ? (
              topCategories.map(([cat, count]) => {
                const pct = Math.max(
                  8,
                  Math.round((count / Math.max(1, publishedProducts.length)) * 100)
                )
                return (
                  <div key={cat} className="space-y-1 text-xs">
                    <div className="flex justify-between font-bold">
                      <span className="capitalize text-slate-700 dark:text-slate-300">
                        {cat}
                      </span>
                      <span className="text-slate-900 dark:text-white">
                        {count} listings ({pct}%)
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div
                        className="h-full bg-blue-600 rounded-full"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                )
              })
            ) : (
              <p className="text-xs text-slate-400 py-4 text-center">
                No published listings yet.
              </p>
            )}
          </div>

          {/* Recent Security & Admin Audit Events */}
          {auditEvents && auditEvents.length > 0 && (
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2.5">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                Recent Audit Trail
              </span>
              <div className="space-y-1.5">
                {auditEvents.slice(0, 4).map((ev: any) => (
                  <div
                    key={ev.id}
                    className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400"
                  >
                    <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                      {ev.action?.replace(/_/g, ' ')}
                    </span>
                    <span className="text-[10px] shrink-0">
                      {new Date(ev.created_at).toLocaleDateString('en-NG')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Recent Orders Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div>
            <h2 className="text-sm font-black text-slate-900 dark:text-white">
              Recent Marketplace Orders
            </h2>
            <p className="text-xs text-slate-400">
              Latest buyer transactions, delivery statuses, and payout states
            </p>
          </div>
          <Link
            href="/admin/orders"
            className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
          >
            <span>Manage All Orders</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs whitespace-nowrap">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-bold uppercase text-[10px]">
                <th className="pb-3 pr-4">Order Ref</th>
                <th className="pb-3 px-4">Item</th>
                <th className="pb-3 px-4">Buyer</th>
                <th className="pb-3 px-4">Gross</th>
                <th className="pb-3 px-4">Seller Payout</th>
                <th className="pb-3 px-4">Delivery</th>
                <th className="pb-3 pl-4 text-right">Settlement</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {allOrders.slice(0, 8).map((o) => (
                <tr key={o.id} className="text-slate-700 dark:text-slate-300">
                  <td className="py-3 pr-4 font-mono font-bold text-slate-900 dark:text-white">
                    {o.order_number || o.payment_reference || o.id.slice(0, 8)}
                  </td>
                  <td className="py-3 px-4 font-semibold truncate max-w-[180px]">
                    {o.product?.title || 'Hardware Order'}
                  </td>
                  <td className="py-3 px-4">{o.buyer?.full_name || 'Buyer'}</td>
                  <td className="py-3 px-4 font-bold">
                    ₦{Number(o.total_amount || o.amount || 0).toLocaleString()}
                  </td>
                  <td className="py-3 px-4 font-bold text-emerald-600 dark:text-emerald-400">
                    ₦{Number(o.seller_payout || 0).toLocaleString()}
                  </td>
                  <td className="py-3 px-4 capitalize">
                    {o.delivery_status?.replace(/_/g, ' ') || 'Pending'}
                  </td>
                  <td className="py-3 pl-4 text-right">
                    <Badge
                      className={`text-[10px] font-bold capitalize ${
                        o.payout_status === 'paid'
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                      }`}
                    >
                      {o.payout_status?.replace(/_/g, ' ') || 'On Hold'}
                    </Badge>
                  </td>
                </tr>
              ))}
              {allOrders.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No orders recorded yet.
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