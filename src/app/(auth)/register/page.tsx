'use client'

import { useState, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
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
  CheckCircle2,
} from 'lucide-react'

function RegisterForm() {
  const searchParams = useSearchParams()
  const initialRole =
    searchParams.get('role') === 'seller' ? 'seller' : 'buyer'

  const [role, setRole] = useState<'buyer' | 'seller'>(initialRole)
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleGoogleSignUp() {
    if (googleLoading || loading) return
    setGoogleLoading(true)
    setError(null)

    try {
      // Save role in a cookie so redirectTo remains a clean URL
      document.cookie = `bt_oauth_role=${role}; path=/; max-age=600; SameSite=Lax`

      const supabase = createClient()
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'select_account',
          },
        },
      })

      if (oauthError) {
        setError(oauthError.message)
        setGoogleLoading(false)
      }
    } catch {
      setError('Could not connect to Google Sign-Up. Please try again.')
      setGoogleLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (loading || googleLoading) return

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

      window.location.href =
        res?.redirectTo || (role === 'seller' ? '/seller/onboarding' : '/feed')
    } catch {
      setError('Connection error. Please check your internet and try again.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-dvh bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col justify-center px-4 py-6 sm:py-10">
      <div className="w-full max-w-4xl mx-auto space-y-4">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Home
        </Link>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-xs grid grid-cols-1 lg:grid-cols-12">
          {/* Left / Top Hardware Showcase */}
          <div className="lg:col-span-5 relative bg-slate-900 text-white p-5 sm:p-7 flex flex-col justify-between min-h-[160px] sm:min-h-[200px] lg:min-h-full overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://images.unsplash.com/photo-1526738549149-8e07eca6c147?auto=format&fit=crop&w=1000&q=80"
              alt="Smartphones Laptops and Hardware"
              className="absolute inset-0 w-full h-full object-cover opacity-35"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/65 to-transparent" />

            <div className="relative z-10 flex items-center gap-2.5">
              <BenchTechLogo className="w-9 h-9" />
              <div>
                <span className="font-black text-base tracking-tight text-white block leading-none">
                  BenchTech
                </span>
                <span className="text-[10px] text-slate-300 font-semibold block mt-0.5">
                  Buy Smart. Sell Easy.
                </span>
              </div>
            </div>

            <div className="relative z-10 space-y-3 pt-6">
              <h2 className="text-lg sm:text-xl font-black leading-snug text-white">
                {role === 'seller'
                  ? 'One-Time Seller Verification.'
                  : 'Shop Inspected Electronics in Abuja.'}
              </h2>
              <div className="hidden sm:flex flex-col gap-2 text-xs text-slate-300 pt-1">
                {role === 'seller' ? (
                  <>
                    <span className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0" />
                      Individual Seller or Registered Business
                    </span>
                    <span className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0" />
                      Verify once, list hardware anytime
                    </span>
                    <span className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0" />
                      Direct Nigerian bank settlements
                    </span>
                  </>
                ) : (
                  <>
                    <span className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0" />
                      Compare phone &amp; laptop specifications
                    </span>
                    <span className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0" />
                      Inspect hardware in person upon delivery
                    </span>
                    <span className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0" />
                      Verified Abuja stores &amp; merchants
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Right: Registration Form */}
          <div className="lg:col-span-7 p-5 sm:p-8 flex flex-col justify-center space-y-5">
            <div>
              <h1 className="text-xl font-black tracking-tight text-slate-900 dark:text-white">
                Create Your Account
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {role === 'seller'
                  ? 'Step 1: Create your login to begin one-time seller verification'
                  : 'Join BenchTech to buy and inspect electronics in Abuja'}
              </p>
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

            {/* Google Sign-Up Button */}
            <button
              type="button"
              onClick={handleGoogleSignUp}
              disabled={googleLoading || loading}
              className="w-full h-11 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/80 text-slate-800 dark:text-slate-100 font-bold text-xs flex items-center justify-center gap-2.5 transition cursor-pointer shadow-2xs disabled:opacity-60"
            >
              {googleLoading ? (
                <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
              ) : (
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
              )}
              <span>
                {googleLoading
                  ? 'Connecting to Google...'
                  : role === 'seller'
                  ? 'Continue with Google as Seller'
                  : 'Continue with Google'}
              </span>
            </button>

            <div className="relative flex items-center justify-center">
              <div className="border-t border-slate-200 dark:border-slate-800 w-full" />
              <span className="bg-white dark:bg-slate-900 px-3 text-[11px] font-bold uppercase text-slate-400">
                or
              </span>
              <div className="border-t border-slate-200 dark:border-slate-800 w-full" />
            </div>

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
                disabled={loading || googleLoading}
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