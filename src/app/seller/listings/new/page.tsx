'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import imageCompression from 'browser-image-compression'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { UploadCloud, X, Loader2 } from 'lucide-react'

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

  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState('phones')
  const [files, setFiles] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])

  // Dynamic specs dictionary
  const [specs, setSpecs] = useState<Record<string, string>>({})

  function handleSpecChange(key: string, value: string) {
    setSpecs((prev) => ({ ...prev, [key]: value }))
  }

  function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files) return
    const selectedFiles = Array.from(e.target.files)
    setFiles((prev) => [...prev, ...selectedFiles])

    const newPreviews = selectedFiles.map((f) => URL.createObjectURL(f))
    setPreviews((prev) => [...prev, ...newPreviews])
  }

  function removeImage(index: number) {
    setFiles((prev) => prev.filter((_, i) => i !== index))
    setPreviews((prev) => prev.filter((_, i) => i !== index))
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setErrorMessage(null)

    // 1. Read the form synchronously BEFORE any async calls
    const form = new FormData(e.currentTarget)
    const title = form.get('title') as string
    const brand = form.get('brand') as string
    const model = form.get('model') as string
    const price = parseFloat(form.get('price') as string)
    const condition = form.get('condition') as string
    const location = (form.get('location') as string) || 'Abuja'

    if (files.length === 0) {
      setErrorMessage('Please upload at least one image of the product.')
      setLoading(false)
      return
    }

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // 2. Compress and upload images
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

        const { data: { publicUrl } } = supabase.storage
          .from('product-media')
          .getPublicUrl(filePath)

        uploadedImageUrls.push(publicUrl)
      }

      // 3. Insert into PostgreSQL products table
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
        specs, // Stored as JSONB
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

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Add New Technology Listing</h1>
        <p className="text-sm text-slate-500 mt-1">Provide clear specifications and condition details for buyers.</p>
      </div>

      {errorMessage && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
          {errorMessage}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Core Details */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Product Details</CardTitle>
            <CardDescription>Select the exact category to load device-specific fields.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Category</Label>
              <select
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value)
                  setSpecs({}) // reset specs on category change
                }}
                className="w-full mt-1.5 h-10 px-3 rounded-md border border-slate-200 bg-white text-sm"
              >
                {CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>{c.label}</option>
                ))}
              </select>
            </div>

            <div>
              <Label htmlFor="title">Listing Title</Label>
              <Input id="title" name="title" placeholder="e.g. iPhone 15 Pro Max - 256GB - Blue Titanium" required className="mt-1" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="brand">Brand</Label>
                <Input id="brand" name="brand" placeholder="e.g. Apple, Dell, Sony" required className="mt-1" />
              </div>
              <div>
                <Label htmlFor="model">Model</Label>
                <Input id="model" name="model" placeholder="e.g. A2849, XPS 15" required className="mt-1" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="price">Price (NGN)</Label>
                <Input id="price" name="price" type="number" min="0" placeholder="1250000" required className="mt-1" />
              </div>
              <div>
                <Label htmlFor="condition">Condition</Label>
                <select id="condition" name="condition" className="w-full mt-1 h-10 px-3 rounded-md border border-slate-200 bg-white text-sm">
                  <option value="brand_new">Brand New</option>
                  <option value="open_box">Open Box</option>
                  <option value="fairly_used">Fairly Used</option>
                </select>
              </div>
            </div>

            <div>
              <Label htmlFor="location">Item Location</Label>
              <Input id="location" name="location" defaultValue="Abuja" placeholder="e.g. Wuse 2, Abuja" required className="mt-1" />
            </div>
          </CardContent>
        </Card>

        {/* Dynamic Category Specifications (JSONB) */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Technical Specifications ({selectedCategory})</CardTitle>
            <CardDescription>These details power the platform comparison matrix.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {selectedCategory === 'phones' && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Storage Capacity</Label>
                  <Input placeholder="e.g. 256GB" onChange={(e) => handleSpecChange('storage', e.target.value)} className="mt-1" />
                </div>
                <div>
                  <Label>Battery Health (%)</Label>
                  <Input placeholder="e.g. 89%" onChange={(e) => handleSpecChange('battery_health', e.target.value)} className="mt-1" />
                </div>
                <div>
                  <Label>RAM</Label>
                  <Input placeholder="e.g. 8GB" onChange={(e) => handleSpecChange('ram', e.target.value)} className="mt-1" />
                </div>
                <div>
                  <Label>Sim Status</Label>
                  <Input placeholder="e.g. Physical + eSIM" onChange={(e) => handleSpecChange('sim_status', e.target.value)} className="mt-1" />
                </div>
              </div>
            )}

            {selectedCategory === 'laptops' && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Processor / Chip</Label>
                  <Input placeholder="e.g. Apple M2 or Core i7-13700H" onChange={(e) => handleSpecChange('processor', e.target.value)} className="mt-1" />
                </div>
                <div>
                  <Label>RAM</Label>
                  <Input placeholder="e.g. 16GB" onChange={(e) => handleSpecChange('ram', e.target.value)} className="mt-1" />
                </div>
                <div>
                  <Label>Storage (SSD/HDD)</Label>
                  <Input placeholder="e.g. 512GB NVMe SSD" onChange={(e) => handleSpecChange('storage', e.target.value)} className="mt-1" />
                </div>
                <div>
                  <Label>Graphics / GPU</Label>
                  <Input placeholder="e.g. RTX 4060 8GB" onChange={(e) => handleSpecChange('gpu', e.target.value)} className="mt-1" />
                </div>
              </div>
            )}

            {selectedCategory === 'cameras' && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Shutter Count</Label>
                  <Input placeholder="e.g. 14,200" onChange={(e) => handleSpecChange('shutter_count', e.target.value)} className="mt-1" />
                </div>
                <div>
                  <Label>Sensor Size</Label>
                  <Input placeholder="e.g. Full Frame" onChange={(e) => handleSpecChange('sensor', e.target.value)} className="mt-1" />
                </div>
              </div>
            )}

            {selectedCategory !== 'phones' && selectedCategory !== 'laptops' && selectedCategory !== 'cameras' && (
              <div>
                <Label>Main Feature / Spec</Label>
                <Input placeholder="e.g. Connectivity, Output Wattage, etc." onChange={(e) => handleSpecChange('primary_spec', e.target.value)} className="mt-1" />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Media Upload Area */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Product Images</CardTitle>
            <CardDescription>Photos are automatically compressed before upload to preserve bandwidth.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center hover:bg-slate-50 transition cursor-pointer relative">
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageSelect}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
              <UploadCloud className="w-8 h-8 mx-auto text-slate-400 mb-2" />
              <p className="text-sm font-medium text-slate-700">Click to upload photos or drag and drop</p>
              <p className="text-xs text-slate-400 mt-1">PNG, JPG, WEBP up to 10MB each</p>
            </div>

            {previews.length > 0 && (
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-3 pt-2">
                {previews.map((src, i) => (
                  <div key={i} className="relative aspect-square rounded-lg overflow-hidden border border-slate-200 group">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={src} alt="Upload preview" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeImage(i)}
                      className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 opacity-90 hover:opacity-100 transition"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 h-11 text-base">
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