import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { Navbar } from '@/components/Navbar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  claimDeliveryOrderAction,
  verifyDeliveryHandoverAction,
} from '@/app/actions/delivery'
import { DeliveryExceptionModal } from './DeliveryExceptionModal'
import {
  Truck,
  MapPin,
  Phone,
  Package,
  CheckCircle2,
  Clock,
  Store,
  User,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Delivery & Logistics Hub | BenchTech Abuja',
}

function getAdminDb() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  return createAdminClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

export default async function DeliveryDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>
}) {
  const params = await searchParams
  const activeTab = params?.tab || 'active'

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login?next=/delivery')
  }

  const adminDb = getAdminDb()
  const { data: profile } = await adminDb
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle()

  const roles: string[] = Array.isArray(profile?.roles)
    ? profile.roles
    : profile?.role
    ? [profile.role]
    : []

  const isAdmin =
    profile?.role === 'admin' || profile?.is_admin === true || roles.includes('admin')
  const isDeliverer =
    profile?.role === 'delivery' ||
    profile?.is_delivery === true ||
    roles.includes('delivery') ||
    isAdmin

  if (!isDeliverer) {
    redirect('/feed')
  }

  const { data: orders } = await adminDb
    .from('orders')
    .select(`
      *,
      product:products(id, title, price, condition),
      buyer:profiles!orders_buyer_id_fkey(full_name, phone, district, street_address),
      seller:profiles!orders_seller_id_fkey(business_name, full_name, phone, district, street_address)
    `)
    .neq('order_status', 'cancelled')
    .neq('order_status', 'refunded')
    .order('created_at', { ascending: false })

  const allOrders = orders || []

  // Categorize deliveries
  const myActiveDeliveries = allOrders.filter(
    (o) =>
      o.delivery_status !== 'verified' &&
      (o.courier_id === user.id ||
        (isAdmin && o.delivery_status === 'dispatched'))
  )

  const availablePool = allOrders.filter(
    (o) =>
      o.delivery_status !== 'verified' &&
      !o.courier_id
  )

  const completedDeliveries = allOrders.filter(
    (o) =>
      o.delivery_status === 'verified' &&
      (isAdmin || o.courier_id === user.id)
  )

  const displayedOrders =
    activeTab === 'available'
      ? availablePool
      : activeTab === 'completed'
      ? completedDeliveries
      : myActiveDeliveries.length > 0
      ? myActiveDeliveries
      : availablePool

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col">
      <Navbar />

      <main className="max-w-6xl w-full mx-auto px-3 sm:px-6 py-6 sm:py-8 space-y-6">
        {/* Header */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-2xl bg-sky-600 text-white">
                <Truck className="w-5 h-5" />
              </div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                Abuja Delivery &amp; Handover Hub
              </h1>
              <Badge className="bg-sky-50 text-sky-700 dark:bg-sky-950 dark:text-sky-300 border border-sky-200 dark:border-sky-800 text-[10px] font-bold">
                {profile?.full_name || 'Authorized Deliverer'}
              </Badge>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Coordinate hardware pickups from verified sellers, oversee buyer inspection, and confirm handover OTPs.
            </p>
          </div>

          {isAdmin && (
            <Link href="/admin/deliveries">
              <Button
                size="sm"
                variant="outline"
                className="text-xs font-bold rounded-xl h-9 border-slate-200 dark:border-slate-700 cursor-pointer"
              >
                Admin Dispatch View
              </Button>
            </Link>
          )}
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-3 gap-3 sm:gap-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 sm:p-5 shadow-xs">
            <span className="text-[10px] font-bold uppercase text-slate-400 block">
              My Active Runs
            </span>
            <p className="text-xl sm:text-2xl font-black text-sky-600 dark:text-sky-400 mt-1">
              {myActiveDeliveries.length}
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 sm:p-5 shadow-xs">
            <span className="text-[10px] font-bold uppercase text-slate-400 block">
              Unassigned Pickups
            </span>
            <p className="text-xl sm:text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">
              {availablePool.length}
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 sm:p-5 shadow-xs">
            <span className="text-[10px] font-bold uppercase text-slate-400 block">
              Verified Handovers
            </span>
            <p className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
              {completedDeliveries.length}
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {[
            { id: 'active', label: `Active Runs (${myActiveDeliveries.length})` },
            { id: 'available', label: `Available Pickups (${availablePool.length})` },
            { id: 'completed', label: `Completed (${completedDeliveries.length})` },
          ].map((tab) => (
            <Link key={tab.id} href={`/delivery?tab=${tab.id}`}>
              <button
                type="button"
                className={`px-4 py-2 rounded-xl text-xs font-bold shrink-0 transition cursor-pointer ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                {tab.label}
              </button>
            </Link>
          ))}
        </div>

        {/* Delivery Cards */}
        <div className="space-y-4">
          {displayedOrders.length > 0 ? (
            displayedOrders.map((order) => {
              const orderRef =
                order.order_number || order.payment_reference || order.id.slice(0, 8)
              const isVerified = order.delivery_status === 'verified'
              const isAssignedToMe = order.courier_id === user.id

              return (
                <div
                  key={order.id}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xs space-y-5"
                >
                  {/* Top Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-black text-xs sm:text-sm text-slate-900 dark:text-white">
                        #{orderRef}
                      </span>
                      <span className="text-xs text-slate-400">
                        • {new Date(order.created_at).toLocaleDateString('en-NG')}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {order.delivery_exception && (
                        <Badge className="bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border border-amber-200 text-[10px] font-bold">
                          <AlertTriangle className="w-3 h-3 mr-1" />
                          {order.delivery_exception}
                        </Badge>
                      )}
                      <Badge
                        className={`text-[10px] font-bold capitalize ${
                          isVerified
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                            : 'bg-sky-50 text-sky-700 dark:bg-sky-950 dark:text-sky-300'
                        }`}
                      >
                        {order.delivery_status?.replace(/_/g, ' ') || 'Awaiting Pickup'}
                      </Badge>
                    </div>
                  </div>

                  {/* Pickup & Dropoff Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                    {/* 1. Hardware Item */}
                    <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 space-y-1">
                      <span className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-1">
                        <Package className="w-3 h-3" /> Hardware Item
                      </span>
                      <p className="font-bold text-slate-900 dark:text-white">
                        {order.product?.title || 'Hardware Device'}
                      </p>
                      <p className="text-slate-500 capitalize">
                        Condition: {order.product?.condition?.replace(/_/g, ' ') || 'Used'} • Method:{' '}
                        {order.delivery_method || 'Delivery'}
                      </p>
                    </div>

                    {/* 2. Seller Pickup Location */}
                    <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 space-y-1">
                      <span className="text-[10px] font-black uppercase text-blue-600 dark:text-blue-400 flex items-center gap-1">
                        <Store className="w-3 h-3" /> 1. Pickup from Seller
                      </span>
                      <p className="font-bold text-slate-900 dark:text-white">
                        {order.seller?.business_name || order.seller?.full_name || 'Vendor Store'}
                      </p>
                      <p className="text-slate-500 flex items-center gap-1">
                        <MapPin className="w-3 h-3 shrink-0" />
                        <span>
                          {order.seller?.street_address
                            ? `${order.seller.street_address}, `
                            : ''}
                          {order.seller?.district || 'Abuja'}
                        </span>
                      </p>
                      {order.seller?.phone && (
                        <a
                          href={`tel:${order.seller.phone}`}
                          className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 font-bold pt-1 hover:underline"
                        >
                          <Phone className="w-3 h-3" /> Call Seller ({order.seller.phone})
                        </a>
                      )}
                    </div>

                    {/* 3. Buyer Drop-off Location */}
                    <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 space-y-1">
                      <span className="text-[10px] font-black uppercase text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <User className="w-3 h-3" /> 2. Deliver to Buyer
                      </span>
                      <p className="font-bold text-slate-900 dark:text-white">
                        {order.buyer?.full_name || 'Buyer'}
                      </p>
                      <p className="text-slate-500 flex items-center gap-1">
                        <MapPin className="w-3 h-3 shrink-0" />
                        <span>
                          {order.delivery_address ||
                            order.buyer?.street_address ||
                            order.delivery_area ||
                            order.buyer?.district ||
                            'Abuja'}
                        </span>
                      </p>
                      {order.buyer?.phone && (
                        <a
                          href={`tel:${order.buyer.phone}`}
                          className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold pt-1 hover:underline"
                        >
                          <Phone className="w-3 h-3" /> Call Buyer ({order.buyer.phone})
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Action Bar: Claim Run OR Verify Handover OTP */}
                  {!isVerified && (
                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      {!isAssignedToMe && !order.courier_id ? (
                        <form
                          action={async () => {
                            'use server'
                            await claimDeliveryOrderAction(order.id)
                          }}
                        >
                          <Button
                            type="submit"
                            size="sm"
                            className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl h-9 px-4 gap-1.5 cursor-pointer"
                          >
                            <Truck className="w-3.5 h-3.5" />
                            <span>Accept &amp; Claim Delivery Run</span>
                          </Button>
                        </form>
                      ) : (
                        <div className="text-xs text-slate-500">
                          Assigned Courier:{' '}
                          <strong className="text-slate-900 dark:text-white">
                            {order.courier_name || 'You'}
                          </strong>
                        </div>
                      )}

                      {/* OTP Verification Form + Exception Modal */}
                      <div className="flex flex-wrap items-center gap-2">
                        <form
                          action={async (fd) => {
                            'use server'
                            await verifyDeliveryHandoverAction(fd)
                          }}
                          className="flex items-center gap-2"
                        >
                          <input type="hidden" name="orderId" value={order.id} />
                          <input
                            type="text"
                            name="otp"
                            maxLength={8}
                            placeholder={
                              order.delivery_otp
                                ? 'Enter 6-digit Buyer OTP'
                                : 'OTP (or leave blank)'
                            }
                            className="h-9 w-40 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono font-bold"
                          />
                          <Button
                            type="submit"
                            size="sm"
                            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl h-9 px-4 gap-1.5 cursor-pointer"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Verify Handover</span>
                          </Button>
                        </form>

                        <DeliveryExceptionModal
                          jobId={order.id}
                          jobNumber={orderRef}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )
            })
          ) : (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-12 text-center space-y-2">
              <Truck className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
              <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                No delivery runs in this view
              </p>
              <p className="text-xs text-slate-400">
                Check the &quot;Available Pickups&quot; tab to claim new Abuja dispatch jobs.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}