'use client'

import { useState, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { signIn } from '@/app/(auth)/actions'
import { BenchTechLogo } from '@/components/BenchTechLogo'
import { Button } from '@/components/ui/button'
import { Eye, EyeOff, Loader2, AlertCircle, ArrowLeft } from 'lucide-react'

function LoginForm() {
  const searchParams = useSearchParams()
  const nextUrl = searchParams.get('next') || searchParams.get('redirect') || ''
  const urlError = searchParams.get('error')

  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(urlError)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (loading) return

    setLoading(true)
    setError(null)

    try {
      const formData = new FormData(e.currentTarget)
      const res = await signIn(formData)

      if (res?.error) {
        setError(res.error)
        setLoading(false)
        return
      }

      if (res?.redirectTo) {
        window.location.href = res.redirectTo
      } else {
        window.location.href = '/feed'
      }
    } catch {
      setError('Connection error. Please check your internet and try again.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-dvh bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col justify-center px-4 py-8">
      <div className="w-full max-w-md mx-auto space-y-6">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Home
        </Link>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
          {/* Header */}
          <div className="flex items-center gap-3">
            <BenchTechLogo className="w-10 h-10" />
            <div>
              <h1 className="text-xl font-black tracking-tight text-slate-900 dark:text-white">
                Sign In to BenchTech
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Access your buyer account or seller dashboard
              </p>
            </div>
          </div>

          {error && (
            <div className="p-3.5 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-xs font-semibold text-red-700 dark:text-red-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <input type="hidden" name="next" value={nextUrl} />

            <div>
              <label
                htmlFor="email"
                className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5"
              >
                Email Address
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

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="password"
                  className="block text-xs font-bold text-slate-700 dark:text-slate-300"
                >
                  Password
                </label>
                <Link
                  href="/forgot-password"
                  className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  placeholder="••••••••"
                  className="w-full h-11 pl-3.5 pr-10 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-base sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1"
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Signing In...</span>
                </>
              ) : (
                <span>Sign In</span>
              )}
            </Button>
          </form>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 text-center space-y-2 text-xs">
            <p className="text-slate-500 dark:text-slate-400">
              Don&apos;t have an account?{' '}
              <Link
                href="/register"
                className="font-bold text-blue-600 dark:text-blue-400 hover:underline"
              >
                Create Account
              </Link>
            </p>
            <p className="text-slate-500 dark:text-slate-400">
              Want to sell on BenchTech?{' '}
              <Link
                href="/register?role=seller"
                className="font-bold text-purple-600 dark:text-purple-400 hover:underline"
              >
                Register as a Seller
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-dvh bg-slate-50 dark:bg-slate-950" />}>
      <LoginForm />
    </Suspense>
  )
}