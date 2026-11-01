'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { SaveButton } from '@/components/SaveButton'
import { AddToCartButton } from '@/components/cart/AddToCartButton'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  SlidersHorizontal,
  Search,
  ShieldCheck,
  MapPin,
  Package,
  RotateCcw,
  Smartphone,
  Laptop,
  Gamepad2,
  Monitor,
  Tablet,
  Headphones,
  Camera,
  Cpu,
  Wifi,
  Home,
  Watch,
  LayoutGrid,
  X,
} from 'lucide-react'

export interface ProductsCatalogClientProps {
  initialProducts?: any[]
  products?: any[]
  initialCategory?: string
  initialQuery?: string
  isAuthenticated?: boolean
}

const CATEGORIES = [
  { slug: 'all', label: 'All Catalog', icon: LayoutGrid },
  { slug: 'phones', label: 'Phones', icon: Smartphone },
  { slug: 'laptops', label: 'Laptops', icon: Laptop },
  { slug: 'gaming', label: 'Gaming', icon: Gamepad2 },
  { slug: 'tablets', label: 'Tablets', icon: Tablet },
  { slug: 'accessories', label: 'Accessories', icon: Headphones },
  { slug: 'cameras', label: 'Cameras', icon: Camera },
  { slug: 'components', label: 'Components', icon: Cpu },
  { slug: 'networking', label: 'Networking', icon: Wifi },
  { slug: 'monitors', label: 'Monitors', icon: Monitor },
  { slug: 'wearables', label: 'Wearables', icon: Watch },
  { slug: 'smart_home', label: 'Smart Home', icon: Home },
]

const PRICE_BRACKETS = [
  { id: 'all', label: 'Any Price', min: 0, max: Infinity },
  { id: 'under_150k', label: 'Under ₦150k', min: 0, max: 150000 },
  { id: '150k_350k', label: '₦150k – ₦350k', min: 150000, max: 350000 },
  { id: '350k_750k', label: '₦350k – ₦750k', min: 350000, max: 750000 },
  { id: '750k_1_5m', label: '₦750k – ₦1.5M', min: 750000, max: 1500000 },
  { id: 'above_1_5m', label: 'Above ₦1.5M', min: 1500000, max: Infinity },
]

const CONDITIONS = [
  { id: 'brand_new', label: 'Brand New (Sealed)' },
  { id: 'open_box', label: 'Open Box / Mint' },
  { id: 'uk_used', label: 'Foreign Used (Clean)' },
  { id: 'fairly_used', label: 'Direct Used' },
]

const RAM_OPTIONS = ['4GB', '8GB', '12GB', '16GB', '32GB', '64GB']
const STORAGE_OPTIONS = ['128GB', '256GB', '512GB', '1TB', '2TB']

