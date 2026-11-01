'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  sellerRespondToDeviceRequestAction,
  sellerReplyToProductEnquiryAction,
} from '@/app/requests/actions'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  MessageSquare,
  Megaphone,
  CheckCircle2,
  Send,
  Calendar,
  MapPin,
  Loader2,
  Store,
} from 'lucide-react'

export function SellerEnquiriesClient({
  sellerId,
  enquiries,
  deviceRequests,
  sellerProducts,
}: {
  sellerId: string
  enquiries: any[]
  deviceRequests: any[]
  sellerProducts: any[]
}) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'requests' | 'enquiries'>(
    deviceRequests.length > 0 ? 'requests' : 'enquiries'
  )

  const [openRespondId, setOpenRespondId] = useState<string | null>(null)
  const [submittingId, setSubmittingId] = useState<string | null>(null)
  const [alertMsg, setAlertMsg] = useState<string | null>(null)

  async function handleRespondToRequest(
    e: React.FormEvent<HTMLFormElement>,
    reqId: string
  ) {
    e.preventDefault()
    setSubmittingId(reqId)
    setAlertMsg(null)

    const formData = new FormData(e.currentTarget)
    const res = await sellerRespondToDeviceRequestAction(formData)

    setSubmittingId(null)
    if (!res?.error) {
      setOpenRespondId(null)
      setAlertMsg(
        'Buyer notified. Your storefront link and offer are now visible on the buyer’s request page.'
      )
      router.refresh()
    }
  }

  async function handleReplyEnquiry(
    e: React.FormEvent<HTMLFormElement>,
    enqId: string
  ) {
    e.preventDefault()
    setSubmittingId(enqId)
    setAlertMsg(null)

    const formData = new FormData(e.currentTarget)
    const res = await sellerReplyToProductEnquiryAction(formData)

    setSubmittingId(null)
    if (!res?.error) {
      setAlertMsg('Reply sent to buyer.')
      router.refresh()
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white">
              Buyer Enquiries &amp; Device Requests
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Respond to buyer product questions or notify shoppers when you have their requested hardware in stock.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('requests')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
              activeTab === 'requests'
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
            }`}
          >
            <Megaphone className="w-3.5 h-3.5" />
            <span>Buyer Device Requests ({deviceRequests.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('enquiries')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
              activeTab === 'enquiries'
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Direct Enquiries ({enquiries.length})</span>
          </button>
        </div>
      </div>

      {alertMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs font-bold text-emerald-800 dark:text-emerald-200 flex items-center justify-between">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            {alertMsg}
          </span>
          <button
            type="button"
            onClick={() => setAlertMsg(null)}
            className="underline text-[11px]"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* TAB 1: BUYER DEVICE REQUEST BROADCASTS */}
      {activeTab === 'requests' && (
        <div className="space-y-4">
          {deviceRequests.length > 0 ? (
            deviceRequests.map((req) => {
              const myResponse = (req.responses || []).find(
                (r: any) => r.seller_id === sellerId
              )
              const isFormOpen = openRespondId === req.id

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
                        <Badge className="bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 text-[10px] font-bold">
                          Target Budget: ₦{Number(req.budget || 0).toLocaleString()}
                        </Badge>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-slate-500 dark:text-slate-400">
                        <span>
                          Buyer: <strong>{req.buyer_name}</strong>
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {req.preferred_district}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(req.created_at).toLocaleDateString('en-NG')}
                        </span>
                      </div>
                    </div>

                    {myResponse ? (
                      <Badge className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-[10px] font-bold px-3 py-1">
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        Buyer Notified (₦
                        {Number(myResponse.offered_price).toLocaleString()})
                      </Badge>
                    ) : (
                      <Button
                        type="button"
                        size="sm"
                        onClick={() =>
                          setOpenRespondId(isFormOpen ? null : req.id)
                        }
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl h-9 px-4 gap-1.5 cursor-pointer"
                      >
                        <Store className="w-3.5 h-3.5" />
                        <span>
                          {isFormOpen
                            ? 'Cancel'
                            : 'I Have This — Notify Buyer'}
                        </span>
                      </Button>
                    )}
                  </div>

                  {req.specs_notes && (
                    <p className="text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800 leading-relaxed">
                      {req.specs_notes}
                    </p>
                  )}

                  {/* Seller Response Form */}
                  {isFormOpen && !myResponse && (
                    <form
                      onSubmit={(e) => handleRespondToRequest(e, req.id)}
                      className="p-4 rounded-2xl bg-blue-50/40 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 space-y-4"
                    >
                      <input type="hidden" name="requestId" value={req.id} />
                      <input
                        type="hidden"
                        name="buyerId"
                        value={req.buyer_id || ''}
                      />

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                            Your Offered Price (₦) *
                          </label>
                          <input
                            type="number"
                            name="offeredPrice"
                            required
                            defaultValue={req.budget || ''}
                            placeholder="e.g. 440000"
                            className="w-full h-10 px-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-black"
                          />
                        </div>

                        <div>
                          <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                            Device Condition
                          </label>
                          <select
                            name="condition"
                            defaultValue="uk_used"
                            className="w-full h-10 px-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold"
                          >
                            <option value="brand_new">Brand New (Sealed)</option>
                            <option value="open_box">Open Box</option>
                            <option value="uk_used">Foreign Used (Clean)</option>
                            <option value="fairly_used">Direct Used</option>
                          </select>
                        </div>

                        <div>
                          <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                            Link Matching Listing (Optional)
                          </label>
                          <select
                            name="productId"
                            defaultValue=""
                            className="w-full h-10 px-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium"
                          >
                            <option value="">
                              Link my Storefront only
                            </option>
                            {sellerProducts.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.title} (₦{Number(p.price).toLocaleString()})
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                          Note to Buyer (Specs, Battery Health, Store Pickup Info)
                        </label>
                        <input
                          type="text"
                          name="note"
                          required
                          placeholder="e.g. Available in our Wuse 2 store, 93% battery health, factory unlocked. Visit our storefront to inspect."
                          className="w-full h-10 px-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium"
                        />
                      </div>

                      <div className="flex justify-end">
                        <Button
                          type="submit"
                          disabled={submittingId === req.id}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl h-9 px-5 gap-1.5 cursor-pointer"
                        >
                          {submittingId === req.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Send className="w-3.5 h-3.5" />
                          )}
                          <span>Send Storefront Offer to Buyer</span>
                        </Button>
                      </div>
                    </form>
                  )}
                </div>
              )
            })
          ) : (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-12 text-center text-xs text-slate-400">
              No active buyer device requests at the moment.
            </div>
          )}
        </div>
      )}

      {/* TAB 2: DIRECT PRODUCT ENQUIRIES */}
      {activeTab === 'enquiries' && (
        <div className="space-y-4">
          {enquiries.length > 0 ? (
            enquiries.map((enq) => (
              <div
                key={enq.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs space-y-3.5 text-xs"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 dark:text-white">
                      {enq.buyer_name || 'Prospective Buyer'}
                    </span>
                    <Badge
                      className={`text-[10px] font-bold capitalize ${
                        enq.status === 'replied'
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                      }`}
                    >
                      {enq.status || 'new'}
                    </Badge>
                  </div>
                  <span className="text-[11px] text-slate-400 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(enq.created_at).toLocaleDateString('en-NG')}
                  </span>
                </div>

                {enq.product && (
                  <p className="text-[11px] font-bold text-blue-600 dark:text-blue-400">
                    Listing: {enq.product.title} (₦
                    {Number(enq.product.price || 0).toLocaleString()})
                  </p>
                )}

                <p className="text-slate-700 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800">
                  {enq.message}
                </p>

                {enq.seller_reply ? (
                  <div className="p-3.5 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 space-y-1">
                    <span className="text-[10px] font-black uppercase text-emerald-700 dark:text-emerald-300 block">
                      Your Sent Reply
                    </span>
                    <p className="text-slate-800 dark:text-slate-200">
                      {enq.seller_reply}
                    </p>
                  </div>
                ) : (
                  <form
                    onSubmit={(e) => handleReplyEnquiry(e, enq.id)}
                    className="flex gap-2 pt-1"
                  >
                    <input type="hidden" name="enquiryId" value={enq.id} />
                    <input
                      type="text"
                      name="replyText"
                      required
                      placeholder="Reply to buyer's question about availability or specs..."
                      className="flex-1 h-10 px-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium"
                    />
                    <Button
                      type="submit"
                      disabled={submittingId === enq.id}
                      className="h-10 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl px-4 gap-1.5 cursor-pointer"
                    >
                      {submittingId === enq.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Send className="w-3.5 h-3.5" />
                      )}
                      <span>Reply</span>
                    </Button>
                  </form>
                )}
              </div>
            ))
          ) : (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-12 text-center text-xs text-slate-400">
              No direct product enquiries received yet.
            </div>
          )}
        </div>
      )}
    </div>
  )
}