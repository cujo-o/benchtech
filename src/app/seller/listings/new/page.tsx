'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import imageCompression from 'browser-image-compression'
import { createClient } from '@/lib/supabase/client'
import { createProductListingAction } from '../actions'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  ArrowLeft,
  Upload,
  X,
  Loader2,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  Smartphone,
  Laptop,
  Gamepad2,
  Monitor,
  Headphones,
  Cpu,
  FileText,
} from 'lucide-react'

type CategoryKey =
  | 'phones'
  | 'laptops'
  | 'gaming'
  | 'monitors'
  | 'accessories'
  | 'components'

const CATEGORIES: Array<{
  id: CategoryKey
  label: string
  icon: any
}> = [
  { id: 'phones', label: 'Phones & Tablets', icon: Smartphone },
  { id: 'laptops', label: 'Laptops & Macs', icon: Laptop },
  { id: 'gaming', label: 'Consoles & Gaming', icon: Gamepad2 },
  { id: 'monitors', label: 'Monitors & Displays', icon: Monitor },
  { id: 'accessories', label: 'Audio & Accessories', icon: Headphones },
  { id: 'components', label: 'PC Parts & Storage', icon: Cpu },
]

const CONDITIONS = [
  { id: 'brand_new', label: 'Brand New (Sealed)' },
  { id: 'open_box', label: 'Open Box' },
  { id: 'uk_used', label: 'Foreign Used (Clean)' },
  { id: 'fairly_used', label: 'Direct Used' },
]

