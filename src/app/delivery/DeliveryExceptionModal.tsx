'use client'

import { useState } from 'react'
import { recordDeliveryException } from '@/app/actions/delivery'
import { Button } from '@/components/ui/button'
import { AlertTriangle, X, Loader2 } from 'lucide-react'

export function DeliveryExceptionModal({
  orderId,
  orderRef,
  delivery,
  order,
}: {
  orderId?: string
  orderRef?: string
  delivery?: any
  order?: any
}) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const resolvedOrderId =
    orderId || delivery?.order_id || delivery?.id || order?.id || ''
  const resolvedRef =
    orderRef ||
    order?.order_number ||
    delivery?.order_number ||
    resolvedOrderId.slice(0, 8)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    formData.set('orderId', resolvedOrderId)

    const res = await recordDeliveryException(formData)
    setLoading(false)

    if (res?.error) {
      setError(res.error)
      return
    }

    setOpen(false)
  }

  return (
    <>
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={() => setOpen(true)}
        className="text-xs font-bold rounded-xl h-9 px-3 border-amber-300 dark:border-amber-800 text-amber-700 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/40 gap-1.5 cursor-pointer"
      >
        <AlertTriangle className="w-3.5 h-3.5" />
        <span>Report Issue</span>
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-white">
                  Report Delivery Issue
                </h3>
                <p className="text-[11px] text-slate-400 font-mono">
                  Order #{resolvedRef}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-xs text-red-700 dark:text-red-300 font-semibold">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Exception Reason
                </label>
                <select
                  name="reason"
                  required
                  className="w-full h-10 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-medium"
                >
                  <option value="Buyer unreachable by phone">
                    Buyer unreachable by phone
                  </option>
                  <option value="Buyer requested reschedule">
                    Buyer requested reschedule
                  </option>
                  <option value="Buyer rejected item on physical inspection">
                    Buyer rejected item on physical inspection
                  </option>
                  <option value="Seller item not ready for pickup">
                    Seller item not ready for pickup
                  </option>
                  <option value="Incorrect Abuja delivery address">
                    Incorrect Abuja delivery address
                  </option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Field Notes
                </label>
                <textarea
                  name="notes"
                  rows={3}
                  placeholder="Provide details on the handover attempt..."
                  className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-medium"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setOpen(false)}
                  className="text-xs font-bold rounded-xl h-9"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={loading}
                  className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl h-9 px-4 cursor-pointer gap-1.5"
                >
                  {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Submit Report</span>
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}