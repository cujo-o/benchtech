'use client'

import { useState } from 'react'
import Link from 'next/link'
import imageCompression from 'browser-image-compression'
import { createClient } from '@/lib/supabase/client'
import { updateStoreProfile } from '@/app/seller/settings/actions'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  ShieldCheck,
  Crown,
  MapPin,
  Truck,
  RotateCcw,
  Camera,
  Image as ImageIcon,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Package,
} from 'lucide-react'

const PRESET_BANNERS = [
  {
    label: 'Workstation Dark',
    url: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=1400&q=80',
  },
  {
    label: 'Hardware Desk',
    url: 'https://images.unsplash.com/photo-1526738549149-8e07eca6c147?auto=format&fit=crop&w=1400&q=80',
  },
  {
    label: 'Gaming & Consoles',
    url: 'https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?auto=format&fit=crop&w=1400&q=80',
  },
]

function resolveFirstImage(images: any): string | null {
  if (!images) return null
  if (Array.isArray(images)) return images[0] || null
  if (typeof images === 'string') {
    try {
      const parsed = JSON.parse(images)
      if (Array.isArray(parsed)) return parsed[0] || null
    } catch {
      return images.startsWith('http') ? images : null
    }
  }
  return null
}

export function StorefrontEditorClient({
  profile,
  products,
}: {
  profile: any
  products: any[]
}) {
  const [bannerUrl, setBannerUrl] = useState<string>(
    profile?.store_banner_url || PRESET_BANNERS[0].url
  )
  const [avatarUrl, setAvatarUrl] = useState<string>(profile?.avatar_url || '')
  const [businessName, setBusinessName] = useState<string>(
    profile?.business_name || profile?.full_name || 'My Store'
  )
  const [district, setDistrict] = useState<string>(
    profile?.district || 'Banex Plaza, Wuse 2'
  )
  const [bio, setBio] = useState<string>(
    profile?.bio ||
      profile?.description ||
      'Verified electronics merchant supplying inspected smartphones, laptops, and hardware in Abuja.'
  )
  const [deliveryPolicy, setDeliveryPolicy] = useState<string>(
    profile?.delivery_policy ||
      'Same-day Abuja courier delivery or walk-in plaza pickup.'
  )
  const [pickupPolicy, setPickupPolicy] = useState<string>(
    profile?.pickup_policy ||
      'Physical inspection upon delivery with 7-day buyer protection.'
  )

  const [uploadingBanner, setUploadingBanner] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [saving, setSaving] = useState(false)
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error'
    text: string
  } | null>(null)

  const supabase = createClient()
  const isPro =
    profile?.seller_plan === 'pro' ||
    profile?.subscription_tier === 'pro' ||
    profile?.subscription_plan === 'professional'
  const isVerified = profile?.tech_trust_status === 'verified'

  async function uploadAsset(file: File, kind: 'banner' | 'avatar') {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) throw new Error('Please sign in first.')

    const compressed = await imageCompression(file, {
      maxSizeMB: kind === 'banner' ? 0.6 : 0.25,
      maxWidthOrHeight: kind === 'banner' ? 1600 : 600,
      useWebWorker: true,
    })

    const ext = file.name.split('.').pop() || 'jpg'
    const path = `stores/${user.id}/${kind}-${Date.now()}.${ext}`

    let bucket = 'products'
    const { error: err1 } = await supabase.storage
      .from(bucket)
      .upload(path, compressed, { upsert: true })

    if (err1) {
      bucket = 'product-media'
      const { error: err2 } = await supabase.storage
        .from(bucket)
        .upload(path, compressed, { upsert: true })
      if (err2) throw err2
    }

    const { data } = supabase.storage.from(bucket).getPublicUrl(path)
    return data.publicUrl
  }

  async function handleBannerFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingBanner(true)
    setFeedback(null)
    try {
      const uploadedUrl = await uploadAsset(file, 'banner')
      setBannerUrl(uploadedUrl)
      setFeedback({
        type: 'success',
        text: 'Banner uploaded! Click "Save Storefront" below to publish.',
      })
    } catch (err: any) {
      setFeedback({
        type: 'error',
        text: err?.message || 'Banner upload failed.',
      })
    } finally {
      setUploadingBanner(false)
    }
  }

  async function handleAvatarFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingAvatar(true)
    setFeedback(null)
    try {
      const uploadedUrl = await uploadAsset(file, 'avatar')
      setAvatarUrl(uploadedUrl)
      setFeedback({
        type: 'success',
        text: 'Logo uploaded! Click "Save Storefront" below to publish.',
      })
    } catch (err: any) {
      setFeedback({
        type: 'error',
        text: err?.message || 'Logo upload failed.',
      })
    } finally {
      setUploadingAvatar(false)
    }
  }

  async function handleSaveStorefront(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSaving(true)
    setFeedback(null)

    const formData = new FormData()
    formData.set('businessName', businessName)
    formData.set('phone', profile?.phone || '')
    formData.set('district', district)
    formData.set('address', profile?.address || profile?.street_address || '')
    formData.set('bio', bio)
    formData.set('deliveryPolicy', deliveryPolicy)
    formData.set('pickupPolicy', pickupPolicy)
    formData.set('avatarUrl', avatarUrl)
    formData.set('storeBannerUrl', bannerUrl)

    const res = await updateStoreProfile(formData)
    setSaving(false)

    if (res?.error) {
      setFeedback({ type: 'error', text: res.error })
    } else {
      setFeedback({
        type: 'success',
        text: 'Storefront branding and policies saved.',
      })
    }
  }

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white">
              My Storefront &amp; Branding
            </h1>
            <Badge className="bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-[10px] font-bold">
              Live Preview
            </Badge>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Upload your custom store banner and logo, and preview how buyers see your store.
          </p>
        </div>

        <Link href={`/sellers/${profile?.id}`} target="_blank">
          <Button
            size="sm"
            variant="outline"
            className="text-xs font-bold rounded-xl h-9 px-3.5 border-slate-200 dark:border-slate-700 gap-1.5 cursor-pointer"
          >
            <span>Public Store Link</span>
            <ExternalLink className="w-3.5 h-3.5 text-blue-600" />
          </Button>
        </Link>
      </div>

      {/* LIVE STOREFRONT CARD (Clean non-overlapping layout) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-xs overflow-hidden">
        {/* Banner Cover */}
        <div className="relative h-44 sm:h-60 w-full bg-slate-900 overflow-hidden">
          {bannerUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={bannerUrl}
              alt="Store Banner"
              className="w-full h-full object-cover opacity-80"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/30 to-transparent" />

          {/* Direct Upload Banner Button Overlay */}
          <div className="absolute top-3.5 right-3.5 flex items-center gap-2">
            <label className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900/85 hover:bg-slate-900 text-white text-xs font-bold border border-white/15 backdrop-blur-md cursor-pointer transition shadow-sm">
              <input
                type="file"
                accept="image/*"
                onChange={handleBannerFile}
                className="hidden"
              />
              {uploadingBanner ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-400" />
              ) : (
                <ImageIcon className="w-3.5 h-3.5 text-blue-400" />
              )}
              <span>
                {uploadingBanner ? 'Uploading Banner...' : 'Upload Banner Image'}
              </span>
            </label>
          </div>
        </div>

        {/* Store Profile Details Row (No text overlap) */}
        <div className="p-5 sm:p-7 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-4">
              {/* Avatar with upload button */}
              <div className="relative -mt-12 sm:-mt-14 shrink-0">
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-white dark:bg-slate-800 border-4 border-white dark:border-slate-900 shadow-md overflow-hidden flex items-center justify-center text-2xl font-black text-blue-600">
                  {avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={avatarUrl}
                      alt={businessName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    businessName[0]?.toUpperCase() || 'S'
                  )}
                </div>
                <label
                  title="Change Store Logo"
                  className="absolute -bottom-1 -right-1 w-8 h-8 rounded-xl bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center shadow-md cursor-pointer border-2 border-white dark:border-slate-900 transition"
                >
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarFile}
                    className="hidden"
                  />
                  {uploadingAvatar ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Camera className="w-3.5 h-3.5" />
                  )}
                </label>
              </div>

              <div className="space-y-1.5 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white truncate">
                    {businessName}
                  </h2>
                  {isVerified && (
                    <Badge className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-[10px] font-bold">
                      <ShieldCheck className="w-3 h-3 mr-1" /> Verified Seller
                    </Badge>
                  )}
                  {isPro && (
                    <Badge className="bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300 border border-purple-200 dark:border-purple-800 text-[10px] font-bold">
                      <Crown className="w-3 h-3 mr-1 text-amber-500 fill-amber-400" /> Pro Store
                    </Badge>
                  )}
                </div>

                <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 font-medium">
                  <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  <span>{district}, Abuja</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className="text-xs font-bold px-3 py-1 rounded-xl border-slate-200 dark:border-slate-800"
              >
                {products.length} Active {products.length === 1 ? 'Listing' : 'Listings'}
              </Badge>
            </div>
          </div>

          <p className="text-xs text-slate-600 dark:text-slate-300 max-w-3xl leading-relaxed">
            {bio}
          </p>

          {/* Store Policies Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs">
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex items-start gap-2.5">
              <Truck className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-slate-900 dark:text-white block">
                  Delivery &amp; Pickup
                </span>
                <span className="text-slate-500 dark:text-slate-400">
                  {deliveryPolicy}
                </span>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex items-start gap-2.5">
              <RotateCcw className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-slate-900 dark:text-white block">
                  Inspection &amp; Protection
                </span>
                <span className="text-slate-500 dark:text-slate-400">
                  {pickupPolicy}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CUSTOMIZE STOREFRONT FORM */}
      <form
        onSubmit={handleSaveStorefront}
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-7 shadow-xs space-y-5"
      >
        <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
          <h3 className="text-sm font-black text-slate-900 dark:text-white">
            Customize Storefront Details &amp; Banner
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Upload your own banner photo above, pick a preset below, or edit your store details.
          </p>
        </div>

        {feedback && (
          <div
            className={`p-3.5 rounded-2xl border text-xs font-semibold flex items-center gap-2 ${
              feedback.type === 'success'
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300'
                : 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-900 text-red-700 dark:text-red-300'
            }`}
          >
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            <span>{feedback.text}</span>
          </div>
        )}

        {/* Quick Hardware Banner Presets */}
        <div className="space-y-2">
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
            Quick Hardware Banner Presets (Or Upload Your Own Above)
          </label>
          <div className="grid grid-cols-3 gap-3">
            {PRESET_BANNERS.map((preset) => (
              <button
                key={preset.label}
                type="button"
                onClick={() => setBannerUrl(preset.url)}
                className={`relative h-16 rounded-2xl overflow-hidden border-2 text-left p-2.5 flex items-end transition cursor-pointer ${
                  bannerUrl === preset.url
                    ? 'border-blue-600 ring-2 ring-blue-500/20'
                    : 'border-slate-200 dark:border-slate-800 opacity-75 hover:opacity-100'
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={preset.url}
                  alt={preset.label}
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-slate-950/50" />
                <span className="relative z-10 text-[10px] font-bold text-white">
                  {preset.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Store Name
            </label>
            <input
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              required
              className="w-full h-11 px-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-base sm:text-xs font-medium text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Abuja Location / District
            </label>
            <input
              value={district}
              onChange={(e) => setDistrict(e.target.value)}
              required
              className="w-full h-11 px-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-base sm:text-xs font-medium text-slate-900 dark:text-white"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
            Store Description
          </label>
          <textarea
            rows={2}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            className="w-full p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-base sm:text-xs font-medium text-slate-900 dark:text-white"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Delivery Policy
            </label>
            <input
              value={deliveryPolicy}
              onChange={(e) => setDeliveryPolicy(e.target.value)}
              className="w-full h-11 px-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-base sm:text-xs font-medium text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Inspection Policy
            </label>
            <input
              value={pickupPolicy}
              onChange={(e) => setPickupPolicy(e.target.value)}
              className="w-full h-11 px-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-base sm:text-xs font-medium text-slate-900 dark:text-white"
            />
          </div>
        </div>

        <div className="flex justify-end pt-1">
          <Button
            type="submit"
            disabled={saving || uploadingBanner || uploadingAvatar}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl h-10 px-6 cursor-pointer gap-2"
          >
            {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            <span>Save Storefront</span>
          </Button>
        </div>
      </form>

      {/* Storefront Catalogue Preview */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-black text-slate-900 dark:text-white">
            Storefront Active Listings ({products.length})
          </h3>
          <Link href="/seller/listings/new">
            <Button
              size="sm"
              variant="outline"
              className="text-xs font-bold rounded-xl h-9 border-slate-200 dark:border-slate-700"
            >
              + Add Product
            </Button>
          </Link>
        </div>

        {products.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5">
            {products.map((item) => {
              const firstImg = resolveFirstImage(item.images)
              return (
                <Link
                  key={item.id}
                  href={`/seller/listings/${item.id}/edit`}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-blue-500/60 rounded-2xl overflow-hidden flex flex-col justify-between transition shadow-2xs"
                >
                  <div className="aspect-[4/3] bg-slate-100/80 dark:bg-slate-800/50 p-3 flex items-center justify-center relative">
                    <Badge className="absolute top-2 left-2 bg-slate-900/80 text-white border-none text-[9px] capitalize">
                      {item.condition?.replace(/_/g, ' ') || 'Used'}
                    </Badge>
                    {firstImg ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={firstImg}
                        alt={item.title}
                        className="max-h-full max-w-full object-contain"
                      />
                    ) : (
                      <Package className="w-6 h-6 text-slate-400" />
                    )}
                  </div>
                  <div className="p-3 space-y-1">
                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {item.title}
                    </p>
                    <p className="text-xs font-black text-blue-600 dark:text-blue-400">
                      ₦{Number(item.price).toLocaleString()}
                    </p>
                  </div>
                </Link>
              )
            })}
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-10 text-center text-xs text-slate-400">
            No active listings published yet.
          </div>
        )}
      </div>
    </div>
  )
}