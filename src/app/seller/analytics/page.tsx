import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Boxes, CircleDollarSign, CheckCircle2, PauseCircle, Tag } from 'lucide-react'

export default async function SellerAnalyticsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Fetch all products for this seller
  const { data: products } = await supabase
    .from('products')
    .select('*')
    .eq('seller_id', user!.id)

  const items = products || []
  const totalListings = items.length
  const activeListings = items.filter((p) => p.status === 'published').length
  const soldListings = items.filter((p) => p.status === 'sold').length
  const pausedListings = items.filter((p) => p.status === 'paused').length

  // Calculate live inventory value
  const totalActiveValue = items
    .filter((p) => p.status === 'published')
    .reduce((sum, item) => sum + (Number(item.price) || 0), 0)

  const totalSoldValue = items
    .filter((p) => p.status === 'sold')
    .reduce((sum, item) => sum + (Number(item.price) || 0), 0)

  // Aggregate category breakdown
  const categoryCounts: Record<string, number> = {}
  items.forEach((item) => {
    categoryCounts[item.category] = (categoryCounts[item.category] || 0) + 1
  })

  // Aggregate condition breakdown
  const conditionCounts: Record<string, number> = {}
  items.forEach((item) => {
    conditionCounts[item.condition] = (conditionCounts[item.condition] || 0) + 1
  })

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Catalogue Analytics</h1>
        <p className="text-xs text-slate-500 mt-1">
          Performance metrics, real-time inventory valuations, and inventory breakdown.
        </p>
      </div>

      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-slate-200/80 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Inventory</CardTitle>
            <Boxes className="w-4 h-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-slate-900">{activeListings}</div>
            <p className="text-[11px] text-slate-400 mt-1">{totalListings} total registered items</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200/80 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Portfolio Value</CardTitle>
            <CircleDollarSign className="w-4 h-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-slate-900">₦{totalActiveValue.toLocaleString()}</div>
            <p className="text-[11px] text-slate-400 mt-1">Total value of published stock</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200/80 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Gross Sold Value</CardTitle>
            <CheckCircle2 className="w-4 h-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-slate-900">₦{totalSoldValue.toLocaleString()}</div>
            <p className="text-[11px] text-slate-400 mt-1">{soldListings} items marked sold</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200/80 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Paused / Inactive</CardTitle>
            <PauseCircle className="w-4 h-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-slate-900">{pausedListings}</div>
            <p className="text-[11px] text-slate-400 mt-1">Temporarily unlisted</p>
          </CardContent>
        </Card>
      </div>

      {/* Breakdown Grids */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Category Share Card */}
        <Card className="border-slate-200/80 shadow-sm">
          <CardHeader>
            <CardTitle className="text-sm font-bold text-slate-900">Category Distribution</CardTitle>
            <CardDescription className="text-xs">Breakdown of listings by hardware type</CardDescription>
          </CardHeader>
          <CardContent>
            {Object.keys(categoryCounts).length > 0 ? (
              <div className="space-y-3">
                {Object.entries(categoryCounts).map(([cat, count]) => {
                  const percentage = Math.round((count / totalListings) * 100)
                  return (
                    <div key={cat} className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="capitalize text-slate-700">{cat}</span>
                        <span className="text-slate-500">{count} items ({percentage}%)</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className="h-full bg-blue-600 rounded-full"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="text-xs text-slate-400 py-4">No inventory data available yet.</p>
            )}
          </CardContent>
        </Card>

        {/* Condition Share Card */}
        <Card className="border-slate-200/80 shadow-sm">
          <CardHeader>
            <CardTitle className="text-sm font-bold text-slate-900">Condition Distribution</CardTitle>
            <CardDescription className="text-xs">Breakdown of product physical grading</CardDescription>
          </CardHeader>
          <CardContent>
            {Object.keys(conditionCounts).length > 0 ? (
              <div className="space-y-3">
                {Object.entries(conditionCounts).map(([cond, count]) => {
                  const percentage = Math.round((count / totalListings) * 100)
                  return (
                    <div key={cond} className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="capitalize text-slate-700">{cond.replace('_', ' ')}</span>
                        <span className="text-slate-500">{count} items ({percentage}%)</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="text-xs text-slate-400 py-4">No inventory data available yet.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}