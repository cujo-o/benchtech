'use client'

import { useState, useEffect } from 'react'
import imageCompression from 'browser-image-compression'
import { useTheme } from 'next-themes'
import { createClient } from '@/lib/supabase/client'
import { updateStoreProfile } from './actions'
import {
  changeBuyerPasswordAction,
  sendBuyerPasswordRecoveryEmailAction,
} from '@/app/settings/actions'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  ShieldCheck,
  Store,
  MapPin,
  Phone,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Camera,
  Image as ImageIcon,
  Sun,
  Moon,
  Monitor,
  Lock,
  Mail,
  Eye,
  EyeOff,
} from 'lucide-react'

const ABUJA_DISTRICTS = [
  'Banex Plaza, Wuse 2',
  'Wuse 2',
  'Emab Plaza, Wuse 2',
  'Gwarinpa',
  'Maitama',
  'Garki',
  'Utako',
  'Jabi',
  'Central Area',
  'Kubwa',
  'Lugbe',
]

export default function StoreSettingsPage() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [uploadingBanner, setUploadingBanner] = useState(false)
  const [message, setMessage] = useState<{
    type: 'success' | 'error'
    text: string
  } | null>(null)

  const [profile, setProfile] = useState<any>(null)
  const [userEmail, setUserEmail] = useState<string>('')
  const [avatarPreview, setAvatarPreview] = useState<string>('')
  const [bannerPreview, setBannerPreview] = useState<string>('')

  // Password state
  const [showPassword, setShowPassword] = useState(false)
  const [pwLoading, setPwLoading] = useState(false)
  const [recoveryLoading, setRecoveryLoading] = useState(false)
  const [pwMessage, setPwMessage] = useState<{
    type: 'success' | 'error'
    text: string
  } | null>(null)

  const supabase = createClient()

  useEffect(() => {
    setMounted(true)
    async function loadProfile() {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user) {
        setUserEmail(user.email || '')
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle()
        setProfile(data)
        if (data?.avatar_url) setAvatarPreview(data.avatar_url)
        if (data?.store_banner_url) setBannerPreview(data.store_banner_url)
      }
      setFetching(false)
    }
    loadProfile()
  }, [supabase])

  async function uploadImageToStorage(
    file: File,
    type: 'avatar' | 'banner'
  ): Promise<string> {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const compressed = await imageCompression(file, {
      maxSizeMB: type === 'banner' ? 0.6 : 0.25,
      maxWidthOrHeight: type === 'banner' ? 1600 : 600,
      useWebWorker: true,
    })

    const ext = file.name.split('.').pop() || 'jpg'
    const filePath = `stores/${user.id}/${type}-${Date.now()}.${ext}`

    // Try 'products' bucket first, fallback to 'product-media'
    let bucketName = 'products'
    const { error: firstErr } = await supabase.storage
      .from(bucketName)
      .upload(filePath, compressed, { upsert: true })

    if (firstErr) {
      bucketName = 'product-media'
      const { error: secondErr } = await supabase.storage
        .from(bucketName)
        .upload(filePath, compressed, { upsert: true })
      if (secondErr) throw secondErr
    }

    const { data } = supabase.storage.from(bucketName).getPublicUrl(filePath)
    return data.publicUrl
  }

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingAvatar(true)
    setMessage(null)
    try {
      const url = await uploadImageToStorage(file, 'avatar')
      setAvatarPreview(url)
      setMessage({
        type: 'success',
        text: 'Logo uploaded. Click "Save Store Settings" below to apply.',
      })
    } catch (err: any) {
      setMessage({
        type: 'error',
        text: err?.message || 'Failed to upload logo.',
      })
    } finally {
      setUploadingAvatar(false)
    }
  }

  async function handleBannerChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingBanner(true)
    setMessage(null)
    try {
      const url = await uploadImageToStorage(file, 'banner')
      setBannerPreview(url)
      setMessage({
        type: 'success',
        text: 'Banner uploaded. Click "Save Store Settings" below to apply.',
      })
    } catch (err: any) {
      setMessage({
        type: 'error',
        text: err?.message || 'Failed to upload banner.',
      })
    } finally {
      setUploadingBanner(false)
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    const formData = new FormData(e.currentTarget)
    formData.set('avatarUrl', avatarPreview)
    formData.set('storeBannerUrl', bannerPreview)

    const res = await updateStoreProfile(formData)

    setLoading(false)
    if (res?.error) {
      setMessage({ type: 'error', text: res.error })
    } else {
      setMessage({
        type: 'success',
        text: 'Store settings and policies updated.',
      })
    }
  }

  async function handlePasswordUpdate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setPwLoading(true)
    setPwMessage(null)

    const formData = new FormData(e.currentTarget)
    const res = await changeBuyerPasswordAction(formData)

    setPwLoading(false)
    if (res?.error) {
      setPwMessage({ type: 'error', text: res.error })
    } else if (res?.success) {
      setPwMessage({ type: 'success', text: res.success })
      ;(e.target as HTMLFormElement).reset()
    }
  }

  async function handleRecoveryEmail() {
    setRecoveryLoading(true)
    setPwMessage(null)
    const res = await sendBuyerPasswordRecoveryEmailAction(userEmail)
    setRecoveryLoading(false)
    if (res?.error) {
      setPwMessage({ type: 'error', text: res.error })
    } else if (res?.success) {
      setPwMessage({ type: 'success', text: res.success })
    }
  }

  if (fetching) {
    return (
      <div className="flex items-center justify-center p-16 text-slate-400 text-xs">
        <Loader2 className="w-5 h-5 animate-spin mr-2 text-blue-600" /> Loading store settings...
      </div>
    )
  }

  const isPro =
    profile?.seller_plan === 'pro' ||
    profile?.subscription_tier === 'pro' ||
    profile?.subscription_plan === 'professional'

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 overflow-hidden flex items-center justify-center shrink-0">
            {avatarPreview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatarPreview}
                alt="Store Avatar"
                className="w-full h-full object-cover"
              />
            ) : (
              <Store className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            )}
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {profile?.business_name || 'Store Settings'}
            </h1>
            <div className="flex flex-wrap items-center gap-2 mt-1">
              <Badge
                className={`text-[10px] font-bold capitalize ${
                  profile?.tech_trust_status === 'verified'
                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                    : 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                }`}
              >
                <ShieldCheck className="w-3 h-3 mr-1" />
                {profile?.tech_trust_status || 'Unverified'}
              </Badge>
              <Badge variant="outline" className="text-[10px] font-bold uppercase">
                Plan: {isPro ? 'Pro Seller' : 'Free'}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* 1. APPEARANCE (LIGHT / DARK / SYSTEM MODE) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
        <div>
          <h2 className="text-sm font-black text-slate-900 dark:text-white">
            Workspace Appearance
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Switch between Light Mode, Dark Mode, or follow your device&apos;s system theme.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {[
            { id: 'light', label: 'Light Mode', icon: Sun },
            { id: 'dark', label: 'Dark Mode', icon: Moon },
            { id: 'system', label: 'System Default', icon: Monitor },
          ].map((opt) => {
            const Icon = opt.icon
            const active = mounted && theme === opt.id
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => setTheme(opt.id)}
                className={`p-3.5 sm:p-4 rounded-2xl border text-left transition flex flex-col justify-between gap-2.5 cursor-pointer ${
                  active
                    ? 'border-2 border-blue-600 bg-blue-50/50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                  {active && <CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />}
                </div>
                <span className="text-xs font-bold block">{opt.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* 2. STORE IDENTITY, LOGO, BANNER & LOCATION FORM */}
      <form
        onSubmit={handleSubmit}
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-7 shadow-xs space-y-6"
      >
        <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
          <h2 className="text-sm font-black text-slate-900 dark:text-white">
            Store Identity, Branding &amp; Location
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Upload your store logo and cover banner, and keep your Abuja store location up to date.
          </p>
        </div>

        {message && (
          <div
            className={`p-3.5 rounded-2xl border text-xs font-semibold flex items-center gap-2 ${
              message.type === 'success'
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300'
                : 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-900 text-red-700 dark:text-red-300'
            }`}
          >
            {message.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            <span>{message.text}</span>
          </div>
        )}

        {/* Logo & Banner Upload Row */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
          {/* Avatar Upload */}
          <div className="md:col-span-5 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 overflow-hidden flex items-center justify-center shrink-0">
              {avatarPreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={avatarPreview}
                  alt="Avatar preview"
                  className="w-full h-full object-cover"
                />
              ) : (
                <Store className="w-6 h-6 text-slate-400" />
              )}
            </div>
            <div className="space-y-1.5">
              <span className="text-xs font-bold text-slate-900 dark:text-white block">
                Store Logo
              </span>
              <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 hover:border-blue-500 cursor-pointer transition">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
                {uploadingAvatar ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
                ) : (
                  <Camera className="w-3.5 h-3.5 text-blue-600" />
                )}
                <span>{uploadingAvatar ? 'Uploading...' : 'Upload Logo'}</span>
              </label>
            </div>
          </div>

          {/* Banner Upload */}
          <div className="md:col-span-7 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-24 h-16 rounded-xl bg-slate-900 border border-slate-700 overflow-hidden flex items-center justify-center shrink-0">
                {bannerPreview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={bannerPreview}
                    alt="Banner preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <ImageIcon className="w-5 h-5 text-slate-400" />
                )}
              </div>
              <div className="min-w-0">
                <span className="text-xs font-bold text-slate-900 dark:text-white block">
                  Storefront Cover Banner
                </span>
                <span className="text-[11px] text-slate-400 block truncate">
                  Displayed at the top of your store page
                </span>
              </div>
            </div>

            <label className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold cursor-pointer shrink-0 transition">
              <input
                type="file"
                accept="image/*"
                onChange={handleBannerChange}
                className="hidden"
              />
              {uploadingBanner ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <ImageIcon className="w-3.5 h-3.5" />
              )}
              <span>{uploadingBanner ? 'Uploading...' : 'Upload Banner'}</span>
            </label>
          </div>
        </div>

        {/* Store Fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Store / Business Name
            </label>
            <input
              name="businessName"
              defaultValue={profile?.business_name || ''}
              required
              placeholder="e.g. Cujo Hub Technologies"
              className="w-full h-11 px-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-base sm:text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Contact Phone (For Dispatch &amp; Verification)
            </label>
            <div className="relative">
              <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                name="phone"
                defaultValue={profile?.phone || ''}
                required
                placeholder="080 1234 5678"
                className="w-full h-11 pl-9 pr-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-base sm:text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Abuja District / Hub
            </label>
            <select
              name="district"
              defaultValue={profile?.district || 'Banex Plaza, Wuse 2'}
              className="w-full h-11 px-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-base sm:text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              Shop / Office Address (Abuja)
            </label>
            <div className="relative">
              <MapPin className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                name="address"
                defaultValue={profile?.address || profile?.street_address || ''}
                placeholder="e.g. Suite B14, New Banex Plaza, Wuse 2"
                className="w-full h-11 pl-9 pr-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-base sm:text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
            Store Bio / Overview
          </label>
          <textarea
            name="bio"
            rows={3}
            defaultValue={profile?.bio || profile?.description || ''}
            placeholder="Describe your hardware specialties, grading standards, and store warranty..."
            className="w-full p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-base sm:text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Abuja Delivery Policy
            </label>
            <input
              name="deliveryPolicy"
              defaultValue={
                profile?.delivery_policy ||
                'Same-day Abuja courier dispatch or plaza pickup.'
              }
              className="w-full h-11 px-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-base sm:text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Inspection &amp; Warranty Policy
            </label>
            <input
              name="pickupPolicy"
              defaultValue={
                profile?.pickup_policy ||
                '7-day buyer inspection protection on every delivered order.'
              }
              className="w-full h-11 px-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-base sm:text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <Button
            type="submit"
            disabled={loading || uploadingAvatar || uploadingBanner}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl h-11 px-8 cursor-pointer gap-2"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            <span>Save Store Settings</span>
          </Button>
        </div>
      </form>

      {/* 3. PASSWORD & SECURITY */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-7 shadow-xs space-y-5">
        <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
          <h2 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Lock className="w-4 h-4 text-blue-600" />
            Password &amp; Account Recovery
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Change your password directly or request a recovery email from admin@shopbenchtech.com.
          </p>
        </div>

        {pwMessage && (
          <div
            className={`p-3.5 rounded-2xl border text-xs font-semibold flex items-center gap-2 ${
              pwMessage.type === 'success'
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300'
                : 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-900 text-red-700 dark:text-red-300'
            }`}
          >
            {pwMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            <span>{pwMessage.text}</span>
          </div>
        )}

        <form onSubmit={handlePasswordUpdate} className="space-y-4">
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
                  className="w-full h-11 pl-3.5 pr-10 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-base sm:text-xs font-medium text-slate-900 dark:text-white"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
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
                className="w-full h-11 px-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-base sm:text-xs font-medium text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <button
              type="button"
              disabled={recoveryLoading}
              onClick={handleRecoveryEmail}
              className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1.5 cursor-pointer"
            >
              <Mail className="w-3.5 h-3.5" />
              <span>
                {recoveryLoading
                  ? 'Sending recovery link...'
                  : 'Send password reset link to my email'}
              </span>
            </button>

            <Button
              type="submit"
              disabled={pwLoading}
              className="bg-slate-900 hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-700 text-white font-bold text-xs rounded-xl h-10 px-6 cursor-pointer"
            >
              {pwLoading ? 'Updating...' : 'Update Password'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}