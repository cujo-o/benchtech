'use client'

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import {
  resendVerificationEmail,
  verifyEmailOtpAction,
} from '@/app/(auth)/actions'
import { BenchTechLogo } from '@/components/BenchTechLogo'
import { Button } from '@/components/ui/button'
import {
  Mail,
  Loader2,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ArrowLeft,
  ShieldCheck,
} from 'lucide-react'

function VerifyEmailContent() {
  const searchParams = useSearchParams()
  const emailParam = (searchParams.get('email') || '').trim().toLowerCase()
  const roleParam = searchParams.get('role') === 'seller' ? 'seller' : 'buyer'

  const [email, setEmail] = useState(emailParam)
  const [code, setCode] = useState('')
  const [verifying, setVerifying] = useState(false)
  const [resending, setResending] = useState(false)
  const [cooldown, setCooldown] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)

  useEffect(() => {
    if (cooldown <= 0) return
    const timer = setInterval(() => {
      setCooldown((prev) => (prev <= 1 ? 0 : prev - 1))
    }, 1000)
    return () => clearInterval(timer)
  }, [cooldown])

  async function handleVerifyCode(e: React.FormEvent) {
    e.preventDefault()
    if (verifying) return

    setVerifying(true)
    setError(null)
    setInfo(null)

    const res = await verifyEmailOtpAction(email, code)
    setVerifying(false)

    if (res?.error) {
      setError(res.error)
      return
    }

    window.location.href =
      res?.redirectTo || (roleParam === 'seller' ? '/seller/onboarding' : '/feed')
  }

  async function handleResend() {
    if (resending || cooldown > 0 || !email) return

    setResending(true)
    setError(null)
    setInfo(null)

    const res = await resendVerificationEmail(email)
    setResending(false)

    if (res?.error) {
      setError(res.error)
      return
    }

    setCooldown(60)
    setInfo(
      'A fresh confirmation email has been sent from admin@shopbenchtech.com. Check your inbox and spam folder.'
    )
  }

  return (
    <div className="min-h-dvh bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col justify-center px-4 py-8">
      <div className="w-full max-w-md mx-auto space-y-5">
        <Link
          href="/register"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Use a different email
        </Link>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex flex-col items-center text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/70 border border-blue-200/70 dark:border-blue-800/70 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Mail className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-center gap-2">
                <BenchTechLogo className="w-6 h-6" />
                <span className="text-xs font-black uppercase tracking-wider text-blue-600 dark:text-blue-400">
                  Email Verification Required
                </span>
              </div>
              <h1 className="text-xl font-black tracking-tight text-slate-900 dark:text-white">
                Confirm Your Email Address
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                We sent a confirmation link and 6-digit code to{' '}
                <strong className="text-slate-900 dark:text-white">
                  {email || 'your email address'}
                </strong>
                . Confirm your email to activate your account.
              </p>
            </div>
          </div>

          {error && (
            <div className="p-3.5 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-xs font-semibold text-red-700 dark:text-red-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{error}</span>
            </div>
          )}

          {info && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{info}</span>
            </div>
          )}

          {/* 6-Digit Code Verification Form */}
          <form onSubmit={handleVerifyCode} className="space-y-4">
            {!emailParam && (
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full h-11 px-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}

            <div>
              <label
                htmlFor="otpCode"
                className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5"
              >
                Or Enter 6-Digit Code From Your Email
              </label>
              <input
                id="otpCode"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                placeholder="000000"
                className="w-full h-12 px-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-center font-mono text-lg font-black tracking-[0.4em] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <Button
              type="submit"
              disabled={verifying || code.length < 6 || !email}
              className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer gap-2"
            >
              {verifying ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Verifying Code...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Verify &amp; Continue</span>
                </>
              )}
            </Button>
          </form>

          {/* Resend Section */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3 text-center">
            <Button
              type="button"
              variant="outline"
              disabled={resending || cooldown > 0 || !email}
              onClick={handleResend}
              className="w-full h-10 rounded-xl text-xs font-bold border-slate-200 dark:border-slate-700 gap-1.5 cursor-pointer"
            >
              {resending ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <RefreshCw className="w-3.5 h-3.5" />
              )}
              <span>
                {cooldown > 0
                  ? `Resend available in ${cooldown}s`
                  : 'Resend Confirmation Email'}
              </span>
            </Button>

            <p className="text-[11px] text-slate-400 leading-relaxed">
              Didn&apos;t see it? Check Spam or Promotions for an email from{' '}
              <strong className="text-slate-600 dark:text-slate-300">
                admin@shopbenchtech.com
              </strong>
              .
            </p>

            <p className="text-xs text-slate-500 dark:text-slate-400 pt-1">
              Already confirmed?{' '}
              <Link
                href="/login"
                className="font-bold text-blue-600 dark:text-blue-400 hover:underline"
              >
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="min-h-dvh bg-slate-50 dark:bg-slate-950" />}>
      <VerifyEmailContent />
    </Suspense>
  )
}