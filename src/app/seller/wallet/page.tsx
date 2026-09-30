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
  ArrowUpRight,
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

  // 1. Verify Paystack Top-Up if returning with reference
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

  // 2. Fetch fresh data (Profile, Ad Wallet, Orders)
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

  // Escrow & Earnings
  const pendingEscrow = (orders || [])
    .filter((o) => o.status === 'paid' || o.status === 'in_escrow')
    .reduce((acc, curr) => acc + Number(curr.seller_payout || 0), 0)

  const totalSettledEarnings = (orders || [])
    .filter((o) => o.status === 'completed')
    .reduce((acc, curr) => acc + Number(curr.seller_payout || 0), 0)

  const bankInfo = {
    bank_name: profile?.bank_name,
    account_number: profile?.account_number,
    account_name: profile?.account_name,
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full text-slate-900 dark:text-slate-100">
      {/* Top Banner on successful topup */}
      {newlyCreditedAmount !== null && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-4 flex items-center justify-between text-emerald-400 animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
            <div>
              <p className="text-xs font-bold text-emerald-950 dark:text-emerald-200">
                Wallet Credited Successfully!
              </p>
              <p className="text-[11px] text-emerald-800 dark:text-emerald-300">
                ₦{newlyCreditedAmount.toLocaleString()} has been added to your Ad Promotion Wallet.
              </p>
            </div>
          </div>
          <Link href="/seller/wallet" className="text-xs font-bold underline text-emerald-600 hover:text-emerald-500">
            Dismiss
          </Link>
        </div>
      )}

      {/* 1. Header with clear, vibrant text contrast */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900/80 p-5 sm:p-6 rounded-3xl border border-slate-200/90 dark:border-slate-800/90 shadow-2xs backdrop-blur-md">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2.5 tracking-tight">
            <div className="p-2 rounded-2xl bg-blue-600 text-white shadow-xs">
              <Wallet className="w-5 h-5" />
            </div>
            Financial Overview &amp; Payouts
          </h1>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">
            Manage your gadget sales revenue, escrow settlements, and CPC advertising funds.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> Safe Escrow Active
          </span>
        </div>
      </div>

      {/* 2. Dual Wallet Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Wallet Card 1: Sales Settlement Wallet */}
        <div className="relative overflow-hidden bg-white dark:bg-slate-900/90 border border-slate-200/90 dark:border-slate-800 rounded-3xl p-6 shadow-2xs flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                <CreditCard className="w-4 h-4" /> Sales Settlement Wallet
              </span>
              <Badge className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-[10px] font-bold">
                Direct Bank Transfer
              </Badge>
            </div>

            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Available to Withdraw
              </p>
              <p className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight mt-1">
                ₦{availablePayout.toLocaleString()}
              </p>
            </div>

            {/* Escrow breakdown strip */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between items-center text-slate-600 dark:text-slate-300">
                <span className="flex items-center gap-1.5 font-medium">
                  <Clock className="w-3.5 h-3.5 text-amber-500" /> Held in Buyer Escrow:
                </span>
                <span className="font-bold text-slate-900 dark:text-slate-100">
                  ₦{pendingEscrow.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center text-slate-600 dark:text-slate-300 border-t border-slate-100 dark:border-slate-700/60 pt-2">
                <span className="flex items-center gap-1.5 font-medium">
                  <TrendingUp className="w-3.5 h-3.5 text-blue-500" /> Lifetime Settled Earnings:
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

        {/* Wallet Card 2: Ad Promotion Wallet */}
        <div className="relative overflow-hidden bg-white dark:bg-slate-900/90 border border-slate-200/90 dark:border-slate-800 rounded-3xl p-6 shadow-2xs flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
                <Megaphone className="w-4 h-4" /> Ad Promotion Wallet
              </span>
              <Badge className="bg-blue-50 text-blue-700 dark:bg-blue-950/80 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-[10px] font-bold">
                Sponsored Search CPC
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
                Automated Valid Click Billing
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                Funds are deducted only when genuine shoppers click your sponsored listings in Abuja. Zero cost for organic views or impressions.
              </p>
            </div>
          </div>

          <div>
            <AddFundsModal currentBalance={adWalletBalance} />
          </div>
        </div>
      </div>

      {/* 3. Escrow Policy Banner */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl p-5 sm:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-2xs">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
              TechTrust Escrow &amp; Safe Release Policy
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Net proceeds (after 7% marketplace commission and 2.5% promotion fee) are held securely and released upon buyer device verification.
            </p>
          </div>
        </div>

        {bankInfo.account_number ? (
          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs shrink-0">
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Linked Settlement Bank</span>
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

      {/* 4. Transactions Ledger Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl p-5 sm:p-6 space-y-4 shadow-2xs">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
              Recent Settlements &amp; Withdrawal History
            </h3>
            <p className="text-xs text-slate-400">Real-time ledger of completed orders and payout disbursements.</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-bold uppercase text-[10px]">
                <th className="pb-3">Reference / Order</th>
                <th className="pb-3">Type</th>
                <th className="pb-3">Gross Sale</th>
                <th className="pb-3">Platform Fees</th>
                <th className="pb-3">Net Payout</th>
                <th className="pb-3">Status</th>
                <th className="pb-3 text-right">Date</th>
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
                      <td className="py-3.5 font-bold text-slate-900 dark:text-slate-100 truncate max-w-[140px]">
                        {o.payment_reference || o.id.slice(0, 8)}
                      </td>
                      <td className="py-3.5">Marketplace Sale</td>
                      <td className="py-3.5 font-semibold">₦{gross.toLocaleString()}</td>
                      <td className="py-3.5 text-red-500 font-medium">
                        -₦{(comm + adFee).toLocaleString()}
                      </td>
                      <td className="py-3.5 font-black text-emerald-600 dark:text-emerald-400">
                        ₦{net.toLocaleString()}
                      </td>
                      <td className="py-3.5">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            o.status === 'completed'
                              ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-300'
                              : 'bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-300'
                          }`}
                        >
                          {o.status === 'completed' ? 'Settled' : 'In Escrow'}
                        </span>
                      </td>
                      <td className="py-3.5 text-right text-slate-400">
                        {new Date(o.created_at).toLocaleDateString('en-NG')}
                      </td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 space-y-1">
                    <p className="font-semibold text-slate-600 dark:text-slate-300">No order transactions recorded yet</p>
                    <p className="text-[11px] text-slate-400">When sales occur or payouts are requested, transaction records will appear here.</p>
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