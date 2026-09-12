'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { updateProduct } from './actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { ArrowLeft, Loader2 } from 'lucide-react'

export default function EditListingPage() {
  const params = useParams()
  const router = useRouter()
  const productId = params.id as string

  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  
  const [product, setProduct] = useState<{
    title: string
    brand: string
    model: string
    price: number
    condition: string
    location: string
    category: string
    specs: Record<string, string>
    images: string[]
  } | null>(null)

  const [specs, setSpecs] = useState<Record<string, string>>({})
  const supabase = createClient()

  useEffect(() => {
    async function loadItem() {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', productId)
        .single()

      if (error || !data) {
        router.push('/seller/listings')
        return
      }

      setProduct(data)
      setSpecs(data.specs || {})
      setFetching(false)
    }

    loadItem()
  }, [productId, router, supabase])

  function handleSpecChange(key: string, val: string) {
    setSpecs((prev) => ({ ...prev, [key]: val }))
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setErrorMessage(null)

    const form = new FormData(e.currentTarget)
    const res = await updateProduct(productId, form, specs)

    if (res?.error) {
      setErrorMessage(res.error)
      setLoading(false)
    }
  }

  if (fetching) {
    return (
      <div className="flex items-center justify-center p-12 text-slate-500">
        <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading product details...
      </div>
    )
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/seller/listings">
          <Button variant="ghost" size="sm" className="h-8 gap-1 text-xs">
            <ArrowLeft className="w-3.5 h-3.5" /> Back
          </Button>
        </Link>
        <div>
          <h1 className="text-xl font-bold text-slate-900">Edit Listing</h1>
          <p className="text-xs text-slate-500">Update pricing, condition, or hardware specs</p>
        </div>
      </div>

      {errorMessage && (
        <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200">
          {errorMessage}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Product Details</CardTitle>
            <CardDescription className="text-xs">Category: <span className="font-bold capitalize">{product?.category}</span></CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="title" className="text-xs font-semibold">Title</Label>
              <Input id="title" name="title" defaultValue={product?.title} required className="mt-1 h-10 text-xs" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="brand" className="text-xs font-semibold">Brand</Label>
                <Input id="brand" name="brand" defaultValue={product?.brand} required className="mt-1 h-10 text-xs" />
              </div>
              <div>
                <Label htmlFor="model" className="text-xs font-semibold">Model</Label>
                <Input id="model" name="model" defaultValue={product?.model} required className="mt-1 h-10 text-xs" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="price" className="text-xs font-semibold">Price (NGN)</Label>
                <Input id="price" name="price" type="number" defaultValue={product?.price} required className="mt-1 h-10 text-xs" />
              </div>
              <div>
                <Label htmlFor="condition" className="text-xs font-semibold">Condition</Label>
                <select
                  id="condition"
                  name="condition"
                  defaultValue={product?.condition}
                  className="w-full mt-1 h-10 px-3 rounded-md border border-slate-200 bg-white text-xs"
                >
                  <option value="brand_new">Brand New</option>
                  <option value="open_box">Open Box</option>
                  <option value="fairly_used">Fairly Used</option>
                </select>
              </div>
            </div>

            <div>
              <Label htmlFor="location" className="text-xs font-semibold">Item Location</Label>
              <Input id="location" name="location" defaultValue={product?.location} required className="mt-1 h-10 text-xs" />
            </div>
          </CardContent>
        </Card>

        {/* Dynamic Hardware Specs */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Specifications ({product?.category})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {product?.category === 'phones' && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs">Storage</Label>
                  <Input defaultValue={specs.storage || ''} onChange={(e) => handleSpecChange('storage', e.target.value)} className="mt-1 text-xs" />
                </div>
                <div>
                  <Label className="text-xs">Battery Health (%)</Label>
                  <Input defaultValue={specs.battery_health || ''} onChange={(e) => handleSpecChange('battery_health', e.target.value)} className="mt-1 text-xs" />
                </div>
                <div>
                  <Label className="text-xs">RAM</Label>
                  <Input defaultValue={specs.ram || ''} onChange={(e) => handleSpecChange('ram', e.target.value)} className="mt-1 text-xs" />
                </div>
                <div>
                  <Label className="text-xs">Sim Status</Label>
                  <Input defaultValue={specs.sim_status || ''} onChange={(e) => handleSpecChange('sim_status', e.target.value)} className="mt-1 text-xs" />
                </div>
              </div>
            )}

            {product?.category === 'laptops' && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs">Processor</Label>
                  <Input defaultValue={specs.processor || ''} onChange={(e) => handleSpecChange('processor', e.target.value)} className="mt-1 text-xs" />
                </div>
                <div>
                  <Label className="text-xs">RAM</Label>
                  <Input defaultValue={specs.ram || ''} onChange={(e) => handleSpecChange('ram', e.target.value)} className="mt-1 text-xs" />
                </div>
                <div>
                  <Label className="text-xs">Storage</Label>
                  <Input defaultValue={specs.storage || ''} onChange={(e) => handleSpecChange('storage', e.target.value)} className="mt-1 text-xs" />
                </div>
                <div>
                  <Label className="text-xs">GPU</Label>
                  <Input defaultValue={specs.gpu || ''} onChange={(e) => handleSpecChange('gpu', e.target.value)} className="mt-1 text-xs" />
                </div>
              </div>
            )}

            {product?.category !== 'phones' && product?.category !== 'laptops' && (
              <div>
                <Label className="text-xs">Primary Specification</Label>
                <Input defaultValue={specs.primary_spec || ''} onChange={(e) => handleSpecChange('primary_spec', e.target.value)} className="mt-1 text-xs" />
              </div>
            )}
          </CardContent>
        </Card>

        <Button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 h-11 text-xs font-bold">
          {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
          Update Listing
        </Button>
      </form>
    </div>
  )
}