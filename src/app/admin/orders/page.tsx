import Link from 'next/link'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  adminVerifyOrderDelivery,
  adminReleaseOrderPayout,
  adminRefundOrder,
} from '@/app/admin/actions'
import {
  ClipboardList,
  Truck,
  CheckCircle2,
  RotateCcw,
  Wallet,
  Search,
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

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string; q?: string }>
}) {
  const params = await searchParams
  const activeFilter = params?.filter || 'all'
  const query = (params?.q || '').trim().toLowerCase()

  const adminDb = getAdminDb()
  const { data: orders } = await adminDb
    .from('orders')
    .select(`
      *,
      product:products(id, title, price),
      buyer:profiles!orders_buyer_id_fkey(full_name, phone, district),
      seller:profiles!orders_seller_id_fkey(business_name, full_name, phone)
    `)
    .order('created_at', { ascending: false })

  const allOrders = orders || []

  const filteredOrders = allOrders.filter((o) => {
    const matchesSearch =
      !query ||
      (o.order_number || '').toLowerCase().includes(query) ||
      (o.payment_reference || '').toLowerCase().includes(query) ||
      (o.product?.title || '').toLowerCase().includes(query) ||
      (o.buyer?.full_name || '').toLowerCase().includes(query) ||
      (o.seller?.business_name || '').toLowerCase().includes(query)

    if (!matchesSearch) return false

    if (activeFilter === 'pending_delivery') {
      return o.delivery_status !== 'verified' && o.order_status !== 'refunded'
    }
    if (activeFilter === 'on_hold') {
      return o.payout_status === 'on_hold'
    }
    if (activeFilter === 'completed') {
      return o.payout_status === 'paid' || o.order_status === 'completed'
    }
    if (activeFilter === 'refunded') {
      return o.order_status === 'refunded'
    }
    return true
  })

  return (
    <div className="space-y-6">
      {/* Header & Search */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <ClipboardList className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white">
              Orders &amp; Logistics Control
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Monitor order deliveries, verify handovers, and release seller payouts.
          </p>
        </div>

        <form action="/admin/orders" method="GET" className="w-full md:w-72">
          <input type="hidden" name="filter" value={activeFilter} />
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              name="q"
              defaultValue={params?.q || ''}
              placeholder="Search order ref, item, buyer..."
              className="w-full h-10 pl-9 pr-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </form>
      </div>

      {/* Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {[
          { id: 'all', label: `All Orders (${allOrders.length})` },
          { id: 'pending_delivery', label: 'Pending Delivery' },
          { id: 'on_hold', label: 'In Inspection Hold' },
          { id: 'completed', label: 'Paid & Settled' },
          { id: 'refunded', label: 'Refunded' },
        ].map((tab) => (
          <Link
            key={tab.id}
            href={`/admin/orders?filter=${tab.id}${
              params?.q ? `&q=${encodeURIComponent(params.q)}` : ''
            }`}
          >
            <button
              type="button"
              className={`px-3.5 py-2 rounded-xl text-xs font-bold shrink-0 transition cursor-pointer ${
                activeFilter === tab.id
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
              }`}
            >
              {tab.label}
            </button>
          </Link>
        ))}
      </div>

      {/* Orders List */}
      <div className="space-y-3">
        {filteredOrders.length > 0 ? (
          filteredOrders.map((o) => {
            const isDelivered = o.delivery_status === 'verified'
            const isPaidOut = o.payout_status === 'paid'
            const isRefunded = o.order_status === 'refunded'

            return (
              <div
                key={o.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs space-y-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-black text-xs sm:text-sm text-slate-900 dark:text-white">
                      {o.order_number || o.payment_reference || o.id.slice(0, 10)}
                    </span>
                    <span className="text-xs text-slate-400">
                      • {new Date(o.created_at).toLocaleDateString('en-NG')}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge
                      className={`text-[10px] font-bold capitalize ${
                        isDelivered
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                      }`}
                    >
                      Delivery: {o.delivery_status?.replace(/_/g, ' ') || 'Pending'}
                    </Badge>
                    <Badge
                      className={`text-[10px] font-bold capitalize ${
                        isPaidOut
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                          : isRefunded
                          ? 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300'
                          : 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                      }`}
                    >
                      Payout: {o.payout_status?.replace(/_/g, ' ') || 'On Hold'}
                    </Badge>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  <div>
                    <span className="text-[10px] font-bold uppercase text-slate-400 block">
                      Item &amp; Seller
                    </span>
                    <p className="font-bold text-slate-900 dark:text-white mt-0.5">
                      {o.product?.title || 'Hardware Order'}
                    </p>
                    <p className="text-slate-500">
                      Seller: {o.seller?.business_name || o.seller?.full_name || 'Vendor'}
                    </p>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold uppercase text-slate-400 block">
                      Buyer &amp; Destination
                    </span>
                    <p className="font-bold text-slate-900 dark:text-white mt-0.5">
                      {o.buyer?.full_name || 'Buyer'}
                    </p>
                    <p className="text-slate-500">
                      {o.delivery_area || o.buyer?.district || 'Abuja'}
                    </p>
                  </div>

                  <div className="md:text-right">
                    <span className="text-[10px] font-bold uppercase text-slate-400 block">
                      Financials
                    </span>
                    <p className="font-black text-sm text-slate-900 dark:text-white mt-0.5">
                      Gross: ₦{Number(o.total_amount || o.amount || 0).toLocaleString()}
                    </p>
                    <p className="font-bold text-emerald-600 dark:text-emerald-400">
                      Net Seller Payout: ₦{Number(o.seller_payout || 0).toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* Admin Actions Bar */}
                {!isPaidOut && !isRefunded && (
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-end gap-2">
                    {!isDelivered && (
                      <form
                        action={async () => {
                          'use server'
                          await adminVerifyOrderDelivery(o.id)
                        }}
                      >
                        <Button
                          type="submit"
                          size="sm"
                          variant="outline"
                          className="text-xs font-bold rounded-xl h-9 gap-1.5 border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 cursor-pointer"
                        >
                          <Truck className="w-3.5 h-3.5" />
                          <span>Verify Delivery</span>
                        </Button>
                      </form>
                    )}

                    <form
                      action={async () => {
                        'use server'
                        await adminReleaseOrderPayout(o.id)
                      }}
                    >
                      <Button
                        type="submit"
                        size="sm"
                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl h-9 gap-1.5 cursor-pointer"
                      >
                        <Wallet className="w-3.5 h-3.5" />
                        <span>Release Payout to Seller</span>
                      </Button>
                    </form>

                    <form
                      action={async () => {
                        'use server'
                        await adminRefundOrder(o.id)
                      }}
                    >
                      <Button
                        type="submit"
                        size="sm"
                        variant="outline"
                        className="text-xs font-bold rounded-xl h-9 gap-1.5 border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Refund Buyer</span>
                      </Button>
                    </form>
                  </div>
                )}
              </div>
            )
          })
        ) : (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-12 text-center text-xs text-slate-400">
            No orders match this filter.
          </div>
        )}
      </div>
    </div>
  )
}