'use client'

import { useState } from 'react'
import { createDeliveryJobFromOrder } from '@/app/actions/delivery'
import { Button } from '@/components/ui/button'
import {
  Truck,
  X,
  Loader2,
  Package,
  ShieldCheck,
  Check,
  Camera,
} from 'lucide-react'

interface DispatchModalProps {
  order: {
    id: string
    order_number?: string
    amount: number
    delivery_status: string
    product?: {
      title?: string
    }
  }
}

export function DispatchModal({ order }: DispatchModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [serialImei, setSerialImei] = useState('')
  const [conditionNotes, setConditionNotes] = useState('')
  const [evidenceUrl, setEvidenceUrl] = useState('')

  if (order.delivery_status !== 'not_delivered' && order.delivery_status !== 'created') {
    return null
  }

  const handleDispatch = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const res = await createDeliveryJobFromOrder(order.id)
    setLoading(false)

    if (res.success) {
      alert(`Order assigned to BenchTech Logistics! Delivery Job #${res.jobNumber} created.`)
      setIsOpen(false)
    } else {
      alert(res.error || 'Failed to dispatch order.')
    }
  }

  return (
    <>
      <Button
        size="sm"
        onClick={() => setIsOpen(true)}
        className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl h-9 px-3.5 gap-1.5 shadow-xs cursor-pointer"
      >
        <Truck className="w-3.5 h-3.5" />
        <span>Ready for Pickup / Dispatch</span>
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs animate-in fade-in"
            onClick={() => !loading && setIsOpen(false)}
          />

          <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl z-10 space-y-5 text-slate-900 dark:text-slate-100 animate-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600">
                  <Package className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-sm">Prepare Order for Dispatch</h3>
                  <p className="text-[10px] text-slate-400">Order #{order.order_number || order.id.slice(0, 8)}</p>
                </div>
              </div>
              <button
                type="button"
                disabled={loading}
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Pre-Dispatch Evidence Form (Spec §4) */}
            <form onSubmit={handleDispatch} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Serial Number or IMEI (Optional but Recommended)
                </label>
                <input
                  type="text"
                  value={serialImei}
                  onChange={(e) => setSerialImei(e.target.value)}
                  placeholder="e.g. F2LXM0... or IMEI 35492..."
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                />
                <span className="text-[10px] text-slate-400">
                  Protects you in arbitration against wrong-item claims.
                </span>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Packaging / Pre-Dispatch Evidence URL (Photo Link)
                </label>
                <input
                  type="url"
                  value={evidenceUrl}
                  onChange={(e) => setEvidenceUrl(e.target.value)}
                  placeholder="https://... photo of sealed package or device screen"
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Condition &amp; Inclusions Notes
                </label>
                <textarea
                  rows={2}
                  value={conditionNotes}
                  onChange={(e) => setConditionNotes(e.target.value)}
                  placeholder="e.g. Device fully charged at 88% battery, power brick & cable inside box."
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* Policy Banner */}
              <div className="p-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 rounded-xl text-[11px] text-blue-900 dark:text-blue-200 space-y-1">
                <p className="font-bold">What happens next:</p>
                <p className="text-[10px] leading-relaxed text-blue-800 dark:text-blue-300">
                  A BenchTech verified delivery partner will be assigned to pick up the gadget from your store. Once delivered and verified with OTP, your 7-day buyer inspection countdown begins.
                </p>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs h-11 rounded-xl shadow-xs cursor-pointer gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Assigning Delivery Partner...</span>
                  </>
                ) : (
                  <>
                    <Truck className="w-4 h-4" />
                    <span>Confirm Ready &amp; Request Pickup →</span>
                  </>
                )}
              </Button>
            </form>
          </div>
        </div>
      )}
    </>
  )
}