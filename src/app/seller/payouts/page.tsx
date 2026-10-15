import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Wallet,
  Calendar,
} from 'lucide-react'
import { EarlyPayoutModal } from './EarlyPayoutModal'

export const dynamic = 'force-dynamic'

export default async function SellerPayoutSchedulePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login?next=/seller/payouts')

  const [{ data: profile }, { data: orders }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('orders').select('*').eq('seller_id', user.id).order('created_at', { ascending: false }),
  ])

  const allOrders = orders || []
  const availableBalance = Number(profile?.available_payout || 0)

  const heldInInspection = allOrders
    .filter((o) => o.payout_status === 'on_hold')
    .reduce((acc, curr) => acc + Number(curr.seller_payout || 0), 0)

  const eligibleOrders = allOrders.filter((o) => o.payout_status === 'eligible')
  const nextPayoutTotal = eligibleOrders.reduce((acc, curr) => acc + Number(curr.seller_payout || 0), 0)

  return (
    <div className="p-3 sm:p-6 lg:p-8 space-y-6 max-w-6xl mx-auto w-full text-slate-900 dark:text-slate-100">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black">Payout Schedule</h1>
            <Badge className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-bold">
              Automated Transfers
            </Badge>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Review settlement dates, pending inspection windows, and bank transfers[cite: 3].
          </p>
        </div>

        <Link href="/seller/wallet">
          <Button size="sm" variant="outline" className="text-xs font-bold rounded-xl h-10 border-slate-200 dark:border-slate-700 gap-1.5">
            <Wallet className="w-4 h-4 text-blue-600" /> Wallet Overview
          </Button>
        </Link>
      </div>

      {/* Summary Banner */}
      <div className="bg-slate-900 dark:bg-slate-900 text-white p-5 sm:p-6 rounded-3xl border border-slate-800 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" /> Next Scheduled Transfer
          </span>
          <h2 className="text-2xl font-black tracking-tight">
            ₦{nextPayoutTotal > 0 ? nextPayoutTotal.toLocaleString() : availableBalance.toLocaleString()}
          </h2>
          <p className="text-xs text-slate-400">
            {eligibleOrders.length} orders eligible for transfer.
          </p>
        </div>

        <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 text-xs space-y-1 w-full md:w-auto">
          <div className="flex justify-between gap-6 text-slate-300">
            <span>Inspection Hold:</span>
            <span className="font-bold text-white">₦{heldInInspection.toLocaleString()}</span>
          </div>
          <div className="flex justify-between gap-6 text-slate-300">
            <span>Account:</span>
            <span className="font-bold text-white">{profile?.bank_name || 'Not Linked'}</span>
          </div>
        </div>
      </div>

      {/* Orders Settlement Matrix */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
        <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">Order Settlement Records</h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs whitespace-nowrap">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-bold uppercase text-[10px]">
                <th className="pb-3 pr-4">Order</th>
                <th className="pb-3 px-4">Amount</th>
                <th className="pb-3 px-4">Net Payout</th>
                <th className="pb-3 px-4">Inspection Window</th>
                <th className="pb-3 px-4">Status</th>
                <th className="pb-3 pl-4 text-right">Action / Release</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {allOrders.length > 0 ? (
                allOrders.map((o) => (
                  <tr key={o.id} className="text-slate-700 dark:text-slate-300">
                    <td className="py-3.5 pr-4 font-bold text-slate-900 dark:text-slate-100 font-mono">
                      {o.order_number || o.id.slice(0, 8)}
                    </td>
                    <td className="py-3.5 px-4 font-semibold">₦{Number(o.total_amount || o.amount).toLocaleString()}</td>
                    <td className="py-3.5 px-4 font-black text-emerald-600 dark:text-emerald-400">
                      ₦{Number(o.seller_payout).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 text-slate-400">
                      {o.protection_ends_at ? new Date(o.protection_ends_at).toLocaleDateString('en-NG') : 'Pending delivery'}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold capitalize ${
                          o.payout_status === 'paid'
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                            : o.payout_status === 'eligible'
                            ? 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                            : 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                        }`}
                      >
                        {o.payout_status?.replace(/_/g, ' ') || 'Pending'}
                      </span>
                    </td>
                    <td className="py-3.5 pl-4 text-right">
                      {o.payout_status === 'on_hold' && o.delivery_status === 'verified' && !o.early_payout_claimed ? (
                        <EarlyPayoutModal order={o} />
                      ) : (
                        <span className="text-[11px] text-slate-400 font-medium">
                          {o.early_payout_claimed ? 'Early Released' : o.protection_ends_at ? 'Post-Inspection' : '—'}
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-slate-400">
                    No orders scheduled for settlement.
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