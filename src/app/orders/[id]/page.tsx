import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { Navbar } from '@/components/Navbar'
import { formatSpecLabel } from '@/lib/specs/categorySpecs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  CheckCircle2,
  Package,
  Truck,
  ShieldCheck,
  Clock,
  MapPin,
  Store,
  ArrowLeft,
  Lock,
  AlertTriangle,
  Cpu,
  RotateCcw,
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

export default async function OrderDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect(`/login?next=/orders/${id}`)
  }

  const adminDb = getAdminDb()
  const { data: order } = await adminDb
    .from('orders')
    .select(
      `
      *,
      product:products(*, profiles!products_seller_id_fkey(id, business_name, full_name, district, tech_trust_status)),
      seller:profiles!orders_seller_id_fkey(id, business_name, full_name, district, tech_trust_status)
    `
    )
    .eq('id', id)
    .maybeSingle()

  if (!order) {
    notFound()
  }

  // Enforce ownership (Buyer, Seller, or Admin)
  const { data: viewerProfile } = await adminDb
    .from('profiles')
    .select('role, is_admin')
    .eq('id', user.id)
    .maybeSingle()

  const isAdmin =
    viewerProfile?.role === 'admin' || viewerProfile?.is_admin === true
  if (
    order.buyer_id !== user.id &&
    order.seller_id !== user.id &&
    !isAdmin
  ) {
    redirect('/orders')
  }

  // Retrieve full multi-item manifest if this order had multiple cart items
  let purchasedItems: any[] = []
  if (Array.isArray((order as any).order_items) && (order as any).order_items.length > 0) {
    purchasedItems = (order as any).order_items
  } else {
    // Check audit_events for multi-item checkout payload or Paystack metadata
    const { data: checkoutAudit } = await adminDb
      .from('audit_events')
      .select('metadata')
      .eq('target_id', order.id)
      .eq('action', 'order_checkout_completed')
      .maybeSingle()

    if (
      Array.isArray(checkoutAudit?.metadata?.items) &&
      checkoutAudit.metadata.items.length > 0
    ) {
      purchasedItems = checkoutAudit.metadata.items
    }
  }

  // Hydrate live product specs for all items in the order
  if (purchasedItems.length > 0) {
    const prodIds = purchasedItems.map((i) => i.id).filter(Boolean)
    const { data: liveProds } = await adminDb
      .from('products')
      .select(
        '*, profiles!products_seller_id_fkey(id, business_name, full_name, district, tech_trust_status)'
      )
      .in('id', prodIds)

    const prodMap = new Map<string, any>()
    for (const lp of liveProds || []) {
      prodMap.set(lp.id, lp)
    }

    purchasedItems = purchasedItems.map((item) => {
      const lp = prodMap.get(item.id)
      const sellerObj = Array.isArray(lp?.profiles)
        ? lp.profiles[0]
        : lp?.profiles
      return {
        id: item.id,
        title: lp?.title || item.title || 'Hardware Device',
        price: Number(item.price || lp?.price || 0),
        quantity: Number(item.quantity || 1),
        condition: lp?.condition || item.condition || 'used',
        brand: lp?.brand || item.brand || '',
        model: lp?.model || lp?.specs?.model || item.model || '',
        category: lp?.category || item.category || 'hardware',
        image: resolveFirstImage(lp?.images) || item.image || null,
        specs: { ...(lp?.specs || {}), ...(item.specs || {}) },
        seller_id: lp?.seller_id || item.seller_id || order.seller_id,
        seller_name:
          sellerObj?.business_name ||
          sellerObj?.full_name ||
          item.seller_name ||
          order.seller?.business_name ||
          'Verified Store',
        seller_district:
          sellerObj?.district ||
          item.seller_district ||
          order.seller?.district ||
          'Abuja',
        seller_verified: sellerObj?.tech_trust_status === 'verified',
      }
    })
  } else if (order.product) {
    const p = order.product
    const sellerObj = Array.isArray(p.profiles) ? p.profiles[0] : p.profiles
    purchasedItems = [
      {
        id: p.id,
        title: p.title,
        price: Number(p.price || order.total_amount || order.amount || 0),
        quantity: 1,
        condition: p.condition || 'used',
        brand: p.brand || '',
        model: p.model || p.specs?.model || '',
        category: p.category || 'hardware',
        image: resolveFirstImage(p.images),
        specs: p.specs || {},
        seller_id: p.seller_id || order.seller_id,
        seller_name:
          sellerObj?.business_name ||
          sellerObj?.full_name ||
          order.seller?.business_name ||
          'Verified Store',
        seller_district:
          sellerObj?.district || order.seller?.district || 'Abuja',
        seller_verified: sellerObj?.tech_trust_status === 'verified',
      },
    ]
  }

  const isCancelled = order.order_status === 'cancelled'
  const isRefunded = order.order_status === 'refunded'
  const isDispatched =
    order.delivery_status === 'dispatched' ||
    order.delivery_status === 'verified'
  const isDelivered =
    order.delivery_status === 'verified' ||
    order.order_status === 'delivered' ||
    order.order_status === 'completed'

  // Server action: Buyer confirms receipt ONLY after order has been dispatched
  async function buyerConfirmDeliveryAction(): Promise<void> {
    'use server'
    const db = getAdminDb()
    const now = new Date()
    const protectionEnds = new Date(
      now.getTime() + 7 * 24 * 60 * 60 * 1000
    ).toISOString()

    await db
      .from('orders')
      .update({
        delivery_status: 'verified',
        order_status: 'delivered',
        payout_status: 'on_hold',
        delivered_at: now.toISOString(),
        protection_ends_at: protectionEnds,
        updated_at: now.toISOString(),
      })
      .eq('id', id)

    revalidatePath(`/orders/${id}`)
    revalidatePath('/orders')
  }

  // Server action: Buyer cancels unshipped order
  async function buyerCancelUnshippedAction(): Promise<void> {
    'use server'
    const db = getAdminDb()
    await db
      .from('orders')
      .update({
        order_status: 'cancelled',
        status: 'cancelled',
        payout_status: 'cancelled',
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)

    revalidatePath(`/orders/${id}`)
    revalidatePath('/orders')
  }

  const orderRef =
    order.order_number || order.payment_reference || order.id.slice(0, 8)
  const totalAmount = Number(order.total_amount || order.amount || 0)

  const STAGES = [
    { key: 'placed', label: 'Placed', done: true, icon: CheckCircle2 },
    {
      key: 'preparing',
      label: 'Preparing',
      done: !isCancelled && !isRefunded,
      icon: Package,
    },
    {
      key: 'dispatched',
      label: 'Dispatched',
      done: isDispatched,
      icon: Truck,
    },
    {
      key: 'delivered',
      label: 'Delivered',
      done: isDelivered,
      icon: ShieldCheck,
    },
  ]

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col">
      <Navbar />

      <main className="max-w-4xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-6">
        <div className="flex items-center justify-between">
          <Link
            href="/orders"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to My Orders</span>
          </Link>

          <Link
            href="/help"
            className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline"
          >
            Need Help with This Order?
          </Link>
        </div>

        {/* 1. Order Reference & Total Banner */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-slate-400 font-semibold">
                Order Reference:
              </span>
              <span className="font-mono font-black text-base sm:text-lg text-slate-900 dark:text-white">
                {orderRef}
              </span>
              <Badge
                className={`text-[10px] font-bold uppercase ${
                  isCancelled || isRefunded
                    ? 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300'
                    : isDelivered
                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                    : 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                }`}
              >
                {order.order_status || order.status || 'Paid'}
              </Badge>
            </div>
            <p className="text-xs text-slate-400">
              Placed on{' '}
              {new Date(order.created_at).toLocaleDateString('en-NG', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}{' '}
              • {purchasedItems.reduce((sum, i) => sum + i.quantity, 0)} Total{' '}
              {purchasedItems.reduce((sum, i) => sum + i.quantity, 0) === 1
                ? 'Unit'
                : 'Units'}
            </p>
          </div>

          <div className="sm:text-right">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Total Amount Paid
            </span>
            <span className="text-xl sm:text-2xl font-black text-blue-600 dark:text-blue-400">
              ₦{totalAmount.toLocaleString()}
            </span>
          </div>
        </div>

        {/* 2. Order Delivery Progress & Stage-Gated Controls */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xs space-y-6">
          <h2 className="text-xs font-black uppercase tracking-wider text-slate-400">
            Order Delivery Progress
          </h2>

          {/* 4-Stage Visual Tracker */}
          <div className="grid grid-cols-4 gap-2 text-center">
            {STAGES.map((st) => {
              const Icon = st.icon
              return (
                <div
                  key={st.key}
                  className="flex flex-col items-center gap-2"
                >
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition ${
                      st.done
                        ? 'bg-emerald-500/15 border-emerald-500 text-emerald-500'
                        : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <span
                    className={`text-xs font-bold ${
                      st.done
                        ? 'text-slate-900 dark:text-white'
                        : 'text-slate-400'
                    }`}
                  >
                    {st.label}
                  </span>
                </div>
              )
            })}
          </div>

          {/* STAGE-APPROPRIATE STATUS BOX (Never shows "Confirm Received" before Dispatch!) */}
          {isCancelled || isRefunded ? (
            <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 text-xs text-red-700 dark:text-red-300 font-semibold flex items-center gap-2.5">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>
                This order has been {order.order_status}. No further delivery action is required.
              </span>
            </div>
          ) : !isDispatched ? (
            /* STAGE 1 & 2: PLACED / PREPARING (NOT YET DISPATCHED) */
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-bold text-slate-900 dark:text-white">
                    Awaiting Seller Dispatch in Abuja
                  </p>
                  <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
                    Your payment is held safely in escrow. Once the seller dispatches your order with a courier, your 6-digit Handover OTP and delivery confirmation controls will unlock here.
                  </p>
                </div>
              </div>

              {order.buyer_id === user.id && (
                <form action={buyerCancelUnshippedAction} className="shrink-0">
                  <Button
                    type="submit"
                    size="sm"
                    variant="outline"
                    className="text-xs font-bold rounded-xl h-9 px-3.5 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:text-red-600 gap-1.5 cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Cancel Unshipped Order</span>
                  </Button>
                </form>
              )}
            </div>
          ) : !isDelivered ? (
            /* STAGE 3: DISPATCHED / IN TRANSIT (SHOW HANDOVER OTP & CONFIRM BUTTON) */
            <div className="p-4 sm:p-5 rounded-2xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
              <div className="space-y-1.5">
                <p className="font-black text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <Truck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span>Order Dispatched — Inspect Hardware Before Handover</span>
                </p>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                  Inspect the physical condition and specifications upon arrival. Share this 6-digit Handover OTP with the courier (or click Confirm below) <strong>only after</strong> you have received and inspected the item:
                </p>
                {order.delivery_otp && (
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-blue-300 dark:border-blue-800 mt-1">
                    <span className="text-[10px] font-bold uppercase text-slate-400">
                      Handover OTP:
                    </span>
                    <span className="font-mono font-black text-sm tracking-widest text-blue-600 dark:text-blue-400">
                      {order.delivery_otp}
                    </span>
                  </div>
                )}
              </div>

              {order.buyer_id === user.id && (
                <form action={buyerConfirmDeliveryAction} className="shrink-0">
                  <Button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl h-10 px-5 cursor-pointer"
                  >
                    Confirm I Received This Order
                  </Button>
                </form>
              )}
            </div>
          ) : (
            /* STAGE 4: DELIVERED & IN 7-DAY BUYER INSPECTION WINDOW */
            <div className="p-4 sm:p-5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
              <div className="space-y-1">
                <p className="font-black text-sm text-emerald-900 dark:text-emerald-200 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Delivery Verified — 7-Day Buyer Inspection Active</span>
                </p>
                <p className="text-emerald-800 dark:text-emerald-300">
                  Your order was marked delivered. You are covered by the 7-day inspection window until{' '}
                  {order.protection_ends_at
                    ? new Date(order.protection_ends_at).toLocaleDateString('en-NG')
                    : '7 days from delivery'}
                  .
                </p>
              </div>

              <Link href={`/orders/${order.id}/dispute`} className="shrink-0">
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs font-bold rounded-xl h-9 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 cursor-pointer"
                >
                  Report Hardware Issue
                </Button>
              </Link>
            </div>
          )}
        </div>

        {/* 3. All Purchased Products & Full Technical Specifications */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xs space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div>
              <h2 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white">
                Purchased Hardware &amp; Specifications ({purchasedItems.length}{' '}
                {purchasedItems.length === 1 ? 'Product' : 'Products'})
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Use these recorded specifications to verify each device upon delivery
              </p>
            </div>
          </div>

          <div className="space-y-5">
            {purchasedItems.map((item, idx) => {
              const unitPrice = Number(item.price || 0)
              const qty = Number(item.quantity || 1)
              const lineTotal = unitPrice * qty

              // Filter public specs (exclude internal URLs)
              const specEntries = Object.entries(item.specs || {}).filter(
                ([k, v]) =>
                  v &&
                  typeof v === 'string' &&
                  !['ownership_proof_url', 'serial_number', 'product_verification'].includes(
                    k
                  )
              )

              return (
                <div
                  key={`${item.id}-${idx}`}
                  className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4 min-w-0">
                      <Link
                        href={`/products/${item.id}`}
                        className="w-20 h-20 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-2 flex items-center justify-center shrink-0 overflow-hidden"
                      >
                        {item.image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={item.image}
                            alt={item.title}
                            className="w-full h-full object-contain"
                          />
                        ) : (
                          <Package className="w-7 h-7 text-slate-400" />
                        )}
                      </Link>

                      <div className="min-w-0 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <Link
                            href={`/products/${item.id}`}
                            className="text-sm sm:text-base font-black text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400"
                          >
                            {item.title}
                          </Link>
                          <Badge
                            variant="outline"
                            className="text-[10px] font-bold capitalize"
                          >
                            {item.condition?.replace(/_/g, ' ') || 'Verified'}
                          </Badge>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                          <span className="flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300">
                            <Store className="w-3.5 h-3.5 text-blue-600" />
                            Sold by:{' '}
                            <Link
                              href={`/sellers/${item.seller_id}`}
                              className="hover:underline text-blue-600 dark:text-blue-400"
                            >
                              {item.seller_name}
                            </Link>
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {item.seller_district}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="sm:text-right shrink-0 border-t sm:border-t-0 border-slate-200/70 dark:border-slate-700 pt-3 sm:pt-0">
                      <span className="text-xs text-slate-400 block">
                        Qty: <strong className="text-slate-900 dark:text-white">{qty}</strong> × ₦
                        {unitPrice.toLocaleString()}
                      </span>
                      <span className="text-base font-black text-blue-600 dark:text-blue-400">
                        ₦{lineTotal.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Item Technical Specifications Grid */}
                  {specEntries.length > 0 ? (
                    <div className="pt-3 border-t border-slate-200/70 dark:border-slate-700/70 space-y-2">
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                        <Cpu className="w-3.5 h-3.5 text-blue-600" />
                        Recorded Hardware Specifications
                      </span>

                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 text-xs">
                        {specEntries.map(([key, value]) => (
                          <div
                            key={key}
                            className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800"
                          >
                            <span className="text-[10px] font-bold uppercase text-slate-400 block truncate">
                              {formatSpecLabel(key)}
                            </span>
                            <span className="font-bold text-slate-900 dark:text-white block truncate mt-0.5">
                              {String(value)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="pt-3 border-t border-slate-200/70 dark:border-slate-700/70 flex flex-wrap items-center gap-4 text-xs text-slate-500">
                      {item.brand && (
                        <span>
                          Brand: <strong className="text-slate-900 dark:text-white">{item.brand}</strong>
                        </span>
                      )}
                      {item.model && (
                        <span>
                          Model: <strong className="text-slate-900 dark:text-white">{item.model}</strong>
                        </span>
                      )}
                      <span>
                        Condition:{' '}
                        <strong className="capitalize text-slate-900 dark:text-white">
                          {item.condition?.replace(/_/g, ' ') || 'Verified'}
                        </strong>
                      </span>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* 4. Delivery & Escrow Summary */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xs grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase text-slate-400 block">
              Delivery Destination &amp; Method
            </span>
            <p className="font-bold text-slate-900 dark:text-white capitalize">
              Method: {order.delivery_method || 'Abuja Dispatch'}
            </p>
            <p className="text-slate-500 dark:text-slate-400">
              Location: {order.delivery_address || order.delivery_area || 'Abuja'}
            </p>
          </div>

          <div className="space-y-1 sm:text-right">
            
            <p className="font-bold text-emerald-600 dark:text-emerald-400 flex sm:justify-end items-center gap-1">
              <Lock className="w-3.5 h-3.5" />
              <span>
                {order.payout_status === 'paid'
                  ? 'Settled to Seller'
                  : 'Protected in Escrow Hold'}
              </span>
            </p>
           
          </div>
        </div>
      </main>
    </div>
  )
}