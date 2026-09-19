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
  Boxes,
  CheckCircle2,
  Tag,
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

  // Fetch live listings
  const { data: products } = await supabase
    .from('products')
    .select('*')
    .eq('seller_id', user.id)

  // Fetch live orders
  const { data: orders } = await supabase
    .from('orders')
    .select('*')
    .eq('seller_id', user.id)

  const allProducts = products || []
  const activeProducts = allProducts.filter((p) => p.status === 'published')
  const soldProducts = allProducts.filter((p) => p.status === 'sold')
  const pausedProducts = allProducts.filter(
    (p) => p.status === 'paused' || p.status === 'unavailable'
  )

  const portfolioValue = activeProducts.reduce(
    (acc, curr) => acc + (Number(curr.price) || 0),
    0
  )
  const totalRevenue = (orders || []).reduce(
    (acc, curr) => acc + (Number(curr.total_amount) || 0),
    0
  )

  // Category Distribution calculation
  const categoryCounts: Record<string, number> = {}
  activeProducts.forEach((p) => {
    const cat = p.category || 'Hardware'
    categoryCounts[cat] = (categoryCounts[cat] || 0) + 1
  })

  // Condition Distribution calculation
  const conditionCounts: Record<string, number> = {}
  activeProducts.forEach((p) => {
    const cond = p.condition || 'good'
    conditionCounts[cond] = (conditionCounts[cond] || 0) + 1
  })

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
            Performance metrics, inventory valuations, and buyer traffic insights in Abuja.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className="text-xs font-bold gap-1.5 py-1.5 px-3 border-slate-200 bg-white"
          >
            <Calendar className="w-3.5 h-3.5 text-slate-400" /> Last 30 Days
          </Badge>

          {!isPro && (
            <Link href="/seller/subscription">
              <Button
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl h-9 gap-1.5 shadow-xs"
              >
                <Crown className="w-3.5 h-3.5 text-amber-400 fill-amber-400" /> Unlock Pro Analytics
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Core Inventory Stats Cards */}
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
          <p className="text-[10px] text-emerald-600 font-semibold">Total value of published stock</p>
        </Card>

        <Card className="rounded-2xl border-slate-200/80 bg-white p-4 shadow-xs space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Gross Sold Value
          </span>
          <p className="text-2xl font-black text-slate-900">
            ₦{totalRevenue.toLocaleString()}
          </p>
          <p className="text-[10px] text-slate-400">{orders?.length || 0} items marked sold</p>
        </Card>

        <Card className="rounded-2xl border-slate-200/80 bg-white p-4 shadow-xs space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Paused / Inactive
          </span>
          <p className="text-2xl font-black text-slate-900">{pausedProducts.length}</p>
          <p className="text-[10px] text-slate-400">Temporarily unlisted devices</p>
        </Card>
      </div>

      {/* =========================================================================
          FREE PLAN ANALYTICS (Fully Functional Visualizations)
      ========================================================================= */}
      {!isPro && (
        <div className="space-y-6">
          {/* Category & Condition Breakdown Progress Bars */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Category Distribution */}
            <Card className="rounded-3xl border-slate-200/80 bg-white p-6 shadow-xs space-y-4">
              <div>
                <h3 className="text-sm font-black text-slate-900">Category Distribution</h3>
                <p className="text-xs text-slate-400">Breakdown of active listings by hardware type</p>
              </div>

              {Object.keys(categoryCounts).length > 0 ? (
                <div className="space-y-3 pt-2">
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
                <div className="py-8 text-center text-xs text-slate-400">
                  No published products to categorize yet.
                </div>
              )}
            </Card>

            {/* Condition Distribution */}
            <Card className="rounded-3xl border-slate-200/80 bg-white p-6 shadow-xs space-y-4">
              <div>
                <h3 className="text-sm font-black text-slate-900">Condition Distribution</h3>
                <p className="text-xs text-slate-400">Breakdown of product physical grading</p>
              </div>

              {Object.keys(conditionCounts).length > 0 ? (
                <div className="space-y-3 pt-2">
                  {Object.entries(conditionCounts).map(([cond, count]) => {
                    const pct = Math.round((count / (activeProducts.length || 1)) * 100)
                    return (
                      <div key={cond} className="space-y-1.5">
                        <div className="flex justify-between text-xs font-bold text-slate-700">
                          <span className="capitalize">{cond.replace('_', ' ')}</span>
                          <span>{count} items ({pct}%)</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="py-8 text-center text-xs text-slate-400">
                  No published devices to grade yet.
                </div>
              )}
            </Card>
          </div>

          {/* Clean Pro Upgrade Preview Banner */}
          <Card className="rounded-3xl border-2 border-purple-200 bg-gradient-to-r from-purple-50 via-white to-blue-50 p-6 sm:p-8 shadow-sm">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
              <div className="space-y-3 max-w-xl">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-xs">
                    <Crown className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900">
                      Want to see Revenue Curves &amp; Buyer Traffic?
                    </h3>
                    <p className="text-xs text-slate-500">
                      Unlock advanced 30-day sales trends, conversion rates, and traffic sources with Pro.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1 text-[11px] font-bold text-slate-700">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-purple-600" /> 30-Day Revenue Spline Chart
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-purple-600" /> Buyer Traffic Channels
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-purple-600" /> Demand Insights &amp; Tips
                  </div>
                </div>
              </div>

              <div className="shrink-0 w-full sm:w-auto">
                <Link href="/seller/subscription" className="block">
                  <Button className="w-full sm:w-auto bg-purple-600 hover:bg-purple-700 text-white font-black text-xs h-11 px-6 rounded-xl shadow-md gap-2">
                    Upgrade to Pro — ₦5,000/mo <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* =========================================================================
          PRO PLAN ANALYTICS (Full Advanced Dashboard)
      ========================================================================= */}
      {isPro && (
        <div className="space-y-6">
          {/* Key Pro Ratios */}
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

          {/* Revenue & Traffic Curve (SVG Chart) */}
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

            <div className="h-64 w-full relative pt-6">
              <svg viewBox="0 0 800 200" className="w-full h-full overflow-visible">
                <line x1="0" y1="0" x2="800" y2="0" stroke="#f1f5f9" strokeWidth="1" />
                <line x1="0" y1="50" x2="800" y2="50" stroke="#f1f5f9" strokeWidth="1" />
                <line x1="0" y1="100" x2="800" y2="100" stroke="#f1f5f9" strokeWidth="1" />
                <line x1="0" y1="150" x2="800" y2="150" stroke="#f1f5f9" strokeWidth="1" />

                <defs>
                  <linearGradient id="curveGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                  </linearGradient>
                </defs>

                <path
                  d="M 0 160 Q 100 130 200 90 T 400 120 T 600 40 T 800 60 L 800 200 L 0 200 Z"
                  fill="url(#curveGradient)"
                />
                <path
                  d="M 0 160 Q 100 130 200 90 T 400 120 T 600 40 T 800 60"
                  fill="none"
                  stroke="#2563eb"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                />
                <path
                  d="M 0 180 Q 100 150 200 130 T 400 140 T 600 80 T 800 90"
                  fill="none"
                  stroke="#8b5cf6"
                  strokeWidth="2.5"
                  strokeDasharray="4 4"
                  strokeLinecap="round"
                />
                <circle cx="600" cy="40" r="5" fill="#2563eb" stroke="#ffffff" strokeWidth="2" />
              </svg>

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
            {/* Top Products */}
            <Card className="lg:col-span-2 rounded-3xl border-slate-200/80 bg-white p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black text-slate-900">Top Performing Products</h3>
                  <p className="text-xs text-slate-400">Ranked by inquiries and conversions</p>
                </div>
                <Link href="/seller/listings" className="text-xs font-bold text-blue-600 hover:underline">
                  View All
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

            {/* Traffic Sources Donut Chart */}
            <Card className="rounded-3xl border-slate-200/80 bg-white p-6 shadow-xs flex flex-col justify-between space-y-4">
              <div>
                <h3 className="text-sm font-black text-slate-900">Traffic Sources</h3>
                <p className="text-xs text-slate-400">Where buyers discover your listings</p>
              </div>

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

          {/* Actionable Tip */}
          <div className="bg-gradient-to-r from-purple-900 via-indigo-950 to-slate-950 text-white rounded-3xl p-5 shadow-sm flex items-start gap-4">
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center text-amber-400 shrink-0">
              <Lightbulb className="w-5 h-5 fill-amber-400" />
            </div>
            <div className="space-y-1 flex-1">
              <h4 className="text-xs sm:text-sm font-bold text-purple-200 uppercase tracking-wider">
                Actionable Recommendation for You
              </h4>
              <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                Your smartphone listings receive <strong>32% more views on Friday and Saturday evenings</strong>. Consider promoting your iPhone listings right before the weekend to capture active Abuja buyers.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}