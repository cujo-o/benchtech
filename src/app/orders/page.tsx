import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { Navbar } from '@/components/Navbar'
import { BuyerSidebar } from '@/components/storefront/BuyerSidebar'
import { resolveOrderItemsForOrder } from '@/lib/orders/resolveOrderItems'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Package,
  Truck,
  ShieldCheck,
  ArrowRight,
  Store,
  MapPin,
} from 'lucide-react'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'My Orders | BenchTech Abuja',
  description: 'Track your hardware orders, delivery handover OTPs, and 7-day buyer inspection windows.',
}

function getAdminDb() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  return createAdminClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

export default async function BuyerOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>
}) {
  const params = await searchParams
  const activeTab = params?.tab || 'all'

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login?next=/orders')
  }

  const adminDb = getAdminDb()

  const [{ data: rawOrders }, { data: allCatalogProducts }, { data: checkoutAudits }] =
    await Promise.all([
      adminDb
        .from('orders')
        .select(
          `
          *,
          product:products(*, profiles!products_seller_id_fkey(id, business_name, full_name, district, tech_trust_status)),
          seller:profiles!orders_seller_id_fkey(id, business_name, full_name, district, tech_trust_status)
        `
        )
        .eq('buyer_id', user.id)
        .order('created_at', { ascending: false }),
      adminDb
        .from('products')
        .select(
          '*, profiles!products_seller_id_fkey(id, business_name, full_name, district, tech_trust_status)'
        ),
      adminDb
        .from('audit_events')
        .select('target_id, metadata')
        .eq('action', 'order_checkout_completed'),
    ])

  const auditItemsMap = new Map<string, any[]>()
  for (const ev of checkoutAudits || []) {
    if (ev.target_id && Array.isArray(ev.metadata?.items)) {
      auditItemsMap.set(ev.target_id, ev.metadata.items)
    }
  }

  const allOrders = (rawOrders || []).map((order) => {
    const items = resolveOrderItemsForOrder({
      order,
      auditItems: auditItemsMap.get(order.id),
      allCatalogProducts: allCatalogProducts || [],
    })
    return {
      ...order,
      resolvedItems: items,
    }
  })

  const filteredOrders = allOrders.filter((o) => {
    if (activeTab === 'in_transit') {
      return (
        o.delivery_status !== 'verified' &&
        o.order_status !== 'cancelled' &&
        o.order_status !== 'refunded'
      )
    }
    if (activeTab === 'inspection') {
      return o.delivery_status === 'verified' && o.payout_status === 'on_hold'
    }
    if (activeTab === 'disputed') {
      return (
        o.dispute_status === 'open' ||
        o.order_status === 'refunded' ||
        o.order_status === 'cancelled'
      )
    }
    if (activeTab === 'completed') {
      return (
        o.order_status === 'completed' ||
        o.payout_status === 'paid' ||
        o.delivery_status === 'verified'
      )
    }
    return true
  })

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col">
      <Navbar />

      <div className="max-w-[1700px] w-full mx-auto flex flex-1">
        <BuyerSidebar />

        <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
          {/* Filter Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {[
              { id: 'all', label: `All Orders (${allOrders.length})` },
              { id: 'in_transit', label: 'In Transit / Pickup' },
              { id: 'inspection', label: '7-Day Protection Window' },
              { id: 'disputed', label: 'Disputes & Refunds' },
              { id: 'completed', label: 'Completed' },
            ].map((tab) => (
              <Link key={tab.id} href={`/orders?tab=${tab.id}`}>
                <button
                  type="button"
                  className={`px-4 py-2 rounded-full text-xs font-bold shrink-0 transition cursor-pointer ${
                    activeTab === tab.id
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  {tab.label}
                </button>
              </Link>
            ))}
          </div>

          {/* Orders List */}
          {filteredOrders.length > 0 ? (
            <div className="space-y-4">
              {filteredOrders.map((order) => {
                const orderRef =
                  order.order_number ||
                  order.payment_reference ||
                  order.id.slice(0, 8)
                const totalPaid = Number(
                  order.total_amount || order.amount || 0
                )
                const isDelivered = order.delivery_status === 'verified'
                const items = order.resolvedItems || []
                const totalUnits = items.reduce(
                  (sum: number, i: any) => sum + Number(i.quantity || 1),
                  0
                )

                let protectionDaysLeft = 0
                if (order.protection_ends_at) {
                  const diffMs =
                    new Date(order.protection_ends_at).getTime() - Date.now()
                  protectionDaysLeft = Math.max(
                    0,
                    Math.ceil(diffMs / (1000 * 60 * 60 * 24))
                  )
                }

                return (
                  <div
                    key={order.id}
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4"
                  >
                    {/* Top Row */}
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                      <div className="flex items-center gap-2 text-xs">
                        <span className="font-mono font-black text-slate-900 dark:text-white">
                          {orderRef}
                        </span>
                        <span className="text-slate-400">
                          •{' '}
                          {new Date(order.created_at).toLocaleDateString(
                            'en-NG',
                            {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            }
                          )}
                        </span>
                        <Badge
                          variant="outline"
                          className="text-[10px] font-bold"
                        >
                          {items.length}{' '}
                          {items.length === 1 ? 'Product' : 'Products'} (
                          {totalUnits} {totalUnits === 1 ? 'Unit' : 'Units'})
                        </Badge>
                      </div>

                      <div className="flex items-center gap-2">
                        {protectionDaysLeft > 0 && (
                          <Badge className="bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-[10px] font-bold">
                            <ShieldCheck className="w-3 h-3 mr-1" />
                            {protectionDaysLeft}{' '}
                            {protectionDaysLeft === 1 ? 'Day' : 'Days'}{' '}
                            Protection Remaining
                          </Badge>
                        )}
                        <Badge
                          className={`text-[10px] font-bold capitalize ${
                            isDelivered
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                              : 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                          }`}
                        >
                          {isDelivered
                            ? 'Completed'
                            : order.order_status || 'Paid'}
                        </Badge>
                      </div>
                    </div>

                    {/* All Products in This Order */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="space-y-3 flex-1 min-w-0">
                        {items.map((item: any, idx: number) => (
                          <div
                            key={`${item.id}-${idx}`}
                            className="flex items-center gap-3.5"
                          >
                            <div className="w-14 h-14 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-1.5 flex items-center justify-center shrink-0 overflow-hidden">
                              {item.image ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={item.image}
                                  alt={item.title}
                                  className="w-full h-full object-contain"
                                />
                              ) : (
                                <Package className="w-6 h-6 text-slate-400" />
                              )}
                            </div>

                            <div className="min-w-0 space-y-0.5">
                              <p className="text-xs sm:text-sm font-black text-slate-900 dark:text-white truncate">
                                {item.title}
                                {item.quantity > 1
                                  ? ` × ${item.quantity}`
                                  : ''}
                              </p>
                              <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                                <span className="flex items-center gap-1">
                                  <Store className="w-3 h-3 text-slate-400" />
                                  {item.seller_name}
                                </span>
                                <span>•</span>
                                <span className="flex items-center gap-0.5">
                                  <MapPin className="w-3 h-3 text-slate-400" />
                                  {item.seller_district}
                                </span>
                                <span>•</span>
                                <span className="font-bold text-slate-700 dark:text-slate-300">
                                  ₦
                                  {(
                                    Number(item.price || 0) *
                                    Number(item.quantity || 1)
                                  ).toLocaleString()}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="sm:text-right shrink-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800 pt-3 sm:pt-0">
                        <span className="text-[10px] font-bold uppercase text-slate-400 block">
                          Total Paid
                        </span>
                        <span className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
                          ₦{totalPaid.toLocaleString()}
                        </span>
                      </div>
                    </div>

                    {/* Footer Row */}
                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 text-xs">
                      <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                        <Truck className="w-3.5 h-3.5 text-slate-400" />
                        <span className="capitalize">
                          {order.delivery_method || 'Delivery'}:
                        </span>
                        <strong className="text-slate-800 dark:text-slate-200">
                          {isDelivered
                            ? 'Delivered & Inspected'
                            : order.delivery_status === 'dispatched'
                            ? 'In Transit — Inspect Before Giving OTP'
                            : 'Preparing for Abuja Dispatch'}
                        </strong>
                      </span>

                      <Link href={`/orders/${order.id}`}>
                        <Button
                          size="sm"
                          className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl h-9 px-4 gap-1.5 cursor-pointer"
                        >
                          <span>Track &amp; Inspect</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-12 text-center space-y-3">
              <Package className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
              <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                No orders in this view
              </p>
              <Link href="/products" className="inline-block">
                <Button
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl h-9 px-4"
                >
                  Browse Catalog
                </Button>
              </Link>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}