import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/Navbar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  CheckCircle2,
  Clock,
  ArrowLeft,
  RotateCcw,
  ShieldCheck,
  CreditCard,
  Building2,
  AlertCircle,
} from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function RefundDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect(`/login?next=/refunds/${id}`)

  const { data: refund } = await supabase
    .from('refunds')
    .select('*, order:orders(*), buyer:profiles!refunds_buyer_id_fkey(*)')
    .eq('id', id)
    .single()

  if (!refund) notFound()

  // Stepper active states: approved -> processing -> completed
  const isApproved = Boolean(refund.approved_at || refund.status !== 'requested')
  const isProcessing = Boolean(refund.processing_started_at || refund.status === 'processing' || refund.status === 'completed')
  const isCompleted = refund.status === 'completed'

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <Navbar />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Link href="/orders" className="p-2 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-slate-100">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-black flex items-center gap-2">
                <RotateCcw className="w-5 h-5 text-emerald-600" /> Refund Status
              </h1>
              <Badge className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 text-[10px] font-bold uppercase">
                {refund.status}
              </Badge>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">Refund Reference #{refund.refund_number || refund.id.slice(0, 8)}</p>
          </div>
        </div>

        {/* Refund Amount Banner */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Refund Authorized</span>
            <span className="text-3xl font-black text-emerald-600 dark:text-emerald-400">
              ₦{Number(refund.amount).toLocaleString()}
            </span>
          </div>
          <div className="text-right text-xs text-slate-400">
            <span>Payment Method:</span>
            <p className="font-bold text-slate-900 dark:text-slate-100">Original Provider / Card</p>
          </div>
        </div>

        {/* Visual 8 Screen 8: 4-Stage Refund Progression Timeline */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-6">
          <h2 className="text-xs font-black uppercase tracking-wider text-slate-400">Settlement Timeline</h2>

          <div className="space-y-6 relative pl-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
            {/* Stage 1: Refund Approved */}
            <div className="relative space-y-1">
              <div className={`absolute -left-6 top-0.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                isApproved ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-500'
              }`}>
                ✓
              </div>
              <p className="text-xs font-black text-slate-900 dark:text-slate-100">Refund Approved</p>
              <p className="text-[11px] text-slate-400">
                {refund.approved_at ? new Date(refund.approved_at).toLocaleString('en-NG') : 'Approved by arbitrator'}
              </p>
            </div>

            {/* Stage 2: Processing by Payment Provider */}
            <div className="relative space-y-1">
              <div className={`absolute -left-6 top-0.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                isProcessing ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-500'
              }`}>
                ✓
              </div>
              <p className="text-xs font-black text-slate-900 dark:text-slate-100">Processing by Payment Provider</p>
              <p className="text-[11px] text-slate-400">Transferred to Paystack gateway. Settlement takes 1–5 business days.</p>
            </div>

            {/* Stage 3: Refund to Your Account */}
            <div className="relative space-y-1">
              <div className={`absolute -left-6 top-0.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                isCompleted ? 'bg-emerald-600 text-white' : 'bg-blue-600 text-white animate-pulse'
              }`}>
                ●
              </div>
              <p className="text-xs font-black text-slate-900 dark:text-slate-100">Credit to Originating Bank</p>
              <p className="text-[11px] text-slate-400">Funds dispatched to your originating debit card or bank account.</p>
            </div>

            {/* Stage 4: Completed */}
            <div className="relative space-y-1">
              <div className={`absolute -left-6 top-0.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                isCompleted ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-500'
              }`}>
                {isCompleted ? '✓' : '4'}
              </div>
              <p className="text-xs font-black text-slate-900 dark:text-slate-100">Completed</p>
              <p className="text-[11px] text-slate-400">Confirmation received from payment network.</p>
            </div>
          </div>
        </div>

        {/* Support Help Box */}
        <div className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-blue-600 shrink-0" />
            <span className="text-slate-500 dark:text-slate-300">If your refund has not reflected after 5 business days, contact support.</span>
          </div>
          <Link href="/admin/support" className="font-bold text-blue-600 hover:underline shrink-0">
            Contact Support →
          </Link>
        </div>
      </main>
    </div>
  )
}