const ABUJA_DISTRICTS = [
  'Wuse 2',
  'Banex',
  'Gwarinpa',
  'Maitama',
  'Garki',
  'Utako',
  'Jabi',
  'Lugbe',
  'Central Area',
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

export function ProductsCatalogClient({
  initialProducts = [],
  products,
  initialCategory = 'all',
  initialQuery = '',
  isAuthenticated = false,
}: ProductsCatalogClientProps) {
  const catalogItems = products || initialProducts

  // Filter Drawer/Panel is INACTIVE (closed) by default
  const [showFilters, setShowFilters] = useState(false)

  // Search, Category & Sort State
  const [category, setCategory] = useState(initialCategory.toLowerCase())
  const [searchQuery, setSearchQuery] = useState(initialQuery)
  const [sortBy, setSortBy] = useState<
    'featured' | 'newest' | 'price_asc' | 'price_desc'
  >('featured')

  // Granular Filter States (All inactive by default)
  const [verifiedOnly, setVerifiedOnly] = useState(false)
  const [serialVerifiedOnly, setSerialVerifiedOnly] = useState(false)
  const [priceBracket, setPriceBracket] = useState('all')
  const [minPriceInput, setMinPriceInput] = useState('')
  const [maxPriceInput, setMaxPriceInput] = useState('')
  const [selectedBrands, setSelectedBrands] = useState<string[]>([])
  const [selectedConditions, setSelectedConditions] = useState<string[]>([])
  const [selectedRam, setSelectedRam] = useState<string[]>([])
  const [selectedStorage, setSelectedStorage] = useState<string[]>([])
  const [selectedDistricts, setSelectedDistricts] = useState<string[]>([])

  // Dynamically extract available brands from catalog + standard brands
  const availableBrands = useMemo(() => {
    const base = new Set([
      'Apple',
      'Samsung',
      'HP',
      'Dell',
      'Lenovo',
      'Sony',
      'ASUS',
      'Hisense',
      'Microsoft',
      'Canon',
    ])
    for (const item of catalogItems) {
      if (item.brand && typeof item.brand === 'string') {
        const clean = item.brand.trim()
        if (clean.length > 1 && clean.toLowerCase() !== 'generic') {
          base.add(clean)
        }
      }
    }
    return Array.from(base).slice(0, 14)
  }, [catalogItems])

  function toggleArrayFilter(
    list: string[],
    setList: (val: string[]) => void,
    value: string
  ) {
    setList(
      list.includes(value)
        ? list.filter((item) => item !== value)
        : [...list, value]
    )
  }

  function clearAllFilters() {
    setVerifiedOnly(false)
    setSerialVerifiedOnly(false)
    setPriceBracket('all')
    setMinPriceInput('')
    setMaxPriceInput('')
    setSelectedBrands([])
    setSelectedConditions([])
    setSelectedRam([])
    setSelectedStorage([])
    setSelectedDistricts([])
    setSearchQuery('')
    setCategory('all')
  }

  const activeFilterCount =
    (verifiedOnly ? 1 : 0) +
    (serialVerifiedOnly ? 1 : 0) +
    (priceBracket !== 'all' ? 1 : 0) +
    (minPriceInput || maxPriceInput ? 1 : 0) +
    selectedBrands.length +
    selectedConditions.length +
    selectedRam.length +
    selectedStorage.length +
    selectedDistricts.length

  const filteredProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    const bracketObj =
      PRICE_BRACKETS.find((b) => b.id === priceBracket) || PRICE_BRACKETS[0]
    const customMin = minPriceInput ? Number(minPriceInput) : null
    const customMax = maxPriceInput ? Number(maxPriceInput) : null

    return catalogItems
      .filter((item) => {
        // 1. Category
        if (
          category !== 'all' &&
          (item.category || '').toLowerCase() !== category
        ) {
          return false
        }

        // 2. Search Query (Title, Brand, Model, Specs)
        if (q) {
          const specText = JSON.stringify(item.specs || {}).toLowerCase()
          const hay = `${item.title || ''} ${item.brand || ''} ${
            item.model || ''
          } ${item.category || ''} ${specText}`.toLowerCase()
          if (!hay.includes(q)) return false
        }

        const sellerProfile = Array.isArray(item.profiles)
          ? item.profiles[0]
          : item.profiles

        // 3. Verified Sellers Only
        if (
          verifiedOnly &&
          sellerProfile?.tech_trust_status !== 'verified'
        ) {
          return false
        }

        // 4. Serial / IMEI Verified Only
        if (
          serialVerifiedOnly &&
          !item.specs?.serial_masked &&
          !item.specs?.serial_number
        ) {
          return false
        }

        // 5. Price Range
        const price = Number(item.price || 0)
        if (price < bracketObj.min || price > bracketObj.max) return false
        if (customMin !== null && price < customMin) return false
        if (customMax !== null && price > customMax) return false

        // 6. Brand
        if (selectedBrands.length > 0) {
          const itemBrand = (item.brand || '').toLowerCase()
          const titleLower = (item.title || '').toLowerCase()
          const matchesBrand = selectedBrands.some(
            (b) =>
              itemBrand.includes(b.toLowerCase()) ||
              titleLower.includes(b.toLowerCase())
          )
          if (!matchesBrand) return false
        }

        // 7. Condition
        if (selectedConditions.length > 0) {
          const itemCond = (item.condition || '').toLowerCase()
          if (!selectedConditions.includes(itemCond)) return false
        }

        // 8. RAM Capacity
        if (selectedRam.length > 0) {
          const ramStr = `${item.specs?.ram || ''} ${
            item.title || ''
          }`.toUpperCase()
          const matchesRam = selectedRam.some((r) => ramStr.includes(r))
          if (!matchesRam) return false
        }

        // 9. Storage Capacity
        if (selectedStorage.length > 0) {
          const storageStr = `${item.specs?.storage || ''} ${
            item.title || ''
          }`.toUpperCase()
          const matchesStorage = selectedStorage.some((s) =>
            storageStr.includes(s)
          )
          if (!matchesStorage) return false
        }

        // 10. Abuja District
        if (selectedDistricts.length > 0) {
          const itemDist = `${sellerProfile?.district || ''} ${
            item.location || ''
          }`.toLowerCase()
          const matchesDist = selectedDistricts.some((d) =>
            itemDist.includes(d.toLowerCase())
          )
          if (!matchesDist) return false
        }

        return true
      })
      .sort((a, b) => {
        if (sortBy === 'price_asc') return Number(a.price) - Number(b.price)
        if (sortBy === 'price_desc') return Number(b.price) - Number(a.price)
        if (sortBy === 'newest') {
          return (
            new Date(b.created_at || 0).getTime() -
            new Date(a.created_at || 0).getTime()
          )
        }
        // Default: Featured / Sponsored first
        const aFeat = a.is_featured ? 1 : 0
        const bFeat = b.is_featured ? 1 : 0
        if (aFeat !== bFeat) return bFeat - aFeat
        return (
          new Date(b.created_at || 0).getTime() -
          new Date(a.created_at || 0).getTime()
        )
      })
  }, [
    catalogItems,
    category,
    searchQuery,
    sortBy,
    verifiedOnly,
    serialVerifiedOnly,
    priceBracket,
    minPriceInput,
    maxPriceInput,
    selectedBrands,
    selectedConditions,
    selectedRam,
    selectedStorage,
    selectedDistricts,
  ])

  return (
    <div className="space-y-5">
      {/* 1. Category Pills Strip */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1.5 [scrollbar-width:none]">
        {CATEGORIES.map((cat) => {
          const Icon = cat.icon
          const active = category === cat.slug
          return (
            <button
              key={cat.slug}
              type="button"
              onClick={() => setCategory(cat.slug)}
              className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold shrink-0 transition cursor-pointer ${
                active
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-blue-500'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{cat.label}</span>
            </button>
          )
        })}
      </div>

      {/* 2. Top Controls Bar (Device Count, Search, Show/Hide Filters Button, Sort Dropdown) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 sm:px-5 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-500 dark:text-slate-400">
            <strong className="font-black text-slate-900 dark:text-white">
              {filteredProducts.length}{' '}
              {filteredProducts.length === 1 ? 'Device' : 'Devices'}
            </strong>{' '}
            available in Abuja
          </span>

          {activeFilterCount > 0 && (
            <button
              type="button"
              onClick={clearAllFilters}
              className="inline-flex items-center gap-1 text-[11px] font-bold text-red-600 hover:underline cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset ({activeFilterCount})</span>
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
          {/* Quick Inline Search */}
          <div className="relative flex-1 sm:w-56">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter by model, RAM, SSD..."
              className="w-full h-9 pl-8 pr-7 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Toggle Filter Panel Button (Inactive by Default) */}
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className={`h-9 px-3.5 rounded-xl border text-xs font-bold inline-flex items-center gap-1.5 transition cursor-pointer ${
              showFilters || activeFilterCount > 0
                ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400'
                : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>{showFilters ? 'Hide Filters' : 'Filter Devices'}</span>
            {activeFilterCount > 0 && (
              <span className="bg-blue-600 text-white text-[10px] font-black px-1.5 py-0.2 rounded-full">
                {activeFilterCount}
              </span>
            )}
          </button>

          {/* Sort Select */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-slate-400 font-semibold hidden md:inline">
              Sort:
            </span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="h-9 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white focus:outline-none"
            >
              <option value="featured">Featured First</option>
              <option value="newest">Newest Arrivals</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* 3. Main Content Area: Optional Filter Sidebar + Product Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {showFilters && (
          <aside className="lg:col-span-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs space-y-5 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <span className="font-black text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-blue-600" />
                <span>Filter Hardware</span>
              </span>
              {activeFilterCount > 0 && (
                <button
                  type="button"
                  onClick={clearAllFilters}
                  className="text-[11px] font-bold text-blue-600 hover:underline cursor-pointer"
                >
                  Clear All
                </button>
              )}
            </div>

            {/* Trust & Verification Toggles */}
            <div className="space-y-2">
              <label className="flex items-center gap-2.5 p-2.5 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-900/60 cursor-pointer">
                <input
                  type="checkbox"
                  checked={verifiedOnly}
                  onChange={(e) => setVerifiedOnly(e.target.checked)}
                  className="rounded border-slate-300 text-emerald-600"
                />
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="font-bold text-emerald-950 dark:text-emerald-200">
                  Verified Sellers Only
                </span>
              </label>

              <label className="flex items-center gap-2.5 p-2.5 rounded-xl bg-blue-50/50 dark:bg-blue-950/30 border border-blue-200/70 dark:border-blue-900/60 cursor-pointer">
                <input
                  type="checkbox"
                  checked={serialVerifiedOnly}
                  onChange={(e) => setSerialVerifiedOnly(e.target.checked)}
                  className="rounded border-slate-300 text-blue-600"
                />
                <span className="font-bold text-blue-950 dark:text-blue-200">
                  Serial / IMEI Logged Only
                </span>
              </label>
            </div>

            {/* Price Budget */}
            <div className="space-y-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <span className="font-black text-slate-900 dark:text-white block">
                Price Budget
              </span>
              <div className="space-y-1.5">
                {PRICE_BRACKETS.map((b) => (
                  <label
                    key={b.id}
                    className="flex items-center gap-2 text-slate-600 dark:text-slate-300 cursor-pointer"
                  >
                    <input
                      type="radio"
                      name="priceBracket"
                      checked={priceBracket === b.id}
                      onChange={() => setPriceBracket(b.id)}
                      className="text-blue-600"
                    />
                    <span>{b.label}</span>
                  </label>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-2 pt-1.5">
                <input
                  type="number"
                  value={minPriceInput}
                  onChange={(e) => setMinPriceInput(e.target.value)}
                  placeholder="Min ₦"
                  className="h-8 px-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-semibold"
                />
                <input
                  type="number"
                  value={maxPriceInput}
                  onChange={(e) => setMaxPriceInput(e.target.value)}
                  placeholder="Max ₦"
                  className="h-8 px-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-semibold"
                />
              </div>
            </div>

            {/* Device Condition */}
            <div className="space-y-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <span className="font-black text-slate-900 dark:text-white block">
                Device Condition
              </span>
              <div className="space-y-1.5">
                {CONDITIONS.map((c) => (
                  <label
                    key={c.id}
                    className="flex items-center gap-2 text-slate-600 dark:text-slate-300 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedConditions.includes(c.id)}
                      onChange={() =>
                        toggleArrayFilter(
                          selectedConditions,
                          setSelectedConditions,
                          c.id
                        )
                      }
                      className="rounded border-slate-300 text-blue-600"
                    />
                    <span>{c.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* RAM Capacity */}
            <div className="space-y-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <span className="font-black text-slate-900 dark:text-white block">
                RAM Memory
              </span>
              <div className="flex flex-wrap gap-1.5">
                {RAM_OPTIONS.map((ram) => {
                  const active = selectedRam.includes(ram)
                  return (
                    <button
                      key={ram}
                      type="button"
                      onClick={() =>
                        toggleArrayFilter(selectedRam, setSelectedRam, ram)
                      }
                      className={`px-2.5 py-1 rounded-lg border text-[11px] font-bold transition cursor-pointer ${
                        active
                          ? 'border-blue-600 bg-blue-600 text-white'
                          : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {ram}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Storage Capacity */}
            <div className="space-y-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <span className="font-black text-slate-900 dark:text-white block">
                Storage Capacity
              </span>
              <div className="flex flex-wrap gap-1.5">
                {STORAGE_OPTIONS.map((st) => {
                  const active = selectedStorage.includes(st)
                  return (
                    <button
                      key={st}
                      type="button"
                      onClick={() =>
                        toggleArrayFilter(
                          selectedStorage,
                          setSelectedStorage,
                          st
                        )
                      }
                      className={`px-2.5 py-1 rounded-lg border text-[11px] font-bold transition cursor-pointer ${
                        active
                          ? 'border-blue-600 bg-blue-600 text-white'
                          : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {st}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Brands */}
            <div className="space-y-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <span className="font-black text-slate-900 dark:text-white block">
                Brands
              </span>
              <div className="grid grid-cols-2 gap-1.5">
                {availableBrands.map((brand) => (
                  <label
                    key={brand}
                    className="flex items-center gap-2 text-slate-600 dark:text-slate-300 cursor-pointer truncate"
                  >
                    <input
                      type="checkbox"
                      checked={selectedBrands.includes(brand)}
                      onChange={() =>
                        toggleArrayFilter(
                          selectedBrands,
                          setSelectedBrands,
                          brand
                        )
                      }
                      className="rounded border-slate-300 text-blue-600"
                    />
                    <span className="truncate">{brand}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Abuja Hub Location */}
            <div className="space-y-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <span className="font-black text-slate-900 dark:text-white block">
                Abuja Hub Location
              </span>
              <div className="grid grid-cols-2 gap-1.5">
                {ABUJA_DISTRICTS.map((dist) => (
                  <label
                    key={dist}
                    className="flex items-center gap-2 text-slate-600 dark:text-slate-300 cursor-pointer truncate"
                  >
                    <input
                      type="checkbox"
                      checked={selectedDistricts.includes(dist)}
                      onChange={() =>
                        toggleArrayFilter(
                          selectedDistricts,
                          setSelectedDistricts,
                          dist
                        )
                      }
                      className="rounded border-slate-300 text-blue-600"
                    />
                    <span className="truncate">{dist}</span>
                  </label>
                ))}
              </div>
            </div>
          </aside>
        )}

        {/* Product Cards Grid */}
        <div className={showFilters ? 'lg:col-span-9' : 'lg:col-span-12'}>
          {filteredProducts.length > 0 ? (
            <div
              className={`grid grid-cols-2 sm:grid-cols-3 ${
                showFilters ? 'xl:grid-cols-3' : 'xl:grid-cols-4'
              } gap-3.5 sm:gap-4`}
            >
              {filteredProducts.map((product) => {
                const firstImage = resolveFirstImage(product.images)
                const sellerProfile = Array.isArray(product.profiles)
                  ? product.profiles[0]
                  : product.profiles
                const sellerName =
                  sellerProfile?.business_name ||
                  sellerProfile?.full_name ||
                  'Abuja Store'
                const isVerifiedSeller =
                  sellerProfile?.tech_trust_status === 'verified'
                const district =
                  sellerProfile?.district || product.location || 'Abuja'

                const quickSpecs = [
                  product.specs?.ram,
                  product.specs?.storage,
                  product.specs?.battery_health
                    ? `${product.specs.battery_health} Battery`
                    : null,
                ]
                  .filter(Boolean)
                  .slice(0, 2)

                return (
                  <div
                    key={product.id}
                    className="relative bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 hover:border-blue-500/60 dark:hover:border-blue-500/60 rounded-2xl overflow-hidden flex flex-col justify-between transition shadow-2xs hover:shadow-md"
                  >
                    {isAuthenticated && <SaveButton product={product} />}

                    <Link
                      href={`/products/${product.id}`}
                      className="group flex-1 flex flex-col justify-between"
                    >
                      <div className="relative aspect-[4/3] w-full bg-slate-100/80 dark:bg-slate-800/60 flex items-center justify-center p-3 overflow-hidden border-b border-slate-100 dark:border-slate-800">
                        <div className="absolute top-2.5 left-2.5 z-10 flex flex-col gap-1">
                          {product.is_featured && (
                            <span className="bg-emerald-600 text-white text-[9px] font-black uppercase px-2 py-0.5 rounded-md shadow-2xs w-fit">
                              Featured
                            </span>
                          )}
                          <span className="bg-slate-900/85 text-white text-[9px] font-bold uppercase px-2 py-0.5 rounded-md backdrop-blur-xs w-fit">
                            {product.condition?.replace(/_/g, ' ') || 'Used'}
                          </span>
                        </div>

                        {firstImage ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={firstImage}
                            alt={product.title}
                            loading="lazy"
                            className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <Package className="w-8 h-8 text-slate-300 dark:text-slate-600" />
                        )}
                      </div>

                      <div className="p-3 sm:p-3.5 space-y-1.5">
                        <div className="flex items-center justify-between gap-1 text-[10px] font-bold uppercase text-slate-400">
                          <span className="truncate">
                            {product.brand || product.category || 'Hardware'}
                          </span>
                          <span className="flex items-center gap-0.5 shrink-0">
                            <MapPin className="w-2.5 h-2.5" />
                            {district}
                          </span>
                        </div>

                        <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition line-clamp-1">
                          {product.title}
                        </h3>

                        {quickSpecs.length > 0 && (
                          <div className="flex flex-wrap gap-1 pt-0.5">
                            {quickSpecs.map((sp, i) => (
                              <span
                                key={i}
                                className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px] font-semibold text-slate-600 dark:text-slate-300"
                              >
                                {sp}
                              </span>
                            ))}
                          </div>
                        )}

                        <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400 truncate pt-0.5">
                          <span className="truncate font-medium">
                            {sellerName}
                          </span>
                          {isVerifiedSeller && (
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                          )}
                        </div>
                      </div>
                    </Link>

                    <div className="px-3 sm:px-3.5 pb-3 pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2">
                      <span className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
                        ₦{Number(product.price).toLocaleString()}
                      </span>

                      {isAuthenticated ? (
                        <AddToCartButton product={product} variant="icon" />
                      ) : (
                        <Link
                          href={`/products/${product.id}`}
                          className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          Inspect &rarr;
                        </Link>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-12 text-center space-y-3">
              <Package className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
              <div className="space-y-1">
                <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  No devices match your current filter
                </p>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Try clearing your active filters or broadcast a custom device request to verified Abuja sellers.
                </p>
              </div>
              <div className="flex items-center justify-center gap-2.5 pt-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={clearAllFilters}
                  className="text-xs font-bold rounded-xl h-9 px-4 cursor-pointer"
                >
                  Reset Filters
                </Button>
                {isAuthenticated && (
                  <Link href="/requests/new">
                    <Button
                      size="sm"
                      className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl h-9 px-4 cursor-pointer"
                    >
                      Request This Device
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}