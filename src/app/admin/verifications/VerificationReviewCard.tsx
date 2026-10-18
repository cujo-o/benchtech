'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  approveSellerVerificationAction,
  requestSellerActionAction,
  rejectSellerVerificationAction,
} from './actions'
import {
  User,
  Building2,
  MapPin,
  Landmark,
  FileText,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  XCircle,
} from 'lucide-react'

export function VerificationReviewCard({ item }: { item: any }) {
  const [loading, setLoading] = useState(false)
  const [feedbackMode, setFeedbackMode] = useState<'action' | 'reject' | null>(null)
  const [note, setNote] = useState('')

  const isBusiness = item.seller_type === 'business'
  const displayName = isBusiness
    ? item.business_name || item.legal_name
    : item.legal_name || 'Seller Applicant'

  const handleApprove = async () => {
    setLoading(true)
    try {
      await approveSellerVerificationAction(item.seller_id)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitNote = async () => {
    if (!note.trim()) return
    setLoading(true)
    try {
      if (feedbackMode === 'action') {
        await requestSellerActionAction(item.seller_id, note.trim())
      } else if (feedbackMode === 'reject') {
        await rejectSellerVerificationAction(item.seller_id, note.trim())
      }
      setFeedbackMode(null)
      setNote('')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xs space-y-5">
      {/* Top Header */}
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div
            className={`w-11 h-11 rounded-2xl flex items-center justify-center text-white shrink-0 ${
              isBusiness ? 'bg-purple-600' : 'bg-blue-600'
            }`}
          >
            {isBusiness ? <Building2 className="w-5 h-5" /> : <User className="w-5 h-5" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                {displayName}
              </h3>
              <Badge className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-bold capitalize">
                {isBusiness ? 'Registered Business' : 'Individual Seller'}
              </Badge>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Submitted{' '}
              {item.submitted_at
                ? new Date(item.submitted_at).toLocaleString('en-NG', {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  })
                : 'Recently'}
            </p>
          </div>
        </div>

        <Badge
          className={`text-[10px] font-bold uppercase px-2.5 py-1 ${
            item.status === 'verified'
              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
              : item.status === 'action_required'
              ? 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
              : item.status === 'rejected'
              ? 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300'
              : 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
          }`}
        >
          {item.status?.replace(/_/g, ' ')}
        </Badge>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
        {/* Column 1: Identity & Representative */}
        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 space-y-1.5">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
            {isBusiness ? 'Business & Representative' : 'Personal & Identity'}
          </span>
          {isBusiness && (
            <>
              <p>
                <span className="text-slate-400">CAC No:</span>{' '}
                <strong className="font-mono">{item.cac_number || '—'}</strong>
              </p>
              <p>
                <span className="text-slate-400">TIN:</span>{' '}
                <strong className="font-mono">{item.tin_number || '—'}</strong>
              </p>
            </>
          )}
          <p>
            <span className="text-slate-400">Legal Name:</span>{' '}
            <strong>{item.legal_name}</strong>
          </p>
          <p>
            <span className="text-slate-400">DOB:</span> <strong>{item.date_of_birth || '—'}</strong>
          </p>
          <p>
            <span className="text-slate-400">Phone:</span> <strong>{item.phone}</strong>
          </p>
          <p>
            <span className="text-slate-400">ID Type:</span>{' '}
            <strong>{item.id_type?.split(' ')[0]} ({item.id_number_masked})</strong>
          </p>
        </div>

        {/* Column 2: Address */}
        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 space-y-1.5">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1">
            <MapPin className="w-3 h-3" /> Verified Address
          </span>
          <p className="font-bold text-slate-900 dark:text-slate-100">
            {item.street_address || '—'}
          </p>
          <p className="text-slate-500">
            {item.city}, {item.state} {item.postal_code ? `(${item.postal_code})` : ''}
          </p>
          <p className="text-[11px] text-slate-400 pt-1">
            Proof Type: <strong>{item.address_proof_type || 'Not attached'}</strong>
          </p>
        </div>

        {/* Column 3: Payout Bank */}
        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 space-y-1.5">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1">
            <Landmark className="w-3 h-3" /> Payout Bank Account
          </span>
          <p className="font-bold text-slate-900 dark:text-slate-100">
            {item.account_holder_name}
          </p>
          <p className="font-mono font-bold text-blue-600 dark:text-blue-400">
            {item.account_number} • {item.bank_name}
          </p>
          <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1 pt-0.5">
            <CheckCircle2 className="w-3.5 h-3.5" /> Name Match Confirmed
          </p>
        </div>
      </div>

      {/* Document Evidence Links */}
      <div className="flex flex-wrap items-center gap-2 pt-1">
        {[
          { label: 'ID Front', url: item.id_front_url },
          { label: 'ID Back', url: item.id_back_url },
          { label: 'Live Selfie', url: item.selfie_url },
          { label: 'CAC Certificate', url: item.cac_cert_url },
          { label: 'TIN Certificate', url: item.tin_cert_url },
          { label: 'Other Permit', url: item.other_doc_url },
          { label: 'Address Proof', url: item.address_proof_url },
        ]
          .filter((doc) => Boolean(doc.url))
          .map((doc) => (
            <a
              key={doc.label}
              href={doc.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950/50 text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 border border-slate-200/80 dark:border-slate-700 transition"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>{doc.label}</span>
              <ExternalLink className="w-3 h-3 opacity-60" />
            </a>
          ))}
      </div>

      {/* Feedback Input Drawer (When Requesting Action or Rejecting) */}
      {feedbackMode && (
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-3">
          <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
            {feedbackMode === 'action'
              ? 'Explain what the seller needs to fix or re-upload:'
              : 'Reason for rejecting this application:'}
          </label>
          <textarea
            rows={2}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={
              feedbackMode === 'action'
                ? 'e.g. Please upload a clearer photo of your NIN slip.'
                : 'e.g. Provided CAC registration number does not match the uploaded certificate.'
            }
            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <div className="flex items-center justify-end gap-2">
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => {
                setFeedbackMode(null)
                setNote('')
              }}
              className="text-xs font-bold rounded-xl h-9"
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={loading || !note.trim()}
              onClick={handleSubmitNote}
              className={`text-xs font-bold rounded-xl h-9 px-4 text-white cursor-pointer ${
                feedbackMode === 'action'
                  ? 'bg-amber-600 hover:bg-amber-700'
                  : 'bg-red-600 hover:bg-red-700'
              }`}
            >
              {loading ? 'Saving...' : 'Confirm & Send'}
            </Button>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="text-[11px] text-slate-400">
          {item.action_required_note && (
            <span className="text-amber-600 dark:text-amber-400 font-semibold">
              Note sent: {item.action_required_note}
            </span>
          )}
          {item.rejection_reason && (
            <span className="text-red-600 dark:text-red-400 font-semibold">
              Rejected: {item.rejection_reason}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 ml-auto">
          {item.status !== 'verified' && (
            <Button
              type="button"
              size="sm"
              disabled={loading}
              onClick={handleApprove}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl h-9 px-4 gap-1.5 cursor-pointer"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{loading ? 'Processing...' : 'Approve Seller'}</span>
            </Button>
          )}

          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={loading}
            onClick={() => setFeedbackMode('action')}
            className="border-amber-300 dark:border-amber-800 text-amber-700 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/40 font-bold text-xs rounded-xl h-9 px-3.5 gap-1 cursor-pointer"
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Action Required</span>
          </Button>

          {item.status !== 'rejected' && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={loading}
              onClick={() => setFeedbackMode('reject')}
              className="border-red-300 dark:border-red-900 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 font-bold text-xs rounded-xl h-9 px-3.5 gap-1 cursor-pointer"
            >
              <XCircle className="w-3.5 h-3.5" />
              <span>Reject</span>
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}