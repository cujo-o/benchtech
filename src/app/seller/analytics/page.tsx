import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import {
  Calendar,
  Crown,
  Boxes,
  Eye,
  ShoppingBag,
  TrendingUp,
  Lightbulb,
  ArrowRight,
  MessageSquare,
  Package,
} from 'lucide-react'

export const metadata = {
  title: 'Seller Analytics & Insights | BenchTech Abuja',
}

export default async function SellerAnalyticsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login?next=/seller/analytics')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const isPro =
    profile?.seller_plan === 'pro' ||
    profile?.subscription_tier === 'pro' ||
    profile?.subscription_plan === 'professional'

  // 1. Fetch seller's actual products
  const { data: products } = await supabase
    .from('products')
    .select('id, title, price, category, condition, status, views, created_at')
    .eq('seller_id', user.id)
    .order('created_at', { ascending: false })

  // 2. Fetch seller's actual orders
  const { data: orders } = await supabase
    .from('orders')
    .select('id, total_amount, status, created_at')
    .eq('seller_id', user.id)
    .order('created_at', { ascending: true })

  // 3. Fetch seller's actual buyer inquiries
  const { count: totalEnquiries } = await supabase
    .from('enquiries')
    .select('*', { count: 'exact', head: true })
    .eq('seller_id', user.id)

  const allProducts = products || []
  const allOrders = orders || []

  const activeProducts = allProducts.filter((p) => p.status === 'published')
  const soldProducts = allProducts.filter((p) => p.status === 'sold')
  const pausedProducts = allProducts.filter(
    (p) => p.status === 'paused' || p.status === 'unavailable'
  )

  // Real Calculated Metrics
  const portfolioValue = activeProducts.reduce(
    (acc, curr) => acc + (Number(curr.price) || 0),
    0
  )
  const totalRevenue = allOrders.reduce(
    (acc, curr) => acc + (Number(curr.total_amount) || 0),
    0
  )
  const totalOrdersCount = allOrders.length
  const totalViews = allProducts.reduce(
    (acc, curr) => acc + (Number(curr.views) || 0),
    0
  )
  const conversionRate =
    totalViews > 0
      ? ((totalOrdersCount / totalViews) * 100).toFixed(1)
      : totalOrdersCount > 0
      ? '100'
      : '0.0'

  // Category Distribution calculation
  const categoryCounts: Record<string, number> = {}
  activeProducts.forEach((p) => {
    const cat = p.category || 'Other Technology'
    categoryCounts[cat] = (categoryCounts[cat] || 0) + 1
  })

  // Condition Distribution calculation
  const conditionCounts: Record<string, number> = {}
  activeProducts.forEach((p) => {
    const cond = p.condition || 'good'
    conditionCounts[cond] = (conditionCounts[cond] || 0) + 1
  })

  // Real 30-Day Sales Data Mapping
  const hasSales = allOrders.length > 0
  const recentOrders = allOrders.slice(-10)

  return (
    <div className="space-y-6 sm:space-y-8 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {isPro ? 'Advanced Store Analytics' : 'Catalogue Analytics'}
            </h1>
            <Badge
              className={`text-[10px] font-black uppercase ${
                isPro
                  ? 'bg-purple-100 text-purple-800'
                  : 'bg-slate-100 text-slate-700'
              }`}
            >
              {isPro ? 'Pro Intelligence' : 'Free Plan'}
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Real-time performance metrics, verified sales ledger, and inventory valuations in Abuja.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className="text-xs font-bold gap-1.5 py-1.5 px-3 border-slate-200 bg-white"
          >
            <Calendar className="w-3.5 h-3.5 text-slate-400" /> Live Data
          </Badge>

          {!isPro && (
            <Link href="/seller/subscription">
              <Button
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl h-9 gap-1.5 shadow-xs"
              >
                <Crown className="w-3.5 h-3.5 text-amber-400 fill-amber-400" /> Upgrade to Pro
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Stock Valuations Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="rounded-2xl border-slate-200/80 bg-white p-4 shadow-xs space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Active Inventory
          </span>
          <p className="text-2xl font-black text-slate-900">{activeProducts.length}</p>
          <p className="text-[10px] text-slate-400">{allProducts.length} total registered listings</p>
        </Card>

        <Card className="rounded-2xl border-slate-200/80 bg-white p-4 shadow-xs space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Portfolio Stock Value
          </span>
          <p className="text-2xl font-black text-slate-900">
            ₦{portfolioValue.toLocaleString()}
          </p>
          <p className="text-[10px] text-emerald-600 font-semibold">Live listed retail value</p>
        </Card>

        <Card className="rounded-2xl border-slate-200/80 bg-white p-4 shadow-xs space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Gross Sold Value
          </span>
          <p className="text-2xl font-black text-slate-900">
            ₦{totalRevenue.toLocaleString()}
          </p>
          <p className="text-[10px] text-slate-400">{soldProducts.length} items marked sold</p>
        </Card>

        <Card className="rounded-2xl border-slate-200/80 bg-white p-4 shadow-xs space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Paused / Inactive
          </span>
          <p className="text-2xl font-black text-slate-900">{pausedProducts.length}</p>
          <p className="text-[10px] text-slate-400">Temporarily unlisted devices</p>
        </Card>
      </div>

      {/* Performance Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="rounded-2xl border-slate-200/80 bg-white p-4 shadow-xs space-y-1">
          <span className="text-xs text-slate-400 font-bold">Total Revenue</span>
          <p className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
            ₦{totalRevenue.toLocaleString()}
          </p>
          <span className="text-[10px] font-bold text-slate-400">From completed orders</span>
        </Card>

        <Card className="rounded-2xl border-slate-200/80 bg-white p-4 shadow-xs space-y-1">
          <span className="text-xs text-slate-400 font-bold">Orders Received</span>
          <p className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
            {totalOrdersCount}
          </p>
          <span className="text-[10px] font-bold text-slate-400">Verified purchases</span>
        </Card>

        <Card className="rounded-2xl border-slate-200/80 bg-white p-4 shadow-xs space-y-1">
          <span className="text-xs text-slate-400 font-bold">Product Impressions</span>
          <p className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
            {totalViews}
          </p>
          <span className="text-[10px] font-bold text-slate-400">Buyer clicks &amp; views</span>
        </Card>

        <Card className="rounded-2xl border-slate-200/80 bg-white p-4 shadow-xs space-y-1">
          <span className="text-xs text-slate-400 font-bold">Conversion Rate</span>
          <p className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
            {conversionRate}%
          </p>
          <span className="text-[10px] font-bold text-slate-400">Orders per view</span>
        </Card>
      </div>

      {/* Sales Trend Chart */}
      <Card className="rounded-3xl border-slate-200/80 bg-white p-6 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-black text-slate-900">Revenue &amp; Order Activity</h3>
            <p className="text-xs text-slate-400">Transaction history across your store lifecycle</p>
          </div>
          <div className="flex items-center gap-4 text-xs font-bold">
            <span className="flex items-center gap-1.5 text-blue-600">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600" /> Revenue (₦)
            </span>
          </div>
        </div>

        {hasSales ? (
          <div className="h-60 w-full flex items-end gap-2 pt-6 border-b border-slate-100 pb-2">
            {recentOrders.map((o, idx) => {
              const amount = Number(o.total_amount) || 0
              const maxAmount = Math.max(...recentOrders.map((ro) => Number(ro.total_amount) || 1))
              const heightPct = Math.max(Math.round((amount / maxAmount) * 100), 10)

              return (
                <div key={o.id || idx} className="flex-1 flex flex-col items-center gap-1 group relative">
                  <div className="hidden group-hover:block absolute -top-8 bg-slate-900 text-white text-[10px] font-bold px-2 py-0.5 rounded-md whitespace-nowrap z-10">
                    ₦{amount.toLocaleString()}
                  </div>
                  <div
                    className="w-full bg-blue-600 hover:bg-blue-700 transition rounded-t-md"
                    style={{ height: `${heightPct}%` }}
                  />
                  <span className="text-[9px] text-slate-400 truncate w-full text-center">
                    #{o.id.slice(0, 4)}
                  </span>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="py-16 text-center bg-slate-50/50 rounded-2xl border border-dashed border-slate-200 space-y-2">
            <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <TrendingUp className="w-5 h-5" />
            </div>
            <h4 className="text-xs font-bold text-slate-800">No sales transactions recorded yet[cite: 8]</h4>
            <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
              As Abuja buyers place orders and complete Banex/Wuse pickups, your daily sales graph will plot automatically here[cite: 8].
            </p>
          </div>
        )}
      </Card>

      {/* Real Inventory Breakdown & Product Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Your Registered Hardware Listings */}
        <Card className="rounded-3xl border-slate-200/80 bg-white p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-black text-slate-900">Your Catalogue Performance</h3>
              <p className="text-xs text-slate-400">Actual views and retail pricing for your items</p>
            </div>
            <Link href="/seller/listings" className="text-xs font-bold text-blue-600 hover:underline">
              Manage Listings
            </Link>
          </div>

          {allProducts.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {allProducts.map((p) => (
                <div key={p.id} className="py-3 flex items-center justify-between gap-3">
                  <div className="space-y-0.5 min-w-0">
                    <p className="text-xs font-bold text-slate-900 truncate">{p.title}</p>
                    <p className="text-[11px] text-slate-400 capitalize">
                      {p.category || 'Hardware'} • {p.condition?.replace('_', ' ') || 'Good'}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs font-black text-slate-900">₦{Number(p.price).toLocaleString()}</p>
                    <span className="text-[10px] font-bold text-blue-600 flex items-center justify-end gap-1">
                      <Eye className="w-3 h-3" /> {p.views || 0} views
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center text-xs text-slate-400 space-y-2">
              <Package className="w-8 h-8 text-slate-300 mx-auto" />
              <p>You have not published any technology listings yet[cite: 8].</p>
              <Link href="/seller/listings/new" className="inline-block pt-1">
                <Button size="sm" className="text-xs font-bold bg-blue-600 hover:bg-blue-700 rounded-xl">
                  Add Your First Gadget
                </Button>
              </Link>
            </div>
          )}
        </Card>

        {/* Category Distribution */}
        <Card className="rounded-3xl border-slate-200/80 bg-white p-6 shadow-xs space-y-4">
          <div>
            <h3 className="text-sm font-black text-slate-900">Stock Category Breakdown</h3>
            <p className="text-xs text-slate-400">Distribution of your active inventory</p>
          </div>

          {Object.keys(categoryCounts).length > 0 ? (
            <div className="space-y-3.5 pt-1">
              {Object.entries(categoryCounts).map(([cat, count]) => {
                const pct = Math.round((count / (activeProducts.length || 1)) * 100)
                return (
                  <div key={cat} className="space-y-1.5">
                    <div className="flex justify-between text-xs font-bold text-slate-700">
                      <span className="capitalize">{cat}</span>
                      <span>{count} items ({pct}%)</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-blue-600 h-full rounded-full transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="py-12 text-center text-xs text-slate-400">
              No active listings to analyze.
            </div>
          )}
        </Card>
      </div>

      {/* Dynamic Actionable Recommendation */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-950 to-slate-950 text-white rounded-3xl p-5 shadow-sm flex items-start gap-4">
        <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center text-amber-400 shrink-0">
          <Lightbulb className="w-5 h-5 fill-amber-400" />
        </div>
        <div className="space-y-1 flex-1">
          <h4 className="text-xs sm:text-sm font-bold text-purple-200 uppercase tracking-wider">
            Store Performance Note
          </h4>
          <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
            {activeProducts.length === 0
              ? 'Your store is currently empty. List your available phones, laptops, or electronics to appear in Abuja search queries[cite: 8].'
              : totalOrdersCount === 0
              ? `You have ${activeProducts.length} published gadget in Abuja with a total portfolio value of ₦${portfolioValue.toLocaleString()}. Make sure your pricing matches current Banex Plaza market averages to attract your first buyer enquiry[cite: 8].`
              : `You have completed ${totalOrdersCount} orders generating ₦${totalRevenue.toLocaleString()} in revenue. Maintain quick response times on enquiries to keep conversion high[cite: 8].`}
          </p>
        </div>
      </div>
    </div>
  )
}