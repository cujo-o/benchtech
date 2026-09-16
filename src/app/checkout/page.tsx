'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useCartStore } from '@/lib/store/useCartStore'
import { createBrowserClient } from '@supabase/ssr'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Loader2, ShieldCheck, MapPin, CreditCard } from 'lucide-react'

export default function CheckoutPage() {
  const router = useRouter()
  const { items, getSubtotal, clearCart } = useCartStore()

  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [district, setDistrict] = useState('Wuse 2')
  const [fulfillmentType, setFulfillmentType] = useState<'delivery' | 'pickup'>('delivery')

  const subtotal = getSubtotal()
  const deliveryFee = fulfillmentType === 'delivery' ? 2500 : 0
  const totalAmount = subtotal + deliveryFee

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrorMessage(null)

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      // 1. Initialize Paystack Transaction via API
      const res = await fetch('/api/checkout/paystack', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: totalAmount,
          email,
          metadata: {
            buyer_id: user?.id || null,
            buyer_name: fullName,
            phone,
            delivery_address: `${address}, ${district}, Abuja`,
            fulfillment_type: fulfillmentType,
            items: items.map((i) => ({
              id: i.id,
              title: i.title,
              quantity: i.quantity,
              price: i.price,
              seller_id: i.seller_id,
            })),
          },
        }),
      })

      const data = await res.json()

      if (!res.ok || !data.authorization_url) {
        throw new Error(data.message || 'Failed to initialize payment gateway.')
      }

      // 2. Clear local cart & redirect buyer to Paystack gateway
      clearCart()
      window.location.href = data.authorization_url
    } catch (err: any) {
      setErrorMessage(err.message || 'Checkout failed')
      setLoading(false)
    }
  }

  if (items.length === 0) {
    return (
      <div className="max-w-md mx-auto py-20 px-4 text-center space-y-4">
        <h2 className="text-xl font-bold text-slate-900">Your cart is empty</h2>
        <p className="text-xs text-slate-500">Add devices to your cart before proceeding to checkout.</p>
        <Link href="/feed">
          <Button className="bg-blue-600 hover:bg-blue-700 text-xs font-bold rounded-xl">
            Return to Feed
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      <Link
        href="/feed"
        className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Continue Shopping
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Customer & Delivery Form */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="rounded-2xl border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-blue-600" /> Delivery &amp; Contact Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form id="checkout-form" onSubmit={handleCheckout} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs font-bold text-slate-700">Full Name</Label>
                    <Input
                      required
                      placeholder="e.g. Ibrahim Abubakar"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="mt-1 text-xs rounded-xl"
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-bold text-slate-700">Phone Number</Label>
                    <Input
                      required
                      placeholder="08012345678"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="mt-1 text-xs rounded-xl"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-xs font-bold text-slate-700">Email Address (for Receipt)</Label>
                  <Input
                    required
                    type="email"
                    placeholder="buyer@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="mt-1 text-xs rounded-xl"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs font-bold text-slate-700">Abuja District</Label>
                    <select
                      value={district}
                      onChange={(e) => setDistrict(e.target.value)}
                      className="w-full mt-1 h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs font-medium focus:outline-none focus:border-blue-600"
                    >
                      <option value="Wuse 2">Wuse 2</option>
                      <option value="Maitama">Maitama</option>
                      <option value="Garki">Garki</option>
                      <option value="Gwarinpa">Gwarinpa</option>
                      <option value="Jabi">Jabi</option>
                      <option value="Utako">Utako</option>
                      <option value="Kubwa">Kubwa</option>
                      <option value="Airport Road">Airport Road</option>
                    </select>
                  </div>

                  <div>
                    <Label className="text-xs font-bold text-slate-700">Fulfillment Method</Label>
                    <select
                      value={fulfillmentType}
                      onChange={(e) => setFulfillmentType(e.target.value as any)}
                      className="w-full mt-1 h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs font-medium focus:outline-none focus:border-blue-600"
                    >
                      <option value="delivery">Direct Dispatch (₦2,500)</option>
                      <option value="pickup">Physical Inspection &amp; Pickup (Free)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <Label className="text-xs font-bold text-slate-700">Street Address / Landmark</Label>
                  <Input
                    required
                    placeholder="e.g. Suite 4, Banex Plaza, Aminu Kano Crescent"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="mt-1 text-xs rounded-xl"
                  />
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Order Summary Column */}
        <div>
          <Card className="rounded-2xl border-slate-200 shadow-sm sticky top-20">
            <CardHeader>
              <CardTitle className="text-sm font-bold text-slate-900">Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
                {items.map((item) => (
                  <div key={item.id} className="flex justify-between text-xs">
                    <span className="text-slate-600 truncate max-w-[160px]">
                      {item.title} <span className="text-slate-400">× {item.quantity}</span>
                    </span>
                    <span className="font-bold text-slate-900">
                      ₦{(item.price * item.quantity).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>

              <div className="border-t border-slate-100 pt-3 space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-500">
                  <span>Subtotal</span>
                  <span>₦{subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Dispatch Fee</span>
                  <span>{deliveryFee === 0 ? 'Free' : `₦${deliveryFee.toLocaleString()}`}</span>
                </div>
                <div className="flex justify-between font-black text-sm text-slate-900 pt-1 border-t border-slate-100">
                  <span>Total</span>
                  <span>₦{totalAmount.toLocaleString()}</span>
                </div>
              </div>

              {errorMessage && (
                <div className="p-2.5 bg-red-50 text-red-700 text-xs rounded-lg">{errorMessage}</div>
              )}

              <Button
                form="checkout-form"
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 h-11 text-xs font-bold rounded-xl shadow-sm gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Processing...
                  </>
                ) : (
                  <>
                    <CreditCard className="w-4 h-4" /> Pay with Paystack
                  </>
                )}
              </Button>

              <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-400">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                <span>Secured by Paystack 256-bit encryption</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}