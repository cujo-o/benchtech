'use client'

import { useState } from 'react'
import { createBuyingRequest } from '@/app/actions/orders'
import { Button } from '@/components/ui/button'
import { MapPin, Truck, Store, Loader2, CheckCircle2 } from 'lucide-react'

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
        className="w-full h-12 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-sm"
      >
        Request to Buy / Express Interest
      </Button>
    )
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-xl border border-slate-100 space-y-5">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-lg font-black text-slate-900">Request This Gadget</h2>
            <p className="text-xs text-slate-500 mt-0.5">{product.title}</p>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="text-slate-400 hover:text-slate-600 text-lg leading-none"
          >
            &times;
          </button>
        </div>

        {success ? (
          <div className="py-6 text-center space-y-2">
            <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
            <p className="text-sm font-bold text-slate-900">Request Sent to Seller</p>
            <p className="text-xs text-slate-500">
              The seller will confirm availability and coordinate collection in Abuja.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl font-medium">
                {error}
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Fulfillment Preference
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setDeliveryMethod('pickup')}
                  className={`p-3 rounded-2xl border text-left flex items-center gap-2.5 transition ${
                    deliveryMethod === 'pickup'
                      ? 'border-blue-600 bg-blue-50/40 text-blue-900 ring-1 ring-blue-600'
                      : 'border-slate-200 text-slate-600'
                  }`}
                >
                  <Store className="w-4 h-4 text-blue-600 shrink-0" />
                  <div className="text-xs font-bold">Buyer Pickup</div>
                </button>

                <button
                  type="button"
                  onClick={() => setDeliveryMethod('seller_delivery')}
                  className={`p-3 rounded-2xl border text-left flex items-center gap-2.5 transition ${
                    deliveryMethod === 'seller_delivery'
                      ? 'border-blue-600 bg-blue-50/40 text-blue-900 ring-1 ring-blue-600'
                      : 'border-slate-200 text-slate-600'
                  }`}
                >
                  <Truck className="w-4 h-4 text-blue-600 shrink-0" />
                  <div className="text-xs font-bold">Delivery</div>
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Abuja Location / Area
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  name="deliveryArea"
                  required
                  placeholder="e.g., Garki II, Wuse Zone 4, Maitama"
                  className="w-full text-xs pl-9 pr-3 h-10 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-600"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Note for Seller (Optional)
              </label>
              <textarea
                name="buyerNotes"
                rows={2}
                placeholder="Mention preferred inspection time or questions..."
                className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-600"
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-slate-500">Agreed Price:</span>
              <span className="text-base font-black text-slate-900">
                ₦{product.price.toLocaleString()}
              </span>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-11 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm Buying Request'}
            </Button>
          </form>
        )}
      </div>
    </div>
  )
}