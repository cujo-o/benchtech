import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { toggleProductStatus } from '../actions'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Layers,
  Users,
  ShieldCheck,
  ArrowRight,
  EyeOff,
  CheckCircle,
  ExternalLink,
  Phone,
  Store,
  DollarSign,
  Package,
  TrendingUp,
  CreditCard,
  Clock,
  Megaphone,
  ShieldAlert,
} from 'lucide-react'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Admin Control Centre | BenchTech Abuja',
}

export default async function AdminOverviewPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login?next=/admin/overview')

  const { data: currentProfile } = await supabase
    .from('profiles')
    .select('role, is_admin, roles')
    .eq('id', user.id)
    .single()

  const userRoles: string[] = currentProfile?.roles || (currentProfile?.role ? [currentProfile.role] : [])
  const isAdmin = currentProfile?.is_admin === true || currentProfile?.role === 'admin' || userRoles.includes('admin')

  if (!isAdmin) {
    redirect('/feed')
  }

  // Parallel Database Telemetry Fetch
  const [
    { data: orders },
    { data: payoutRequests },
    { data: verificationQueue },
    { data: adWallets },
    { data: products },
    { count: usersCount },
    { count: verifiedSellersCount },
  ] = await Promise.all([
    supabase.from('orders').select('*').order('created_at', { ascending: false }),
    supabase.from('payout_requests').select('id, amount, status').eq('status', 'pending'),
    supabase.from('profiles').select('id').eq('tech_trust_status', 'pending'),
    supabase.from('ad_wallets').select('balance'),
    supabase
      .from('products')
      .select('*, profiles!products_seller_id_fkey(business_name, full_name, phone, district)')
      .order('created_at', { ascending: false }),
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('tech_trust_status', 'verified'),
  ])

  const allOrders = orders || []
  const allProducts = products || []
  const publishedProducts = allProducts.filter((p) => p.status === 'published')
  const pendingPayouts = payoutRequests || []
  const pendingVerifications = verificationQueue || []
  const activeDisputes = allOrders.filter((o) => o.status === 'disputed')

  // Financial Computations
  const totalGMV = allOrders.reduce(
    (acc, curr) => acc + (Number(curr.amount || curr.total_amount) || 0),
    0
  )
  const totalPlatformRevenue = allOrders
    .filter((o) => o.status === 'completed')
    .reduce((acc, curr) => acc + (Number(curr.marketplace_fee || 0) + Number(curr.ad_fee || 0)), 0)

  const escrowFloat = allOrders
    .filter((o) => o.status === 'paid' || o.status === 'in_escrow')
    .reduce((acc, curr) => acc + (Number(curr.seller_payout || curr.amount) || 0), 0)

  const adLiabilityFloat = (adWallets || []).reduce(
    (acc, curr) => acc + (Number(curr.balance) || 0),
    0
  )

  const totalCatalogValue = publishedProducts.reduce(
    (acc, curr) => acc + (Number(curr.price) || 0),
    0
  )

  return (
    <div className="space-y-6 sm:space-y-8 max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 text-slate-900 dark:text-slate-100">
      {/* 1. Header with Storefront Shortcuts */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black tracking-tight">
              Admin Control Centre
            </h1>
            <Badge className="bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300 border border-purple-200 dark:border-purple-800 text-[10px] font-black uppercase">
              Super Admin
            </Badge>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Real-time Abuja marketplace telemetry, escrow settlement queues, and listing moderation.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/products" target="_blank">
            <Button
              variant="outline"
              size="sm"
              className="text-xs font-bold rounded-xl h-10 border-slate-200 dark:border-slate-700 gap-1.5 cursor-pointer"
            >
              <span>Live Catalog</span>
              <ExternalLink className="w-3.5 h-3.5 text-blue-600" />
            </Button>
          </Link>
          <Link href="/admin/advertising">
            <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl h-10 px-4 gap-1.5 shadow-xs cursor-pointer">
              <Megaphone className="w-3.5 h-3.5" />
              <span>Ad Engine &amp; Rates</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* 2. Real-Time Telemetry Pulse Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border border-slate-200/90 dark:border-slate-800 shadow-2xs rounded-2xl bg-white dark:bg-slate-900 p-4 sm:p-5 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Gross Merchandise (GMV)</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <h2 className="text-2xl font-black mt-1">₦{totalGMV.toLocaleString()}</h2>
          <p className="text-[10px] text-slate-400 mt-0.5">{allOrders.length} total orders recorded</p>
        </Card>

        <Card className="border border-slate-200/90 dark:border-slate-800 shadow-2xs rounded-2xl bg-white dark:bg-slate-900 p-4 sm:p-5 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Retained Revenue</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
            ₦{totalPlatformRevenue.toLocaleString()}
          </h2>
          <p className="text-[10px] text-slate-400 mt-0.5">7% commission + ad revenues</p>
        </Card>

        <Card className="border border-slate-200/90 dark:border-slate-800 shadow-2xs rounded-2xl bg-white dark:bg-slate-900 p-4 sm:p-5 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Inspection Escrow Float</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950 text-amber-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <h2 className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">
            ₦{escrowFloat.toLocaleString()}
          </h2>
          <p className="text-[10px] text-slate-400 mt-0.5">Protected pending inspection</p>
        </Card>

        <Card className="border border-slate-200/90 dark:border-slate-800 shadow-2xs rounded-2xl bg-white dark:bg-slate-900 p-4 sm:p-5 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Ad Wallet Liabilities</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950 text-purple-600 flex items-center justify-center">
              <Megaphone className="w-4 h-4" />
            </div>
          </div>
          <h2 className="text-2xl font-black mt-1">₦{adLiabilityFloat.toLocaleString()}</h2>
          <p className="text-[10px] text-purple-600 font-semibold mt-0.5">Prepaid seller float for CPC</p>
        </Card>
      </div>

      {/* 3. Operational Action Dispatch Queue */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link href="/admin/payouts">
          <Card className="p-4 rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-blue-500/50 transition shadow-2xs flex items-center justify-between group cursor-pointer">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950 text-blue-600 flex items-center justify-center font-black">
                {pendingPayouts.length}
              </div>
              <div>
                <h4 className="text-xs font-black group-hover:text-blue-600 transition">Pending Bank Payouts</h4>
                <p className="text-[11px] text-slate-400">Withdrawals waiting for disbursement</p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition" />
          </Card>
        </Link>

        <Link href="/admin/disputes">
          <Card className="p-4 rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-red-500/50 transition shadow-2xs flex items-center justify-between group cursor-pointer">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-red-50 dark:bg-red-950 text-red-600 flex items-center justify-center font-black">
                {activeDisputes.length}
              </div>
              <div>
                <h4 className="text-xs font-black group-hover:text-red-600 transition">Inspection Disputes</h4>
                <p className="text-[11px] text-slate-400">Escrow cases needing arbitration</p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition" />
          </Card>
        </Link>

        <Link href="/admin/verifications">
          <Card className="p-4 rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-emerald-500/50 transition shadow-2xs flex items-center justify-between group cursor-pointer">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center font-black">
                {pendingVerifications.length}
              </div>
              <div>
                <h4 className="text-xs font-black group-hover:text-emerald-600 transition">TechTrust Merchant KYC</h4>
                <p className="text-[11px] text-slate-400">Abuja computer village dealers</p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition" />
          </Card>
        </Link>
      </div>

      {/* 4. Live Listing Moderation Desk */}
      <Card className="border border-slate-200/90 dark:border-slate-800 shadow-2xs rounded-3xl bg-white dark:bg-slate-900 overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-black text-slate-900 dark:text-slate-100">
              Live Listing Moderation Desk
            </h3>
            <p className="text-xs text-slate-400">
              Inspect hardware pricing, seller identity, and take down policy-violating products instantly.
            </p>
          </div>
          <span className="text-xs font-bold text-slate-500">
            {allProducts.length} Total SKUs • ₦{totalCatalogValue.toLocaleString()} Catalog Value
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-400 font-bold border-b border-slate-100 dark:border-slate-800 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-5 py-3">Product</th>
                <th className="px-5 py-3">Vendor</th>
                <th className="px-5 py-3">Price</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 text-right">Moderation Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {allProducts.length > 0 ? (
                allProducts.map((item) => {
                  const seller = item.profiles
                  const cleanPhone = seller?.phone
                    ? seller.phone.replace(/[^0-9]/g, '').replace(/^0/, '234')
                    : null

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition">
                      {/* Product details + Thumbnail */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-slate-50 dark:bg-slate-800 rounded-xl overflow-hidden shrink-0 border border-slate-200/80 dark:border-slate-700 p-1 flex items-center justify-center">
                            {item.images?.[0] ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={item.images[0]}
                                alt={item.title}
                                className="max-h-full object-contain"
                              />
                            ) : (
                              <Package className="w-4 h-4 text-slate-300" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <p className="font-bold text-slate-900 dark:text-slate-100 line-clamp-1">
                                {item.title}
                              </p>
                              <Link
                                href={`/products/${item.id}`}
                                target="_blank"
                                title="Open Live Listing"
                                className="text-slate-400 hover:text-blue-600 transition"
                              >
                                <ExternalLink className="w-3 h-3" />
                              </Link>
                            </div>
                            <p className="text-[10px] text-slate-400 capitalize">
                              {item.brand || 'Device'} • {item.category || 'Hardware'} • {item.condition?.replace('_', ' ') || 'used'}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Seller Info with Direct WhatsApp */}
                      <td className="px-5 py-3.5">
                        <div className="space-y-0.5">
                          <p className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1">
                            <Store className="w-3 h-3 text-slate-400" />
                            <span>{seller?.business_name || seller?.full_name || 'Vendor'}</span>
                          </p>
                          <div className="flex items-center gap-2 text-[10px] text-slate-400">
                            <span>{seller?.district || 'Abuja'}</span>
                            {cleanPhone && (
                              <a
                                href={`https://wa.me/${cleanPhone}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-emerald-600 hover:underline flex items-center gap-0.5 font-bold"
                              >
                                <Phone className="w-2.5 h-2.5" /> WhatsApp
                              </a>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Price */}
                      <td className="px-5 py-3.5 font-black text-slate-900 dark:text-slate-100">
                        ₦{Number(item.price).toLocaleString()}
                      </td>

                      {/* Status */}
                      <td className="px-5 py-3.5">
                        <Badge
                          variant="secondary"
                          className={`text-[10px] capitalize font-bold ${
                            item.status === 'published'
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200'
                              : 'bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300 border border-rose-200'
                          }`}
                        >
                          {item.status}
                        </Badge>
                      </td>

                      {/* Moderation Action Button */}
                      <td className="px-5 py-3.5 text-right">
                        {item.status === 'published' ? (
                          <form action={toggleProductStatus.bind(null, item.id, 'hidden')}>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 text-[11px] text-rose-600 border-rose-200 hover:bg-rose-50 dark:hover:bg-rose-950/40 font-bold gap-1 rounded-xl cursor-pointer"
                            >
                              <EyeOff className="w-3 h-3" /> Take Down
                            </Button>
                          </form>
                        ) : (
                          <form action={toggleProductStatus.bind(null, item.id, 'published')}>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 text-[11px] text-emerald-600 border-emerald-200 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 font-bold gap-1 rounded-xl cursor-pointer"
                            >
                              <CheckCircle className="w-3 h-3" /> Restore
                            </Button>
                          </form>
                        )}
                      </td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-slate-400">
                    No products cataloged in the marketplace yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}