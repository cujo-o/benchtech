import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Wallet,
  Calendar,
  Clock,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Building2,
  Zap,
} from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function SellerPayoutSchedulePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login?next=/seller/payouts')

  // Fetch orders and seller profile
  const [{ data: profile }, { data: orders }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('orders').select('*').eq('seller_id', user.id).order('created_at', { ascending: false }),
  ])

  const allOrders = orders || []
  const availableBalance = Number(profile?.available_payout || 0)
  
  // Held funds during buyer protection window
  const heldInProtection = allOrders
    .filter((o) => o.payout_status === 'on_hold')
    .reduce((acc, curr) => acc + Number(curr.seller_payout || 0), 0)

  // Eligible orders ready for next batch
  const eligibleOrders = allOrders.filter((o) => o.payout_status === 'eligible')
  const nextPayoutTotal = eligibleOrders.reduce((acc, curr) => acc + Number(curr.seller_payout || 0), 0)

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-6xl mx-auto w-full text-slate-900 dark:text-slate-100">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black">Payout Details &amp; Schedule</h1>
            <Badge className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 text-[10px] font-bold">
              Configured Calendar
            </Badge>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Track automated batch runs, protection period releases, and bank transfer receipts.
          </p>
        </div>

        <Link href="/seller/wallet">
          <Button size="sm" variant="outline" className="text-xs font-bold rounded-xl h-10 border-slate-200 dark:border-slate-700 gap-1.5">
            <Wallet className="w-4 h-4 text-blue-600" /> Wallet Overview
          </Button>
        </Link>
      </div>

      {/* Visual 8 Screen 10: Next Payout Run Banner */}
      <div className="bg-linear-to-r from-slate-900 to-indigo-950 text-white p-6 rounded-3xl border border-indigo-900 shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <span className="text-[10px] font-black uppercase tracking-wider text-indigo-300 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" /> Next Scheduled Batch Run
          </span>
          <h2 className="text-2xl font-black tracking-tight">
            ₦{nextPayoutTotal > 0 ? nextPayoutTotal.toLocaleString() : availableBalance.toLocaleString()}
          </h2>
          <p className="text-xs text-indigo-200">
            Includes {eligibleOrders.length} verified orders eligible for automatic settlement.
          </p>
        </div>

        <div className="p-3.5 rounded-2xl bg-white/10 backdrop-blur-xs border border-white/10 text-xs space-y-1">
          <div className="flex justify-between gap-4 text-indigo-200">
            <span>Held in Protection:</span>
            <span className="font-bold text-white">₦{heldInProtection.toLocaleString()}</span>
          </div>
          <div className="flex justify-between gap-4 text-indigo-200">
            <span>Settlement Bank:</span>
            <span className="font-bold text-white">{profile?.bank_name || 'Not Linked'}</span>
          </div>
        </div>
      </div>

      {/* Orders Settlement Matrix */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xs space-y-4">
        <h3 className="font-black text-sm">Order Settlement Statuses</h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-bold uppercase text-[10px]">
                <th className="pb-3">Order</th>
                <th className="pb-3">Amount</th>
                <th className="pb-3">Net Payout</th>
                <th className="pb-3">Protection Window</th>
                <th className="pb-3">Payout Status</th>
                <th className="pb-3 text-right">Estimated Release</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {allOrders.length > 0 ? (
                allOrders.map((o) => (
                  <tr key={o.id} className="text-slate-700 dark:text-slate-300">
                    <td className="py-3.5 font-bold text-slate-900 dark:text-slate-100">
                      {o.order_number || o.id.slice(0, 8)}
                    </td>
                    <td className="py-3.5 font-semibold">₦{Number(o.total_amount || o.amount).toLocaleString()}</td>
                    <td className="py-3.5 font-black text-emerald-600 dark:text-emerald-400">
                      ₦{Number(o.seller_payout).toLocaleString()}
                    </td>
                    <td className="py-3.5 text-slate-400">
                      {o.protection_ends_at ? new Date(o.protection_ends_at).toLocaleDateString('en-NG') : 'Pending delivery'}
                    </td>
                    <td className="py-3.5">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold capitalize ${
                        o.payout_status === 'paid'
                          ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-300'
                          : o.payout_status === 'eligible'
                          ? 'bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-300'
                          : 'bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-300'
                      }`}>
                        {o.payout_status?.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="py-3.5 text-right text-slate-400 font-medium">
                      {o.protection_ends_at ? 'Post-Protection' : '—'}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    No orders recorded for settlement yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}