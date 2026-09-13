'use client'

import { useState } from 'react'
import { Mail, RefreshCw, CheckCircle } from 'lucide-react'
import { resendVerificationEmail } from '@/app/(auth)/actions'

interface EmailVerificationBannerProps {
  email: string
  isEmailConfirmed: boolean
}

export function EmailVerificationBanner({ email, isEmailConfirmed }: EmailVerificationBannerProps) {
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  if (isEmailConfirmed) return null

  const handleResend = async () => {
    setLoading(true)
    await resendVerificationEmail(email)
    setSent(true)
    setLoading(false)
  }

  return (
    <div className="bg-amber-50 border-b border-amber-200 px-4 py-2.5 text-xs text-amber-800 flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        <Mail className="w-4 h-4 text-amber-600 shrink-0" />
        <span>
          Please verify your email (<strong>{email}</strong>) to access full vendor features and prevent account restriction.
        </span>
      </div>

      <button
        onClick={handleResend}
        disabled={loading || sent}
        className="inline-flex items-center gap-1.5 font-bold text-blue-700 hover:text-blue-900 bg-white border border-amber-200 px-2.5 py-1 rounded-lg transition text-[11px]"
      >
        {sent ? (
          <>
            <CheckCircle className="w-3.5 h-3.5 text-emerald-600" /> Resent!
          </>
        ) : (
          <>
            <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Sending...' : 'Resend Verification Link'}
          </>
        )}
      </button>
    </div>
  )
}