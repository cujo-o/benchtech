'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Plus, Wallet, Loader2, X } from 'lucide-react'

export function AddFundsModal({ currentBalance }: { currentBalance: string }) {
  const [isOpen, setIsOpen] = useState(false)
  const [amount, setAmount] = useState('5000')
  const [loading, setLoading] = useState(false)
  const pathname = usePathname()

  const PRESET_AMOUNTS = ['2000', '5000', '10000', '25000', '50000']

  async function handleTopUp() {
    setLoading(true)
    try {
      const res = await fetch('/api/ads/wallet/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          amount: Number(amount),
          redirectPath: pathname || '/seller/wallet'
        }),
      })

      const data = await res.json()
      if (data.authorization_url) {
        window.location.href = data.authorization_url
      } else {
        alert(data.error || 'Failed to initialize payment')
        setLoading(false)
      }
    } catch {
      alert('An error occurred. Please check your network.')
      setLoading(false)
    }
  }

  return (
    <>
      <Button
        size="sm"
        onClick={() => setIsOpen(true)}
        className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs h-10 px-4 rounded-xl gap-1.5 shadow-xs cursor-pointer"
      >
        <Plus className="w-4 h-4" /> Add Funds
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs animate-in fade-in"
            onClick={() => setIsOpen(false)}
          />

          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl z-10 space-y-5 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600">
                  <Wallet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-sm text-slate-900 dark:text-slate-100">
                    Add Promotion Funds
                  </h3>
                  <p className="text-[10px] text-slate-400">Current Balance: ₦{currentBalance}</p>
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

            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Select Deposit Amount
              </label>

              <div className="grid grid-cols-3 gap-2">
                {PRESET_AMOUNTS.map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setAmount(val)}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition ${
                      amount === val
                        ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/40 text-blue-600'
                        : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                    }`}
                  >
                    ₦{Number(val).toLocaleString()}
                  </button>
                ))}
              </div>

              <div className="space-y-1 pt-1">
                <span className="text-[11px] text-slate-400 font-semibold">Or enter custom amount (₦)</span>
                <input
                  type="number"
                  min="1000"
                  step="500"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold"
                />
              </div>

              <p className="text-[11px] text-slate-400 leading-relaxed">
                Funds are credited instantly via Paystack and deducted automatically only when valid clicks occur on your Sponsored Search campaigns.
              </p>
            </div>

            <Button
              onClick={handleTopUp}
              disabled={loading || Number(amount) < 1000}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs h-11 rounded-xl shadow-xs cursor-pointer gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Connecting to Paystack...
                </>
              ) : (
                <>Pay ₦{Number(amount).toLocaleString()} with Paystack →</>
              )}
            </Button>
          </div>
        </div>
      )}
    </>
  )
}