import { createClient as createAdminClient } from '@supabase/supabase-js'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  adminSettleSellerBalance,
  adminReleaseOrderPayout,
} from '@/app/admin/actions'
import { Wallet, Landmark, CheckCircle2, Clock } from 'lucide-react'

export const dynamic = 'force-dynamic'

function getAdminDb() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  return createAdminClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

export default async function AdminPayoutsPage() {
  const adminDb = getAdminDb()

  const [{ data: sellers }, { data: heldOrders }] = await Promise.all([
    adminDb
      .from('profiles')
      .select('*')
      .gt('available_payout', 0)
      .order('available_payout', { ascending: false }),
    adminDb
      .from('orders')
      .select('*, product:products(title), seller:profiles!orders_seller_id_fkey(business_name, full_name, bank_name, account_number, account_name)')
      .eq('payout_status', 'on_hold')
      .order('created_at', { ascending: false }),
  ])

  const payableSellers = sellers || []
  const pendingOrders = heldOrders || []

  const totalPayableNow = payableSellers.reduce(
    (sum, s) => sum + Number(s.available_payout || 0),
    0
  )
  const totalHeldInProtection = pendingOrders.reduce(
    (sum, o) => sum + Number(o.seller_payout || 0),
    0
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Wallet className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white">
              Seller Payouts &amp; Bank Settlements
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Disburse available seller balances and manage orders in the buyer inspection window.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900">
            <span className="text-[10px] font-bold uppercase text-slate-400 block">
              Ready to Disburse
            </span>
            <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">
              ₦{totalPayableNow.toLocaleString()}
            </span>
          </div>
          <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900">
            <span className="text-[10px] font-bold uppercase text-slate-400 block">
              Inspection Hold
            </span>
            <span className="text-sm font-black text-amber-600 dark:text-amber-400">
              ₦{totalHeldInProtection.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Section 1: Sellers with Available Balance Ready for Bank Transfer */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
        <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
          <h2 className="text-sm font-black text-slate-900 dark:text-white">
            Sellers Ready for Bank Transfer ({payableSellers.length})
          </h2>
          <p className="text-xs text-slate-400">
            Transfer the net balance to the seller&apos;s verified bank account and mark as settled.
          </p>
        </div>

        {payableSellers.length > 0 ? (
          <div className="space-y-3">
            {payableSellers.map((seller) => (
              <div
                key={seller.id}
                className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs"
              >
                <div className="space-y-1">
                  <p className="font-black text-sm text-slate-900 dark:text-white">
                    {seller.business_name || seller.full_name || 'Seller'}
                  </p>
                  <div className="flex flex-wrap items-center gap-2 text-slate-500">
                    <Landmark className="w-3.5 h-3.5 text-blue-600" />
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {seller.bank_name || 'No Bank'}
                    </span>
                    <span>•</span>
                    <span className="font-mono font-bold">
                      {seller.account_number || 'No Account Number'}
                    </span>
                    <span>•</span>
                    <span>{seller.account_name || seller.full_name}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="text-[10px] font-bold uppercase text-slate-400 block">
                      Withdrawable Balance
                    </span>
                    <span className="text-base font-black text-emerald-600 dark:text-emerald-400">
                      ₦{Number(seller.available_payout || 0).toLocaleString()}
                    </span>
                  </div>

                  <form
                    action={async () => {
                      'use server'
                      await adminSettleSellerBalance(seller.id)
                    }}
                  >
                    <Button
                      type="submit"
                      size="sm"
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl h-9 px-4 gap-1.5 cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Mark Paid</span>
                    </Button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-400 py-8 text-center">
            No sellers currently have pending withdrawal balances.
          </p>
        )}
      </div>

      {/* Section 2: Orders Currently in Buyer Protection Hold */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
        <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
          <h2 className="text-sm font-black text-slate-900 dark:text-white">
            Orders in Inspection Window ({pendingOrders.length})
          </h2>
          <p className="text-xs text-slate-400">
            Orders awaiting completion of the 7-day buyer inspection window or early payout release.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs whitespace-nowrap">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-bold uppercase text-[10px]">
                <th className="pb-3 pr-4">Order</th>
                <th className="pb-3 px-4">Seller</th>
                <th className="pb-3 px-4">Bank Account</th>
                <th className="pb-3 px-4">Net Payout</th>
                <th className="pb-3 px-4">Release Date</th>
                <th className="pb-3 pl-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {pendingOrders.map((o) => (
                <tr key={o.id} className="text-slate-700 dark:text-slate-300">
                  <td className="py-3.5 pr-4 font-mono font-bold text-slate-900 dark:text-white">
                    {o.order_number || o.id.slice(0, 8)}
                  </td>
                  <td className="py-3.5 px-4 font-bold">
                    {o.seller?.business_name || o.seller?.full_name || 'Vendor'}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-[11px]">
                    {o.seller?.bank_name
                      ? `${o.seller.bank_name} • ${o.seller.account_number}`
                      : 'Not Linked'}
                  </td>
                  <td className="py-3.5 px-4 font-black text-emerald-600 dark:text-emerald-400">
                    ₦{Number(o.seller_payout || 0).toLocaleString()}
                  </td>
                  <td className="py-3.5 px-4 text-slate-400">
                    {o.protection_ends_at
                      ? new Date(o.protection_ends_at).toLocaleDateString('en-NG')
                      : 'Pending delivery'}
                  </td>
                  <td className="py-3.5 pl-4 text-right">
                    <form
                      action={async () => {
                        'use server'
                        await adminReleaseOrderPayout(o.id)
                      }}
                    >
                      <Button
                        type="submit"
                        size="xs"
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg px-3 cursor-pointer"
                      >
                        Release to Wallet
                      </Button>
                    </form>
                  </td>
                </tr>
              ))}
              {pendingOrders.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    No orders currently held in inspection.
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