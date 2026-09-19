import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Download, ShoppingBag, FileText, ArrowRight } from 'lucide-react'

export const metadata = {
  title: 'Financial & Sales Reports | BenchTech Seller',
}

export default async function ReportsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login?next=/seller/reports')

  const { data: profile } = await supabase
    .from('profiles')
    .select('seller_plan')
    .eq('id', user.id)
    .single()

  const isPro = profile?.seller_plan === 'pro'

  // Fetch real order history
  const { data: orders } = await supabase
    .from('orders')
    .select('id, total_amount, status, fulfillment_type, created_at')
    .eq('seller_id', user.id)
    .order('created_at', { ascending: false })

  const allOrders = orders || []
  const grossSales = allOrders.reduce(
    (acc, curr) => acc + (Number(curr.total_amount) || 0),
    0
  )
  const orderCount = allOrders.length
  const avgOrderValue = orderCount > 0 ? Math.round(grossSales / orderCount) : 0

  // 5% commission for Pro, 10% for Free
  const commissionRate = isPro ? 0.05 : 0.1
  const commissionPaid = Math.round(grossSales * commissionRate)
  const netEarnings = grossSales - commissionPaid

  return (
    <div className="space-y-6 sm:space-y-8 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Business &amp; Sales Reports
            </h1>
            <Badge className="bg-purple-100 text-purple-800 text-[10px] font-black uppercase">
              Pro Feature
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Real financial accounting, average order values, and commission reconciliation.
          </p>
        </div>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="rounded-2xl border-slate-200/80 bg-white p-4 shadow-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Gross Transaction Value
          </span>
          <p className="text-2xl font-black text-slate-900 mt-1">
            ₦{grossSales.toLocaleString()}
          </p>
          <p className="text-[10px] text-slate-400">Total processed revenue</p>
        </Card>

        <Card className="rounded-2xl border-slate-200/80 bg-white p-4 shadow-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Completed Orders
          </span>
          <p className="text-2xl font-black text-blue-600 mt-1">{orderCount}</p>
          <p className="text-[10px] text-slate-400">Verified buyer checkouts</p>
        </Card>

        <Card className="rounded-2xl border-slate-200/80 bg-white p-4 shadow-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Average Order Value
          </span>
          <p className="text-2xl font-black text-slate-900 mt-1">
            ₦{avgOrderValue.toLocaleString()}
          </p>
          <p className="text-[10px] text-slate-400">Per paying tech buyer</p>
        </Card>

        <Card className="rounded-2xl border-slate-200/80 bg-white p-4 shadow-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Marketplace Commission
          </span>
          <p className="text-2xl font-black text-purple-600 mt-1">
            ₦{commissionPaid.toLocaleString()}
          </p>
          <p className="text-[10px] text-emerald-600 font-semibold">
            {isPro ? '5% Pro Reduced Rate' : '10% Standard Rate'}
          </p>
        </Card>
      </div>

      {/* Orders Ledger Table */}
      <Card className="rounded-3xl border-slate-200/80 bg-white p-6 shadow-xs space-y-4">
        <h3 className="text-sm font-black text-slate-900">Transaction &amp; Payout Ledger</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase text-[10px] tracking-wider">
                <th className="pb-3">Order ID</th>
                <th className="pb-3">Gross Total</th>
                <th className="pb-3">Commission ({isPro ? '5%' : '10%'})</th>
                <th className="pb-3">Net Seller Payout</th>
                <th className="pb-3">Fulfillment</th>
                <th className="pb-3 text-right">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {allOrders.length > 0 ? (
                allOrders.map((o) => {
                  const amount = Number(o.total_amount) || 0
                  const fee = Math.round(amount * commissionRate)
                  const net = amount - fee

                  return (
                    <tr key={o.id} className="hover:bg-slate-50 transition">
                      <td className="py-3 font-mono font-bold text-slate-900">#{o.id.slice(0, 8)}</td>
                      <td className="py-3 font-black text-slate-900">₦{amount.toLocaleString()}</td>
                      <td className="py-3 text-purple-600 font-bold">-₦{fee.toLocaleString()}</td>
                      <td className="py-3 font-black text-emerald-600">₦{net.toLocaleString()}</td>
                      <td className="py-3 capitalize text-slate-600">{o.fulfillment_type || 'Delivery'}</td>
                      <td className="py-3 text-right text-slate-400">
                        {new Date(o.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 space-y-2">
                    <ShoppingBag className="w-8 h-8 text-slate-300 mx-auto" />
                    <p className="font-semibold text-xs">No orders completed yet.</p>
                    <p className="text-[11px] text-slate-400">
                      When buyers purchase your devices, payouts and commission statements will calculate here.
                    </p>
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