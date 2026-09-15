'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import imageCompression from 'browser-image-compression'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  UploadCloud,
  X,
  Loader2,
  AlertTriangle,
  Zap,
  ArrowRight,
  ArrowLeft,
  Sparkles,
} from 'lucide-react'

const CATEGORIES = [
  { id: 'phones', label: 'Phones' },
  { id: 'laptops', label: 'Laptops' },
  { id: 'tablets', label: 'Tablets' },
  { id: 'cameras', label: 'Cameras' },
  { id: 'gaming', label: 'Gaming Consoles' },
  { id: 'audio', label: 'Audio & Speakers' },
  { id: 'accessories', label: 'Accessories' },
]

export default function NewListingPage() {
  const router = useRouter()
  const supabase = createClient()

  const [initializing, setInitializing] = useState(true)
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Seller Quota State (Section 21)
  const [currentPlan, setCurrentPlan] = useState<string>('free')
  const [maxListings, setMaxListings] = useState<number>(5)
  const [maxImages, setMaxImages] = useState<number>(10)
  const [activeCount, setActiveCount] = useState<number>(0)
  const [isCapped, setIsCapped] = useState<boolean>(false)

  // Form Fields State
  const [selectedCategory, setSelectedCategory] = useState('phones')
  const [files, setFiles] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])
  const [specs, setSpecs] = useState<Record<string, string>>({})

  // 1. Fetch Profile Quotas and Active Listings Count on Mount
  useEffect(() => {
    async function checkQuota() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
          router.push('/login?next=/seller/listings/new')
          return
        }

        // Fetch seller profile quotas
        const { data: profile } = await supabase
          .from('profiles')
          .select('subscription_plan, subscription_tier, max_listings, max_images_per_listing')
          .eq('id', user.id)
          .maybeSingle()

        const plan = profile?.subscription_plan || profile?.subscription_tier || 'free'
        const allowedListings = profile?.max_listings || 5
        const allowedImages = profile?.max_images_per_listing || 10

        setCurrentPlan(plan)
        setMaxListings(allowedListings)
        setMaxImages(allowedImages)

        // Count non-archived listings published by this seller
        const { count } = await supabase
          .from('products')
          .select('*', { count: 'exact', head: true })
          .eq('seller_id', user.id)
          .neq('status', 'archived')

        const currentTotal = count || 0
        setActiveCount(currentTotal)

        if (currentTotal >= allowedListings) {
          setIsCapped(true)
        }
      } catch (err: any) {
        console.error('Failed to load seller quota:', err)
      } finally {
        setInitializing(false)
      }
    }

    checkQuota()
  }, [supabase, router])

  function handleSpecChange(key: string, value: string) {
    setSpecs((prev) => ({ ...prev, [key]: value }))
  }

  // 2. Validate Image Upload Quotas Against Seller Plan
  function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files) return
    const incomingFiles = Array.from(e.target.files)

    if (files.length + incomingFiles.length > maxImages) {
      setErrorMessage(
        `Your ${currentPlan.toUpperCase()} plan allows a maximum of ${maxImages} images per gadget[cite: 1]. Please upgrade to add more photos.`
      )
      return
    }

    setErrorMessage(null)
    setFiles((prev) => [...prev, ...incomingFiles])

    const newPreviews = incomingFiles.map((f) => URL.createObjectURL(f))
    setPreviews((prev) => [...prev, ...newPreviews])
  }

  function removeImage(index: number) {
    setFiles((prev) => prev.filter((_, i) => i !== index))
    setPreviews((prev) => prev.filter((_, i) => i !== index))
  }

  // 3. Handle Submit with Server Quota Guard & Bandwidth-Preserving Compression
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setErrorMessage(null)

    const form = new FormData(e.currentTarget)
    const title = form.get('title') as string
    const brand = form.get('brand') as string
    const model = form.get('model') as string
    const price = parseFloat(form.get('price') as string)
    const condition = form.get('condition') as string
    const location = (form.get('location') as string) || 'Abuja'

    if (files.length === 0) {
      setErrorMessage('Please upload at least one image of the product[cite: 1].')
      setLoading(false)
      return
    }

    if (files.length > maxImages) {
      setErrorMessage(
        `You cannot upload more than ${maxImages} images on the ${currentPlan} plan[cite: 1].`
      )
      setLoading(false)
      return
    }

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Double-check quota directly before spending bandwidth on uploads
      const { count: freshCount } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('seller_id', user.id)
        .neq('status', 'archived')

      if ((freshCount || 0) >= maxListings) {
        setIsCapped(true)
        throw new Error(
          `You have reached your limit of ${maxListings} active listings for the ${currentPlan} plan[cite: 1]. Please upgrade your store.`
        )
      }

      // Compress and upload images
      const uploadedImageUrls: string[] = []

      for (const file of files) {
        const compressedFile = await imageCompression(file, {
          maxSizeMB: 0.35,
          maxWidthOrHeight: 1280,
          useWebWorker: true,
        })

        const fileExt = file.name.split('.').pop()
        const filePath = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`

        const { error: uploadError } = await supabase.storage
          .from('product-media')
          .upload(filePath, compressedFile)

        if (uploadError) throw uploadError

        const {
          data: { publicUrl },
        } = supabase.storage.from('product-media').getPublicUrl(filePath)

        uploadedImageUrls.push(publicUrl)
      }

      // Insert into PostgreSQL products table
      const { error: insertError } = await supabase.from('products').insert({
        seller_id: user.id,
        category: selectedCategory,
        title,
        brand,
        model,
        price,
        condition,
        location,
        images: uploadedImageUrls,
        status: 'published',
        specs,
      })

      if (insertError) throw insertError

      router.push('/seller/dashboard')
      router.refresh()
    } catch (err: unknown) {
      const error = err as Error
      setErrorMessage(error.message || 'Failed to create listing')
      setLoading(false)
    }
  }

  // Loading Skeleton
  if (initializing) {
    return (
      <div className="min-h-[450px] flex flex-col items-center justify-center space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <p className="text-xs text-slate-400 font-medium">Verifying store listing quota...</p>
      </div>
    )
  }

  // Quota Exhausted Paywall Banner (Section 21)
  if (isCapped) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4">
        <div className="bg-white border border-slate-200/90 rounded-3xl p-8 shadow-sm text-center space-y-6">
          <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto border border-amber-200">
            <AlertTriangle className="w-7 h-7" />
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Listing Quota Reached
            </h1>
            <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
              Your store has published{' '}
              <span className="font-bold text-slate-900">
                {activeCount} of {maxListings}
              </span>{' '}
              allowed listings on the{' '}
              <span className="font-bold uppercase text-blue-600">{currentPlan}</span> plan[cite: 1]. Upgrade
              your store plan to post more gadgets to Abuja buyers[cite: 1].
            </p>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl max-w-md mx-auto flex items-center justify-between text-xs">
            <span className="text-slate-500 font-medium">Need more inventory slots?</span>
            <span className="font-bold text-blue-600">Standard Plan gives 25 slots[cite: 1]</span>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link href="/seller/listings">
              <Button
                variant="outline"
                className="w-full sm:w-auto text-xs h-11 rounded-xl border-slate-200 gap-1.5 font-bold"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back to Listings
              </Button>
            </Link>
            <Link href="/seller/subscription">
              <Button className="w-full sm:w-auto text-xs h-11 rounded-xl bg-blue-600 hover:bg-blue-700 text-white gap-2 font-bold shadow-sm">
                <Zap className="w-4 h-4 text-amber-300 fill-amber-300" /> Upgrade Store Tier{' '}
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header with Live Plan Quota Details */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900">Add New Technology Listing</h1>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-blue-50 text-blue-700 rounded-md border border-blue-200 capitalize">
              {currentPlan} Tier
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Slot <span className="font-bold text-slate-700">{activeCount + 1}</span> of{' '}
            <span className="font-bold text-slate-700">{maxListings}</span> • Max {maxImages} images
            allowed[cite: 1].
          </p>
        </div>

        <Link href="/seller/listings">
          <Button variant="ghost" size="sm" className="text-xs text-slate-500 hover:text-slate-900">
            Cancel
          </Button>
        </Link>
      </div>

      {errorMessage && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-medium">
          {errorMessage}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Core Details */}
        <Card className="rounded-2xl border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-bold text-slate-900">Product Details</CardTitle>
            <CardDescription className="text-xs">
              Select the exact category to load device-specific fields[cite: 1].
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-xs font-bold text-slate-700">Category</Label>
              <select
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value)
                  setSpecs({})
                }}
                className="w-full mt-1.5 h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs font-medium focus:outline-none focus:border-blue-600"
              >
                {CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label htmlFor="title" className="text-xs font-bold text-slate-700">
                Listing Title
              </Label>
              <Input
                id="title"
                name="title"
                placeholder="e.g. iPhone 15 Pro Max - 256GB - Blue Titanium"
                required
                className="mt-1 text-xs rounded-xl"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="brand" className="text-xs font-bold text-slate-700">
                  Brand
                </Label>
                <Input
                  id="brand"
                  name="brand"
                  placeholder="e.g. Apple, Dell, Sony"
                  required
                  className="mt-1 text-xs rounded-xl"
                />
              </div>
              <div>
                <Label htmlFor="model" className="text-xs font-bold text-slate-700">
                  Model
                </Label>
                <Input
                  id="model"
                  name="model"
                  placeholder="e.g. A2849, XPS 15"
                  required
                  className="mt-1 text-xs rounded-xl"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="price" className="text-xs font-bold text-slate-700">
                  Price (NGN)
                </Label>
                <Input
                  id="price"
                  name="price"
                  type="number"
                  min="0"
                  placeholder="1250000"
                  required
                  className="mt-1 text-xs rounded-xl font-bold text-slate-900"
                />
              </div>
              <div>
                <Label htmlFor="condition" className="text-xs font-bold text-slate-700">
                  Condition
                </Label>
                <select
                  id="condition"
                  name="condition"
                  className="w-full mt-1 h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs font-medium focus:outline-none focus:border-blue-600"
                >
                  <option value="brand_new">Brand New</option>
                  <option value="open_box">Open Box</option>
                  <option value="fairly_used">Fairly Used</option>
                </select>
              </div>
            </div>

            <div>
              <Label htmlFor="location" className="text-xs font-bold text-slate-700">
                Item Location (Abuja Area)
              </Label>
              <Input
                id="location"
                name="location"
                defaultValue="Abuja"
                placeholder="e.g. Wuse 2, Maitama, Garki"
                required
                className="mt-1 text-xs rounded-xl"
              />
            </div>
          </CardContent>
        </Card>

        {/* Dynamic Category Specifications (JSONB) */}
        <Card className="rounded-2xl border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-bold text-slate-900">
              Technical Specifications ({selectedCategory})
            </CardTitle>
            <CardDescription className="text-xs">
              These details power the side-by-side comparison matrix[cite: 1].
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {selectedCategory === 'phones' && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs font-bold text-slate-700">Storage Capacity</Label>
                  <Input
                    placeholder="e.g. 256GB"
                    onChange={(e) => handleSpecChange('storage', e.target.value)}
                    className="mt-1 text-xs rounded-xl"
                  />
                </div>
                <div>
                  <Label className="text-xs font-bold text-slate-700">Battery Health (%)</Label>
                  <Input
                    placeholder="e.g. 89%"
                    onChange={(e) => handleSpecChange('battery_health', e.target.value)}
                    className="mt-1 text-xs rounded-xl"
                  />
                </div>
                <div>
                  <Label className="text-xs font-bold text-slate-700">RAM</Label>
                  <Input
                    placeholder="e.g. 8GB"
                    onChange={(e) => handleSpecChange('ram', e.target.value)}
                    className="mt-1 text-xs rounded-xl"
                  />
                </div>
                <div>
                  <Label className="text-xs font-bold text-slate-700">SIM Status</Label>
                  <Input
                    placeholder="e.g. Physical + eSIM"
                    onChange={(e) => handleSpecChange('sim_status', e.target.value)}
                    className="mt-1 text-xs rounded-xl"
                  />
                </div>
              </div>
            )}

            {selectedCategory === 'laptops' && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs font-bold text-slate-700">Processor / Chip</Label>
                  <Input
                    placeholder="e.g. Apple M2 or Core i7-13700H"
                    onChange={(e) => handleSpecChange('processor', e.target.value)}
                    className="mt-1 text-xs rounded-xl"
                  />
                </div>
                <div>
                  <Label className="text-xs font-bold text-slate-700">RAM</Label>
                  <Input
                    placeholder="e.g. 16GB"
                    onChange={(e) => handleSpecChange('ram', e.target.value)}
                    className="mt-1 text-xs rounded-xl"
                  />
                </div>
                <div>
                  <Label className="text-xs font-bold text-slate-700">Storage (SSD/HDD)</Label>
                  <Input
                    placeholder="e.g. 512GB NVMe SSD"
                    onChange={(e) => handleSpecChange('storage', e.target.value)}
                    className="mt-1 text-xs rounded-xl"
                  />
                </div>
                <div>
                  <Label className="text-xs font-bold text-slate-700">Graphics / GPU</Label>
                  <Input
                    placeholder="e.g. RTX 4060 8GB"
                    onChange={(e) => handleSpecChange('gpu', e.target.value)}
                    className="mt-1 text-xs rounded-xl"
                  />
                </div>
              </div>
            )}

            {selectedCategory === 'cameras' && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs font-bold text-slate-700">Shutter Count</Label>
                  <Input
                    placeholder="e.g. 14,200"
                    onChange={(e) => handleSpecChange('shutter_count', e.target.value)}
                    className="mt-1 text-xs rounded-xl"
                  />
                </div>
                <div>
                  <Label className="text-xs font-bold text-slate-700">Sensor Size</Label>
                  <Input
                    placeholder="e.g. Full Frame"
                    onChange={(e) => handleSpecChange('sensor', e.target.value)}
                    className="mt-1 text-xs rounded-xl"
                  />
                </div>
              </div>
            )}

            {selectedCategory !== 'phones' &&
              selectedCategory !== 'laptops' &&
              selectedCategory !== 'cameras' && (
                <div>
                  <Label className="text-xs font-bold text-slate-700">Main Feature / Spec</Label>
                  <Input
                    placeholder="e.g. Connectivity, Output Wattage, etc."
                    onChange={(e) => handleSpecChange('primary_spec', e.target.value)}
                    className="mt-1 text-xs rounded-xl"
                  />
                </div>
              )}
          </CardContent>
        </Card>

        {/* Media Upload Area (Bounded by Plan Image Limits) */}
        <Card className="rounded-2xl border-slate-200 shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-bold text-slate-900">Product Images</CardTitle>
              <span className="text-xs font-bold text-slate-500">
                {files.length} / {maxImages} Photos
              </span>
            </div>
            <CardDescription className="text-xs">
              Photos are automatically compressed before upload[cite: 1]. Used items must show actual condition[cite: 1].
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border-2 border-dashed border-slate-200 rounded-2xl p-6 text-center hover:bg-slate-50 transition cursor-pointer relative">
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageSelect}
                disabled={files.length >= maxImages}
                className="absolute inset-0 opacity-0 cursor-pointer disabled:cursor-not-allowed"
              />
              <UploadCloud className="w-8 h-8 mx-auto text-slate-400 mb-2" />
              <p className="text-xs font-bold text-slate-700">
                {files.length >= maxImages
                  ? `Maximum photo quota reached (${maxImages}/${maxImages})`
                  : 'Click to upload photos or drag and drop'}
              </p>
              <p className="text-[11px] text-slate-400 mt-1">PNG, JPG, WEBP up to 10MB each</p>
            </div>

            {previews.length > 0 && (
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-3 pt-2">
                {previews.map((src, i) => (
                  <div
                    key={i}
                    className="relative aspect-square rounded-xl overflow-hidden border border-slate-200 group"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={src} alt="Upload preview" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeImage(i)}
                      className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 opacity-90 hover:opacity-100 transition shadow-sm"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 h-11 text-xs font-bold rounded-xl shadow-sm"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Compressing & Publishing...
            </>
          ) : (
            'Publish Listing'
          )}
        </Button>
      </form>
    </div>
  )
}