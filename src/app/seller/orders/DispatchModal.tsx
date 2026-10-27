'use client'

import { useState } from 'react'
import { createDeliveryJobFromOrder } from '@/app/actions/delivery'
import { Button } from '@/components/ui/button'
import {
  Truck,
  X,
  Loader2,
  CheckCircle2,
  AlertCircle,
  MapPin,
  Phone,
} from 'lucide-react'

export interface DispatchModalProps {
  order?: any
  orderId?: string
  orderNumber?: string
  buyerName?: string
  deliveryArea?: string
  deliveryAddress?: string
  [key: string]: any
}

export function DispatchModal({
  order,
  orderId,
  orderNumber,
  buyerName,
  deliveryArea,
  deliveryAddress,
}: DispatchModalProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dispatchedData, setDispatchedData] = useState<{
    otp?: string
    jobNumber?: string
  } | null>(null)

  const resolvedOrderId = orderId || order?.id || ''
  const resolvedOrderNumber =
    orderNumber ||
    order?.order_number ||
    order?.payment_reference ||
    resolvedOrderId.slice(0, 8)
  const resolvedBuyerName =
    buyerName || order?.buyer?.full_name || order?.buyer_name || 'Buyer'
  const resolvedDeliveryArea =
    deliveryArea || order?.delivery_area || order?.buyer?.district || ''
  const resolvedDeliveryAddress =
    deliveryAddress ||
    order?.delivery_address ||
    order?.buyer?.street_address ||
    resolvedDeliveryArea ||
    'Abuja'

  const [pickupAddress, setPickupAddress] = useState('')
  const [courierName, setCourierName] = useState('')
  const [courierPhone, setCourierPhone] = useState('')
  const [sellerNotes, setSellerNotes] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!resolvedOrderId) {
      setError('Order identifier is missing.')
      return
    }

    setLoading(true)
    setError(null)

    const res = await createDeliveryJobFromOrder({
      orderId: resolvedOrderId,
      pickupAddress,
      courierName,
      courierPhone,
      sellerNotes,
    })

    setLoading(false)

    if (res?.error) {
      setError(res.error)
      return
    }

    setDispatchedData({
      otp: res.otp,
      jobNumber:
        res.jobNumber || `JOB-${resolvedOrderId.slice(0, 8).toUpperCase()}`,
    })
  }

  return (
    <>
      <Button
        type="button"
        size="sm"
        onClick={() => setOpen(true)}
        className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl h-9 px-3.5 gap-1.5 cursor-pointer shadow-2xs"
      >
        <Truck className="w-3.5 h-3.5" />
        <span>Dispatch Order</span>
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-white">
                  Dispatch Hardware Order
                </h3>
                <p className="text-[11px] text-slate-400 font-mono">
                  Order #{resolvedOrderNumber}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setOpen(false)
                  setDispatchedData(null)
                }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-xs text-red-700 dark:text-red-300 font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                <span>{error}</span>
              </div>
            )}

            {dispatchedData ? (
              <div className="space-y-4 py-2">
                <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 space-y-2 text-xs">
                  <div className="flex items-center gap-2 font-bold text-emerald-800 dark:text-emerald-200">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Dispatched Successfully</span>
                  </div>
                  <p className="text-emerald-700 dark:text-emerald-300 leading-relaxed">
                    Job Reference: <strong>{dispatchedData.jobNumber}</strong>
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 pt-1">
                    The courier will verify the buyer&apos;s physical inspection and collect the handover OTP upon delivery.
                  </p>
                </div>

                <Button
                  type="button"
                  onClick={() => {
                    setOpen(false)
                    setDispatchedData(null)
                  }}
                  className="w-full h-10 bg-slate-950 dark:bg-slate-800 text-white font-bold text-xs rounded-xl"
                >
                  Done
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 space-y-1">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">
                    Dropoff Destination
                  </span>
                  <p className="font-bold text-slate-900 dark:text-white">
                    {resolvedBuyerName}
                  </p>
                  <p className="text-slate-500 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                    <span>{resolvedDeliveryAddress}</span>
                  </p>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Store Pickup Address
                  </label>
                  <input
                    type="text"
                    value={pickupAddress}
                    onChange={(e) => setPickupAddress(e.target.value)}
                    placeholder="e.g. Shop B12, Banex Plaza, Wuse 2"
                    className="w-full h-10 px-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-medium"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Courier / Dispatcher Name
                    </label>
                    <input
                      type="text"
                      value={courierName}
                      onChange={(e) => setCourierName(e.target.value)}
                      placeholder="e.g. Musa / FastRider"
                      className="w-full h-10 px-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Courier Phone Number
                    </label>
                    <div className="relative">
                      <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="tel"
                        value={courierPhone}
                        onChange={(e) => setCourierPhone(e.target.value)}
                        placeholder="080..."
                        className="w-full h-10 pl-8 pr-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-medium"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Fulfillment Notes (Optional)
                  </label>
                  <textarea
                    rows={2}
                    value={sellerNotes}
                    onChange={(e) => setSellerNotes(e.target.value)}
                    placeholder="Instructions for courier or inspection..."
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-medium"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
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
                    className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl h-9 px-4 cursor-pointer gap-1.5"
                  >
                    {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>Confirm Dispatch</span>
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  )
}