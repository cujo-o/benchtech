import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { AddFundsModal } from '@/components/ads/AddFundsModal'
import { WithdrawModal } from './WithdrawModal'
import {
  Wallet,
  Clock,
  Megaphone,
  CreditCard,
  ShieldCheck,
  CheckCircle2,
  TrendingUp,
} from 'lucide-react'

export const dynamic = 'force-dynamic'

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  return createAdminClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

export default async function SellerWalletPage({
  searchParams,
}: {
  searchParams: Promise<{ reference?: string; trxref?: string; wallet_topup?: string }>
}) {
  const params = await searchParams
  const reference = params?.reference || params?.trxref
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  let newlyCreditedAmount: number | null = null

  if (reference) {
    const secretKey = process.env.PAYSTACK_SECRET_KEY
    if (secretKey) {
      try {
        const paystackRes = await fetch(
          `https://api.paystack.co/transaction/verify/${reference}`,
          {
            headers: { Authorization: `Bearer ${secretKey}` },
            cache: 'no-store',
          }
        )
        const paystackData = await paystackRes.json()

        if (paystackData.status && paystackData.data?.status === 'success') {
          const txData = paystackData.data
          const topupAmount =
            Number(txData.metadata?.amount) || Number(txData.amount) / 100

          const supabaseAdmin = getSupabaseAdmin()

          const { data: existingTx } = await supabaseAdmin
            .from('ad_wallet_transactions')
            .select('id')
            .eq('reference', reference)
            .maybeSingle()

          if (!existingTx && topupAmount > 0) {
            await supabaseAdmin.from('ad_wallet_transactions').insert({
              seller_id: user.id,
              reference: reference,
              amount: topupAmount,
            })

            const { data: currentWallet } = await supabaseAdmin
              .from('ad_wallets')
              .select('balance')
              .eq('seller_id', user.id)
              .maybeSingle()

            const updatedBalance = Number(currentWallet?.balance || 0) + topupAmount

            await supabaseAdmin.from('ad_wallets').upsert(
              {
                seller_id: user.id,
                balance: updatedBalance,
                updated_at: new Date().toISOString(),
              },
              { onConflict: 'seller_id' }
            )

            newlyCreditedAmount = topupAmount
          }
        }
      } catch (err) {
        console.error('Paystack verification error on wallet page:', err)
      }
    }
  }

  const [{ data: profile }, { data: adWallet }, { data: orders }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).maybeSingle(),
    supabase.from('ad_wallets').select('*').eq('seller_id', user.id).maybeSingle(),
    supabase
      .from('orders')
      .select('*')
      .eq('seller_id', user.id)
      .order('created_at', { ascending: false }),
  ])

  const availablePayout = Number(profile?.available_payout || 0)
  const adWalletBalance = Number(adWallet?.balance || 0).toLocaleString()

  const pendingVerification = (orders || [])
    .filter((o) => o.status === 'paid' || o.status === 'in_escrow' || o.payout_status === 'on_hold')
    .reduce((acc, curr) => acc + Number(curr.seller_payout || 0), 0)

  const totalSettledEarnings = (orders || [])
    .filter((o) => o.status === 'completed' || o.payout_status === 'paid')
    .reduce((acc, curr) => acc + Number(curr.seller_payout || 0), 0)

  const bankInfo = {
    bank_name: profile?.bank_name,
    account_number: profile?.account_number,
    account_name: profile?.account_name,
  }

  return (
    <div className="p-3 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full text-slate-900 dark:text-slate-100">
      {newlyCreditedAmount !== null && (
        <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-4 flex items-center justify-between text-emerald-800 dark:text-emerald-200 animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <div>
              <p className="text-xs font-bold">Wallet Credited Successfully</p>
              <p className="text-[11px] text-emerald-700 dark:text-emerald-300">
                ₦{newlyCreditedAmount.toLocaleString()} has been added to your promotion balance.
              </p>
            </div>
          </div>
          <Link href="/seller/wallet" className="text-xs font-bold underline text-emerald-700 dark:text-emerald-400">
            Dismiss
          </Link>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2.5 tracking-tight">
            <div className="p-2 rounded-2xl bg-blue-600 text-white shadow-xs">
              <Wallet className="w-5 h-5" />
            </div>
            Financial Balance &amp; Payouts
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Track sales revenue, available balances, and marketing budgets.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> Payment Protection Active
          </span>
        </div>
      </div>

      {/* Balance Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Sales Settlement Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xs flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                <CreditCard className="w-4 h-4" /> Sales Settlement Balance
              </span>
              <Badge className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-[10px] font-bold">
                Direct Bank Transfer
              </Badge>
            </div>

            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Available for Withdrawal
              </p>
              <p className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight mt-1">
                ₦{availablePayout.toLocaleString()}
              </p>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between items-center text-slate-600 dark:text-slate-300">
                <span className="flex items-center gap-1.5 font-medium">
                  <Clock className="w-3.5 h-3.5 text-amber-500" /> Pending Delivery Verification:
                </span>
                <span className="font-bold text-slate-900 dark:text-slate-100">
                  ₦{pendingVerification.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center text-slate-600 dark:text-slate-300 border-t border-slate-100 dark:border-slate-700/60 pt-2">
                <span className="flex items-center gap-1.5 font-medium">
                  <TrendingUp className="w-3.5 h-3.5 text-blue-500" /> Completed Settlements:
                </span>
                <span className="font-bold text-slate-900 dark:text-slate-100">
                  ₦{totalSettledEarnings.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          <div>
            <WithdrawModal availableBalance={availablePayout} initialBank={bankInfo} />
          </div>
        </div>

        {/* Promotion Wallet Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xs flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
                <Megaphone className="w-4 h-4" /> Promotion Wallet
              </span>
              <Badge className="bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-[10px] font-bold">
                Search &amp; Catalog Placement
              </Badge>
            </div>

            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Current Ad Balance
              </p>
              <p className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight mt-1">
                ₦{adWalletBalance}
              </p>
            </div>

            <div className="p-4 bg-blue-50/50 dark:bg-blue-950/30 rounded-2xl border border-blue-100 dark:border-blue-900/50 space-y-1 text-xs">
              <p className="font-bold text-blue-950 dark:text-blue-200">
                Verified Click Billing
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                Fees apply only when shoppers engage directly with your featured listings.
              </p>
            </div>
          </div>

          <div>
            <AddFundsModal currentBalance={adWalletBalance} />
          </div>
        </div>
      </div>

      {/* Payment Release Notice */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
              Payment Settlement Policy
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Net proceeds are made available after delivery verification and the standard buyer inspection window.
            </p>
          </div>
        </div>

        {bankInfo.account_number ? (
          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs shrink-0">
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Settlement Account</span>
            <span className="font-bold text-slate-900 dark:text-slate-100">
              {bankInfo.bank_name} • {bankInfo.account_number}
            </span>
          </div>
        ) : (
          <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 text-xs py-1.5 px-3 rounded-xl shrink-0">
            No Bank Account Linked
          </Badge>
        )}
      </div>

      {/* Ledger Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 space-y-4 shadow-xs">
        <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
          <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
            Settlement &amp; Order History
          </h3>
          <p className="text-xs text-slate-400">Record of completed orders and processed disbursements.</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs whitespace-nowrap">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-bold uppercase text-[10px]">
                <th className="pb-3 pr-4">Reference</th>
                <th className="pb-3 px-4">Type</th>
                <th className="pb-3 px-4">Gross Total</th>
                <th className="pb-3 px-4">Platform Fee</th>
                <th className="pb-3 px-4">Net Amount</th>
                <th className="pb-3 px-4">Status</th>
                <th className="pb-3 pl-4 text-right">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {orders && orders.length > 0 ? (
                orders.map((o) => {
                  const gross = Number(o.amount || o.seller_payout || 0)
                  const comm = Number(o.marketplace_fee || 0)
                  const adFee = Number(o.ad_fee || 0)
                  const net = Number(o.seller_payout || gross - comm - adFee)

                  return (
                    <tr key={o.id} className="text-slate-700 dark:text-slate-300">
                      <td className="py-3.5 pr-4 font-bold text-slate-900 dark:text-slate-100 font-mono">
                        {o.payment_reference || o.id.slice(0, 8)}
                      </td>
                      <td className="py-3.5 px-4">Product Sale</td>
                      <td className="py-3.5 px-4 font-semibold">₦{gross.toLocaleString()}</td>
                      <td className="py-3.5 px-4 text-slate-400 font-medium">
                        -₦{(comm + adFee).toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4 font-black text-emerald-600 dark:text-emerald-400">
                        ₦{net.toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            o.status === 'completed' || o.payout_status === 'paid'
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                              : 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                          }`}
                        >
                          {o.status === 'completed' || o.payout_status === 'paid' ? 'Settled' : 'Inspection Hold'}
                        </span>
                      </td>
                      <td className="py-3.5 pl-4 text-right text-slate-400">
                        {new Date(o.created_at).toLocaleDateString('en-NG')}
                      </td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-slate-400">
                    No order transactions recorded.
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