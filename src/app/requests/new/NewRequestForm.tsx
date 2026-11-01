'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  createBuyerDeviceRequestAction,
  closeBuyerDeviceRequestAction,
} from '@/app/requests/actions'
import { PRODUCT_CATEGORIES } from '@/lib/specs/categorySpecs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Megaphone,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Store,
  ShieldCheck,
  MapPin,
  ExternalLink,
  Bell,
  XCircle,
} from 'lucide-react'

const ABUJA_HUBS = [
  'All Abuja Districts',
  'Banex Plaza, Wuse 2',
  'Emab Plaza, Wuse 2',
  'Gwarinpa',
  'Maitama',
  'Garki',
  'Utako',
  'Jabi',
  'Lugbe / Airport Road',
  'Central Area',
]

const CONDITIONS = [
  { id: 'any', label: 'Any Condition (New or Clean Foreign Used)' },
  { id: 'brand_new', label: 'Brand New (Sealed) Only' },
  { id: 'open_box', label: 'Open Box / Mint' },
  { id: 'uk_used', label: 'Foreign Used (Clean)' },
  { id: 'fairly_used', label: 'Direct Used' },
]

export function NewRequestForm({
  myRequests,
  myEnquiries,
}: {
  myRequests: any[]
  myEnquiries: any[]
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [closingId, setClosingId] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error'
    text: string
  } | null>(null)

  const totalSellerOffers = (myRequests || []).reduce(
    (sum, r) => sum + (Array.isArray(r.responses) ? r.responses.length : 0),
    0
  )

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setFeedback(null)

    const formElement = e.currentTarget
    const formData = new FormData(formElement)
    const res = await createBuyerDeviceRequestAction(formData)

    setLoading(false)

    if (res?.error) {
      setFeedback({ type: 'error', text: res.error })
      return
    }

    formElement.reset()
    setFeedback({
      type: 'success',
      text: 'Your device request has been broadcasted to verified Abuja sellers. When a seller confirms stock, their storefront and offer will appear below.',
    })
    router.refresh()
  }

  async function handleCloseRequest(requestId: string) {
    setClosingId(requestId)
    await closeBuyerDeviceRequestAction(requestId)
    setClosingId(null)
    router.refresh()
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Notification Banner When Sellers Respond */}
      {totalSellerOffers > 0 && (
        <div className="p-4 sm:p-5 rounded-3xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs sm:text-sm font-black text-emerald-950 dark:text-emerald-200">
                {totalSellerOffers} Verified{' '}
                {totalSellerOffers === 1 ? 'Seller Has' : 'Sellers Have'}{' '}
                Responded to Your Device Requests
              </p>
              <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-0.5">
                Scroll down to inspect their offered prices and visit their storefronts.
              </p>
            </div>
          </div>
          <a
            href="#seller-responses"
            className="text-xs font-bold text-emerald-800 dark:text-emerald-200 underline shrink-0"
          >
            View Seller Storefronts &darr;
          </a>
        </div>
      )}

      {/* 1. Broadcast Request Form Card (Fixed Contrast in Light & Dark Mode) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex items-start gap-3.5 border-b border-slate-100 dark:border-slate-800 pb-5">
          <div className="w-11 h-11 rounded-2xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 border border-blue-200/60 dark:border-blue-800 flex items-center justify-center shrink-0">
            <Megaphone className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white">
              Can&apos;t Find Your Exact Gadget?
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Broadcast your target specifications and budget to verified Abuja dealers. Sellers with matching stock will notify you with their storefront link and price.
            </p>
          </div>
        </div>

        {feedback && (
          <div
            className={`p-4 rounded-2xl border text-xs font-semibold flex items-center gap-2.5 ${
              feedback.type === 'success'
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
                : 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-900 text-red-700 dark:text-red-300'
            }`}
          >
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
            )}
            <span>{feedback.text}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5 text-xs">
          <div>
            <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1.5">
              Gadget Title &amp; Target Specifications <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="title"
              required
              placeholder="e.g. MacBook Pro 14 M2 Pro 16GB RAM 512GB SSD or iPhone 15 Pro 256GB"
              className="w-full h-11 px-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                Hardware Category <span className="text-red-500">*</span>
              </label>
              <select
                name="category"
                defaultValue="phones"
                className="w-full h-11 px-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {PRODUCT_CATEGORIES.map((cat) => (
                  <option
                    key={cat.slug}
                    value={cat.slug}
                    className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  >
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                Target Budget (₦) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="budget"
                required
                min={5000}
                step={5000}
                placeholder="e.g. 450000"
                className="w-full h-11 px-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 font-black focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                Preferred Condition
              </label>
              <select
                name="condition"
                defaultValue="any"
                className="w-full h-11 px-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {CONDITIONS.map((c) => (
                  <option
                    key={c.id}
                    value={c.id}
                    className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  >
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                Preferred Abuja Hub / District
              </label>
              <select
                name="preferredDistrict"
                defaultValue="All Abuja Districts"
                className="w-full h-11 px-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {ABUJA_HUBS.map((hub) => (
                  <option
                    key={hub}
                    value={hub}
                    className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  >
                    {hub}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1.5">
              Specific Hardware Requirements (RAM, Storage, Battery Health, Color, etc.)
            </label>
            <textarea
              name="specsNotes"
              rows={3}
              placeholder="e.g. Must be factory unlocked, minimum 88% battery health, original screen with Face ID active..."
              className="w-full p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs sm:text-sm rounded-xl gap-2 cursor-pointer shadow-xs"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Broadcasting Request...</span>
              </>
            ) : (
              <>
                <span>Broadcast Request to Abuja Dealers</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </Button>
        </form>
      </div>

      {/* 2. Buyer's Broadcasted Requests & Seller Storefront Responses */}
      <div id="seller-responses" className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
              My Broadcasted Requests &amp; Seller Responses ({myRequests.length})
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              When a verified seller confirms they have your requested hardware, their offer and storefront link appear below.
            </p>
          </div>
        </div>

        {myRequests.length > 0 ? (
          <div className="space-y-4">
            {myRequests.map((req) => {
              const responses: any[] = req.responses || []
              const isClosed = req.status === 'closed'

              return (
                <div
                  key={req.id}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4 text-xs"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3.5">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
                          {req.title}
                        </span>
                        <Badge
                          variant="outline"
                          className="text-[10px] font-bold uppercase"
                        >
                          {req.category}
                        </Badge>
                        <Badge
                          className={`text-[10px] font-bold uppercase ${
                            isClosed
                              ? 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                              : responses.length > 0
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                              : 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                          }`}
                        >
                          {isClosed
                            ? 'Closed'
                            : responses.length > 0
                            ? `${responses.length} Seller ${
                                responses.length === 1 ? 'Offer' : 'Offers'
                              }`
                            : 'Broadcasting to Sellers'}
                        </Badge>
                      </div>
                      <p className="text-slate-500 dark:text-slate-400">
                        Target Budget:{' '}
                        <strong className="text-slate-900 dark:text-white">
                          ₦{Number(req.budget || 0).toLocaleString()}
                        </strong>{' '}
                        • Preferred Hub: {req.preferred_district} • Posted{' '}
                        {new Date(req.created_at).toLocaleDateString('en-NG')}
                      </p>
                      {req.specs_notes && (
                        <p className="text-slate-600 dark:text-slate-300 pt-1">
                          {req.specs_notes}
                        </p>
                      )}
                    </div>

                    {!isClosed && (
                      <Button
                        type="button"
                        size="xs"
                        variant="ghost"
                        disabled={closingId === req.id}
                        onClick={() => handleCloseRequest(req.id)}
                        className="text-slate-400 hover:text-red-600 rounded-lg font-bold cursor-pointer gap-1"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Close Request</span>
                      </Button>
                    )}
                  </div>

                  {/* Sellers Who Responded "I Have This" */}
                  {responses.length > 0 ? (
                    <div className="space-y-2.5">
                      <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block">
                        Sellers With This Item in Stock ({responses.length})
                      </span>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {responses.map((resp, idx) => (
                          <div
                            key={idx}
                            className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-emerald-200/80 dark:border-emerald-900/60 flex flex-col justify-between space-y-3"
                          >
                            <div className="space-y-2">
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <div className="flex items-center gap-1.5">
                                    <Store className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                                    <span className="font-black text-sm text-slate-900 dark:text-white">
                                      {resp.seller_name}
                                    </span>
                                    {resp.seller_verified && (
                                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                                    )}
                                  </div>
                                  <span className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                                    <MapPin className="w-3 h-3" />
                                    {resp.seller_district}, Abuja
                                  </span>
                                </div>

                                <div className="text-right">
                                  <span className="text-[10px] font-bold uppercase text-slate-400 block">
                                    Seller Offer
                                  </span>
                                  <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                                    ₦{Number(resp.offered_price || 0).toLocaleString()}
                                  </span>
                                </div>
                              </div>

                              <p className="text-slate-600 dark:text-slate-300 leading-relaxed bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                                {resp.note}
                              </p>
                            </div>

                            <div className="flex items-center gap-2 pt-1">
                              <Link
                                href={`/sellers/${resp.seller_id}`}
                                className="flex-1"
                              >
                                <Button
                                  size="sm"
                                  className="w-full h-9 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl gap-1.5 cursor-pointer"
                                >
                                  <Store className="w-3.5 h-3.5" />
                                  <span>Visit Storefront</span>
                                </Button>
                              </Link>

                              {resp.product_id && (
                                <Link
                                  href={`/products/${resp.product_id}`}
                                  className="flex-1"
                                >
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="w-full h-9 text-xs font-bold rounded-xl border-slate-200 dark:border-slate-700 gap-1 cursor-pointer"
                                  >
                                    <span>Inspect Listing</span>
                                    <ExternalLink className="w-3 h-3" />
                                  </Button>
                                </Link>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="text-[11px] text-slate-400">
                      No sellers have responded yet. Verified dealers in Abuja can view this request in their Seller Hub and notify you as soon as they have matching stock.
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 text-center text-xs text-slate-400">
            You have not broadcasted any device requests yet.
          </div>
        )}
      </div>

      {/* 3. Direct Product Enquiries & Seller Replies */}
      {myEnquiries && myEnquiries.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-base font-black text-slate-900 dark:text-white">
            My Direct Product Enquiries ({myEnquiries.length})
          </h2>

          <div className="space-y-3">
            {myEnquiries.map((enq: any) => (
              <div
                key={enq.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs space-y-3 text-xs"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 dark:text-white">
                      {enq.product?.title || 'Product Enquiry'}
                    </span>
                    <Badge
                      className={`text-[10px] font-bold capitalize ${
                        enq.status === 'replied'
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                      }`}
                    >
                      {enq.status === 'replied' ? 'Seller Replied' : 'Awaiting Reply'}
                    </Badge>
                  </div>

                  {enq.seller_id && (
                    <Link
                      href={`/sellers/${enq.seller_id}`}
                      className="font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                    >
                      <Store className="w-3.5 h-3.5" />
                      <span>Visit Seller Storefront</span>
                    </Link>
                  )}
                </div>

                <p className="text-slate-600 dark:text-slate-300">
                  <strong>Your Question:</strong> {enq.message}
                </p>

                {enq.seller_reply && (
                  <div className="p-3.5 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 space-y-1">
                    <span className="text-[10px] font-black uppercase text-emerald-700 dark:text-emerald-300 block">
                      Seller Response
                    </span>
                    <p className="text-slate-800 dark:text-slate-200 font-medium">
                      {enq.seller_reply}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}