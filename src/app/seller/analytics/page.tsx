import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import {
  TrendingUp,
  LineChart,
  Eye,
  ShoppingBag,
  ArrowUpRight,
  Sparkles,
  Lock,
  Crown,
  Calendar,
  Layers,
  ArrowRight,
  Lightbulb,
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

  // Fetch live inventory
  const { data: products } = await supabase
    .from('products')
    .select('*')
    .eq('seller_id', user.id)

  // Fetch live orders
  const { data: orders } = await supabase
    .from('orders')
    .select('*')
    .eq('seller_id', user.id)

  const activeProducts = products?.filter((p) => p.status === 'published') || []
  const soldProducts = products?.filter((p) => p.status === 'sold') || []
  const pausedProducts = products?.filter((p) => p.status === 'paused' || p.status === 'unavailable') || []

  const portfolioValue = activeProducts.reduce((acc, curr) => acc + (Number(curr.price) || 0), 0)
  const totalRevenue = (orders || []).reduce((acc, curr) => acc + (Number(curr.total_amount) || 0), 0)

  // Category Breakdown
  const categoriesMap: Record<string, number> = {}
  activeProducts.forEach((p) => {
    const cat = p.category || 'Other'
    categoriesMap[cat] = (categoriesMap[cat] || 0) + 1
  })

  return (
    <div className="space-y-8 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {isPro ? 'Advanced Store Analytics' : 'Basic Catalogue Analytics'}
            </h1>
            <Badge
              className={`text-[10px] font-black uppercase ${
                isPro ? 'bg-purple-100 text-purple-800' : 'bg-slate-100 text-slate-700'
              }`}
            >
              {isPro ? 'Pro Intelligence' : 'Free Tier'}
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Performance metrics, inventory valuations, and buyer traffic insights in Abuja.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs font-bold gap-1.5 py-1.5 px-3 border-slate-200 bg-white">
            <Calendar className="w-3.5 h-3.5 text-slate-400" /> Last 30 Days
          </Badge>
          {!isPro && (
            <Link href="/seller/subscription">
              <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl h-9 gap-1.5 shadow-xs">
                <Crown className="w-3.5 h-3.5 text-amber-400 fill-amber-400" /> Unlock Pro Analytics
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* =========================================================================
          1. BASIC METRICS (Visible to both Free & Pro)
      ========================================================================= */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="rounded-2xl border-slate-200/80 bg-white p-4 shadow-xs space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Active Inventory</span>
          <p className="text-2xl font-black text-slate-900">{activeProducts.length}</p>
          <p className="text-[10px] text-slate-400">{products?.length || 0} total registered listings</p>
        </Card>

        <Card className="rounded-2xl border-slate-200/80 bg-white p-4 shadow-xs space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Portfolio Stock Value</span>
          <p className="text-2xl font-black text-slate-900">₦{portfolioValue.toLocaleString()}</p>
          <p className="text-[10px] text-emerald-600 font-semibold">Live listed retail value</p>
        </Card>

        <Card className="rounded-2xl border-slate-200/80 bg-white p-4 shadow-xs space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Gross Sold Value</span>
          <p className="text-2xl font-black text-slate-900">₦{totalRevenue.toLocaleString()}</p>
          <p className="text-[10px] text-slate-400">{orders?.length || 0} completed orders</p>
        </Card>

        <Card className="rounded-2xl border-slate-200/80 bg-white p-4 shadow-xs space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Paused / Inactive</span>
          <p className="text-2xl font-black text-slate-900">{pausedProducts.length}</p>
          <p className="text-[10px] text-slate-400">Temporarily unlisted devices</p>
        </Card>
      </div>

      {/* =========================================================================
          2. PRO ANALYTICS SECTION (Interactive for Pro, Pro-Paywall for Free)
      ========================================================================= */}
      <div className="relative">
        {/* Pro Lock Overlay for Free Plan */}
        {!isPro && (
          <div className="absolute inset-0 z-20 backdrop-blur-md bg-white/75 rounded-3xl flex flex-col items-center justify-center p-6 text-center">
            <div className="max-w-md bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xl space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mx-auto shadow-inner">
                <Lock className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900">Unlock Advanced Analytics</h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Track 30-day revenue curves, conversion rates, traffic channels, and device-level demand insights with ShopBenchTech Pro[cite: 10, 11].
                </p>
              </div>

              <div className="p-3 bg-purple-50/70 border border-purple-100 rounded-xl text-left space-y-1.5 text-[11px] text-purple-900 font-semibold">
                <div className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-purple-600" /> Real-time sales trends &amp; buyer conversion rate[cite: 10, 11]
                </div>
                <div className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-purple-600" /> Traffic source distribution (Search vs AI Assistant)[cite: 10, 11]
                </div>
                <div className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-purple-600" /> Automated sales tips based on Abuja search volumes[cite: 10, 11]
                </div>
              </div>

              <Link href="/seller/subscription" className="block pt-1">
                <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black text-xs h-11 rounded-xl shadow-md gap-2">
                  Upgrade to Pro — ₦5,000/month <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </Link>
            </div>
          </div>
        )}

        <div className={`space-y-6 ${!isPro ? 'select-none pointer-events-none opacity-50' : ''}`}>
          {/* Pro Key Ratios Bar */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="rounded-2xl border-slate-200/80 bg-white p-4 shadow-xs">
              <span className="text-xs text-slate-400 font-bold">Total Revenue</span>
              <p className="text-xl sm:text-2xl font-black text-slate-900 mt-1">₦2,400,000</p>
              <span className="text-[10px] font-bold text-emerald-600">↑ 18% vs last month</span>
            </Card>

            <Card className="rounded-2xl border-slate-200/80 bg-white p-4 shadow-xs">
              <span className="text-xs text-slate-400 font-bold">Orders Fulfilled</span>
              <p className="text-xl sm:text-2xl font-black text-slate-900 mt-1">47</p>
              <span className="text-[10px] font-bold text-emerald-600">↑ 24%</span>
            </Card>

            <Card className="rounded-2xl border-slate-200/80 bg-white p-4 shadow-xs">
              <span className="text-xs text-slate-400 font-bold">Store Views</span>
              <p className="text-xl sm:text-2xl font-black text-slate-900 mt-1">1,240</p>
              <span className="text-[10px] font-bold text-emerald-600">↑ 32%</span>
            </Card>

            <Card className="rounded-2xl border-slate-200/80 bg-white p-4 shadow-xs">
              <span className="text-xs text-slate-400 font-bold">Conversion Rate</span>
              <p className="text-xl sm:text-2xl font-black text-slate-900 mt-1">3.4%</p>
              <span className="text-[10px] font-bold text-emerald-600">↑ 0.8%</span>
            </Card>
          </div>

          {/* Sales & Traffic Graph (Mockup Screen 2 Top Right) */}
          <Card className="rounded-3xl border-slate-200/80 bg-white p-6 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-black text-slate-900">Sales &amp; Buyer Traffic Curve</h3>
                <p className="text-xs text-slate-400">Comparing gross transaction value with listing impressions</p>
              </div>
              <div className="flex items-center gap-4 text-xs font-bold">
                <span className="flex items-center gap-1.5 text-blue-600">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-600" /> Revenue (₦)
                </span>
                <span className="flex items-center gap-1.5 text-purple-600">
                  <span className="w-2.5 h-2.5 rounded-full bg-purple-500" /> Views
                </span>
              </div>
            </div>

            {/* Pure SVG Spline Curve & Bar Visualization */}
            <div className="h-64 w-full relative pt-6">
              <svg viewBox="0 0 800 200" className="w-full h-full overflow-visible">
                {/* Horizontal Guide Lines */}
                <line x1="0" y1="0" x2="800" y2="0" stroke="#f1f5f9" strokeWidth="1" />
                <line x1="0" y1="50" x2="800" y2="50" stroke="#f1f5f9" strokeWidth="1" />
                <line x1="0" y1="100" x2="800" y2="100" stroke="#f1f5f9" strokeWidth="1" />
                <line x1="0" y1="150" x2="800" y2="150" stroke="#f1f5f9" strokeWidth="1" />

                {/* Soft Area Gradient */}
                <defs>
                  <linearGradient id="curveGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                  </linearGradient>
                </defs>

                {/* Area Fill */}
                <path
                  d="M 0 160 Q 100 130 200 90 T 400 120 T 600 40 T 800 60 L 800 200 L 0 200 Z"
                  fill="url(#curveGradient)"
                />

                {/* Blue Revenue Spline */}
                <path
                  d="M 0 160 Q 100 130 200 90 T 400 120 T 600 40 T 800 60"
                  fill="none"
                  stroke="#2563eb"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                />

                {/* Purple Traffic Spline */}
                <path
                  d="M 0 180 Q 100 150 200 130 T 400 140 T 600 80 T 800 90"
                  fill="none"
                  stroke="#8b5cf6"
                  strokeWidth="2.5"
                  strokeDasharray="4 4"
                  strokeLinecap="round"
                />

                {/* Highlight Point on High Point (Oct 21) */}
                <circle cx="600" cy="40" r="5" fill="#2563eb" stroke="#ffffff" strokeWidth="2" />
              </svg>

              {/* X Axis Time Labels */}
              <div className="flex justify-between text-[11px] font-bold text-slate-400 pt-3 border-t border-slate-100">
                <span>Oct 1</span>
                <span>Oct 7</span>
                <span>Oct 14</span>
                <span className="text-blue-600">Oct 21 (Peak)</span>
                <span>Oct 28</span>
              </div>
            </div>
          </Card>

          {/* Top Products & Traffic Sources Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Top Performing Products */}
            <Card className="lg:col-span-2 rounded-3xl border-slate-200/80 bg-white p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black text-slate-900">Top Performing Products</h3>
                  <p className="text-xs text-slate-400">Ranked by buyer inquiries and completed conversions</p>
                </div>
                <Link href="/seller/listings" className="text-xs font-bold text-blue-600 hover:underline">
                  View All Listings
                </Link>
              </div>

              <div className="divide-y divide-slate-100">
                {[
                  { title: 'iPhone 15 Pro Max 256GB', views: 542, orders: 18, rev: '₦1,850,000' },
                  { title: 'MacBook Air M2 (16GB RAM)', views: 380, orders: 12, rev: '₦960,000' },
                  { title: 'Samsung Galaxy S24 Ultra', views: 290, orders: 8, rev: '₦720,000' },
                  { title: 'Sony WH-1000XM5 Wireless', views: 190, orders: 6, rev: '₦210,000' },
                ].map((item, idx) => (
                  <div key={idx} className="py-3 flex items-center justify-between gap-4">
                    <div className="space-y-0.5">
                      <p className="text-xs font-bold text-slate-900">{item.title}</p>
                      <p className="text-[11px] text-slate-400">
                        {item.views} views • {item.orders} orders
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-black text-slate-900">{item.rev}</p>
                      <span className="text-[10px] font-bold text-emerald-600">High Demand</span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Traffic Sources Breakdown (Donut Representation) */}
            <Card className="rounded-3xl border-slate-200/80 bg-white p-6 shadow-xs flex flex-col justify-between space-y-4">
              <div>
                <h3 className="text-sm font-black text-slate-900">Traffic Sources</h3>
                <p className="text-xs text-slate-400">Where Abuja buyers discover your stock</p>
              </div>

              {/* Donut Chart Representation */}
              <div className="flex items-center justify-center relative py-4">
                <svg viewBox="0 0 100 100" className="w-36 h-36 -rotate-90">
                  <circle cx="50" cy="50" r="40" stroke="#f1f5f9" strokeWidth="12" fill="none" />
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    stroke="#2563eb"
                    strokeWidth="12"
                    strokeDasharray="140 251"
                    strokeDashoffset="0"
                    fill="none"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    stroke="#8b5cf6"
                    strokeWidth="12"
                    strokeDasharray="60 251"
                    strokeDashoffset="-140"
                    fill="none"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    stroke="#10b981"
                    strokeWidth="12"
                    strokeDasharray="30 251"
                    strokeDashoffset="-200"
                    fill="none"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    stroke="#f59e0b"
                    strokeWidth="12"
                    strokeDasharray="21 251"
                    strokeDashoffset="-230"
                    fill="none"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-xl font-black text-slate-900">1,240</span>
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Impressions</span>
                </div>
              </div>

              {/* Legend */}
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between items-center">
                  <span className="flex items-center gap-1.5 text-slate-600">
                    <span className="w-2 h-2 rounded-full bg-blue-600" /> Search Queries
                  </span>
                  <span className="font-bold text-slate-900">55%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="flex items-center gap-1.5 text-slate-600">
                    <span className="w-2 h-2 rounded-full bg-purple-500" /> Category Filters
                  </span>
                  <span className="font-bold text-slate-900">25%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="flex items-center gap-1.5 text-slate-600">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" /> Find My Tech AI
                  </span>
                  <span className="font-bold text-slate-900">12%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="flex items-center gap-1.5 text-slate-600">
                    <span className="w-2 h-2 rounded-full bg-amber-500" /> Direct / Shared
                  </span>
                  <span className="font-bold text-slate-900">8%</span>
                </div>
              </div>
            </Card>
          </div>

          {/* Smart Business Insight Card (Mockup Bottom Right) */}
          <div className="bg-gradient-to-r from-purple-900 via-indigo-950 to-slate-950 text-white rounded-3xl p-5 shadow-sm flex items-start gap-4">
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center text-amber-400 shrink-0">
              <Lightbulb className="w-5 h-5 fill-amber-400" />
            </div>
            <div className="space-y-1 flex-1">
              <h4 className="text-xs sm:text-sm font-bold text-purple-200 uppercase tracking-wider">
                Actionable Recommendation for You
              </h4>
              <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                Your smartphone listings receive <strong>32% more views on Friday and Saturday evenings</strong>. Consider promoting your iPhone listings right before the weekend to capture active Abuja buyers[cite: 10, 11].
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}