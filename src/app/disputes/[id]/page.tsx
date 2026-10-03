import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/Navbar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  ShieldAlert,
  Clock,
  ArrowLeft,
  CheckCircle2,
  Package,
  MessageSquare,
  Image as ImageIcon,
  Send,
  AlertTriangle,
} from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function DisputeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect(`/login?next=/disputes/${id}`)

  // Fetch dispute, messages, evidence, and order details
  const { data: dispute } = await supabase
    .from('disputes')
    .select(`
      *,
      order:orders(*, product:products(*)),
      buyer:profiles!disputes_buyer_id_fkey(full_name, business_name),
      seller:profiles!disputes_seller_id_fkey(business_name, full_name),
      messages:dispute_messages(*, sender:profiles(full_name, business_name)),
      evidence:dispute_evidence(*)
    `)
    .eq('id', id)
    .single()

  if (!dispute) notFound()

  const isBuyer = dispute.buyer_id === user.id
  const isSeller = dispute.seller_id === user.id
  const product = dispute.order?.product

  // Stepper active states: Open -> Buyer Evidence -> Seller Response -> Under Review -> Resolved
  const statusIndexMap: Record<string, number> = {
    opened: 1,
    awaiting_buyer_evidence: 1,
    awaiting_seller_response: 2,
    under_review: 3,
    resolved: 4,
    closed: 4,
  }
  const activeStep = statusIndexMap[dispute.status] || 1

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <Navbar />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center gap-3">
            <Link href={`/orders/${dispute.order_id}`} className="p-2 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-slate-100">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-black">Dispute Case #{dispute.case_number}</h1>
                <Badge className="bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border border-amber-200 text-[10px] font-bold capitalize">
                  {dispute.status.replace(/_/g, ' ')}
                </Badge>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Opened on {new Date(dispute.created_at).toLocaleDateString('en-NG', { dateStyle: 'medium' })}
              </p>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[10px] font-bold text-slate-400 uppercase block">Disputed Escrow</span>
            <span className="text-lg font-black text-red-600 dark:text-red-400">
              ₦{Number(dispute.order?.total_amount || dispute.order?.amount).toLocaleString()}
            </span>
          </div>
        </div>

        {/* Visual 8 Screen 7: Dispute Timeline Stepper */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4">
          <div className="grid grid-cols-5 gap-2 text-center text-xs font-bold">
            <div className={`space-y-1 ${activeStep >= 0 ? 'text-blue-600' : 'text-slate-400'}`}>
              <div className="w-7 h-7 mx-auto rounded-full bg-blue-600 text-white flex items-center justify-center text-xs">✓</div>
              <span>Open</span>
            </div>
            <div className={`space-y-1 ${activeStep >= 1 ? 'text-blue-600' : 'text-slate-400'}`}>
              <div className={`w-7 h-7 mx-auto rounded-full flex items-center justify-center text-xs ${activeStep >= 1 ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-800'}`}>2</div>
              <span>Buyer Evidence</span>
            </div>
            <div className={`space-y-1 ${activeStep >= 2 ? 'text-blue-600' : 'text-slate-400'}`}>
              <div className={`w-7 h-7 mx-auto rounded-full flex items-center justify-center text-xs ${activeStep >= 2 ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-800'}`}>3</div>
              <span>Seller Response</span>
            </div>
            <div className={`space-y-1 ${activeStep >= 3 ? 'text-blue-600' : 'text-slate-400'}`}>
              <div className={`w-7 h-7 mx-auto rounded-full flex items-center justify-center text-xs ${activeStep >= 3 ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-800'}`}>4</div>
              <span>Under Review</span>
            </div>
            <div className={`space-y-1 ${activeStep >= 4 ? 'text-emerald-600' : 'text-slate-400'}`}>
              <div className={`w-7 h-7 mx-auto rounded-full flex items-center justify-center text-xs ${activeStep >= 4 ? 'bg-emerald-600 text-white' : 'bg-slate-100 dark:bg-slate-800'}`}>5</div>
              <span>Resolved</span>
            </div>
          </div>

          {/* Response Deadline Alert */}
          {dispute.seller_response_deadline && dispute.status !== 'resolved' && (
            <div className="p-3.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 rounded-2xl flex items-center justify-between text-xs text-amber-900 dark:text-amber-200">
              <span className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-600" />
                <span><strong>Respond by:</strong> {new Date(dispute.seller_response_deadline).toLocaleString('en-NG')}</span>
              </span>
              <span className="text-[11px] font-bold">48-Hour Arbitration Window</span>
            </div>
          )}
        </div>

        {/* Two-Column Grid: Case Chat & Order Summary */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Mediated Message Thread (8 cols) */}
          <div className="lg:col-span-8 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-2xs space-y-5">
            <h3 className="font-black text-sm flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-blue-600" /> Case Evidence &amp; Statements
            </h3>

            {/* Initial Buyer Narrative */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-blue-600 dark:text-blue-400">Buyer Complaint ({dispute.reason.replace(/_/g, ' ')})</span>
                <span className="text-[10px] text-slate-400">{new Date(dispute.created_at).toLocaleTimeString('en-NG')}</span>
              </div>
              <p className="text-xs leading-relaxed text-slate-700 dark:text-slate-300 whitespace-pre-line">
                {dispute.description}
              </p>
            </div>

            {/* Evidence Thumbnails */}
            {dispute.evidence && dispute.evidence.length > 0 && (
              <div className="space-y-2">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Attached Evidence</span>
                <div className="flex flex-wrap gap-2">
                  {dispute.evidence.map((ev: any) => (
                    <a key={ev.id} href={ev.file_url} target="_blank" rel="noreferrer" className="w-20 h-20 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 flex items-center justify-center hover:opacity-80 transition">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={ev.file_url} alt="Evidence" className="w-full h-full object-cover" />
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Thread Messages */}
            <div className="space-y-3 pt-2">
              {dispute.messages && dispute.messages.length > 0 ? (
                dispute.messages.map((msg: any) => (
                  <div key={msg.id} className="p-3.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-xs space-y-1">
                    <div className="flex justify-between font-bold text-slate-500">
                      <span>{msg.sender?.business_name || msg.sender?.full_name || 'Participant'}</span>
                      <span className="text-[10px] font-normal">{new Date(msg.created_at).toLocaleTimeString('en-NG')}</span>
                    </div>
                    <p className="text-slate-800 dark:text-slate-200">{msg.message}</p>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400 py-3 text-center">No additional messages logged yet.</p>
              )}
            </div>

            {/* Reply Input Form */}
            <form action="/api/disputes/message" method="POST" className="pt-2 flex gap-2">
              <input type="hidden" name="disputeId" value={dispute.id} />
              <input
                type="text"
                name="message"
                required
                placeholder="Type your response to the arbitrator..."
                className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
              />
              <Button type="submit" size="sm" className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl px-4 cursor-pointer gap-1.5">
                <Send className="w-3.5 h-3.5" /> Send
              </Button>
            </form>
          </div>

          {/* Right Column: Order Summary Card (4 cols) */}
          <div className="lg:col-span-4 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 space-y-4 shadow-2xs">
            <h3 className="font-black text-xs uppercase tracking-wider text-slate-400">Order Summary</h3>

            {product && (
              <div className="flex gap-3 items-center">
                <div className="w-14 h-14 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 overflow-hidden flex items-center justify-center shrink-0">
                  {product.images?.[0] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={product.images[0]} alt={product.title} className="w-full h-full object-contain p-1" />
                  ) : (
                    <Package className="w-5 h-5 text-slate-400" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-xs font-bold truncate">{product.title}</h4>
                  <p className="text-xs font-black text-blue-600 dark:text-blue-400 mt-0.5">
                    ₦{Number(product.price).toLocaleString()}
                  </p>
                </div>
              </div>
            )}

            <div className="border-t border-slate-100 dark:border-slate-800 pt-3 space-y-2 text-xs text-slate-500">
              <div className="flex justify-between">
                <span>Seller:</span>
                <span className="font-bold text-slate-900 dark:text-slate-100">{dispute.seller?.business_name || 'Vendor'}</span>
              </div>
              <div className="flex justify-between">
                <span>Order No:</span>
                <span className="font-mono">{dispute.order?.order_number || dispute.order_id.slice(0, 8)}</span>
              </div>
              <div className="flex justify-between">
                <span>Remedy:</span>
                <span className="font-bold text-red-600 capitalize">{dispute.requested_remedy.replace(/_/g, ' ')}</span>
              </div>
            </div>

            <Link href={`/orders/${dispute.order_id}`} className="block pt-2">
              <Button variant="outline" className="w-full text-xs font-bold rounded-xl h-9 border-slate-200 dark:border-slate-700">
                View Full Order Details
              </Button>
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}