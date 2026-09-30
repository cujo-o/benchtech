'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { requestPayout, updateBankAccount } from '@/app/actions/wallet'
import {
  Building2,
  ArrowDownLeft,
  X,
  Loader2,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react'

export function WithdrawModal({
  availableBalance,
  initialBank,
}: {
  availableBalance: number
  initialBank: { bank_name?: string; account_number?: string; account_name?: string } | null
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [isEditingBank, setIsEditingBank] = useState(!initialBank?.account_number)
  const [loading, setLoading] = useState(false)

  // Bank fields
  const [bankName, setBankName] = useState(initialBank?.bank_name || '')
  const [accountNumber, setAccountNumber] = useState(initialBank?.account_number || '')
  const [accountName, setAccountName] = useState(initialBank?.account_name || '')

  // Withdrawal amount
  const [amount, setAmount] = useState('')

  async function handleSaveBank(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const res = await updateBankAccount({ bankName, accountNumber, accountName })
    setLoading(false)
    if (res.success) {
      setIsEditingBank(false)
    } else {
      alert(res.error || 'Failed to update bank details')
    }
  }

  async function handleWithdraw(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const res = await requestPayout({ amount: Number(amount) })
    setLoading(false)
    if (res.success) {
      alert('Withdrawal request submitted! Payout will be processed to your bank within 24 hours.')
      setIsOpen(false)
      setAmount('')
    } else {
      alert(res.error || 'Withdrawal failed')
    }
  }

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-10 px-4 rounded-xl gap-1.5 shadow-xs cursor-pointer"
      >
        <ArrowDownLeft className="w-4 h-4" /> Withdraw Funds
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs animate-in fade-in"
            onClick={() => setIsOpen(false)}
          />

          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl z-10 space-y-5 animate-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-sm text-slate-900 dark:text-slate-100">
                    Bank Payout Settlement
                  </h3>
                  <p className="text-[10px] text-slate-400">
                    Available: ₦{availableBalance.toLocaleString()}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Bank Card / Edit Bank State */}
            {isEditingBank ? (
              <form onSubmit={handleSaveBank} className="space-y-3">
                <p className="text-xs font-bold text-slate-900 dark:text-slate-100">
                  Link Settlement Bank Account
                </p>
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-500">Bank Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Access Bank, GTBank, Zenith"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    required
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-500">Account Number</label>
                  <input
                    type="text"
                    maxLength={10}
                    placeholder="10-digit NUBAN"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    required
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-500">Account Name</label>
                  <input
                    type="text"
                    placeholder="Must match your verified store name"
                    value={accountName}
                    onChange={(e) => setAccountName(e.target.value)}
                    required
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  {initialBank?.account_number && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setIsEditingBank(false)}
                      className="w-1/2 rounded-xl text-xs font-bold"
                    >
                      Cancel
                    </Button>
                  )}
                  <Button
                    type="submit"
                    disabled={loading}
                    size="sm"
                    className={`${
                      initialBank?.account_number ? 'w-1/2' : 'w-full'
                    } bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold`}
                  >
                    {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Save Bank Details'}
                  </Button>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-1.5 text-xs font-black text-slate-900 dark:text-slate-100">
                      {bankName}
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 font-mono mt-0.5">
                      {accountNumber} • {accountName}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsEditingBank(true)}
                    className="text-[11px] font-bold text-blue-600 hover:underline"
                  >
                    Change
                  </button>
                </div>

                <form onSubmit={handleWithdraw} className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Amount to Withdraw (₦)
                    </label>
                    <input
                      type="number"
                      min={2000}
                      max={availableBalance}
                      placeholder="Min ₦2,000"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      required
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold"
                    />
                  </div>

                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Payouts are reviewed for completed buyer inspection and settled into your linked Nigerian account within 24 business hours.
                  </p>

                  <Button
                    type="submit"
                    disabled={loading || Number(amount) < 2000 || Number(amount) > availableBalance}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-11 rounded-xl shadow-xs cursor-pointer gap-2"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Submitting Payout...
                      </>
                    ) : (
                      <>Confirm ₦{Number(amount || 0).toLocaleString()} Payout →</>
                    )}
                  </Button>
                </form>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}