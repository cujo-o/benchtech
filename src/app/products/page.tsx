'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { Navbar } from '@/components/Navbar'
import { BuyerSidebar } from '@/components/storefront/BuyerSidebar'
import { SaveButton } from '@/components/SaveButton'
import { AddToCartButton } from '@/components/cart/AddToCartButton'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import {
  SlidersHorizontal,
  X,
  ChevronDown,
  ChevronUp,
  Check,
  Search,
  ArrowUpDown,
  Smartphone,
  Laptop,
  Gamepad2,
  Headphones,
  Camera,
  Network,
  Home as HomeIcon,
  Watch,
  Tablet,
  Monitor,
  Grid,
  MapPin,
  Sparkles,
  Package,
  ShieldCheck,
  Scale,
} from 'lucide-react'

// Categories
const CATEGORIES = [
  { id: 'all', label: 'All Catalog', icon: Grid },
  { id: 'phones', label: 'Phones', icon: Smartphone },
  { id: 'laptops', label: 'Laptops', icon: Laptop },
  { id: 'gaming', label: 'Gaming', icon: Gamepad2 },
  { id: 'tablets', label: 'Tablets', icon: Tablet },
  { id: 'accessories', label: 'Accessories', icon: Headphones },
  { id: 'cameras', label: 'Cameras', icon: Camera },
  { id: 'networking', label: 'Networking', icon: Network },
  { id: 'monitors', label: 'Monitors', icon: Monitor },
  { id: 'wearables', label: 'Wearables', icon: Watch },
  { id: 'smarthome', label: 'Smart Home', icon: HomeIcon },
]

// Filter Criteria (Amazon Style Facets)
const BRANDS = ['Apple', 'Dell', 'HP', 'Lenovo', 'Samsung', 'ASUS', 'Sony', 'Acer', 'Microsoft']
const RAM_SIZES = ['4GB', '8GB', '16GB', '32GB', '64GB+']
const STORAGE_SIZES = ['128GB', '256GB', '512GB', '1TB', '2TB+']
const CONDITIONS = [
  { id: 'brand_new', label: 'Brand New' },
  { id: 'open_box', label: 'Open Box' },
  { id: 'refurbished', label: 'Refurbished' },
  { id: 'used', label: 'Fairly Used' },
]
const ABUJA_HUBS = [
  'Banex Plaza',
  'Emab Plaza',
  'Wuse 2',
  'Garki',
  'Central Area (CBD)',
  'Maitama',
  'Gwarinpa',
  'Apo',
]
const PRICE_BUCKETS = [
  { label: 'Under ₦150k', min: 0, max: 150000 },
  { label: '₦150k – ₦350k', min: 150000, max: 350000 },
  { label: '₦350k – ₦750k', min: 350000, max: 750000 },
  { label: '₦750k – ₦1.5M', min: 750000, max: 1500000 },
  { label: 'Above ₦1.5M', min: 1500000, max: 999999999 },
]

