import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { AddFundsModal } from '@/components/ads/AddFundsModal'
import { WithdrawModal } from './WithdrawModal'
import {
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  ShieldCheck,
  Clock,
  Megaphone,
  CreditCard,
  Building2,
  Package,
} from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function SellerWalletPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Fetch Seller Profile, Ad Wallet, Orders, and Payout Requests
  const [{ data: profile }, { data: adWallet }, { data: orders }, { data: payouts }] =
    await Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).single(),
      supabase.from('ad_wallets').select('*').eq('seller_id', user.id).maybeSingle(),
      supabase
        .from('orders')
        .select('*')
        .eq('seller_id', user.id)
        .order('created_at', { ascending: false }),
      supabase
        .from('payout_requests')
        .select('*')
        .eq('seller_id', user.id)
        .order('created_at', { ascending: false }),
    ])

  const availablePayout = Number(profile?.available_payout || 0)
  const adWalletBalance = Number(adWallet?.balance || 0).toLocaleString()

  // Calculate funds in Escrow (orders paid but pending physical buyer inspection completion)
  const pendingEscrow = (orders || [])
    .filter((o) => o.status === 'paid' || o.status === 'in_escrow')
    .reduce((acc, curr) => acc + Number(curr.seller_payout || 0), 0)

  // Lifetime sales payout
  const totalSettledEarnings = (orders || [])
    .filter((o) => o.status === 'completed')
    .reduce((acc, curr) => acc + Number(curr.seller_payout || 0), 0)

  const bankInfo = {
    bank_name: profile?.bank_name,
    account_number: profile?.account_number,
    account_name: profile?.account_name,
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* 1. Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <Wallet className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          Financial Overview &amp; Payouts
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Manage your gadget sales earnings, escrow clearances, and promotion ad credit wallets.
        </p>
      </div>

      {/* 2. Dual Wallet Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Wallet Card 1: Sales Revenue & Bank Payout */}
        <div className="bg-white dark:bg-slate-900 border-2 border-emerald-500/40 rounded-3xl p-6 shadow-2xs space-y-5 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-emerald-600 flex items-center gap-1.5">
                <CreditCard className="w-4 h-4" /> Sales Settlement Wallet
              </span>
              <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 text-[10px] font-bold">
                Direct Bank Transfer
              </Badge>
            </div>

            <div>
              <p className="text-xs text-slate-400">Available to Withdraw</p>
              <p className="text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
                ₦{availablePayout.toLocaleString()}
              </p>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/80 dark:border-slate-700 space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-amber-500" /> Held in Buyer Escrow:
                </span>
                <span className="font-bold text-slate-900 dark:text-slate-100">
                  ₦{pendingEscrow.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-slate-500 dark:text-slate-400">
                <span>Lifetime Settled Earnings:</span>
                <span className="font-bold text-slate-900 dark:text-slate-100">
                  ₦{totalSettledEarnings.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          <div className="pt-2">
            <WithdrawModal availableBalance={availablePayout} initialBank={bankInfo} />
          </div>
        </div>

        {/* Wallet Card 2: Ad Promotion Wallet (CPC Budget) */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xs space-y-5 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-blue-600 flex items-center gap-1.5">
                <Megaphone className="w-4 h-4" /> Ad Promotion Wallet
              </span>
              <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 text-[10px] font-bold">
                Sponsored Search CPC
              </Badge>
            </div>

            <div>
              <p className="text-xs text-slate-400">Current Ad Balance</p>
              <p className="text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
                ₦{adWalletBalance}
              </p>
            </div>

            <div className="p-3 bg-blue-50/50 dark:bg-blue-950/30 rounded-2xl border border-blue-200/60 dark:border-blue-900/60 space-y-1 text-xs text-blue-900 dark:text-blue-300">
              <p className="font-bold">Automated Click Deductions</p>
              <p className="text-[11px] text-blue-800/80 dark:text-blue-300/80 leading-relaxed">
                Funds are deducted only when verified shoppers click your Sponsored Search listings. Zero charges occur on impressions.
              </p>
            </div>
          </div>

          <div className="pt-2">
            <AddFundsModal currentBalance={adWalletBalance} />
          </div>
        </div>
      </div>

      {/* 3. Escrow & Bank Verification Banner */}
      <div className="bg-slate-100/80 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-6 h-6 text-emerald-600" />
          </div>
          <div>
            <h3 className="font-black text-sm text-slate-900 dark:text-slate-100">
              TechTrust Escrow &amp; Safe Release Policy
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Net proceeds (93% after 7% commission and 2.5% promotion fee) are automatically released to your available balance upon buyer device inspection.
            </p>
          </div>
        </div>

        {bankInfo.account_number ? (
          <div className="p-3 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs shrink-0 font-medium">
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

      {/* 4. Transactions & Payouts Ledger Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 space-y-4 shadow-2xs">
        <h3 className="font-black text-sm text-slate-900 dark:text-slate-100">
          Recent Settlements &amp; Withdrawal History
        </h3>

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
                      <td className="py-3 font-bold text-slate-900 dark:text-slate-100 truncate max-w-[140px]">
                        {o.payment_reference || o.id.slice(0, 8)}
                      </td>
                      <td className="py-3">Order Sale</td>
                      <td className="py-3 font-semibold">₦{gross.toLocaleString()}</td>
                      <td className="py-3 text-red-500 font-medium">
                        -₦{(comm + adFee).toLocaleString()}
                      </td>
                      <td className="py-3 font-black text-emerald-600 dark:text-emerald-400">
                        ₦{net.toLocaleString()}
                      </td>
                      <td className="py-3">
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
                      <td className="py-3 text-right text-slate-400">
                        {new Date(o.created_at).toLocaleDateString('en-NG')}
                      </td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No order transactions recorded yet.
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