import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { Navbar } from '@/components/Navbar'
import { BuyerSidebar } from '@/components/storefront/BuyerSidebar'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { calculateOrderSplit, recordOrderPaymentCaptureLedger } from '@/lib/finance/calculator'
import {
  Package,
  CheckCircle2,
  Clock,
  ShieldCheck,
  ShieldAlert,
  RotateCcw,
  ArrowRight,
  ExternalLink,
  Store,
  MapPin,
  Truck,
  Sparkles,
  ShoppingBag,
} from 'lucide-react'

export const dynamic = 'force-dynamic'

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  return createAdminClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
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

export default async function BuyerOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ reference?: string; trxref?: string; tab?: string }>
}) {
  const params = await searchParams
  const reference = params?.reference || params?.trxref
  const activeTab = params?.tab || 'all'

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login?next=/orders')

  let newlyCreatedOrder: any = null

  // 1. Process Paystack Verification if returning from checkout
  if (reference) {
    const secretKey = process.env.PAYSTACK_SECRET_KEY
    if (secretKey) {
      try {
        const paystackRes = await fetch(
          `https://api.paystack.co/transaction/verify/${reference}`,
          {
            headers: { Authorization: `Bearer ${secretKey}` },
            cache: 'no-store',
          }
        )
        const paystackData = await paystackRes.json()

        if (paystackData.status && paystackData.data?.status === 'success') {
          const tx = paystackData.data
          const adminClient = getSupabaseAdmin()

          // Check if order already recorded to avoid duplicate creation
          const { data: existingOrder } = await adminClient
            .from('orders')
            .select('*, product:products(*), seller:profiles!orders_seller_id_fkey(*)')
            .eq('payment_reference', reference)
            .maybeSingle()

          if (existingOrder) {
            newlyCreatedOrder = existingOrder
          } else {
            const rawAmount = Number(tx.amount) / 100
            const metadata = tx.metadata || {}

            const productId = metadata.product_id || metadata.productId
            const sellerId = metadata.seller_id || metadata.sellerId

            // Fetch seller profile to check if Pro plan (5% commission vs 7%)
            const { data: sellerProfile } = await adminClient
              .from('profiles')
              .select('seller_plan, subscription_tier')
              .eq('id', sellerId)
              .maybeSingle()

            const isPro =
              sellerProfile?.seller_plan === 'pro' ||
              sellerProfile?.subscription_tier === 'pro'

            // Check if purchase was driven by an attributed ad (2.5% promote fee)
            const isAttributed = Boolean(metadata.campaign_id || metadata.campaignId)

            const split = calculateOrderSplit({
              amount: rawAmount,
              isProSeller: isPro,
              isAttributedAd: isAttributed,
            })

            // Generate clean Order Number (e.g. SB20261003-4921)
            const orderNumber = `SB${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`

            const { data: insertedOrder, error: insertErr } = await adminClient
              .from('orders')
              .insert({
                order_number: orderNumber,
                buyer_id: user.id,
                seller_id: sellerId,
                product_id: productId || null,
                amount: rawAmount,
                total_amount: rawAmount,
                marketplace_fee: split.marketplaceFee,
                ad_fee: split.adFee,
                seller_payout: split.netSellerPayout,
                status: 'paid',
                order_status: 'paid',
                payment_status: 'verified',
                delivery_status: 'not_delivered',
                dispute_status: 'none',
                refund_status: 'not_requested',
                payout_status: 'on_hold',
                payment_reference: reference,
                delivery_method: metadata.deliveryMethod || 'pickup',
                delivery_area: metadata.deliveryArea || 'Abuja',
                buyer_notes: metadata.buyerNotes || null,
              })
              .select('*, product:products(*), seller:profiles!orders_seller_id_fkey(*)')
              .single()

            if (!insertErr && insertedOrder) {
              newlyCreatedOrder = insertedOrder

              // Post double-entry journal entries to immutable ledger
              await recordOrderPaymentCaptureLedger({
                orderId: insertedOrder.id,
                buyerId: user.id,
                sellerId: sellerId,
                split,
                paymentReference: reference,
              })
            }
          }
        }
      } catch (err) {
        console.error('Paystack order verification error:', err)
      }
    }
  }

  // 2. Fetch Buyer's Orders
  const { data: orders } = await supabase
    .from('orders')
    .select(`
      *,
      product:products(*),
      seller:profiles!orders_seller_id_fkey(business_name, full_name, district, phone),
      dispute:disputes(id, case_number, status),
      refund:refunds(id, refund_number, status)
    `)
    .eq('buyer_id', user.id)
    .order('created_at', { ascending: false })

  const orderList = orders || []

  // Filter tabs
  const filteredOrders = orderList.filter((o) => {
    if (activeTab === 'in_delivery') {
      return o.delivery_status !== 'verified' && o.order_status !== 'cancelled' && o.order_status !== 'refunded'
    }
    if (activeTab === 'protection') {
      return o.delivery_status === 'verified' && o.order_status !== 'completed' && o.dispute_status === 'none'
    }
    if (activeTab === 'disputes') {
      return o.dispute_status !== 'none' || o.refund_status !== 'not_requested'
    }
    if (activeTab === 'completed') {
      return o.order_status === 'completed'
    }
    return true
  })

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col transition-colors">
      <Navbar />

      <div className="max-w-[1700px] w-full mx-auto flex flex-1">
        <BuyerSidebar />

        <main className="max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-6 min-w-0">
          {/* Visual 8 Screen 3: Payment Success / Order Confirmed Card */}
          {newlyCreatedOrder && (
            <div className="bg-linear-to-r from-emerald-900 via-teal-900 to-slate-900 text-white p-6 sm:p-8 rounded-3xl border border-emerald-500/40 shadow-xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-slate-950 flex items-center justify-center font-black shadow-lg">
                    <CheckCircle2 className="w-6 h-6 stroke-[2.5]" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-black tracking-widest text-emerald-300">
                      Payment Successful
                    </span>
                    <h2 className="text-xl sm:text-2xl font-black tracking-tight">
                      Your Order Has Been Confirmed!
                    </h2>
                  </div>
                </div>

                <div className="text-left sm:text-right">
                  <span className="text-[10px] text-emerald-200 block uppercase font-bold">
                    Order Number
                  </span>
                  <span className="text-base sm:text-lg font-mono font-black text-white">
                    {newlyCreatedOrder.order_number}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-1 text-emerald-100">
                <div>
                  <span className="text-[10px] text-emerald-300 block">Total Amount Paid</span>
                  <span className="font-black text-sm text-white">
                    ₦{Number(newlyCreatedOrder.total_amount || newlyCreatedOrder.amount).toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-emerald-300 block">Device</span>
                  <span className="font-bold truncate block">
                    {newlyCreatedOrder.product?.title || 'Gadget Item'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-emerald-300 block">Merchant</span>
                  <span className="font-bold truncate block">
                    {newlyCreatedOrder.seller?.business_name || 'Verified Vendor'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-emerald-300 block">Fulfillment</span>
                  <span className="font-bold capitalize">{newlyCreatedOrder.delivery_method || 'Pickup'}</span>
                </div>
              </div>

              <div className="pt-2 flex flex-wrap items-center gap-3">
                <Link href={`/orders/${newlyCreatedOrder.id}`}>
                  <Button className="bg-white hover:bg-slate-100 text-slate-950 font-black text-xs rounded-xl h-10 px-5 gap-1.5 shadow-md">
                    View Order &amp; Delivery Tracking <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                </Link>
                <Link href="/products" className="text-xs font-bold text-emerald-300 hover:text-white underline">
                  Continue Shopping
                </Link>
              </div>
            </div>
          )}

          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xs">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black tracking-tight">My Gadget Orders</h1>
                <Badge className="bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 text-[10px] font-bold">
                  TechTrust Protected
                </Badge>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Track physical inspection, verified delivery, 7-day protection countdowns, and refunds.
              </p>
            </div>

            <Link href="/products">
              <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl h-10 px-4 gap-1.5 shadow-xs">
                <ShoppingBag className="w-4 h-4" /> Explore Gadgets
              </Button>
            </Link>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
            {[
              { id: 'all', label: `All Orders (${orderList.length})` },
              { id: 'in_delivery', label: 'In Transit / Pickup' },
              { id: 'protection', label: '7-Day Protection Window' },
              { id: 'disputes', label: 'Disputes & Refunds' },
              { id: 'completed', label: 'Completed' },
            ].map((tab) => (
              <Link key={tab.id} href={`/orders?tab=${tab.id}`}>
                <button
                  type="button"
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer ${
                    activeTab === tab.id
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  {tab.label}
                </button>
              </Link>
            ))}
          </div>

          {/* Orders List */}
          <div className="space-y-4">
            {filteredOrders.length > 0 ? (
              filteredOrders.map((order) => {
                const firstImg = resolveFirstImage(order.product?.images)
                const isDelivered = order.delivery_status === 'verified' || order.order_status === 'delivered'

                // Protection countdown
                let daysLeft = 0
                if (order.protection_ends_at) {
                  const diff = new Date(order.protection_ends_at).getTime() - Date.now()
                  if (diff > 0) daysLeft = Math.ceil(diff / (1000 * 60 * 60 * 24))
                }

                const dispute = Array.isArray(order.dispute) ? order.dispute[0] : order.dispute
                const refund = Array.isArray(order.refund) ? order.refund[0] : order.refund

                return (
                  <div
                    key={order.id}
                    className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xs space-y-4 hover:border-slate-300 dark:hover:border-slate-700 transition"
                  >
                    {/* Top Row: Order Number, Date & Status Badge */}
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                      <div className="flex items-center gap-2.5">
                        <span className="font-mono font-black text-xs sm:text-sm text-slate-900 dark:text-slate-100">
                          {order.order_number || order.payment_reference || order.id.slice(0, 12)}
                        </span>
                        <span className="text-slate-400 text-xs">•</span>
                        <span className="text-xs text-slate-400">
                          {new Date(order.created_at).toLocaleDateString('en-NG', { dateStyle: 'medium' })}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Protection Badge */}
                        {daysLeft > 0 && order.dispute_status === 'none' && (
                          <Badge className="bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 text-[10px] font-black">
                            <ShieldCheck className="w-3 h-3 mr-1" /> {daysLeft} Days Protection Remaining
                          </Badge>
                        )}

                        {/* Order Status Badge */}
                        <Badge
                          className={`text-[10px] font-bold capitalize ${
                            order.order_status === 'completed'
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                              : order.order_status === 'refunded'
                              ? 'bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                              : order.dispute_status !== 'none'
                              ? 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                              : 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                          }`}
                        >
                          {order.dispute_status !== 'none'
                            ? `Dispute: ${order.dispute_status}`
                            : order.order_status}
                        </Badge>
                      </div>
                    </div>

                    {/* Middle: Product & Seller Details */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 overflow-hidden flex items-center justify-center shrink-0">
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

                        <div className="min-w-0 space-y-1">
                          <h3 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100 truncate max-w-md">
                            {order.product?.title || 'Hardware Device'}
                          </h3>
                          <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
                            <span className="flex items-center gap-1 font-semibold text-slate-600 dark:text-slate-300">
                              <Store className="w-3 h-3 text-slate-400" />
                              {order.seller?.business_name || order.seller?.full_name || 'Abuja Dealer'}
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-slate-400" />
                              {order.seller?.district || 'Abuja'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="text-left sm:text-right shrink-0">
                        <span className="text-[10px] text-slate-400 uppercase font-bold block">
                          Total Paid
                        </span>
                        <span className="text-base sm:text-lg font-black text-slate-900 dark:text-slate-100">
                          ₦{Number(order.total_amount || order.amount).toLocaleString()}
                        </span>
                      </div>
                    </div>

                    {/* Bottom Row: Contextual Action Buttons */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                      <div className="text-xs text-slate-400 flex items-center gap-1.5">
                        <Truck className="w-3.5 h-3.5" />
                        <span className="capitalize">{order.delivery_method || 'Pickup'}:</span>
                        <span className="font-bold text-slate-700 dark:text-slate-300">
                          {isDelivered ? 'Delivered & Inspected' : 'Awaiting physical delivery'}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Dispute Link */}
                        {dispute && (
                          <Link href={`/disputes/${dispute.id}`}>
                            <Button size="sm" variant="outline" className="border-amber-300 text-amber-700 dark:text-amber-300 text-xs font-bold rounded-xl h-9">
                              View Dispute #{dispute.case_number}
                            </Button>
                          </Link>
                        )}

                        {/* Refund Link */}
                        {refund && (
                          <Link href={`/refunds/${refund.id}`}>
                            <Button size="sm" variant="outline" className="border-emerald-300 text-emerald-700 dark:text-emerald-300 text-xs font-bold rounded-xl h-9">
                              Refund Status →
                            </Button>
                          </Link>
                        )}

                        {/* Primary Order Tracking Link */}
                        <Link href={`/orders/${order.id}`}>
                          <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl h-9 px-4 gap-1 cursor-pointer shadow-xs">
                            <span>Track &amp; Inspect</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="py-16 px-4 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
                  <Package className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-black text-sm text-slate-800 dark:text-slate-200">
                    No Orders in This View
                  </h3>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    When you check out gadgets in Abuja, live tracking, delivery confirmation, and protection countdowns will appear here.
                  </p>
                </div>
                <Link href="/products" className="inline-block pt-1">
                  <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl">
                    Browse Hardware Catalog
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}