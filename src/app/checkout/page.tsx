'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useCartStore } from '@/lib/store/useCartStore'
import { Navbar } from '@/components/Navbar'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  MapPin,
  CreditCard,
  ShieldCheck,
  Truck,
  Store,
  ArrowLeft,
  Plus,
  Minus,
  Trash2,
  Package,
  Loader2,
  AlertCircle,
  Lock,
  CheckCircle2,
} from 'lucide-react'

const ABUJA_DISTRICTS = [
  'Wuse 2',
  'Banex / Wuse',
  'Gwarinpa',
  'Maitama',
  'Garki',
  'Utako',
  'Jabi',
  'Lugbe / Airport Road',
  'Asokoro',
  'Kubwa',
  'Lokogoma',
  'Central Area',
]

export default function CheckoutPage() {
  const supabase = createClient()
  const { items, updateQuantity, removeItem, getSubtotal, getTotalItems } =
    useCartStore()

  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Buyer Delivery & Contact Fields
  const [userId, setUserId] = useState<string | null>(null)
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [district, setDistrict] = useState('Wuse 2')
  const [deliveryMethod, setDeliveryMethod] = useState<'delivery' | 'pickup'>(
    'delivery'
  )
  const [streetAddress, setStreetAddress] = useState('')
  const [buyerNotes, setBuyerNotes] = useState('')

  useEffect(() => {
    setMounted(true)
    async function loadBuyerProfile() {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user) {
        setUserId(user.id)
        setEmail(user.email || '')
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle()

        if (profile) {
          setFullName(profile.full_name || profile.business_name || '')
          setPhone(profile.phone || '')
          if (profile.district) setDistrict(profile.district)
          if (profile.street_address || profile.address) {
            setStreetAddress(profile.street_address || profile.address || '')
          }
        }
      }
    }
    loadBuyerProfile()
  }, [supabase])

  if (!mounted) {
    return <div className="min-h-screen bg-slate-50 dark:bg-slate-950" />
  }

  const subtotal = getSubtotal()
  const totalCount = getTotalItems()
  const dispatchFee =
    items.length === 0 ? 0 : deliveryMethod === 'delivery' ? 2500 : 0
  const grandTotal = subtotal + dispatchFee

  async function handleCheckoutSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (items.length === 0 || loading) return

    setError(null)
    setLoading(true)

    try {
      const res = await fetch('/api/checkout/paystack', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: grandTotal,
          email: email.trim(),
          metadata: {
            purpose: 'marketplace_order',
            buyer_id: userId,
            buyer_name: fullName.trim(),
            buyer_phone: phone.trim(),
            delivery_area: district,
            delivery_address: streetAddress.trim(),
            delivery_method: deliveryMethod,
            delivery_fee: dispatchFee,
            buyer_notes: buyerNotes.trim(),
            items: items.map((item) => ({
              id: item.id,
              title: item.title,
              price: Number(item.price || 0),
              quantity: Number(item.quantity || 1),
              image: item.image || '',
              seller_id: item.seller_id,
              seller_name: item.seller_name || '',
              condition: item.condition || 'used',
              brand: item.brand || '',
              specs: item.specs || {},
            })),
          },
        }),
      })

      const data = await res.json()
      if (!res.ok || !data.authorization_url) {
        setError(data.message || data.error || 'Could not initialize payment.')
        setLoading(false)
        return
      }

      window.location.href = data.authorization_url
    } catch {
      setError('Network error while connecting to Paystack. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col">
      <Navbar />

      <main className="max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-6">
        <div className="flex items-center justify-between">
          <Link
            href="/feed"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Continue Shopping</span>
          </Link>

          <Badge className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-[10px] font-bold">
            <ShieldCheck className="w-3.5 h-3.5 mr-1" />
            Escrow &amp; 7-Day Inspection Protected
          </Badge>
        </div>

        {items.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-12 text-center space-y-3 max-w-lg mx-auto">
            <Package className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
            <h1 className="text-base font-black text-slate-900 dark:text-white">
              Your checkout cart is empty
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Add electronics or hardware from our catalog to proceed with checkout.
            </p>
            <Link href="/products" className="inline-block pt-2">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl h-10 px-5">
                Explore Catalog
              </Button>
            </Link>
          </div>
        ) : (
          <form
            onSubmit={handleCheckoutSubmit}
            className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start"
          >
            {/* Left 7 Cols: Cart Items Review + Delivery & Contact Info */}
            <div className="lg:col-span-7 space-y-6">
              {/* 1. Items in Order (With Quantity & Spec Controls) */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div>
                    <h2 className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
                      1. Review Hardware Items ({totalCount}{' '}
                      {totalCount === 1 ? 'Unit' : 'Units'})
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Adjust quantities or inspect item details before payment
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  {items.map((item) => {
                    const unitPrice = Number(item.price || 0)
                    const lineTotal = unitPrice * item.quantity

                    return (
                      <div
                        key={item.id}
                        className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3.5"
                      >
                        <div className="flex items-center gap-3.5 min-w-0">
                          <Link
                            href={`/products/${item.id}`}
                            className="w-16 h-16 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-1.5 flex items-center justify-center shrink-0 overflow-hidden"
                          >
                            {item.image ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={item.image}
                                alt={item.title}
                                className="w-full h-full object-contain"
                              />
                            ) : (
                              <Package className="w-6 h-6 text-slate-400" />
                            )}
                          </Link>

                          <div className="min-w-0 space-y-1">
                            <Link
                              href={`/products/${item.id}`}
                              className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 line-clamp-1"
                            >
                              {item.title}
                            </Link>
                            <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                              <span className="capitalize font-semibold text-blue-600 dark:text-blue-400">
                                {item.condition?.replace(/_/g, ' ') || 'Verified'}
                              </span>
                              <span>•</span>
                              <span>₦{unitPrice.toLocaleString()} each</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200/60 dark:border-slate-700/60 shrink-0">
                          {/* Quantity Selector */}
                          <div className="inline-flex items-center gap-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-1">
                            <button
                              type="button"
                              onClick={() =>
                                updateQuantity(item.id, item.quantity - 1)
                              }
                              className="w-6 h-6 rounded-lg flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="text-xs font-black text-slate-900 dark:text-white min-w-6 text-center">
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                updateQuantity(item.id, item.quantity + 1)
                              }
                              className="w-6 h-6 rounded-lg flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>

                          <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-white min-w-[90px] text-right">
                            ₦{lineTotal.toLocaleString()}
                          </span>

                          <button
                            type="button"
                            onClick={() => removeItem(item.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 transition cursor-pointer"
                            title="Remove item"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* 2. Delivery & Contact Information */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xs space-y-5">
                <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                  <h2 className="text-sm sm:text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <span>2. Abuja Delivery &amp; Contact Information</span>
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Used for courier coordination and your 6-digit delivery handover OTP.
                  </p>
                </div>

                {error && (
                  <div className="p-3.5 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-xs font-semibold text-red-700 dark:text-red-300 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                    <span>{error}</span>
                  </div>
                )}

                {/* Fulfillment Method Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setDeliveryMethod('delivery')}
                    className={`p-3.5 rounded-2xl border text-left transition flex items-start gap-3 cursor-pointer ${
                      deliveryMethod === 'delivery'
                        ? 'border-2 border-blue-600 bg-blue-50/40 dark:bg-blue-950/40'
                        : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40'
                    }`}
                  >
                    <Truck className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                    <div className="text-xs">
                      <span className="font-black text-slate-900 dark:text-white block">
                        Direct Abuja Dispatch (₦2,500)
                      </span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">
                        Same-day courier delivery to your address with physical inspection.
                      </span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDeliveryMethod('pickup')}
                    className={`p-3.5 rounded-2xl border text-left transition flex items-start gap-3 cursor-pointer ${
                      deliveryMethod === 'pickup'
                        ? 'border-2 border-blue-600 bg-blue-50/40 dark:bg-blue-950/40'
                        : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40'
                    }`}
                  >
                    <Store className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                    <div className="text-xs">
                      <span className="font-black text-slate-900 dark:text-white block">
                        In-Store Plaza Pickup (Free)
                      </span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">
                        Inspect and collect at the verified seller&apos;s Abuja store.
                      </span>
                    </div>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      Recipient Full Name
                    </label>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Your full name"
                      className="w-full h-11 px-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      Active Phone Number
                    </label>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="080 1234 5678"
                      className="w-full h-11 px-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      Email Address (For Order Receipt)
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full h-11 px-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      Abuja District
                    </label>
                    <select
                      value={district}
                      onChange={(e) => setDistrict(e.target.value)}
                      className="w-full h-11 px-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {ABUJA_DISTRICTS.map((d) => (
                        <option
                          key={d}
                          value={d}
                          className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                        >
                          {d}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="text-xs">
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Street Address / Landmark in Abuja
                  </label>
                  <input
                    type="text"
                    required
                    value={streetAddress}
                    onChange={(e) => setStreetAddress(e.target.value)}
                    placeholder="House number, estate, street name, nearest landmark"
                    className="w-full h-11 px-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="text-xs">
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Delivery / Inspection Notes (Optional)
                  </label>
                  <textarea
                    rows={2}
                    value={buyerNotes}
                    onChange={(e) => setBuyerNotes(e.target.value)}
                    placeholder="Preferred delivery time window or gate access instructions..."
                    className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Right 5 Cols: Order Summary & Escrow Protection Breakdown */}
            <div className="lg:col-span-5 space-y-4 lg:sticky lg:top-20">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xs space-y-5">
                <h2 className="text-base font-black text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3">
                  Order Summary
                </h2>

                {/* Line Items Breakdown */}
                <div className="space-y-2.5 text-xs">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-start justify-between gap-3 text-slate-600 dark:text-slate-300"
                    >
                      <span className="font-medium line-clamp-1">
                        {item.title}{' '}
                        <strong className="text-slate-900 dark:text-white">
                          × {item.quantity}
                        </strong>
                      </span>
                      <span className="font-bold text-slate-900 dark:text-white shrink-0">
                        ₦{(Number(item.price || 0) * item.quantity).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2 text-xs">
                  <div className="flex justify-between text-slate-500 dark:text-slate-400">
                    <span>Hardware Subtotal ({totalCount} items)</span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      ₦{subtotal.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-500 dark:text-slate-400">
                    <span>
                      {deliveryMethod === 'delivery'
                        ? 'Abuja Courier Dispatch'
                        : 'Store Pickup'}
                    </span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {dispatchFee === 0
                        ? 'Free'
                        : `₦${dispatchFee.toLocaleString()}`}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-500 dark:text-slate-400">
                    <span>7-Day Buyer Inspection Escrow</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                      Included
                    </span>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-sm font-black text-slate-900 dark:text-white">
                    Total Payable
                  </span>
                  <span className="text-xl font-black text-blue-600 dark:text-blue-400">
                    ₦{grandTotal.toLocaleString()}
                  </span>
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs sm:text-sm rounded-xl gap-2 shadow-md shadow-blue-600/20 cursor-pointer"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Connecting to Paystack...</span>
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-4 h-4" />
                      <span>Pay ₦{grandTotal.toLocaleString()} with Paystack</span>
                    </>
                  )}
                </Button>

                {/* How Buyer Protection Works */}
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-800 space-y-2 text-[11px] text-slate-600 dark:text-slate-300">
                  <p className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>How Your Payment is Protected</span>
                  </p>
                  
                </div>
              </div>
            </div>
          </form>
        )}
      </main>
    </div>
  )
}