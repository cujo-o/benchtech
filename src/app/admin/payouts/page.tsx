import { createClient as createAdminClient } from '@supabase/supabase-js'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  adminApproveWithdrawalRequest,
  adminSyncSellerWalletBalance,
  adminSettleSellerBalance,
  adminReleaseOrderPayout,
} from '@/app/admin/actions'
import {
  Wallet,
  Landmark,
  CheckCircle2,
  RefreshCw,
  Clock,
  ArrowUpRight,
} from 'lucide-react'

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

  const [
    { data: profiles },
    { data: withdrawalEvents },
    { data: allOrders },
  ] = await Promise.all([
    adminDb
      .from('profiles')
      .select('*')
      .order('available_payout', { ascending: false }),
    adminDb
      .from('audit_events')
      .select('*')
      .eq('action', 'seller_requested_bank_withdrawal')
      .order('created_at', { ascending: false })
      .limit(50),
    adminDb
      .from('orders')
      .select(
        '*, product:products(title), seller:profiles!orders_seller_id_fkey(id, business_name, full_name, bank_name, account_number, account_name)'
      )
      .order('created_at', { ascending: false }),
  ])

  const profileMap = new Map<string, any>()
  for (const p of profiles || []) {
    profileMap.set(p.id, p)
  }

  const allWithdrawals = withdrawalEvents || []
  const pendingWithdrawals = allWithdrawals.filter(
    (w) => w.result === 'processing'
  )
  const settledWithdrawals = allWithdrawals.filter((w) => w.result === 'paid')

  const sellersList = (profiles || []).filter(
    (p) =>
      p.role === 'seller' ||
      p.is_seller === true ||
      Boolean(p.business_name) ||
      Number(p.available_payout || 0) > 0
  )

  const heldOrders = (allOrders || []).filter(
    (o) =>
      o.payout_status === 'on_hold' &&
      o.order_status !== 'cancelled' &&
      o.order_status !== 'refunded'
  )

  const totalPendingWithdrawalsNaira = pendingWithdrawals.reduce(
    (sum, w) => sum + Number(w.metadata?.amount || 0),
    0
  )
  const totalWalletFloatNaira = sellersList.reduce(
    (sum, s) => sum + Number(s.available_payout || 0),
    0
  )
  const totalHeldInProtection = heldOrders.reduce(
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
            Approve pending seller withdrawal requests, sync wallet balances, and release order inspection holds.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="p-3 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900">
            <span className="text-[10px] font-bold uppercase text-slate-400 block">
              Pending Withdrawals ({pendingWithdrawals.length})
            </span>
            <span className="text-sm font-black text-blue-600 dark:text-blue-400">
              ₦{totalPendingWithdrawalsNaira.toLocaleString()}
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900">
            <span className="text-[10px] font-bold uppercase text-slate-400 block">
              Seller Wallet Float
            </span>
            <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">
              ₦{totalWalletFloatNaira.toLocaleString()}
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

      {/* SECTION 1: PENDING SELLER BANK WITHDRAWAL REQUESTS (WD-...) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div>
            <h2 className="text-sm font-black text-slate-900 dark:text-white">
              1. Pending Bank Withdrawal Requests ({pendingWithdrawals.length})
            </h2>
            <p className="text-xs text-slate-400">
              Withdrawals requested by sellers from their wallet. Clicking &quot;Approve &amp; Mark Settled&quot; updates the seller&apos;s wallet status from Processing Payout to Settled.
            </p>
          </div>
        </div>

        {pendingWithdrawals.length > 0 ? (
          <div className="space-y-3">
            {pendingWithdrawals.map((w) => {
              const seller = profileMap.get(w.actor_id || w.target_id)
              const ref = w.metadata?.reference || w.id.slice(0, 8)
              const amt = Number(w.metadata?.amount || 0)
              const bankName =
                w.metadata?.bank_name || seller?.bank_name || 'Nigerian Bank'
              const accountNum =
                w.metadata?.account_number || seller?.account_number || '—'
              const accountHolder =
                w.metadata?.account_name ||
                seller?.account_name ||
                seller?.business_name ||
                seller?.full_name ||
                'Seller'

              return (
                <div
                  key={w.id}
                  className="p-4 rounded-2xl bg-blue-50/40 dark:bg-blue-950/20 border border-blue-200/80 dark:border-blue-900 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-black text-sm text-blue-600 dark:text-blue-400">
                        {ref}
                      </span>
                      <span className="font-black text-sm text-slate-900 dark:text-white">
                        {seller?.business_name || seller?.full_name || accountHolder}
                      </span>
                      <Badge className="bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border border-amber-200 text-[10px] font-bold">
                        Processing Payout
                      </Badge>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-slate-500 dark:text-slate-400">
                      <Landmark className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        {bankName}
                      </span>
                      <span>•</span>
                      <span className="font-mono font-bold text-slate-900 dark:text-white">
                        {accountNum}
                      </span>
                      <span>•</span>
                      <span>{accountHolder}</span>
                      <span>•</span>
                      <span>
                        Requested{' '}
                        {new Date(w.created_at).toLocaleString('en-NG', {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                        })}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <span className="text-[10px] font-bold uppercase text-slate-400 block">
                        Withdrawal Amount
                      </span>
                      <span className="text-base font-black text-emerald-600 dark:text-emerald-400">
                        ₦{amt.toLocaleString()}
                      </span>
                    </div>

                    <form
                      action={async () => {
                        'use server'
                        await adminApproveWithdrawalRequest(w.id)
                      }}
                    >
                      <Button
                        type="submit"
                        size="sm"
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl h-9 px-4 gap-1.5 cursor-pointer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Approve &amp; Mark Settled</span>
                      </Button>
                    </form>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <p className="text-xs text-slate-400 py-6 text-center">
            No pending withdrawal requests awaiting approval.
          </p>
        )}
      </div>

      {/* SECTION 2: SELLER WALLETS & BALANCE RECONCILIATION */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
        <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
          <h2 className="text-sm font-black text-slate-900 dark:text-white">
            2. Seller Wallet Balances &amp; Bank Accounts ({sellersList.length})
          </h2>
          <p className="text-xs text-slate-400">
            View each seller&apos;s current withdrawable wallet balance, linked bank account, or sync/reconcile their balance against completed orders.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs whitespace-nowrap">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-bold uppercase text-[10px]">
                <th className="pb-3 pr-4">Seller Store</th>
                <th className="pb-3 px-4">Linked Bank Account</th>
                <th className="pb-3 px-4">Account Holder</th>
                <th className="pb-3 px-4">Current Wallet Balance</th>
                <th className="pb-3 pl-4 text-right">Controls</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {sellersList.map((s) => {
                const avail = Number(s.available_payout || 0)
                return (
                  <tr key={s.id} className="text-slate-700 dark:text-slate-300">
                    <td className="py-3.5 pr-4 font-bold text-slate-900 dark:text-white">
                      {s.business_name || s.full_name || 'Seller'}
                    </td>
                    <td className="py-3.5 px-4 font-mono">
                      {s.bank_name
                        ? `${s.bank_name} • ${s.account_number}`
                        : 'No Bank Linked'}
                    </td>
                    <td className="py-3.5 px-4">
                      {s.account_name || s.full_name || '—'}
                    </td>
                    <td className="py-3.5 px-4 font-black text-emerald-600 dark:text-emerald-400">
                      ₦{avail.toLocaleString()}
                    </td>
                    <td className="py-3.5 pl-4 text-right">
                      <div className="inline-flex items-center gap-2">
                        <form
                          action={async () => {
                            'use server'
                            await adminSyncSellerWalletBalance(s.id)
                          }}
                        >
                          <Button
                            type="submit"
                            size="xs"
                            variant="outline"
                            title="Recalculate balance from settled orders minus actual withdrawals"
                            className="rounded-lg text-[11px] font-bold gap-1 cursor-pointer"
                          >
                            <RefreshCw className="w-3 h-3 text-blue-600" />
                            <span>Sync Balance</span>
                          </Button>
                        </form>

                        {avail > 0 && (
                          <form
                            action={async () => {
                              'use server'
                              await adminSettleSellerBalance(s.id)
                            }}
                          >
                            <Button
                              type="submit"
                              size="xs"
                              className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold gap-1 cursor-pointer"
                            >
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Disburse Full Balance</span>
                            </Button>
                          </form>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* SECTION 3: ORDERS IN BUYER INSPECTION WINDOW */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
        <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
          <h2 className="text-sm font-black text-slate-900 dark:text-white">
            3. Orders in Buyer Inspection Hold ({heldOrders.length})
          </h2>
          <p className="text-xs text-slate-400">
            Orders awaiting completion of the 7-day buyer inspection window.
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
              {heldOrders.map((o) => (
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
              {heldOrders.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-slate-400">
                    No orders currently held in inspection.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* SECTION 4: COMPLETED BANK WITHDRAWALS HISTORY */}
      {settledWithdrawals.length > 0 && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
            <h2 className="text-sm font-black text-slate-900 dark:text-white">
              4. Settled Bank Payouts History ({settledWithdrawals.length})
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-bold uppercase text-[10px]">
                  <th className="pb-3 pr-4">Reference</th>
                  <th className="pb-3 px-4">Seller</th>
                  <th className="pb-3 px-4">Bank Destination</th>
                  <th className="pb-3 px-4">Amount Disbursed</th>
                  <th className="pb-3 px-4">Status</th>
                  <th className="pb-3 pl-4 text-right">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {settledWithdrawals.map((w) => {
                  const seller = profileMap.get(w.actor_id || w.target_id)
                  return (
                    <tr key={w.id} className="text-slate-700 dark:text-slate-300">
                      <td className="py-3 pr-4 font-mono font-bold text-slate-900 dark:text-white">
                        {w.metadata?.reference || w.id.slice(0, 8)}
                      </td>
                      <td className="py-3 px-4 font-bold">
                        {seller?.business_name ||
                          seller?.full_name ||
                          w.metadata?.account_name ||
                          'Seller'}
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px]">
                        {w.metadata?.bank_name || seller?.bank_name} •{' '}
                        {w.metadata?.account_number || seller?.account_number}
                      </td>
                      <td className="py-3 px-4 font-black text-emerald-600 dark:text-emerald-400">
                        ₦{Number(w.metadata?.amount || 0).toLocaleString()}
                      </td>
                      <td className="py-3 px-4">
                        <Badge className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 text-[10px] font-bold">
                          Settled
                        </Badge>
                      </td>
                      <td className="py-3 pl-4 text-right text-slate-400">
                        {new Date(w.created_at).toLocaleDateString('en-NG')}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}