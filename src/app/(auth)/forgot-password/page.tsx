'use client'

import { useState } from 'react'
import Link from 'next/link'
import { requestPasswordReset } from '@/app/(auth)/actions'
import { BenchTechLogo } from '@/components/BenchTechLogo'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Loader2, CheckCircle2, AlertCircle, Mail } from 'lucide-react'

export default function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (loading) return

    setLoading(true)
    setError(null)
    setSuccessMessage(null)

    const formData = new FormData(e.currentTarget)
    const res = await requestPasswordReset(formData)

    setLoading(false)

    if (res?.error) {
      setError(res.error)
      return
    }

    if (res?.message) {
      setSuccessMessage(res.message)
    }
  }

  return (
    <div className="min-h-dvh bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col justify-center px-4 py-8">
      <div className="w-full max-w-md mx-auto space-y-6">
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
        </Link>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex items-center gap-3">
            <BenchTechLogo className="w-10 h-10" />
            <div>
              <h1 className="text-xl font-black tracking-tight text-slate-900 dark:text-white">
                Reset Your Password
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Enter your email to receive a password recovery link
              </p>
            </div>
          </div>

          {error && (
            <div className="p-3.5 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-xs font-semibold text-red-700 dark:text-red-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{error}</span>
            </div>
          )}

          {successMessage ? (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 space-y-2 text-xs">
                <div className="flex items-center gap-2 font-bold text-emerald-800 dark:text-emerald-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Recovery Email Sent</span>
                </div>
                <p className="text-emerald-700 dark:text-emerald-300 leading-relaxed">
                  {successMessage}
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 flex items-center gap-2.5 text-[11px] text-slate-500 dark:text-slate-400">
                <Mail className="w-4 h-4 text-blue-600 shrink-0" />
                <span>
                  Sender: <strong className="text-slate-800 dark:text-slate-200">admin@shopbenchtech.com</strong>
                </span>
              </div>

              <Link href="/login" className="block">
                <Button variant="outline" className="w-full h-11 rounded-xl text-xs font-bold">
                  Return to Sign In
                </Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="email"
                  className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5"
                >
                  Registered Email Address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  autoCapitalize="none"
                  autoCorrect="off"
                  required
                  placeholder="you@example.com"
                  className="w-full h-11 px-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-base sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Sending Link...</span>
                  </>
                ) : (
                  <span>Send Recovery Link</span>
                )}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}