'use client'

import { useState } from 'react'
import { recordDeliveryException } from '@/app/actions/delivery'
import { Button } from '@/components/ui/button'
import {
  AlertTriangle,
  X,
  Loader2,
  Camera,
  MapPinOff,
  UserX,
  PackageX,
  HelpCircle,
} from 'lucide-react'

interface DeliveryExceptionModalProps {
  jobId: string
  jobNumber: string
}

const EXCEPTION_REASONS = [
  { id: 'buyer_unavailable', label: 'Buyer Unavailable / Phone Unreachable', icon: UserX },
  { id: 'wrong_address', label: 'Incorrect or Inaccessible Address', icon: MapPinOff },
  { id: 'package_damaged', label: 'Package Appears Damaged / Tampered', icon: PackageX },
  { id: 'buyer_refused', label: 'Buyer Refused Device (Condition Mismatch)', icon: AlertTriangle },
  { id: 'wrong_item_from_seller', label: 'Seller Handed Over Wrong Package', icon: PackageX },
  { id: 'other', label: 'Other Operational Issue', icon: HelpCircle },
]

export function DeliveryExceptionModal({ jobId, jobNumber }: DeliveryExceptionModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [selectedReason, setSelectedReason] = useState(EXCEPTION_REASONS[0].id)
  const [evidenceUrl, setEvidenceUrl] = useState('')
  const [notes, setNotes] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const res = await recordDeliveryException(
      jobId,
      selectedReason,
      `Notes: ${notes} | Evidence: ${evidenceUrl || 'None provided'}`
    )
    setLoading(false)

    if (res.success) {
      alert(`Delivery exception logged for Job #${jobNumber}. BenchTech Dispatch notified.`)
      setIsOpen(false)
    } else {
      alert('Failed to log delivery exception.')
    }
  }

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="text-xs font-bold text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950/40 gap-1.5 h-9 rounded-xl cursor-pointer"
      >
        <AlertTriangle className="w-3.5 h-3.5" />
        <span>Report Delivery Issue / Exception</span>
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs animate-in fade-in"
            onClick={() => !loading && setIsOpen(false)}
          />

          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl z-10 space-y-5 text-slate-900 dark:text-slate-100 animate-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950 text-amber-600">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-sm">Log Delivery Exception</h3>
                  <p className="text-[10px] text-slate-400">Job #{jobNumber}</p>
                </div>
              </div>
              <button
                type="button"
                disabled={loading}
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Reason Selector */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Select Issue Type
                </label>
                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1 [scrollbar-width:thin]">
                  {EXCEPTION_REASONS.map((r) => {
                    const Icon = r.icon
                    const isSelected = selectedReason === r.id
                    return (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => setSelectedReason(r.id)}
                        className={`w-full p-2.5 rounded-xl border text-left text-xs font-bold flex items-center gap-2.5 transition cursor-pointer ${
                          isSelected
                            ? 'border-amber-500 bg-amber-50/50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 ring-1 ring-amber-500'
                            : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                        }`}
                      >
                        <Icon className="w-4 h-4 shrink-0 text-amber-500" />
                        <span className="truncate">{r.label}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Photo Evidence */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Photo Evidence Link (Optional but Recommended)
                </label>
                <input
                  type="url"
                  value={evidenceUrl}
                  onChange={(e) => setEvidenceUrl(e.target.value)}
                  placeholder="https://... photo of damaged package or location"
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              {/* Driver Notes */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Driver Notes / Observations
                </label>
                <textarea
                  rows={2}
                  required
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Called buyer 4 times at Banex gate, phone switched off for over 30 mins."
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl text-[10px] text-slate-500 dark:text-slate-400">
                Logging an exception halts the delivery process safely without penalizing your driver rating. BenchTech support will contact the buyer and merchant.
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs h-11 rounded-xl shadow-xs cursor-pointer gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Logging Exception...</span>
                  </>
                ) : (
                  <span>Submit Delivery Exception</span>
                )}
              </Button>
            </form>
          </div>
        </div>
      )}
    </>
  )
}