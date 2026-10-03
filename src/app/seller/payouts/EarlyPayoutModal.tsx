'use client'

import { useState } from 'react'
import { requestEarlyPayout } from '@/app/actions/earlyPayout'
import { Button } from '@/components/ui/button'
import {
  Zap,
  X,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Percent,
} from 'lucide-react'

export function EarlyPayoutModal({
  order,
}: {
  order: {
    id: string
    order_number?: string
    seller_payout: number
    delivery_status: string
    dispute_status: string
    early_payout_claimed?: boolean
  }
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [percentage, setPercentage] = useState<50 | 100>(50)
  const [loading, setLoading] = useState(false)

  const isEligible =
    order.delivery_status === 'verified' &&
    order.dispute_status === 'none' &&
    !order.early_payout_claimed

  if (!isEligible) return null

  const netPayout = Number(order.seller_payout || 0)
  const portion = percentage === 100 ? netPayout : Math.round(netPayout * 0.5)
  const processingFee = Math.round(portion * 0.02) // 2% early release fee
  const disburseAmount = portion - processingFee

  async function handleClaim() {
    setLoading(true)
    const res = await requestEarlyPayout(order.id, percentage)
    setLoading(false)

    if (res.success) {
      alert(`Early payout of ₦${res.disburseAmount?.toLocaleString()} released to your available balance!`)
      setIsOpen(false)
    } else {
      alert(res.error || 'Failed to claim early payout')
    }
  }

  return (
    <>
      <Button
        size="sm"
        onClick={() => setIsOpen(true)}
        className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-[11px] h-7 px-2.5 rounded-lg gap-1 shadow-xs cursor-pointer"
      >
        <Zap className="w-3 h-3 fill-amber-300 text-amber-300" /> Early Payout
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs animate-in fade-in"
            onClick={() => setIsOpen(false)}
          />

          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl z-10 space-y-5 animate-in zoom-in-95 duration-150 text-slate-900 dark:text-slate-100">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950 text-purple-600">
                  <Zap className="w-5 h-5 fill-amber-400 text-amber-500" />
                </div>
                <div>
                  <h3 className="font-black text-sm">Request Early Payout</h3>
                  <p className="text-[10px] text-slate-400">Order #{order.order_number || order.id.slice(0, 8)}</p>
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

            {/* Selection: 50% Partial vs 100% Full */}
            <div className="space-y-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Disbursement Amount
              </span>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setPercentage(50)}
                  className={`p-3 rounded-2xl border text-left cursor-pointer transition space-y-1 ${
                    percentage === 50
                      ? 'border-purple-600 bg-purple-50/50 dark:bg-purple-950/40 ring-1 ring-purple-600'
                      : 'border-slate-200 dark:border-slate-800'
                  }`}
                >
                  <span className="text-xs font-black block">50% Partial</span>
                  <span className="text-sm font-black text-purple-600 dark:text-purple-400 block">
                    ₦{Math.round(netPayout * 0.5).toLocaleString()}
                  </span>
                  <span className="text-[10px] text-slate-400 block">50% held until Day 7</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPercentage(100)}
                  className={`p-3 rounded-2xl border text-left cursor-pointer transition space-y-1 ${
                    percentage === 100
                      ? 'border-purple-600 bg-purple-50/50 dark:bg-purple-950/40 ring-1 ring-purple-600'
                      : 'border-slate-200 dark:border-slate-800'
                  }`}
                >
                  <span className="text-xs font-black block">100% Full</span>
                  <span className="text-sm font-black text-purple-600 dark:text-purple-400 block">
                    ₦{netPayout.toLocaleString()}
                  </span>
                  <span className="text-[10px] text-slate-400 block">Full advance payout</span>
                </button>
              </div>
            </div>

            {/* Fee Breakdown Strip */}
            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/80 dark:border-slate-700 space-y-2 text-xs">
              <div className="flex justify-between text-slate-500 dark:text-slate-400">
                <span>Selected Advance:</span>
                <span className="font-bold text-slate-900 dark:text-slate-100">₦{portion.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-slate-500 dark:text-slate-400">
                <span>Priority Disbursement Fee (2%):</span>
                <span className="font-bold text-red-500">-₦{processingFee.toLocaleString()}</span>
              </div>
              <div className="flex justify-between pt-1.5 border-t border-slate-200 dark:border-slate-700 font-black text-sm text-slate-900 dark:text-slate-100">
                <span>Instant Available Credit:</span>
                <span className="text-emerald-600 dark:text-emerald-400">₦{disburseAmount.toLocaleString()}</span>
              </div>
            </div>

            <p className="text-[10px] text-slate-400 leading-relaxed">
              Delivery is verified. Buyer protection remains active for 7 days. If a defect is confirmed by arbitration, refunds are recovered according to the merchant agreement.
            </p>

            <Button
              onClick={handleClaim}
              disabled={loading}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs h-11 rounded-xl shadow-xs cursor-pointer gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Processing Early Release...
                </>
              ) : (
                <>Confirm ₦{disburseAmount.toLocaleString()} Early Payout →</>
              )}
            </Button>
          </div>
        </div>
      )}
    </>
  )
}