import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { resolveEscrowDispute } from '@/app/admin/actions'
import {
  AlertTriangle,
  ShieldAlert,
  ArrowLeft,
  RotateCcw,
  CheckCircle2,
  Package,
} from 'lucide-react'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function AdminDisputesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login?next=/admin/disputes')

  // Fetch disputed or flagged orders
  const { data: disputes } = await supabase
    .from('orders')
    .select('*, profiles!orders_seller_id_fkey(business_name, district, phone_number)')
    .or('status.eq.disputed,status.eq.refunded')
    .order('created_at', { ascending: false })

  const disputeList = disputes || []

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full text-slate-900 dark:text-slate-100">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-2xs">
        <div className="flex items-center gap-3">
          <Link href="/admin/overview" className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl sm:text-2xl font-black flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-red-600" />
              Device Inspection Disputes
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Arbitrate physical pickup failures (iCloud lock, fake specs, degraded battery).
            </p>
          </div>
        </div>

        <Badge className="bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300 border border-red-200 text-xs py-1.5 px-3 rounded-xl font-bold">
          {disputeList.filter((d) => d.status === 'disputed').length} Open Arbitrations
        </Badge>
      </div>

      {/* Disputes Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xs space-y-4">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-bold uppercase text-[10px]">
                <th className="pb-3">Order / Ref</th>
                <th className="pb-3">Seller Store</th>
                <th className="pb-3">Escrow Amount</th>
                <th className="pb-3">Dispute Reason</th>
                <th className="pb-3">Status</th>
                <th className="pb-3 text-right">Arbitration Decision</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {disputeList.length > 0 ? (
                disputeList.map((d) => (
                  <tr key={d.id} className="text-slate-700 dark:text-slate-300">
                    <td className="py-3.5 font-bold text-slate-900 dark:text-slate-100">
                      {d.payment_reference || d.id.slice(0, 8)}
                    </td>
                    <td className="py-3.5">
                      <span className="font-bold text-slate-900 dark:text-slate-100 block">
                        {d.profiles?.business_name || 'Dealer'}
                      </span>
                      <span className="text-[11px] text-slate-400">{d.profiles?.district || 'Abuja'}</span>
                    </td>
                    <td className="py-3.5 font-black text-slate-900 dark:text-slate-100">
                      ₦{Number(d.amount || d.total_amount).toLocaleString()}
                    </td>
                    <td className="py-3.5 max-w-[200px] truncate text-red-600 font-medium">
                      {d.dispute_notes || 'Failed physical inspection upon meetup'}
                    </td>
                    <td className="py-3.5">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        d.status === 'disputed'
                          ? 'bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-300'
                          : 'bg-slate-100 text-slate-600 dark:bg-slate-800'
                      }`}>
                        {d.status}
                      </span>
                    </td>
                    <td className="py-3.5 text-right">
                      {d.status === 'disputed' ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <form action={async () => {
                            'use server'
                            await resolveEscrowDispute(d.id, 'refund_buyer')
                          }}>
                            <Button size="sm" type="submit" className="bg-red-600 hover:bg-red-700 text-white font-bold text-[11px] h-8 px-2.5 rounded-lg cursor-pointer">
                              Refund Buyer
                            </Button>
                          </form>
                          <form action={async () => {
                            'use server'
                            await resolveEscrowDispute(d.id, 'release_seller')
                          }}>
                            <Button size="sm" variant="outline" type="submit" className="border-emerald-600 text-emerald-600 hover:bg-emerald-50 text-[11px] h-8 px-2.5 rounded-lg cursor-pointer">
                              Release Seller
                            </Button>
                          </form>
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-400 capitalize">
                          {d.dispute_resolution?.replace('_', ' ') || 'Resolved'}
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    Zero open escrow disputes. All device inspections are currently smooth.
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