import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { updatePayoutStatus } from '@/app/admin/actions'
import {
  Wallet,
  Building2,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowLeft,
  ShieldCheck,
} from 'lucide-react'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function AdminPayoutsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login?next=/admin/payouts')

  const { data: requests } = await supabase
    .from('payout_requests')
    .select('*, profiles(business_name, full_name, phone_number, district)')
    .order('created_at', { ascending: false })

  const payoutList = requests || []
  const pendingTotal = payoutList
    .filter((p) => p.status === 'pending')
    .reduce((acc, curr) => acc + Number(curr.amount || 0), 0)

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
              <Building2 className="w-5 h-5 text-emerald-600" />
              Bank Payout Settlement Console
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Review seller withdrawal requests and authorize bank disbursements.
            </p>
          </div>
        </div>

        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl flex items-center gap-3">
          <Wallet className="w-5 h-5 text-emerald-600 shrink-0" />
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase block">Pending Settlement</span>
            <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">
              ₦{pendingTotal.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Payout Requests Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xs space-y-4">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-bold uppercase text-[10px]">
                <th className="pb-3">Seller Store</th>
                <th className="pb-3">Amount</th>
                <th className="pb-3">Bank Details</th>
                <th className="pb-3">District</th>
                <th className="pb-3">Status</th>
                <th className="pb-3">Requested</th>
                <th className="pb-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {payoutList.length > 0 ? (
                payoutList.map((p) => {
                  const sellerName = p.profiles?.business_name || p.profiles?.full_name || 'Vendor'

                  return (
                    <tr key={p.id} className="text-slate-700 dark:text-slate-300">
                      <td className="py-3.5 font-bold text-slate-900 dark:text-slate-100">
                        {sellerName}
                      </td>
                      <td className="py-3.5 font-black text-sm text-emerald-600 dark:text-emerald-400">
                        ₦{Number(p.amount).toLocaleString()}
                      </td>
                      <td className="py-3.5">
                        <span className="font-bold block text-slate-900 dark:text-slate-100">{p.bank_name}</span>
                        <span className="font-mono text-slate-500 text-[11px]">{p.account_number} • {p.account_name}</span>
                      </td>
                      <td className="py-3.5 text-slate-500">{p.profiles?.district || 'Abuja'}</td>
                      <td className="py-3.5">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          p.status === 'processed'
                            ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-300'
                            : p.status === 'declined'
                            ? 'bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-300'
                            : 'bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-300'
                        }`}>
                          {p.status}
                        </span>
                      </td>
                      <td className="py-3.5 text-slate-400">
                        {new Date(p.created_at).toLocaleDateString('en-NG')}
                      </td>
                      <td className="py-3.5 text-right">
                        {p.status === 'pending' ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <form action={async () => {
                              'use server'
                              await updatePayoutStatus(p.id, 'processed')
                            }}>
                              <Button size="sm" type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] h-8 px-2.5 rounded-lg cursor-pointer">
                                Disburse
                              </Button>
                            </form>
                            <form action={async () => {
                              'use server'
                              await updatePayoutStatus(p.id, 'declined')
                            }}>
                              <Button size="sm" variant="ghost" type="submit" className="text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 text-[11px] h-8 px-2 rounded-lg cursor-pointer">
                                Decline
                              </Button>
                            </form>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400 capitalize">{p.status}</span>
                        )}
                      </td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No payout requests submitted yet.
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