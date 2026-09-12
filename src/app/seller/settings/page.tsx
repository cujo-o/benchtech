'use client'

import { useState, useEffect } from 'react'
import imageCompression from 'browser-image-compression'
import { createClient } from '@/lib/supabase/client'
import { updateStoreProfile } from './actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ShieldCheck, Store, MapPin, Phone, CheckCircle2, Loader2, Camera } from 'lucide-react'

export default function StoreSettingsPage() {
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  
  const [profile, setProfile] = useState<{
    business_name?: string
    phone?: string
    city?: string
    address?: string
    bio?: string
    avatar_url?: string
    tech_trust_status?: string
    subscription_tier?: string
  } | null>(null)

  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [avatarUrlInput, setAvatarUrlInput] = useState<string>('')

  const supabase = createClient()

  useEffect(() => {
    async function loadProfile() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
        setProfile(data)
        if (data?.avatar_url) {
          setAvatarPreview(data.avatar_url)
          setAvatarUrlInput(data.avatar_url)
        }
      }
      setFetching(false)
    }
    loadProfile()
  }, [supabase])

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingAvatar(true)
    setMessage(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const compressedFile = await imageCompression(file, {
        maxSizeMB: 0.2,
        maxWidthOrHeight: 600,
        useWebWorker: true,
      })

      const fileExt = file.name.split('.').pop()
      const filePath = `${user.id}/avatar-${Date.now()}.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from('product-media')
        .upload(filePath, compressedFile, { upsert: true })

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('product-media')
        .getPublicUrl(filePath)

      setAvatarPreview(publicUrl)
      setAvatarUrlInput(publicUrl)
      setMessage({ type: 'success', text: 'Avatar uploaded! Click "Save Changes" below to apply.' })
    } catch (err: unknown) {
      const error = err as Error
      setMessage({ type: 'error', text: error.message || 'Failed to upload avatar' })
    } finally {
      setUploadingAvatar(false)
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    const formData = new FormData(e.currentTarget)
    formData.set('avatarUrl', avatarUrlInput)

    const res = await updateStoreProfile(formData)

    if (res?.error) {
      setMessage({ type: 'error', text: res.error })
    } else {
      setMessage({ type: 'success', text: 'Store profile updated successfully!' })
    }
    setLoading(false)
  }

  if (fetching) {
    return (
      <div className="flex items-center justify-center p-12 text-slate-500 text-xs">
        <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading settings...
      </div>
    )
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Store Settings</h1>
        <p className="text-xs text-slate-500 mt-1">
          Manage your public merchant profile avatar, bio, and Abuja store location.
        </p>
      </div>

      {message && (
        <div
          className={`p-3 rounded-xl text-xs flex items-center gap-2 border ${
            message.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-red-50 text-red-800 border-red-200'
          }`}
        >
          {message.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />}
          <span>{message.text}</span>
        </div>
      )}

      {/* Account Status Card */}
      <Card className="border-slate-200 shadow-sm">
        <CardContent className="p-5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="relative w-14 h-14 rounded-2xl bg-slate-100 overflow-hidden border border-slate-200 shrink-0 flex items-center justify-center">
              {avatarPreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <Store className="w-6 h-6 text-slate-400" />
              )}
            </div>
            <div>
              <p className="font-bold text-sm text-slate-900">{profile?.business_name || 'My Tech Store'}</p>
              <div className="flex items-center gap-2 mt-1">
                <Badge
                  variant="secondary"
                  className={`text-[10px] font-bold capitalize ${
                    profile?.tech_trust_status === 'verified'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-amber-50 text-amber-700 border border-amber-200'
                  }`}
                >
                  <ShieldCheck className="w-3 h-3 mr-1 inline" />
                  {profile?.tech_trust_status || 'unverified'}
                </Badge>
                <span className="text-[11px] text-slate-400 capitalize font-medium">
                  Plan: {profile?.subscription_tier || 'Free'}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Profile & Avatar Form */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Store Identity & Bio</CardTitle>
          <CardDescription className="text-xs">
            Upload a store logo or avatar and describe your device offerings.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Avatar Upload Box */}
            <div>
              <Label className="text-xs font-semibold block mb-2">Store Logo / Profile Picture</Label>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center relative shrink-0">
                  {avatarPreview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={avatarPreview} alt="Avatar preview" className="w-full h-full object-cover" />
                  ) : (
                    <Store className="w-6 h-6 text-slate-400" />
                  )}
                </div>
                <div className="relative">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  <Button type="button" variant="outline" size="sm" disabled={uploadingAvatar} className="text-xs gap-1.5">
                    {uploadingAvatar ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Camera className="w-3.5 h-3.5" />}
                    {uploadingAvatar ? 'Uploading...' : 'Change Avatar'}
                  </Button>
                  <p className="text-[10px] text-slate-400 mt-1">PNG, JPG up to 5MB</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="businessName" className="text-xs font-semibold">Store / Business Name</Label>
                <Input
                  id="businessName"
                  name="businessName"
                  defaultValue={profile?.business_name || ''}
                  required
                  className="mt-1 h-10 text-xs"
                />
              </div>

              <div>
                <Label htmlFor="phone" className="text-xs font-semibold">WhatsApp / Phone Number</Label>
                <div className="relative mt-1">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <Input
                    id="phone"
                    name="phone"
                    defaultValue={profile?.phone || ''}
                    required
                    placeholder="0801 234 5678"
                    className="pl-9 h-10 text-xs"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="city" className="text-xs font-semibold">City</Label>
                <div className="relative mt-1">
                  <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <Input
                    id="city"
                    name="city"
                    defaultValue={profile?.city || 'Abuja'}
                    required
                    className="pl-9 h-10 text-xs"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="address" className="text-xs font-semibold">Shop / Office Address (Abuja)</Label>
                <Input
                  id="address"
                  name="address"
                  defaultValue={profile?.address || ''}
                  placeholder="e.g. Shop 24, Banex Plaza"
                  className="mt-1 h-10 text-xs"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="bio" className="text-xs font-semibold">Store Bio / Description</Label>
              <Textarea
                id="bio"
                name="bio"
                defaultValue={profile?.bio || ''}
                placeholder="Briefly describe your gadgets, warranty terms, or specialties..."
                rows={3}
                className="mt-1 text-xs"
              />
            </div>

            <Button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-xs h-10 font-bold mt-2">
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Save Changes
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}