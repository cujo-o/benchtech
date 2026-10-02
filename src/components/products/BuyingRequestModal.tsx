'use client'

import { useState } from 'react'
import { createBuyingRequest } from '@/app/actions/orders'
import { Button } from '@/components/ui/button'
import { MapPin, Truck, Store, Loader2, CheckCircle2, X } from 'lucide-react'

interface BuyingRequestModalProps {
  product: {
    id: string
    title: string
    price: number
    seller_id: string
    location?: string
  }
}

export function BuyingRequestModal({ product }: BuyingRequestModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [deliveryMethod, setDeliveryMethod] = useState<'pickup' | 'seller_delivery'>('pickup')

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    formData.append('productId', product.id)
    formData.append('sellerId', product.seller_id)
    formData.append('price', product.price.toString())
    formData.append('deliveryMethod', deliveryMethod)

    const res = await createBuyingRequest(formData)

    setLoading(false)
    if (res.error) {
      setError(res.error)
      return
    }

    setSuccess(true)
    setTimeout(() => {
      setSuccess(false)
      setIsOpen(false)
    }, 2500)
  }

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className="w-full h-12 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-xs cursor-pointer"
      >
        Request to Buy / Express Interest
      </Button>
    )
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 dark:border-slate-800 space-y-5 animate-in zoom-in-95 duration-150">
        <div className="flex justify-between items-start border-b border-slate-100 dark:border-slate-800 pb-3">
          <div>
            <h2 className="text-base font-black text-slate-900 dark:text-slate-100">Request This Gadget</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate max-w-[260px]">
              {product.title}
            </p>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {success ? (
          <div className="py-6 text-center space-y-2">
            <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
            <p className="text-sm font-bold text-slate-900 dark:text-slate-100">Request Sent to Seller</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              The seller will confirm availability and coordinate collection or inspection in Abuja.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 text-xs rounded-xl font-medium border border-red-200 dark:border-red-900">
                {error}
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Fulfillment Preference
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setDeliveryMethod('pickup')}
                  className={`p-3 rounded-2xl border text-left flex items-center gap-2.5 transition cursor-pointer ${
                    deliveryMethod === 'pickup'
                      ? 'border-blue-600 bg-blue-50/40 dark:bg-blue-950/40 text-blue-900 dark:text-blue-200 ring-1 ring-blue-600'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <Store className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                  <div className="text-xs font-bold">Buyer Pickup</div>
                </button>

                <button
                  type="button"
                  onClick={() => setDeliveryMethod('seller_delivery')}
                  className={`p-3 rounded-2xl border text-left flex items-center gap-2.5 transition cursor-pointer ${
                    deliveryMethod === 'seller_delivery'
                      ? 'border-blue-600 bg-blue-50/40 dark:bg-blue-950/40 text-blue-900 dark:text-blue-200 ring-1 ring-blue-600'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <Truck className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                  <div className="text-xs font-bold">Delivery</div>
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Abuja Location / Area
              </label>
              <div className="relative">
                <MapPin className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3.5" />
                <input
                  name="deliveryArea"
                  required
                  placeholder="e.g., Garki II, Wuse Zone 4, Banex, Maitama"
                  className="w-full text-xs pl-9 pr-3 h-10 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Note for Seller (Optional)
              </label>
              <textarea
                name="buyerNotes"
                rows={2}
                placeholder="Preferred inspection time or questions..."
                className="w-full text-xs p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
              />
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
              <span className="text-xs text-slate-500 dark:text-slate-400">Agreed Price:</span>
              <span className="text-base font-black text-slate-900 dark:text-slate-100">
                ₦{Number(product.price).toLocaleString()}
              </span>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-11 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs cursor-pointer"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm Buying Request'}
            </Button>
          </form>
        )}
      </div>
    </div>
  )
}