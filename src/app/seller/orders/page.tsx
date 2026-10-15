import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { EarlyPayoutModal } from '@/app/seller/payouts/EarlyPayoutModal'
import { DispatchModal } from './DispatchModal'
import {
  Package,
  Truck,
  ShieldCheck,
  ShieldAlert,
  MapPin,
  User,
  ExternalLink,
} from 'lucide-react'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Merchant Orders & Fulfillment | BenchTech Seller',
}

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

export default async function SellerOrdersPage({
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

  if (!user) redirect('/login?next=/seller/orders')

  const [{ data: paidOrders }, { data: inquiries }] = await Promise.all([
    supabase
      .from('orders')
      .select(`
        *,
        product:products(*),
        buyer:profiles!orders_buyer_id_fkey(full_name, phone, district),
        dispute:disputes(id, case_number, status)
      `)
      .eq('seller_id', user.id)
      .order('created_at', { ascending: false }),
    supabase
      .from('buying_requests')
      .select(`
        *,
        products(id, title, price, images),
        profiles!buying_requests_buyer_id_fkey(full_name, phone)
      `)
      .eq('seller_id', user.id)
      .order('created_at', { ascending: false }),
  ])

  const allOrders = paidOrders || []
  const allInquiries = inquiries || []

  const pendingDispatchCount = allOrders.filter(
    (o) =>
      o.delivery_status !== 'verified' &&
      o.order_status !== 'cancelled' &&
      o.order_status !== 'refunded'
  ).length

  const pendingReleaseTotal = allOrders
    .filter((o) => o.payout_status === 'on_hold')
    .reduce((acc, curr) => acc + Number(curr.seller_payout || 0), 0)

  const filteredOrders = allOrders.filter((o) => {
    if (activeTab === 'to_dispatch') {
      return o.delivery_status === 'not_delivered' || o.order_status === 'paid'
    }
    if (activeTab === 'in_protection') {
      return (
        o.delivery_status === 'verified' &&
        o.order_status !== 'completed' &&
        o.dispute_status === 'none'
      )
    }
    if (activeTab === 'disputes') {
      return o.dispute_status && o.dispute_status !== 'none'
    }
    if (activeTab === 'completed') {
      return o.order_status === 'completed'
    }
    return true
  })

  return (
    <div className="max-w-6xl mx-auto p-3 sm:p-6 lg:p-8 space-y-6 text-slate-900 dark:text-slate-100">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black tracking-tight">Orders &amp; Fulfillment</h1>
            <Badge className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-bold">
              Merchant Panel
            </Badge>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Dispatch paid items, track delivery handovers, and review payouts[cite: 3].
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 rounded-2xl text-left">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Awaiting Dispatch</span>
            <span className="text-sm font-black text-blue-600 dark:text-blue-400">{pendingDispatchCount} Orders</span>
          </div>

          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 rounded-2xl text-left">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Pending Release</span>
            <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">₦{pendingReleaseTotal.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
        {[
          { id: 'all', label: `Paid Orders (${allOrders.length})` },
          { id: 'to_dispatch', label: `To Dispatch (${pendingDispatchCount})` },
          { id: 'in_protection', label: 'In Inspection Window' },
          { id: 'disputes', label: 'Disputed' },
          { id: 'completed', label: 'Completed' },
          { id: 'inquiries', label: `Offline Requests (${allInquiries.length})` },
        ].map((tab) => (
          <Link key={tab.id} href={`/seller/orders?tab=${tab.id}`}>
            <button
              type="button"
              className={`px-3.5 py-2 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              {tab.label}
            </button>
          </Link>
        ))}
      </div>

      {/* Offline Requests View */}
      {activeTab === 'inquiries' ? (
        <div className="space-y-4">
          {allInquiries.length > 0 ? (
            allInquiries.map((req: any) => (
              <div
                key={req.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4"
              >
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-400">Direct Request</span>
                    <Badge variant="outline" className="text-[10px] capitalize">
                      {req.status?.replace('_', ' ') || 'Pending'}
                    </Badge>
                  </div>
                  <span className="text-xs text-slate-400">
                    {new Date(req.created_at).toLocaleDateString('en-NG')}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-4">
                  <div className="space-y-1">
                    <h3 className="font-bold text-sm">{req.products?.title || 'Gadget'}</h3>
                    <p className="text-xs font-black text-blue-600 dark:text-blue-400">
                      Offered: ₦{Number(req.agreed_price).toLocaleString()}
                    </p>
                    <p className="text-xs text-slate-400">
                      Buyer: {req.profiles?.full_name || 'Buyer'} • Area: {req.delivery_area || 'Abuja'}
                    </p>
                  </div>
                  <Badge className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    {req.delivery_method}
                  </Badge>
                </div>
              </div>
            ))
          ) : (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-10 text-center text-slate-400 text-xs">
              No direct buying requests recorded.
            </div>
          )}
        </div>
      ) : (
        /* Paid Orders List */
        <div className="space-y-4">
          {filteredOrders.length > 0 ? (
            filteredOrders.map((order) => {
              const firstImg = resolveFirstImage(order.product?.images)
              const isDelivered =
                order.delivery_status === 'verified' || order.order_status === 'delivered'
              const isDispatched =
                order.delivery_status === 'dispatched' ||
                order.delivery_status === 'pickup_pending' ||
                isDelivered

              let daysLeft = 0
              if (order.protection_ends_at) {
                const diff = new Date(order.protection_ends_at).getTime() - Date.now()
                if (diff > 0) daysLeft = Math.ceil(diff / (1000 * 60 * 60 * 24))
              }

              const dispute = Array.isArray(order.dispute) ? order.dispute[0] : order.dispute

              return (
                <div
                  key={order.id}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xs space-y-5"
                >
                  {/* Top Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100">
                        {order.order_number || order.payment_reference || order.id.slice(0, 10)}
                      </span>
                      <span className="text-slate-400 text-xs">•</span>
                      <span className="text-xs text-slate-400">
                        {new Date(order.created_at).toLocaleDateString('en-NG', {
                          dateStyle: 'medium',
                        })}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {daysLeft > 0 && order.dispute_status === 'none' && (
                        <Badge className="bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 text-[10px] font-bold">
                          <ShieldCheck className="w-3 h-3 mr-1" /> {daysLeft} Days in Inspection Window
                        </Badge>
                      )}

                      {order.dispute_status && order.dispute_status !== 'none' && (
                        <Badge className="bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300 border border-red-200 text-[10px] font-bold">
                          <ShieldAlert className="w-3 h-3 mr-1" /> Disputed
                        </Badge>
                      )}

                      <Badge
                        className={`text-[10px] font-bold capitalize ${
                          isDelivered
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                            : isDispatched
                            ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300'
                            : 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                        }`}
                      >
                        {isDelivered
                          ? 'Delivered'
                          : isDispatched
                          ? 'In Transit'
                          : 'Awaiting Dispatch'}
                      </Badge>
                    </div>
                  </div>

                  {/* Device and Buyer Details */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                    <div className="md:col-span-5 flex items-center gap-3.5 min-w-0">
                      <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 overflow-hidden flex items-center justify-center shrink-0">
                        {firstImg ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={firstImg}
                            alt={order.product?.title || 'Gadget'}
                            className="w-full h-full object-contain p-1"
                          />
                        ) : (
                          <Package className="w-6 h-6 text-slate-400" />
                        )}
                      </div>

                      <div className="min-w-0 space-y-0.5">
                        <h3 className="font-bold text-xs sm:text-sm truncate">
                          {order.product?.title || 'Device'}
                        </h3>
                        <p className="text-[11px] text-slate-400">
                          {order.product?.condition?.replace('_', ' ') || 'Used'} • {order.delivery_method || 'Delivery'}
                        </p>
                      </div>
                    </div>

                    <div className="md:col-span-4 space-y-1 text-xs text-slate-500 dark:text-slate-400 border-t md:border-t-0 md:border-l border-slate-100 dark:border-slate-800 md:pl-4">
                      <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        <span>{order.buyer?.full_name || 'Customer'}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px]">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        <span>{order.delivery_area || order.buyer?.district || 'Abuja Destination'}</span>
                      </div>
                      <span className="inline-block text-[10px] text-blue-600 dark:text-blue-400 font-semibold pt-0.5">
                        • Verified Logistics Delivery
                      </span>
                    </div>

                    <div className="md:col-span-3 text-left md:text-right border-t md:border-t-0 md:border-l border-slate-100 dark:border-slate-800 md:pl-4 space-y-0.5">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">
                        Net Payout
                      </span>
                      <p className="text-lg font-black text-emerald-600 dark:text-emerald-400">
                        ₦{Number(order.seller_payout || 0).toLocaleString()}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        Gross: ₦{Number(order.total_amount || order.amount).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
                    <div className="text-xs text-slate-400 flex items-center gap-1.5">
                      <Truck className="w-3.5 h-3.5" />
                      <span>
                        Fulfillment:{' '}
                        <strong className="text-slate-700 dark:text-slate-300 capitalize">
                          {order.delivery_status?.replace('_', ' ') || 'Pending'}
                        </strong>
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {!isDispatched && (
                        <DispatchModal order={order} />
                      )}

                      {isDelivered && (
                        <EarlyPayoutModal
                          order={{
                            id: order.id,
                            order_number: order.order_number,
                            seller_payout: Number(order.seller_payout || 0),
                            delivery_status: order.delivery_status,
                            dispute_status: order.dispute_status,
                            early_payout_claimed: order.early_payout_claimed,
                          }}
                        />
                      )}

                      {dispute && (
                        <Link href={`/disputes/${dispute.id}`}>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-red-300 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 text-xs font-bold rounded-xl h-9 px-3"
                          >
                            Review Dispute
                          </Button>
                        </Link>
                      )}

                      <Link href={`/orders/${order.id}`} target="_blank">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-xs font-bold rounded-xl h-9 px-2 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              )
            })
          ) : (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-10 text-center space-y-2">
              <div className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
                <Package className="w-5 h-5" />
              </div>
              <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                No orders found in this view
              </p>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Confirmed orders from Abuja buyers will appear here for dispatch and settlement.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}