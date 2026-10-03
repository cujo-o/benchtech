'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
  ArrowLeft,
  AlertTriangle,
  CheckCircle2,
  Upload,
  Loader2,
  ShieldAlert,
} from 'lucide-react'

const DISPUTE_REASONS = [
  { id: 'not_as_described', label: 'Item not as described (Specs/Battery mismatch)' },
  { id: 'item_damaged', label: 'Item is damaged or defective' },
  { id: 'wrong_item', label: 'Wrong item received' },
  { id: 'missing_accessories', label: 'Missing accessories or contents' },
  { id: 'other', label: 'Other issue' },
]

export default function RaiseDisputePage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1)
  const [reason, setReason] = useState(DISPUTE_REASONS[0].id)
  const [description, setDescription] = useState('')
  const [remedy, setRemedy] = useState('full_refund')
  const [evidenceUrl, setEvidenceUrl] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit() {
    setLoading(true)
    try {
      const res = await fetch('/api/disputes/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: params.id,
          reason,
          description,
          requestedRemedy: remedy,
          evidenceUrl,
        }),
      })

      const data = await res.json()
      if (data.success) {
        router.push(`/orders/${params.id}?dispute=created`)
      } else {
        alert(data.error || 'Failed to submit dispute')
        setLoading(false)
      }
    } catch {
      alert('Network error. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 p-4 sm:p-6 lg:p-8">
      <div className="max-w-xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Link href={`/orders/${params.id}`} className="p-2 rounded-xl text-slate-400 hover:text-slate-900">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl font-black flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-red-600" /> Report a Problem
            </h1>
            <p className="text-xs text-slate-400">Open a formal dispute within your protection period.</p>
          </div>
        </div>

        {/* Stepper Header */}
        <div className="grid grid-cols-4 gap-2 text-center text-xs font-bold text-slate-400">
          <div className={step >= 1 ? 'text-blue-600 border-b-2 border-blue-600 pb-1' : 'pb-1'}>1. Reason</div>
          <div className={step >= 2 ? 'text-blue-600 border-b-2 border-blue-600 pb-1' : 'pb-1'}>2. Details</div>
          <div className={step >= 3 ? 'text-blue-600 border-b-2 border-blue-600 pb-1' : 'pb-1'}>3. Evidence</div>
          <div className={step === 4 ? 'text-blue-600 border-b-2 border-blue-600 pb-1' : 'pb-1'}>4. Submit</div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-5">
          {step === 1 && (
            <div className="space-y-3">
              <h2 className="text-sm font-black">What is the issue with your gadget?</h2>
              <div className="space-y-2">
                {DISPUTE_REASONS.map((r) => (
                  <label
                    key={r.id}
                    onClick={() => setReason(r.id)}
                    className={`flex items-center gap-3 p-3.5 rounded-2xl border text-xs font-bold cursor-pointer transition ${
                      reason === r.id
                        ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/40 text-blue-600'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                    }`}
                  >
                    <input type="radio" checked={reason === r.id} readOnly className="text-blue-600" />
                    <span>{r.label}</span>
                  </label>
                ))}
              </div>
              <Button onClick={() => setStep(2)} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs h-11 rounded-xl mt-2">
                Next: Provide Details →
              </Button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h2 className="text-sm font-black">Describe the discrepancy</h2>
              <textarea
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Explain exactly what is wrong (e.g. Battery health is 74% instead of 88%, iCloud lock present)..."
                className="w-full text-xs p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
              />

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400">Requested Resolution</label>
                <select
                  value={remedy}
                  onChange={(e) => setRemedy(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold"
                >
                  <option value="full_refund">Full Refund (Return Item)</option>
                  <option value="partial_refund">Partial Refund (Keep Item)</option>
                  <option value="replacement">Vendor Replacement</option>
                </select>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep(1)} className="w-1/3 text-xs font-bold rounded-xl h-11">
                  Back
                </Button>
                <Button
                  disabled={description.length < 10}
                  onClick={() => setStep(3)}
                  className="w-2/3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl h-11"
                >
                  Next: Add Evidence →
                </Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <h2 className="text-sm font-black">Provide Photo or Video Evidence</h2>
              <p className="text-xs text-slate-400">
                Upload clear photos of the physical unit, serial numbers, or inspection report.
              </p>
              <input
                type="url"
                value={evidenceUrl}
                onChange={(e) => setEvidenceUrl(e.target.value)}
                placeholder="Paste Supabase storage image link or file URL..."
                className="w-full text-xs p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
              />
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep(2)} className="w-1/3 text-xs font-bold rounded-xl h-11">
                  Back
                </Button>
                <Button onClick={() => setStep(4)} className="w-2/3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl h-11">
                  Review &amp; Submit →
                </Button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 space-y-1.5">
                <p className="text-xs font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-600" /> Dispute Submission Freezes Payout
                </p>
                <p className="text-[11px] text-amber-800 dark:text-amber-300 leading-relaxed">
                  Upon submission, escrow funds remain frozen. The seller will have 48 hours to reply before an admin arbitrator resolves the case.
                </p>
              </div>

              <div className="text-xs space-y-1.5 border-t border-slate-100 dark:border-slate-800 pt-3">
                <div className="flex justify-between">
                  <span className="text-slate-400">Reason:</span>
                  <span className="font-bold capitalize">{reason.replace(/_/g, ' ')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Remedy:</span>
                  <span className="font-bold capitalize">{remedy.replace(/_/g, ' ')}</span>
                </div>
              </div>

              <Button
                onClick={handleSubmit}
                disabled={loading}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-bold text-xs h-11 rounded-xl shadow-xs cursor-pointer gap-2"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm & Open Formal Dispute'}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}