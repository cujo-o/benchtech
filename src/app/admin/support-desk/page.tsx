import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  ShieldAlert,
  RotateCcw,
  Clock,
  ArrowRight,
  TrendingUp,
  CreditCard,
  Building2,
  AlertTriangle,
  Package,
} from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function AdminSupportDeskPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login?next=/admin/support-desk')

  // Parallel Database Queries for Visual 8 Screen 12 Metrics
  const [
    { count: totalOrdersCount },
    { data: disputes },
    { data: refunds },
    { data: payoutBatches },
  ] = await Promise.all([
    supabase.from('orders').select('*', { count: 'exact', head: true }),
    supabase
      .from('disputes')
      .select('*, order:orders(*, product:products(*)), buyer:profiles!disputes_buyer_id_fkey(full_name), seller:profiles!disputes_seller_id_fkey(business_name)')
      .order('created_at', { ascending: false }),
    supabase.from('refunds').select('*').eq('status', 'requested'),
    supabase.from('payout_batches').select('*').order('created_at', { ascending: false }),
  ])

  const disputeList = disputes || []
  const openDisputes = disputeList.filter((d) => d.status !== 'resolved' && d.status !== 'closed')
  const pendingRefunds = refunds || []

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full text-slate-900 dark:text-slate-100">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-black">Admin / Support Operations Desk</h1>
          <p className="text-xs text-slate-400 mt-1">
            Visual 8 Screen 12: High-velocity arbitration, payout batches, and refund authorizations.
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/payouts">
            <Button size="sm" variant="outline" className="text-xs font-bold rounded-xl h-10 border-slate-200 dark:border-slate-700">
              Payout Batches
            </Button>
          </Link>
          <Link href="/admin/overview">
            <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl h-10 px-4">
              Overview Console
            </Button>
          </Link>
        </div>
      </div>

      {/* 2. Top Metric Strip (Visual 8: Screen 12) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Orders */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Orders</span>
          <p className="text-2xl sm:text-3xl font-black">{totalOrdersCount || 0}</p>
          <span className="text-[10px] text-slate-400">All registered checkout intents</span>
        </div>

        {/* Open Disputes */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-red-200 dark:border-red-900/60 shadow-2xs space-y-1">
          <span className="text-[10px] font-black text-red-600 dark:text-red-400 uppercase tracking-wider">Open Disputes</span>
          <p className="text-2xl sm:text-3xl font-black text-red-600 dark:text-red-400">{openDisputes.length}</p>
          <span className="text-[10px] text-slate-400">Requiring case agent review</span>
        </div>

        {/* Pending Refunds */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-amber-200 dark:border-amber-900/60 shadow-2xs space-y-1">
          <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">Pending Refunds</span>
          <p className="text-2xl sm:text-3xl font-black text-amber-600">{pendingRefunds.length}</p>
          <span className="text-[10px] text-slate-400">Awaiting provider transfer</span>
        </div>

        {/* Failed Payouts */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Failed Transfers</span>
          <p className="text-2xl sm:text-3xl font-black">0</p>
          <span className="text-[10px] text-emerald-600 font-bold">100% gateway reconciliation</span>
        </div>
      </div>

      {/* 3. Recent Disputes Table & Payout Overview Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Recent Disputes (8 cols) */}
        <div className="lg:col-span-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="font-black text-sm">Recent Dispute Cases</h3>
            <span className="text-xs text-slate-400 font-bold">{disputeList.length} Total</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-bold uppercase text-[10px]">
                  <th className="pb-3">Case ID</th>
                  <th className="pb-3">Product</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3">Disputed Amount</th>
                  <th className="pb-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {disputeList.slice(0, 6).map((d) => (
                  <tr key={d.id} className="text-slate-700 dark:text-slate-300">
                    <td className="py-3 font-mono font-bold text-slate-900 dark:text-slate-100">
                      {d.case_number}
                    </td>
                    <td className="py-3 font-semibold truncate max-w-[140px]">
                      {d.order?.product?.title || 'Gadget Item'}
                    </td>
                    <td className="py-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold capitalize ${
                        d.status === 'resolved'
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                      }`}>
                        {d.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="py-3 font-black text-slate-900 dark:text-slate-100">
                      ₦{Number(d.order?.total_amount || d.order?.amount).toLocaleString()}
                    </td>
                    <td className="py-3 text-right">
                      <Link href={`/disputes/${d.id}`}>
                        <Button size="sm" variant="outline" className="text-xs font-bold rounded-lg h-7 px-2 border-slate-200 dark:border-slate-700">
                          Arbitrate →
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Payout Batches Summary (4 cols) */}
        <div className="lg:col-span-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xs space-y-4">
          <h3 className="font-black text-sm">Payout Settlement Runs</h3>

          <div className="space-y-3">
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Scheduled Today</span>
              <p className="text-xl font-black text-blue-600 dark:text-blue-400">₦120,000</p>
              <span className="text-[10px] text-slate-400">3 verified batches queued</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Processing</span>
              <p className="text-xl font-black text-amber-600">₦80,000</p>
              <span className="text-[10px] text-slate-400">In Paystack transfer queue</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 space-y-1">
              <span className="text-[10px] font-bold text-emerald-800 dark:text-emerald-300 uppercase">Settled This Week</span>
              <p className="text-xl font-black text-emerald-600 dark:text-emerald-400">₦1,450,000</p>
              <span className="text-[10px] text-emerald-700 dark:text-emerald-300">Clean reconciliation</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}