export default function NewSellerListingPage() {
  const router = useRouter()
  const supabase = createClient()

  // Core Product Fields
  const [category, setCategory] = useState<CategoryKey>('phones')
  const [title, setTitle] = useState('')
  const [brand, setBrand] = useState('')
  const [model, setModel] = useState('')
  const [condition, setCondition] = useState('uk_used')
  const [price, setPrice] = useState('')
  const [quantity, setQuantity] = useState('1')
  const [description, setDescription] = useState('')

  // Per-Product Verification Fields
  const [serialOrImei, setSerialOrImei] = useState('')
  const [repairHistory, setRepairHistory] = useState('No prior repairs')
  const [warrantyInfo, setWarrantyInfo] = useState('7-Day Inspection + Store Warranty')
  const [ownershipProofUrl, setOwnershipProofUrl] = useState('')
  const [uploadingProof, setUploadingProof] = useState(false)

  // Category-Specific Hardware Specs
  const [storage, setStorage] = useState('')
  const [ram, setRam] = useState('')
  const [batteryHealth, setBatteryHealth] = useState('')
  const [color, setColor] = useState('')
  const [lockStatus, setLockStatus] = useState('Factory Unlocked')
  const [processor, setProcessor] = useState('')
  const [gpu, setGpu] = useState('Integrated Graphics')
  const [displaySize, setDisplaySize] = useState('')
  const [includedAccessories, setIncludedAccessories] = useState('')

  // Photos State
  const [images, setImages] = useState<string[]>([])
  const [uploadingImages, setUploadingImages] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const numericPrice = Number(price) || 0
  const isHighValue = numericPrice >= 800000

  async function uploadFileToStorage(file: File, folder: string): Promise<string> {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) throw new Error('You must be signed in to upload files.')

    const isImage = file.type.startsWith('image/')
    const fileToUpload = isImage
      ? await imageCompression(file, {
          maxSizeMB: 0.6,
          maxWidthOrHeight: 1600,
          useWebWorker: true,
        })
      : file

    const ext = file.name.split('.').pop() || 'jpg'
    const filePath = `${folder}/${user.id}/${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 7)}.${ext}`

    // Try 'products' bucket first, fallback to 'product-media'
    let bucketName = 'products'
    const { error: firstErr } = await supabase.storage
      .from(bucketName)
      .upload(filePath, fileToUpload, { upsert: true })

    if (firstErr) {
      bucketName = 'product-media'
      const { error: secondErr } = await supabase.storage
        .from(bucketName)
        .upload(filePath, fileToUpload, { upsert: true })
      if (secondErr) throw secondErr
    }

    const { data: pubData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(filePath)
    return pubData.publicUrl
  }

  async function handleImageFilesChange(e: React.ChangeEvent<HTMLInputElement>) {
    const fileList = e.target.files
    if (!fileList || fileList.length === 0) return

    setUploadingImages(true)
    setError(null)

    try {
      const uploadedUrls: string[] = []
      for (const file of Array.from(fileList).slice(0, 8 - images.length)) {
        const url = await uploadFileToStorage(file, 'listings')
        uploadedUrls.push(url)
      }
      setImages((prev) => [...prev, ...uploadedUrls])
    } catch (err: any) {
      setError(err?.message || 'Failed to upload image. Please try again.')
    } finally {
      setUploadingImages(false)
      e.target.value = ''
    }
  }

  async function handleOwnershipProofUpload(
    e: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingProof(true)
    setError(null)

    try {
      const url = await uploadFileToStorage(file, 'product-evidence')
      setOwnershipProofUrl(url)
    } catch (err: any) {
      setError(err?.message || 'Failed to upload proof document.')
    } finally {
      setUploadingProof(false)
    }
  }

  function removeImage(index: number) {
    setImages((prev) => prev.filter((_, i) => i !== index))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (submitting || uploadingImages) return

    setError(null)

    if (images.length === 0) {
      setError('Please upload at least one real photo of the item.')
      return
    }

    if ((category === 'phones' || category === 'laptops' || category === 'gaming') && !serialOrImei.trim()) {
      setError(
        category === 'phones'
          ? 'Please enter the device IMEI or Serial Number for product verification.'
          : 'Please enter the device Serial Number for product verification.'
      )
      return
    }

    setSubmitting(true)

    const specs: Record<string, string> = {}
    if (storage) specs.storage = storage
    if (ram) specs.ram = ram
    if (batteryHealth) specs.battery_health = batteryHealth
    if (color) specs.color = color
    if (category === 'phones' && lockStatus) specs.lock_status = lockStatus
    if (category === 'laptops') {
      if (processor) specs.processor = processor
      if (gpu) specs.gpu = gpu
      if (displaySize) specs.display = displaySize
    }
    if (includedAccessories) specs.accessories = includedAccessories

    const res = await createProductListingAction({
      title,
      category,
      brand,
      model,
      condition,
      price: numericPrice,
      quantity: Number(quantity) || 1,
      description,
      images,
      serialOrImei,
      ownershipProofUrl: ownershipProofUrl || undefined,
      warrantyInfo,
      repairHistory,
      specs,
    })

    if (res?.error) {
      setError(res.error)
      setSubmitting(false)
      return
    }

    router.push('/seller/listings')
    router.refresh()
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xs">
        <div className="space-y-1">
          <Link
            href="/seller/listings"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 mb-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Listings</span>
          </Link>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            Create New Product Listing
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Provide accurate hardware specifications, real device photos, and serial verification details.
          </p>
        </div>

        <Badge className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-[10px] font-bold px-3 py-1 rounded-xl w-fit flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Per-Product Verification Active</span>
        </Badge>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-xs font-semibold text-red-700 dark:text-red-300 flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 1. Category Selector */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
          <h2 className="text-sm font-black text-slate-900 dark:text-white">
            1. Select Hardware Category
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon
              const active = category === cat.id
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategory(cat.id)}
                  className={`p-3.5 rounded-2xl border text-left transition flex items-center gap-2.5 cursor-pointer ${
                    active
                      ? 'border-2 border-blue-600 bg-blue-50/50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-bold'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300 font-semibold hover:border-slate-300'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="text-xs truncate">{cat.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* 2. Basic Product Information & Pricing */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
          <h2 className="text-sm font-black text-slate-900 dark:text-white">
            2. Device Identity &amp; Pricing
          </h2>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Listing Title
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={
                category === 'phones'
                  ? 'e.g. iPhone 14 Pro Max 256GB Factory Unlocked'
                  : category === 'laptops'
                  ? 'e.g. MacBook Pro 14 M2 Pro 16GB RAM 512GB SSD'
                  : 'e.g. Sony PlayStation 5 Slim Disc Edition + 2 Pads'
              }
              className="w-full h-11 px-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-base sm:text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Brand
              </label>
              <input
                type="text"
                required
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                placeholder="e.g. Apple, Samsung, HP, Dell, Sony"
                className="w-full h-11 px-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-base sm:text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Exact Model
              </label>
              <input
                type="text"
                required
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder="e.g. A2894 / Latitude 7420"
                className="w-full h-11 px-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-base sm:text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Condition
              </label>
              <select
                value={condition}
                onChange={(e) => setCondition(e.target.value)}
                className="w-full h-11 px-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-base sm:text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {CONDITIONS.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Selling Price (₦)
              </label>
              <input
                type="number"
                required
                min={1000}
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="e.g. 450000"
                className="w-full h-11 px-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-base sm:text-xs font-black focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Available Units in Stock
              </label>
              <input
                type="number"
                required
                min={1}
                max={100}
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full h-11 px-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-base sm:text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* 3. Category-Specific Technical Specifications */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
          <div>
            <h2 className="text-sm font-black text-slate-900 dark:text-white">
              3. Hardware Specifications
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Used for buyer side-by-side spec comparisons and delivery inspection checks.
            </p>
          </div>

          {category === 'phones' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Storage Capacity
                </label>
                <input
                  type="text"
                  required
                  value={storage}
                  onChange={(e) => setStorage(e.target.value)}
                  placeholder="e.g. 256GB"
                  className="w-full h-10 px-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  RAM
                </label>
                <input
                  type="text"
                  value={ram}
                  onChange={(e) => setRam(e.target.value)}
                  placeholder="e.g. 8GB"
                  className="w-full h-10 px-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Battery Health (%)
                </label>
                <input
                  type="text"
                  value={batteryHealth}
                  onChange={(e) => setBatteryHealth(e.target.value)}
                  placeholder="e.g. 92%"
                  className="w-full h-10 px-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Color
                </label>
                <input
                  type="text"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  placeholder="e.g. Space Black"
                  className="w-full h-10 px-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Network / Activation Status
                </label>
                <select
                  value={lockStatus}
                  onChange={(e) => setLockStatus(e.target.value)}
                  className="w-full h-10 px-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium"
                >
                  <option value="Factory Unlocked (Physical SIM + eSIM)">
                    Factory Unlocked (Physical SIM + eSIM)
                  </option>
                  <option value="Factory Unlocked (eSIM Only)">
                    Factory Unlocked (eSIM Only)
                  </option>
                  <option value="Factory Unlocked (Physical Dual SIM)">
                    Factory Unlocked (Physical Dual SIM)
                  </option>
                  <option value="Carrier Locked / Wi-Fi Only">
                    Carrier Locked / Wi-Fi Only
                  </option>
                </select>
              </div>
            </div>
          )}

          {category === 'laptops' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Processor (CPU)
                </label>
                <input
                  type="text"
                  required
                  value={processor}
                  onChange={(e) => setProcessor(e.target.value)}
                  placeholder="e.g. Intel Core i7 12th Gen / Apple M2"
                  className="w-full h-10 px-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Memory (RAM)
                </label>
                <input
                  type="text"
                  required
                  value={ram}
                  onChange={(e) => setRam(e.target.value)}
                  placeholder="e.g. 16GB DDR5"
                  className="w-full h-10 px-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Storage (SSD)
                </label>
                <input
                  type="text"
                  required
                  value={storage}
                  onChange={(e) => setStorage(e.target.value)}
                  placeholder="e.g. 512GB NVMe SSD"
                  className="w-full h-10 px-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Graphics (GPU)
                </label>
                <input
                  type="text"
                  value={gpu}
                  onChange={(e) => setGpu(e.target.value)}
                  placeholder="e.g. RTX 4060 8GB / Intel Iris Xe"
                  className="w-full h-10 px-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Display Size &amp; Resolution
                </label>
                <input
                  type="text"
                  value={displaySize}
                  onChange={(e) => setDisplaySize(e.target.value)}
                  placeholder="e.g. 14-inch FHD+ IPS"
                  className="w-full h-10 px-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Battery Health / Cycle Count
                </label>
                <input
                  type="text"
                  value={batteryHealth}
                  onChange={(e) => setBatteryHealth(e.target.value)}
                  placeholder="e.g. 89% (4+ hours backup)"
                  className="w-full h-10 px-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium"
                />
              </div>
            </div>
          )}

          {category !== 'phones' && category !== 'laptops' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Key Specification / Capacity
                </label>
                <input
                  type="text"
                  value={storage}
                  onChange={(e) => setStorage(e.target.value)}
                  placeholder="e.g. 1TB SSD / 144Hz 4K IPS / Bluetooth 5.3"
                  className="w-full h-10 px-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Included Accessories / Box Contents
                </label>
                <input
                  type="text"
                  value={includedAccessories}
                  onChange={(e) => setIncludedAccessories(e.target.value)}
                  placeholder="e.g. 2 Wireless Controllers, HDMI 2.1 Cable, Original Box"
                  className="w-full h-10 px-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium"
                />
              </div>
            </div>
          )}
        </div>

        {/* 4. Per-Product Verification & Ownership Evidence */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                4. Product Verification &amp; Authenticity Proof
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Serial/IMEI numbers are checked against duplicate listings. Only the last 4 digits are shown to buyers.
              </p>
            </div>
            {isHighValue && (
              <Badge className="bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border border-amber-200 text-[10px] font-bold">
                High-Value Listing (≥ ₦800,000) — Proof Recommended
              </Badge>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                {category === 'phones' ? 'IMEI / Serial Number' : 'Serial Number'}
              </label>
              <input
                type="text"
                value={serialOrImei}
                onChange={(e) => setSerialOrImei(e.target.value)}
                placeholder={category === 'phones' ? '15-digit IMEI or Serial' : 'Device Serial Number'}
                className="w-full h-10 px-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Repair History
              </label>
              <select
                value={repairHistory}
                onChange={(e) => setRepairHistory(e.target.value)}
                className="w-full h-10 px-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium"
              >
                <option value="No prior repairs (All original parts)">
                  No prior repairs (All original parts)
                </option>
                <option value="Battery replaced">Battery replaced</option>
                <option value="Screen replaced">Screen replaced</option>
                <option value="Manufacturer refurbished">Manufacturer refurbished</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Warranty Coverage
              </label>
              <input
                type="text"
                value={warrantyInfo}
                onChange={(e) => setWarrantyInfo(e.target.value)}
                placeholder="e.g. 7-Day Inspection + 30-Day Store Warranty"
                className="w-full h-10 px-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium"
              />
            </div>
          </div>

          {/* Ownership / Purchase Proof Upload */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-0.5 text-xs">
              <p className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-blue-600" />
                <span>Ownership / Purchase Proof or Serial Screen Photo (Optional)</span>
              </p>
              <p className="text-[11px] text-slate-400">
                Upload invoice, receipt, or a photo of the device&apos;s About screen to earn the Product Verified badge. Kept strictly private.
              </p>
            </div>

            <label className="px-4 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-blue-500 text-xs font-bold cursor-pointer shrink-0 transition text-center">
              <input
                type="file"
                accept="image/*,.pdf"
                className="hidden"
                onChange={handleOwnershipProofUpload}
              />
              {uploadingProof ? (
                <span className="inline-flex items-center gap-1.5">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
                  Uploading...
                </span>
              ) : ownershipProofUrl ? (
                <span className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Evidence Attached
                </span>
              ) : (
                <span>Attach Proof</span>
              )}
            </label>
          </div>
        </div>

        {/* 5. Real Hardware Photos & Description */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xs space-y-5">
          <div>
            <h2 className="text-sm font-black text-slate-900 dark:text-white">
              5. Real Device Photos &amp; Condition Notes
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Upload up to 8 clear photos of the actual hardware (front, back, edges, and screen).
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {images.map((url, idx) => (
              <div
                key={idx}
                className="relative aspect-square rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 overflow-hidden flex items-center justify-center p-2"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={url}
                  alt={`Device photo ${idx + 1}`}
                  className="max-h-full max-w-full object-contain"
                />
                {idx === 0 && (
                  <span className="absolute bottom-2 left-2 bg-blue-600 text-white text-[9px] font-black uppercase px-2 py-0.5 rounded-md">
                    Main Photo
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => removeImage(idx)}
                  className="absolute top-2 right-2 w-6 h-6 rounded-full bg-slate-900/80 text-white flex items-center justify-center hover:bg-red-600 transition cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}

            {images.length < 8 && (
              <label className="aspect-square rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 bg-slate-50/60 dark:bg-slate-800/30 flex flex-col items-center justify-center gap-1.5 cursor-pointer transition p-4 text-center">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleImageFilesChange}
                />
                {uploadingImages ? (
                  <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                ) : (
                  <Upload className="w-6 h-6 text-slate-400" />
                )}
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  {uploadingImages ? 'Uploading...' : 'Add Photos'}
                </span>
                <span className="text-[10px] text-slate-400">
                  {images.length}/8 uploaded
                </span>
              </label>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Detailed Condition &amp; Package Notes
            </label>
            <textarea
              rows={4}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe physical condition, battery performance, included charger/accessories, and any minor scratches..."
              className="w-full p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-base sm:text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-[11px] text-slate-400">
              Your verified seller status is already active — no additional identity documents required.
            </p>
            <Button
              type="submit"
              disabled={submitting || uploadingImages}
              className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl h-11 px-8 cursor-pointer gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Publishing Listing...</span>
                </>
              ) : (
                <span>Publish Product Listing</span>
              )}
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}