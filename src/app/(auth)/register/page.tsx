'use client'

import { useState, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { signUp } from '@/app/(auth)/actions'
import { BenchTechLogo } from '@/components/BenchTechLogo'
import { Button } from '@/components/ui/button'
import {
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  ShoppingBag,
  Store,
  ArrowLeft,
} from 'lucide-react'

function RegisterForm() {
  const searchParams = useSearchParams()
  const initialRole =
    searchParams.get('role') === 'seller' ? 'seller' : 'buyer'

  const [role, setRole] = useState<'buyer' | 'seller'>(initialRole)
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (loading) return

    setLoading(true)
    setError(null)

    try {
      const formData = new FormData(e.currentTarget)
      formData.set('role', role)

      const res = await signUp(formData)

      if (res?.error) {
        setError(res.error)
        setLoading(false)
        return
      }

      if (res?.redirectTo) {
        window.location.href = res.redirectTo
      } else {
        window.location.href = role === 'seller' ? '/seller/onboarding' : '/feed'
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
                Create Your Account
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {role === 'seller'
                  ? 'Step 1: Create your login to begin one-time seller verification'
                  : 'Join BenchTech to buy and inspect electronics in Abuja'}
              </p>
            </div>
          </div>

          {/* Account Type Toggle */}
          <div className="grid grid-cols-2 gap-2.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl">
            <button
              type="button"
              onClick={() => setRole('buyer')}
              className={`py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer ${
                role === 'buyer'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Buyer</span>
            </button>

            <button
              type="button"
              onClick={() => setRole('seller')}
              className={`py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer ${
                role === 'seller'
                  ? 'bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400 shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              <Store className="w-3.5 h-3.5" />
              <span>Seller</span>
            </button>
          </div>

          {error && (
            <div className="p-3.5 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-xs font-semibold text-red-700 dark:text-red-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="fullName"
                className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5"
              >
                Full Legal Name
              </label>
              <input
                id="fullName"
                name="fullName"
                type="text"
                autoComplete="name"
                required
                placeholder="John Adewale"
                className="w-full h-11 px-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-base sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

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
              <label
                htmlFor="phone"
                className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5"
              >
                Phone Number
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                required
                placeholder="080 1234 5678"
                className="w-full h-11 px-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-base sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  minLength={6}
                  required
                  placeholder="Minimum 6 characters"
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
              className={`w-full h-11 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer gap-2 ${
                role === 'seller'
                  ? 'bg-purple-600 hover:bg-purple-700'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Creating Account...</span>
                </>
              ) : role === 'seller' ? (
                <span>Continue to Seller Verification</span>
              ) : (
                <span>Create Buyer Account</span>
              )}
            </Button>
          </form>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 text-center text-xs">
            <p className="text-slate-500 dark:text-slate-400">
              Already have an account?{' '}
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

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-dvh bg-slate-50 dark:bg-slate-950" />}>
      <RegisterForm />
    </Suspense>
  )
}