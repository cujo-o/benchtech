import Link from 'next/link'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { Badge } from '@/components/ui/badge'
import { FileSpreadsheet } from 'lucide-react'

export const dynamic = 'force-dynamic'

function getAdminDb() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  return createAdminClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

export default async function AdminFinancialLedgerPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>
}) {
  const params = await searchParams
  const typeFilter = params?.type || 'all'

  const adminDb = getAdminDb()

  const [
    { data: ledgerEntries },
    { data: orders },
    { data: adTopups },
    { data: profiles },
  ] = await Promise.all([
    adminDb
      .from('financial_ledger')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(150),
    adminDb.from('orders').select('*').order('created_at', { ascending: false }),
    adminDb
      .from('ad_wallet_transactions')
      .select('*')
      .order('created_at', { ascending: false }),
    adminDb.from('profiles').select('id, business_name, full_name'),
  ])

  const profileMap = new Map<string, string>()
  for (const p of profiles || []) {
    profileMap.set(p.id, p.business_name || p.full_name || 'Account')
  }

  const allOrders = (orders || []).filter(
    (o) => o.order_status !== 'cancelled' && o.order_status !== 'refunded'
  )
  const grossCaptured = allOrders.reduce(
    (sum, o) => sum + Number(o.total_amount || o.amount || 0),
    0
  )
  const marketplaceCommissions = allOrders.reduce(
    (sum, o) => sum + Number(o.marketplace_fee || 0),
    0
  )
  const adSaleCommissions = allOrders.reduce(
    (sum, o) => sum + Number(o.ad_fee || 0),
    0
  )
  const totalAdTopups = (adTopups || []).reduce(
    (sum, t) => sum + Number(t.amount || 0),
    0
  )

  const allEntries = ledgerEntries || []
  const totalSellerDisbursed = allEntries
    .filter(
      (e: any) =>
        e.transaction_type === 'seller_payout_withdrawal' ||
        e.transaction_type === 'payout_disbursed'
    )
    .reduce((sum: number, e: any) => sum + Number(e.amount || 0), 0)

  const filteredEntries = allEntries.filter((e: any) => {
    if (typeFilter === 'captures') return e.transaction_type === 'payment_captured'
    if (typeFilter === 'fees')
      return (
        e.transaction_type === 'marketplace_fee' ||
        e.transaction_type === 'ad_fee'
      )
    if (typeFilter === 'payouts')
      return (
        e.transaction_type === 'seller_payout_withdrawal' ||
        e.transaction_type === 'payout_disbursed' ||
        e.transaction_type === 'seller_payable'
      )
    return true
  })

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white">
              Financial Ledger &amp; Revenue Accounting
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Double-entry accounting journal for order captures, marketplace commissions (5% Pro / 7% Standard), seller withdrawals, and advertising revenue.
          </p>
        </div>

        <Link
          href="/admin/payouts"
          className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline shrink-0"
        >
          Manage Seller Payouts &rarr;
        </Link>
      </div>

      {/* Accounting Summary (5 Cards) */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs">
          <span className="text-[10px] font-bold uppercase text-slate-400 block">
            Gross Buyer Captures
          </span>
          <p className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1">
            ₦{grossCaptured.toLocaleString()}
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs">
          <span className="text-[10px] font-bold uppercase text-slate-400 block">
            Marketplace Commissions
          </span>
          <p className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
            ₦{marketplaceCommissions.toLocaleString()}
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs">
          <span className="text-[10px] font-bold uppercase text-slate-400 block">
            Seller Payouts &amp; Withdrawals
          </span>
          <p className="text-xl sm:text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">
            ₦{totalSellerDisbursed.toLocaleString()}
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs">
          <span className="text-[10px] font-bold uppercase text-slate-400 block">
            2.5% Ad Sale Fees
          </span>
          <p className="text-xl sm:text-2xl font-black text-blue-600 dark:text-blue-400 mt-1">
            ₦{adSaleCommissions.toLocaleString()}
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs col-span-2 lg:col-span-1">
          <span className="text-[10px] font-bold uppercase text-slate-400 block">
            Paystack Ad Wallet Top-Ups
          </span>
          <p className="text-xl sm:text-2xl font-black text-purple-600 dark:text-purple-400 mt-1">
            ₦{totalAdTopups.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {[
          { id: 'all', label: `All Journal Entries (${allEntries.length})` },
          { id: 'captures', label: 'Buyer Captures' },
          { id: 'fees', label: 'Platform Commissions' },
          { id: 'payouts', label: 'Seller Payables & Withdrawals' },
        ].map((tab) => (
          <Link key={tab.id} href={`/admin/finance?type=${tab.id}`}>
            <button
              type="button"
              className={`px-3.5 py-2 rounded-xl text-xs font-bold shrink-0 transition cursor-pointer ${
                typeFilter === tab.id
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
              }`}
            >
              {tab.label}
            </button>
          </Link>
        ))}
      </div>

      {/* Journal Entries Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
        <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
          <h2 className="text-sm font-black text-slate-900 dark:text-white">
            Immutable Journal Entries ({filteredEntries.length})
          </h2>
          <p className="text-xs text-slate-400">
            Debit and credit postings recorded across escrow holding, platform revenue, and seller payable accounts.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs whitespace-nowrap">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-bold uppercase text-[10px]">
                <th className="pb-3 pr-4">Reference</th>
                <th className="pb-3 px-4">Merchant / Party</th>
                <th className="pb-3 px-4">Account</th>
                <th className="pb-3 px-4">Transaction Type</th>
                <th className="pb-3 px-4">Entry</th>
                <th className="pb-3 px-4">Amount</th>
                <th className="pb-3 pl-4 text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredEntries.length > 0 ? (
                filteredEntries.map((entry: any) => {
                  const sellerName = entry.seller_id
                    ? profileMap.get(entry.seller_id)
                    : null
                  return (
                    <tr key={entry.id} className="text-slate-700 dark:text-slate-300">
                      <td className="py-3 pr-4 font-mono font-bold text-slate-900 dark:text-white">
                        {entry.reference || entry.order_id?.slice(0, 8) || '—'}
                      </td>
                      <td className="py-3 px-4 font-semibold">
                        {sellerName || 'Marketplace'}
                      </td>
                      <td className="py-3 px-4 font-semibold capitalize">
                        {entry.account?.replace(/_/g, ' ')}
                      </td>
                      <td className="py-3 px-4 capitalize">
                        {entry.transaction_type?.replace(/_/g, ' ')}
                      </td>
                      <td className="py-3 px-4">
                        <Badge
                          className={`text-[10px] font-bold uppercase ${
                            entry.entry_type === 'credit'
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                              : 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                          }`}
                        >
                          {entry.entry_type}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 font-black text-slate-900 dark:text-white">
                        ₦{Number(entry.amount || 0).toLocaleString()}
                      </td>
                      <td className="py-3 pl-4 text-right text-slate-400">
                        {entry.created_at
                          ? new Date(entry.created_at).toLocaleString('en-NG', {
                              dateStyle: 'short',
                              timeStyle: 'short',
                            })
                          : '—'}
                      </td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No ledger entries match this filter.
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