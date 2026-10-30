'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  requestPayout,
  updateBankAccount,
  resolveSellerBankNuban,
} from '@/app/actions/wallet'
import { NIGERIAN_BANKS } from '@/lib/verification/provider'
import {
  Building2,
  ArrowDownLeft,
  X,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react'

function matchInitialBankName(rawName?: string): string {
  if (!rawName) return NIGERIAN_BANKS[0].name
  const clean = rawName.trim().toLowerCase()
  const exactOrPartial = NIGERIAN_BANKS.find(
    (b) =>
      b.name.toLowerCase() === clean ||
      b.name.toLowerCase().includes(clean) ||
      clean.includes(b.name.toLowerCase())
  )
  return exactOrPartial ? exactOrPartial.name : rawName
}

export function WithdrawModal({
  availableBalance,
  initialBank,
}: {
  availableBalance: number
  initialBank: {
    bank_name?: string
    account_number?: string
    account_name?: string
  } | null
}) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [isEditingBank, setIsEditingBank] = useState(
    !initialBank?.account_number
  )
  const [loading, setLoading] = useState(false)
  const [resolvingNuban, setResolvingNuban] = useState(false)
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error'
    text: string
  } | null>(null)

  const [bankName, setBankName] = useState(
    matchInitialBankName(initialBank?.bank_name)
  )
  const [accountNumber, setAccountNumber] = useState(
    initialBank?.account_number || ''
  )
  const [accountName, setAccountName] = useState(
    initialBank?.account_name || ''
  )

  const [amount, setAmount] = useState('')

  // Auto-resolve account name when 10 digits are entered
  useEffect(() => {
    const clean = accountNumber.replace(/\D/g, '')
    if (!isEditingBank || clean.length !== 10 || !bankName) return

    let cancelled = false
    setResolvingNuban(true)
    resolveSellerBankNuban({ bankName, accountNumber: clean })
      .then((res) => {
        if (!cancelled && res?.resolvedName) {
          setAccountName(res.resolvedName)
        }
      })
      .finally(() => {
        if (!cancelled) setResolvingNuban(false)
      })

    return () => {
      cancelled = true
    }
  }, [bankName, accountNumber, isEditingBank])

  async function handleSaveBank(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setFeedback(null)

    const res = await updateBankAccount({
      bankName,
      accountNumber,
      accountName,
    })
    setLoading(false)

    if (res.success) {
      setIsEditingBank(false)
      setFeedback({
        type: 'success',
        text: 'Settlement bank account verified and saved.',
      })
      router.refresh()
    } else {
      setFeedback({
        type: 'error',
        text: res.error || 'Failed to update bank details.',
      })
    }
  }

  async function handleWithdraw(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setFeedback(null)

    const res = await requestPayout({ amount: Number(amount) })
    setLoading(false)

    if (res.success) {
      setFeedback({
        type: 'success',
        text: `Withdrawal of ₦${Number(amount).toLocaleString()} submitted (Ref: ${
          res.reference
        }). Funds will be settled to your ${bankName} account.`,
      })
      setAmount('')
      router.refresh()
      setTimeout(() => {
        setIsOpen(false)
        setFeedback(null)
      }, 2200)
    } else {
      setFeedback({
        type: 'error',
        text: res.error || 'Withdrawal failed.',
      })
    }
  }

  return (
    <>
      <Button
        type="button"
        onClick={() => {
          setFeedback(null)
          setIsOpen(true)
        }}
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
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {feedback && (
              <div
                className={`p-3 rounded-2xl border text-xs font-semibold flex items-center gap-2 ${
                  feedback.type === 'success'
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300'
                    : 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-900 text-red-700 dark:text-red-300'
                }`}
              >
                {feedback.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0" />
                )}
                <span>{feedback.text}</span>
              </div>
            )}

            {/* Bank Card / Edit Bank State */}
            {isEditingBank ? (
              <form onSubmit={handleSaveBank} className="space-y-3.5">
                <p className="text-xs font-bold text-slate-900 dark:text-slate-100">
                  Link Settlement Bank Account
                </p>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                    Select Nigerian Bank
                  </label>
                  <select
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    required
                    className="w-full h-10 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {NIGERIAN_BANKS.map((bank) => (
                      <option
                        key={bank.code}
                        value={bank.name}
                        className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                      >
                        {bank.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                    Account Number (10-Digit NUBAN)
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={10}
                    placeholder="0123456789"
                    value={accountNumber}
                    onChange={(e) =>
                      setAccountNumber(e.target.value.replace(/\D/g, ''))
                    }
                    required
                    className="w-full h-10 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 text-xs font-mono font-bold text-slate-900 dark:text-white"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                      Account Holder Name
                    </label>
                    {resolvingNuban && (
                      <span className="text-[10px] text-blue-500 flex items-center gap-1">
                        <Loader2 className="w-3 h-3 animate-spin" /> Verifying NUBAN...
                      </span>
                    )}
                  </div>
                  <input
                    type="text"
                    placeholder="Account holder full name"
                    value={accountName}
                    onChange={(e) => setAccountName(e.target.value)}
                    required
                    className="w-full h-10 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 text-xs font-bold text-slate-900 dark:text-white"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  {initialBank?.account_number && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setIsEditingBank(false)}
                      className="w-1/2 rounded-xl text-xs font-bold h-10 cursor-pointer"
                    >
                      Cancel
                    </Button>
                  )}
                  <Button
                    type="submit"
                    disabled={loading || accountNumber.length !== 10}
                    size="sm"
                    className={`${
                      initialBank?.account_number ? 'w-1/2' : 'w-full'
                    } bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold h-10 cursor-pointer`}
                  >
                    {loading ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      'Save Bank Details'
                    )}
                  </Button>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-1.5 text-xs font-black text-slate-900 dark:text-slate-100">
                      <span>{bankName}</span>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 font-mono mt-0.5">
                      {accountNumber} • {accountName}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsEditingBank(true)}
                    className="text-[11px] font-bold text-blue-600 hover:underline cursor-pointer"
                  >
                    Change
                  </button>
                </div>

                <form onSubmit={handleWithdraw} className="space-y-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
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
                      className="w-full h-10 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 text-xs font-bold text-slate-900 dark:text-white"
                    />

                    {/* Quick Test Amount Pills */}
                    {availableBalance >= 2000 && (
                      <div className="flex items-center gap-1.5 pt-1">
                        {[
                          { label: '₦2,000', val: 2000 },
                          ...(availableBalance >= 5000
                            ? [{ label: '₦5,000', val: 5000 }]
                            : []),
                          ...(availableBalance >= 10000
                            ? [
                                {
                                  label: '50%',
                                  val: Math.floor(availableBalance / 2),
                                },
                              ]
                            : []),
                          { label: 'Max', val: availableBalance },
                        ].map((preset) => (
                          <button
                            key={preset.label}
                            type="button"
                            onClick={() => setAmount(String(preset.val))}
                            className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 text-[10px] font-bold text-slate-600 dark:text-slate-300 hover:text-emerald-600 border border-slate-200 dark:border-slate-700 transition cursor-pointer"
                          >
                            {preset.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Payouts are deducted from your available balance immediately and settled into your linked Nigerian bank account within 24 business hours.
                  </p>

                  <Button
                    type="submit"
                    disabled={
                      loading ||
                      Number(amount) < 2000 ||
                      Number(amount) > availableBalance
                    }
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-11 rounded-xl shadow-xs cursor-pointer gap-2"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Submitting Payout...</span>
                      </>
                    ) : (
                      <>
                        Confirm ₦{Number(amount || 0).toLocaleString()} Payout
                      </>
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