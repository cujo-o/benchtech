import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import {
  FileText,
  Download,
  Calendar,
  DollarSign,
  ShoppingBag,
  Percent,
  Lock,
  Crown,
  ArrowRight,
} from 'lucide-react'

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
    .select('*')
    .eq('id', user.id)
    .single()

  const isPro =
    profile?.seller_plan === 'pro' ||
    profile?.subscription_tier === 'pro' ||
    profile?.subscription_plan === 'professional'

  const { data: orders } = await supabase
    .from('orders')
    .select('*')
    .eq('seller_id', user.id)
    .order('created_at', { ascending: false })

  const grossSales = (orders || []).reduce((acc, curr) => acc + (Number(curr.total_amount) || 0), 0)
  const orderCount = orders?.length || 0
  const avgOrderValue = orderCount > 0 ? Math.round(grossSales / orderCount) : 0
  const commissionRate = isPro ? 0.05 : 0.10
  const commissionPaid = Math.round(grossSales * commissionRate)

  return (
    <div className="space-y-6 sm:space-y-8 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
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
            Exportable order accounting, average order values, and commission reconciliation[cite: 10, 11].
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" className="border-slate-200 text-slate-700 font-bold text-xs h-10 rounded-xl gap-2">
            <Download className="w-4 h-4 text-blue-600" /> Export CSV Report[cite: 11]
          </Button>
        </div>
      </div>

      <div className="relative">
        {/* Pro Lock Overlay */}
        {!isPro && (
          <div className="absolute inset-0 z-20 backdrop-blur-md bg-white/80 rounded-3xl flex flex-col items-center justify-center p-6 text-center">
            <div className="max-w-md bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mx-auto">
                <Lock className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900">Sales Reports are Pro-Only</h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Download tax statements, export customer transaction summaries, and audit your 5% reduced commission savings[cite: 10, 11].
                </p>
              </div>
              <Link href="/seller/subscription" className="block pt-2">
                <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black text-xs h-11 rounded-xl shadow-md gap-2">
                  Upgrade to Pro — ₦5,000/month <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </Link>
            </div>
          </div>
        )}

        <div className={`space-y-6 ${!isPro ? 'select-none pointer-events-none opacity-40' : ''}`}>
          {/* Summary Metric Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="rounded-2xl border-slate-200/80 bg-white p-4 shadow-xs">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Gross Transaction Value</span>
              <p className="text-2xl font-black text-slate-900 mt-1">₦{grossSales.toLocaleString()}</p>
              <p className="text-[10px] text-slate-400">Total volume processed[cite: 10, 11]</p>
            </Card>

            <Card className="rounded-2xl border-slate-200/80 bg-white p-4 shadow-xs">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Orders</span>
              <p className="text-2xl font-black text-blue-600 mt-1">{orderCount}</p>
              <p className="text-[10px] text-slate-400">Completed &amp; verified[cite: 10, 11]</p>
            </Card>

            <Card className="rounded-2xl border-slate-200/80 bg-white p-4 shadow-xs">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Average Order Value</span>
              <p className="text-2xl font-black text-slate-900 mt-1">₦{avgOrderValue.toLocaleString()}</p>
              <p className="text-[10px] text-slate-400">Per paying tech buyer[cite: 10, 11]</p>
            </Card>

            <Card className="rounded-2xl border-slate-200/80 bg-white p-4 shadow-xs">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Marketplace Commission</span>
              <p className="text-2xl font-black text-purple-600 mt-1">₦{commissionPaid.toLocaleString()}</p>
              <p className="text-[10px] text-emerald-600 font-semibold">{isPro ? '5% Pro Rate (Saved 50%)' : '10% Standard Rate'}[cite: 10, 11]</p>
            </Card>
          </div>

          {/* Transactions Ledger Table */}
          <Card className="rounded-3xl border-slate-200/80 bg-white p-6 shadow-xs space-y-4">
            <h3 className="text-sm font-black text-slate-900">Transaction &amp; Commission Ledger</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase text-[10px] tracking-wider">
                    <th className="pb-3">Order ID</th>
                    <th className="pb-3">Gross Total</th>
                    <th className="pb-3">Commission (5%)</th>
                    <th className="pb-3">Net Payout</th>
                    <th className="pb-3">Fulfillment</th>
                    <th className="pb-3 text-right">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {orders && orders.length > 0 ? (
                    orders.map((o) => {
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
                          <td className="py-3 text-right text-slate-400">{new Date(o.created_at).toLocaleDateString()}</td>
                        </tr>
                      )
                    })
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400">
                        No orders to report yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}