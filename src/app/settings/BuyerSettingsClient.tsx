'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useTheme } from 'next-themes'
import {
  updateBuyerProfileAction,
  changeBuyerPasswordAction,
  sendBuyerPasswordRecoveryEmailAction,
} from './actions'
import { signOut } from '@/app/(auth)/actions'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Sun,
  Moon,
  Monitor,
  User,
  MapPin,
  Lock,
  Mail,
  Store,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Eye,
  EyeOff,
  LogOut,
} from 'lucide-react'

const ABUJA_DISTRICTS = [
  'Wuse 2',
  'Gwarinpa',
  'Maitama',
  'Banex / Wuse',
  'Garki',
  'Utako',
  'Jabi',
  'Asokoro',
  'Lugbe',
  'Kubwa',
  'Lokogoma',
  'Central Area',
]

export function BuyerSettingsClient({
  user,
  profile,
}: {
  user: { id: string; email: string } | null
  profile: any
}) {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // Profile State
  const [profileLoading, setProfileLoading] = useState(false)
  const [profileMsg, setProfileMsg] = useState<{
    type: 'success' | 'error'
    text: string
  } | null>(null)

  // Password State
  const [showPassword, setShowPassword] = useState(false)
  const [pwLoading, setPwLoading] = useState(false)
  const [recoveryLoading, setRecoveryLoading] = useState(false)
  const [guestRecoveryEmail, setGuestRecoveryEmail] = useState(user?.email || '')
  const [pwMsg, setPwMsg] = useState<{
    type: 'success' | 'error'
    text: string
  } | null>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  const isSeller =
    profile?.role === 'seller' ||
    profile?.is_seller === true ||
    Boolean(profile?.business_name)

  async function handleProfileSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setProfileLoading(true)
    setProfileMsg(null)

    const formData = new FormData(e.currentTarget)
    const res = await updateBuyerProfileAction(formData)

    setProfileLoading(false)
    if (res?.error) {
      setProfileMsg({ type: 'error', text: res.error })
    } else if (res?.success) {
      setProfileMsg({ type: 'success', text: res.success })
    }
  }

  async function handlePasswordSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setPwLoading(true)
    setPwMsg(null)

    const formData = new FormData(e.currentTarget)
    const res = await changeBuyerPasswordAction(formData)

    setPwLoading(false)
    if (res?.error) {
      setPwMsg({ type: 'error', text: res.error })
    } else if (res?.success) {
      setPwMsg({ type: 'success', text: res.success })
      ;(e.target as HTMLFormElement).reset()
    }
  }

  async function handleSendRecoveryEmail() {
    setRecoveryLoading(true)
    setPwMsg(null)

    const res = await sendBuyerPasswordRecoveryEmailAction(
      user?.email || guestRecoveryEmail
    )

    setRecoveryLoading(false)
    if (res?.error) {
      setPwMsg({ type: 'error', text: res.error })
    } else if (res?.success) {
      setPwMsg({ type: 'success', text: res.success })
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Page Title */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            Account Settings &amp; Preferences
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Manage display appearance, Abuja delivery details, and password security.
          </p>
        </div>

        {user && (
          <Badge className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-xs font-bold py-1 px-3 rounded-xl w-fit">
            {user.email}
          </Badge>
        )}
      </div>

      {/* 1. APPEARANCE: LIGHT / DARK / SYSTEM MODE */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
        <div>
          <h2 className="text-sm font-black text-slate-900 dark:text-white">
            Display Appearance
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Choose between Light Mode, Dark Mode, or follow your device&apos;s system setting.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {[
            { id: 'light', label: 'Light Mode', icon: Sun },
            { id: 'dark', label: 'Dark Mode', icon: Moon },
            { id: 'system', label: 'System Default', icon: Monitor },
          ].map((option) => {
            const Icon = option.icon
            const isSelected = mounted && theme === option.id
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => setTheme(option.id)}
                className={`p-4 rounded-2xl border text-left transition flex flex-col justify-between gap-3 cursor-pointer ${
                  isSelected
                    ? 'border-2 border-blue-600 bg-blue-50/50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 shadow-2xs'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <Icon className="w-5 h-5" />
                  {isSelected && <CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />}
                </div>
                <span className="text-xs font-bold block">{option.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* 2. PERSONAL & ABUJA DELIVERY DETAILS (For Signed-In Users) */}
      {user ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xs space-y-5">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
            <h2 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
              <User className="w-4 h-4 text-blue-600" />
              Personal &amp; Default Abuja Delivery Info
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Used to pre-fill your contact and delivery location during checkout.
            </p>
          </div>

          {profileMsg && (
            <div
              className={`p-3.5 rounded-2xl border text-xs font-semibold flex items-center gap-2 ${
                profileMsg.type === 'success'
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300'
                  : 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-900 text-red-700 dark:text-red-300'
              }`}
            >
              {profileMsg.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0" />
              )}
              <span>{profileMsg.text}</span>
            </div>
          )}

          <form onSubmit={handleProfileSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Full Name
                </label>
                <input
                  type="text"
                  name="fullName"
                  defaultValue={profile?.full_name || ''}
                  required
                  placeholder="Your full name"
                  className="w-full h-11 px-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-base sm:text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Phone Number (For Delivery Courier OTP)
                </label>
                <input
                  type="tel"
                  name="phone"
                  defaultValue={profile?.phone || ''}
                  placeholder="080 1234 5678"
                  className="w-full h-11 px-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-base sm:text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Default Abuja District
                </label>
                <select
                  name="district"
                  defaultValue={profile?.district || 'Wuse 2'}
                  className="w-full h-11 px-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-base sm:text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {ABUJA_DISTRICTS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Street / Delivery Address
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    name="streetAddress"
                    defaultValue={profile?.street_address || profile?.address || ''}
                    placeholder="House number, street, landmark"
                    className="w-full h-11 pl-9 pr-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-base sm:text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <Button
                type="submit"
                disabled={profileLoading}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl h-10 px-6 cursor-pointer gap-2"
              >
                {profileLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Save Profile Changes</span>
              </Button>
            </div>
          </form>
        </div>
      ) : null}

      {/* 3. PASSWORD CHANGE & EMAIL RECOVERY */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xs space-y-5">
        <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
          <h2 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Lock className="w-4 h-4 text-blue-600" />
            Password &amp; Account Recovery
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Change your password directly or send a password reset link via admin@shopbenchtech.com.
          </p>
        </div>

        {pwMsg && (
          <div
            className={`p-3.5 rounded-2xl border text-xs font-semibold flex items-center gap-2 ${
              pwMsg.type === 'success'
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300'
                : 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-900 text-red-700 dark:text-red-300'
            }`}
          >
            {pwMsg.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            <span>{pwMsg.text}</span>
          </div>
        )}

        {user && (
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="newPassword"
                    minLength={6}
                    required
                    placeholder="Minimum 6 characters"
                    className="w-full h-11 pl-3.5 pr-10 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-base sm:text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Confirm New Password
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  minLength={6}
                  required
                  placeholder="Re-enter new password"
                  className="w-full h-11 px-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-base sm:text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={pwLoading}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl h-10 px-6 cursor-pointer gap-2"
              >
                {pwLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Update Password</span>
              </Button>
            </div>
          </form>
        )}

        {/* Email Recovery Link Box */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <p className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-blue-600" />
              <span>Password Recovery via Email</span>
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Receive a recovery link from <strong>admin@shopbenchtech.com</strong> to reset your password.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {!user && (
              <input
                type="email"
                value={guestRecoveryEmail}
                onChange={(e) => setGuestRecoveryEmail(e.target.value)}
                placeholder="you@example.com"
                className="h-9 px-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs"
              />
            )}
            <Button
              type="button"
              variant="outline"
              disabled={recoveryLoading}
              onClick={handleSendRecoveryEmail}
              className="text-xs font-bold rounded-xl h-9 px-4 border-slate-200 dark:border-slate-700 shrink-0 cursor-pointer gap-1.5"
            >
              {recoveryLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>Send Recovery Link</span>
            </Button>
          </div>
        </div>
      </div>

      {/* 4. SELLER WORKSPACE & SIGN OUT */}
      {user ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs font-black text-slate-900 dark:text-white">
                {isSeller ? 'Seller Account Active' : 'Want to Sell Hardware on BenchTech?'}
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {isSeller
                  ? 'Manage your listings, orders, and payouts in the Seller Hub.'
                  : 'Complete your one-time Individual or Business verification to start listing.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <Link href={isSeller ? '/seller/dashboard' : '/seller/onboarding'}>
              <Button
                variant="outline"
                className="text-xs font-bold rounded-xl h-9 px-4 border-slate-200 dark:border-slate-700 cursor-pointer"
              >
                {isSeller ? 'Open Seller Hub' : 'Become a Seller'}
              </Button>
            </Link>

            <form action={signOut}>
              <Button
                type="submit"
                variant="ghost"
                className="text-xs font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl h-9 px-3 gap-1.5 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </Button>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  )
}