export default function ProductsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false)

  // Filter States
  const [selectedCategory, setSelectedCategory] = useState<string>(searchParams.get('category') || 'all')
  const [searchQuery, setSearchQuery] = useState<string>(searchParams.get('q') || '')
  const [selectedBrands, setSelectedBrands] = useState<string[]>([])
  const [selectedRam, setSelectedRam] = useState<string[]>([])
  const [selectedStorage, setSelectedStorage] = useState<string[]>([])
  const [selectedConditions, setSelectedConditions] = useState<string[]>([])
  const [selectedHubs, setSelectedHubs] = useState<string[]>([])
  const [selectedPriceRange, setSelectedPriceRange] = useState<{ min: number; max: number } | null>(null)
  const [verifiedOnly, setVerifiedOnly] = useState(false)
  const [sortBy, setSortBy] = useState<'newest' | 'price_low' | 'price_high' | 'featured'>('featured')

  // Collapsible Accordion Sections State
  const [openSections, setOpenSections] = useState({
    price: true,
    brand: true,
    ram: true,
    condition: true,
    hub: false,
    storage: false,
  })

  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }))
  }

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  // Fetch published products
  useEffect(() => {
    async function loadProducts() {
      setLoading(true)
      const { data } = await supabase
        .from('products')
        .select('*, profiles!products_seller_id_fkey(business_name, district, tech_trust_status)')
        .eq('status', 'published')
        .order('is_featured', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: false })

      setProducts(data || [])
      setLoading(false)
    }
    loadProducts()
  }, [supabase])

  // Multi-facet filtering logic
  const filteredProducts = useMemo(() => {
    return products
      .filter((item) => {
        // Category
        if (selectedCategory !== 'all' && item.category?.toLowerCase() !== selectedCategory.toLowerCase()) {
          return false
        }
        // Search text
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase()
          const matchTitle = item.title?.toLowerCase().includes(q)
          const matchBrand = item.brand?.toLowerCase().includes(q)
          const matchDesc = item.description?.toLowerCase().includes(q)
          if (!matchTitle && !matchBrand && !matchDesc) return false
        }
        // Brand filter
        if (selectedBrands.length > 0 && !selectedBrands.some((b) => item.brand?.toLowerCase() === b.toLowerCase())) {
          return false
        }
        // Condition filter
        if (selectedConditions.length > 0 && !selectedConditions.includes(item.condition)) {
          return false
        }
        // Hub / District filter
        if (selectedHubs.length > 0) {
          const district = item.profiles?.district || ''
          if (!selectedHubs.some((h) => district.toLowerCase().includes(h.toLowerCase()))) {
            return false
          }
        }
        // Price filter
        if (selectedPriceRange) {
          const price = Number(item.price) || 0
          if (price < selectedPriceRange.min || price > selectedPriceRange.max) {
            return false
          }
        }
        // Verified seller only
        if (verifiedOnly && item.profiles?.tech_trust_status !== 'verified') {
          return false
        }
        // RAM filter (checks specs or title)
        if (selectedRam.length > 0) {
          const content = `${item.title} ${item.description} ${item.ram || ''}`.toUpperCase()
          if (!selectedRam.some((r) => content.includes(r.toUpperCase()))) {
            return false
          }
        }
        // Storage filter
        if (selectedStorage.length > 0) {
          const content = `${item.title} ${item.description} ${item.storage || ''}`.toUpperCase()
          if (!selectedStorage.some((s) => content.includes(s.toUpperCase()))) {
            return false
          }
        }
        return true
      })
      .sort((a, b) => {
        if (sortBy === 'price_low') return Number(a.price) - Number(b.price)
        if (sortBy === 'price_high') return Number(b.price) - Number(a.price)
        if (sortBy === 'newest') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        // default: featured first
        return (b.is_featured ? 1 : 0) - (a.is_featured ? 1 : 0)
      })
  }, [
    products,
    selectedCategory,
    searchQuery,
    selectedBrands,
    selectedConditions,
    selectedHubs,
    selectedPriceRange,
    verifiedOnly,
    selectedRam,
    selectedStorage,
    sortBy,
  ])

  // Count active filters
  const activeFilterCount =
    (selectedCategory !== 'all' ? 1 : 0) +
    selectedBrands.length +
    selectedConditions.length +
    selectedHubs.length +
    selectedRam.length +
    selectedStorage.length +
    (selectedPriceRange ? 1 : 0) +
    (verifiedOnly ? 1 : 0)

  const clearAllFilters = () => {
    setSelectedCategory('all')
    setSelectedBrands([])
    setSelectedRam([])
    setSelectedStorage([])
    setSelectedConditions([])
    setSelectedHubs([])
    setSelectedPriceRange(null)
    setVerifiedOnly(false)
    setSearchQuery('')
  }

  // Toggle helper for checkbox arrays
  const toggleItem = (list: string[], setList: (val: string[]) => void, item: string) => {
    if (list.includes(item)) {
      setList(list.filter((x) => x !== item))
    } else {
      setList([...list, item])
    }
  }

  // Reusable Amazon-Style Accordion Filter Content
  const FacetedFilters = () => (
    <div className="space-y-5 text-xs text-slate-700">
      {/* TechTrust Verified Filter */}
      <div className="p-3 bg-emerald-50/70 border border-emerald-200/80 rounded-2xl flex items-center justify-between">
        <label className="flex items-center gap-2 cursor-pointer font-bold text-emerald-950">
          <input
            type="checkbox"
            checked={verifiedOnly}
            onChange={(e) => setVerifiedOnly(e.target.checked)}
            className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
          />
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Verified Dealers Only
          </span>
        </label>
      </div>

      {/* Price Range */}
      <div className="border-b border-slate-100 pb-4">
        <button
          onClick={() => toggleSection('price')}
          className="w-full flex items-center justify-between font-bold text-slate-900 mb-2.5"
        >
          <span>Price Budget (NGN)</span>
          {openSections.price ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </button>
        {openSections.price && (
          <div className="space-y-1.5 pl-0.5">
            {PRICE_BUCKETS.map((b, i) => {
              const isSelected = selectedPriceRange?.min === b.min && selectedPriceRange?.max === b.max
              return (
                <label key={i} className="flex items-center gap-2.5 cursor-pointer py-0.5 hover:text-blue-600">
                  <input
                    type="radio"
                    name="price_bucket"
                    checked={isSelected}
                    onChange={() => setSelectedPriceRange(isSelected ? null : b)}
                    onClick={() => {
                      if (isSelected) setSelectedPriceRange(null)
                    }}
                    className="w-3.5 h-3.5 text-blue-600"
                  />
                  <span className={isSelected ? 'font-bold text-blue-600' : 'text-slate-600'}>{b.label}</span>
                </label>
              )
            })}
          </div>
        )}
      </div>

      {/* Brand */}
      <div className="border-b border-slate-100 pb-4">
        <button
          onClick={() => toggleSection('brand')}
          className="w-full flex items-center justify-between font-bold text-slate-900 mb-2.5"
        >
          <span>Brand</span>
          {openSections.brand ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </button>
        {openSections.brand && (
          <div className="space-y-1.5 pl-0.5">
            {BRANDS.map((brand) => (
              <label key={brand} className="flex items-center gap-2.5 cursor-pointer py-0.5 hover:text-blue-600">
                <input
                  type="checkbox"
                  checked={selectedBrands.includes(brand)}
                  onChange={() => toggleItem(selectedBrands, setSelectedBrands, brand)}
                  className="w-3.5 h-3.5 rounded text-blue-600"
                />
                <span className={selectedBrands.includes(brand) ? 'font-bold text-blue-600' : 'text-slate-600'}>
                  {brand}
                </span>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* RAM Size */}
      <div className="border-b border-slate-100 pb-4">
        <button
          onClick={() => toggleSection('ram')}
          className="w-full flex items-center justify-between font-bold text-slate-900 mb-2.5"
        >
          <span>RAM Capacity</span>
          {openSections.ram ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </button>
        {openSections.ram && (
          <div className="space-y-1.5 pl-0.5">
            {RAM_SIZES.map((ram) => (
              <label key={ram} className="flex items-center gap-2.5 cursor-pointer py-0.5 hover:text-blue-600">
                <input
                  type="checkbox"
                  checked={selectedRam.includes(ram)}
                  onChange={() => toggleItem(selectedRam, setSelectedRam, ram)}
                  className="w-3.5 h-3.5 rounded text-blue-600"
                />
                <span className={selectedRam.includes(ram) ? 'font-bold text-blue-600' : 'text-slate-600'}>
                  {ram}
                </span>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Physical Condition */}
      <div className="border-b border-slate-100 pb-4">
        <button
          onClick={() => toggleSection('condition')}
          className="w-full flex items-center justify-between font-bold text-slate-900 mb-2.5"
        >
          <span>Condition</span>
          {openSections.condition ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </button>
        {openSections.condition && (
          <div className="space-y-1.5 pl-0.5">
            {CONDITIONS.map((c) => (
              <label key={c.id} className="flex items-center gap-2.5 cursor-pointer py-0.5 hover:text-blue-600">
                <input
                  type="checkbox"
                  checked={selectedConditions.includes(c.id)}
                  onChange={() => toggleItem(selectedConditions, setSelectedConditions, c.id)}
                  className="w-3.5 h-3.5 rounded text-blue-600"
                />
                <span className={selectedConditions.includes(c.id) ? 'font-bold text-blue-600' : 'text-slate-600'}>
                  {c.label}
                </span>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Abuja Tech Hub Location */}
      <div className="border-b border-slate-100 pb-4">
        <button
          onClick={() => toggleSection('hub')}
          className="w-full flex items-center justify-between font-bold text-slate-900 mb-2.5"
        >
          <span>Abuja Hub Location</span>
          {openSections.hub ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </button>
        {openSections.hub && (
          <div className="space-y-1.5 pl-0.5">
            {ABUJA_HUBS.map((hub) => (
              <label key={hub} className="flex items-center gap-2.5 cursor-pointer py-0.5 hover:text-blue-600">
                <input
                  type="checkbox"
                  checked={selectedHubs.includes(hub)}
                  onChange={() => toggleItem(selectedHubs, setSelectedHubs, hub)}
                  className="w-3.5 h-3.5 rounded text-blue-600"
                />
                <span className={selectedHubs.includes(hub) ? 'font-bold text-blue-600' : 'text-slate-600'}>
                  {hub}
                </span>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Internal Storage */}
      <div>
        <button
          onClick={() => toggleSection('storage')}
          className="w-full flex items-center justify-between font-bold text-slate-900 mb-2.5"
        >
          <span>Storage Capacity</span>
          {openSections.storage ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </button>
        {openSections.storage && (
          <div className="space-y-1.5 pl-0.5">
            {STORAGE_SIZES.map((storage) => (
              <label key={storage} className="flex items-center gap-2.5 cursor-pointer py-0.5 hover:text-blue-600">
                <input
                  type="checkbox"
                  checked={selectedStorage.includes(storage)}
                  onChange={() => toggleItem(selectedStorage, setSelectedStorage, storage)}
                  className="w-3.5 h-3.5 rounded text-blue-600"
                />
                <span className={selectedStorage.includes(storage) ? 'font-bold text-blue-600' : 'text-slate-600'}>
                  {storage}
                </span>
              </label>
            ))}
          </div>
        )}
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      <div className="max-w-[1700px] w-full mx-auto flex flex-1">
        {/* Left Buyer Sidebar (Desktop Only) */}
        <BuyerSidebar />

        <main className="flex-1 min-w-0 p-3 sm:p-5 lg:p-6 space-y-3 sm:space-y-4">
          {/* =========================================================
              1. COMPACT HORIZONTAL CATEGORY CHIPS BAR
          ========================================================= */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none -mx-1 px-1">
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon
              const isSelected = selectedCategory === cat.id
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold shrink-0 transition ${
                    isSelected
                      ? 'bg-blue-600 text-white font-bold shadow-xs'
                      : 'bg-white border border-slate-200 text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-slate-500'}`} />
                  <span>{cat.label}</span>
                </button>
              )
            })}
          </div>

          {/* =========================================================
              2. DESKTOP & MOBILE ACTION TOOLBAR (Sort + Mobile Filter Button)
          ========================================================= */}
          <div className="bg-white p-3 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-slate-900">
                {filteredProducts.length} {filteredProducts.length === 1 ? 'Device' : 'Devices'}
              </span>
              {activeFilterCount > 0 && (
                <button
                  onClick={clearAllFilters}
                  className="text-[11px] font-bold text-red-600 hover:underline flex items-center gap-0.5 ml-2"
                >
                  <X className="w-3 h-3" /> Reset Filters ({activeFilterCount})
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              {/* Sort Selector */}
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <span className="hidden sm:inline font-bold">Sort:</span>
                <select
                  value={sortBy}
                  onChange={(e: any) => setSortBy(e.target.value)}
                  className="h-8 px-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-800 focus:outline-none focus:border-blue-600"
                >
                  <option value="featured">Featured First</option>
                  <option value="newest">Newest Listed</option>
                  <option value="price_low">Price: Low to High</option>
                  <option value="price_high">Price: High to Low</option>
                </select>
              </div>

              {/* Mobile Filter Drawer Trigger (Screens < 1024px) */}
              <Button
                size="sm"
                onClick={() => setMobileDrawerOpen(true)}
                className="lg:hidden h-8 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs gap-1.5 shadow-xs"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>Filters</span>
                {activeFilterCount > 0 && (
                  <span className="w-4 h-4 rounded-full bg-blue-600 text-white text-[9px] flex items-center justify-center">
                    {activeFilterCount}
                  </span>
                )}
              </Button>
            </div>
          </div>

          {/* =========================================================
              3. MAIN CONTENT: DESKTOP LEFT SIDEBAR + 2-COL MOBILE / 4-COL PC GRID
          ========================================================= */}
          <div className="flex gap-6 items-start">
            {/* Desktop Left Filter Sidebar (Hidden on mobile) */}
            <aside className="hidden lg:block w-64 bg-white border border-slate-200/80 rounded-3xl p-5 shadow-xs shrink-0 sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                <h3 className="font-black text-sm text-slate-900 flex items-center gap-1.5">
                  <SlidersHorizontal className="w-4 h-4 text-blue-600" /> Filter Catalogue
                </h3>
                {activeFilterCount > 0 && (
                  <button onClick={clearAllFilters} className="text-[10px] font-bold text-red-600 hover:underline">
                    Clear All
                  </button>
                )}
              </div>

              <FacetedFilters />
            </aside>

            {/* Product Grid Area */}
            <div className="flex-1 min-w-0">
              {loading ? (
                <div className="py-24 text-center text-xs text-slate-400">Loading catalog devices...</div>
              ) : filteredProducts.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-3.5">
                  {filteredProducts.map((item) => {
                    const isFeatured =
                      item.is_featured &&
                      item.featured_until &&
                      new Date(item.featured_until) > new Date()

                    return (
                      <div key={item.id} className="relative group">
                        <SaveButton product={item} />
                        <Link href={`/products/${item.id}`}>
                          <Card
                            className={`h-full rounded-xl sm:rounded-2xl overflow-hidden hover:shadow-md transition bg-white flex flex-col justify-between ${
                              isFeatured
                                ? 'border-2 border-blue-400/80 ring-2 ring-blue-500/10 shadow-2xs'
                                : 'border border-slate-200/80 shadow-2xs'
                            }`}
                          >
                            <div className="aspect-square bg-slate-50 relative overflow-hidden p-2 flex items-center justify-center">
                              {/* Condition / Featured Badges */}
                              <div className="absolute top-2 left-2 flex flex-col gap-1 z-10">
                                {isFeatured && (
                                  <Badge className="bg-blue-600 text-white border-none text-[8px] font-black uppercase tracking-wider flex items-center gap-0.5 shadow-xs px-1.5 py-0">
                                    <Sparkles className="w-2.5 h-2.5" /> Featured
                                  </Badge>
                                )}
                                <Badge className="bg-slate-900/80 backdrop-blur-xs text-white border-none text-[8px] capitalize px-1.5 py-0">
                                  {item.condition?.replace('_', ' ') || 'Good'}
                                </Badge>
                              </div>

                              {item.images?.[0] ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={item.images[0]}
                                  alt={item.title}
                                  className="max-h-full object-contain group-hover:scale-105 transition duration-300"
                                />
                              ) : (
                                <Package className="w-8 h-8 text-slate-300" />
                              )}
                            </div>

                            <CardContent className="p-2.5 sm:p-3.5 flex-1 flex flex-col justify-between space-y-1.5">
                              <div>
                                <h3 className="font-bold text-[11px] sm:text-xs text-slate-900 group-hover:text-blue-600 transition line-clamp-1">
                                  {item.title}
                                </h3>
                                <div className="flex items-center justify-between text-[10px] text-slate-400 mt-0.5">
                                  <span className="uppercase tracking-wider font-semibold truncate max-w-[60px] sm:max-w-none">
                                    {item.brand || 'Device'}
                                  </span>
                                  {item.profiles?.district && (
                                    <span className="flex items-center gap-0.5 text-[9px] sm:text-[10px] shrink-0">
                                      <MapPin className="w-2.5 h-2.5 text-slate-400" />
                                      {item.profiles.district.split(' ')[0]}
                                    </span>
                                  )}
                                </div>
                              </div>

                              <div className="pt-1.5 border-t border-slate-100 flex items-center justify-between">
                                <p className="text-xs sm:text-sm font-black text-slate-900">
                                  ₦{Number(item.price).toLocaleString()}
                                </p>
                                <AddToCartButton product={item} variant="icon" />
                              </div>
                            </CardContent>
                          </Card>
                        </Link>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 space-y-2">
                  <p className="text-xs font-bold text-slate-700">No hardware found matching your active filters.</p>
                  <Button size="sm" onClick={clearAllFilters} variant="outline" className="text-xs font-bold rounded-xl">
                    Clear Filters
                  </Button>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* =========================================================
          4. MOBILE SLIDE-OUT FILTER DRAWER
      ========================================================= */}
      {mobileDrawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileDrawerOpen(false)}
          />
          <div className="relative ml-auto w-80 max-w-[85vw] h-full bg-white z-10 shadow-2xl flex flex-col justify-between">
            {/* Header */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <span className="font-black text-sm text-slate-900 flex items-center gap-1.5">
                <SlidersHorizontal className="w-4 h-4 text-blue-600" /> Filters
              </span>
              <button
                type="button"
                onClick={() => setMobileDrawerOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-900 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Filters Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <FacetedFilters />
            </div>

            {/* Apply & Reset Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={clearAllFilters}
                className="w-1/3 text-xs font-bold rounded-xl h-10 border-slate-200"
              >
                Reset
              </Button>
              <Button
                size="sm"
                onClick={() => setMobileDrawerOpen(false)}
                className="w-2/3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl h-10 shadow-xs"
              >
                Show Results ({filteredProducts.length})
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}