import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/Navbar'
import { BuyerSidebar } from '@/components/storefront/BuyerSidebar'
import { AddToCartButton } from '@/components/cart/AddToCartButton'
import { CompareButton } from '@/components/CompareButton'
import { SaveButton } from '@/components/SaveButton'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Grid,
  Search,
  Filter,
  SlidersHorizontal,
  MapPin,
  ShieldCheck,
  Cpu,
  Sparkles,
  ArrowRight,
  RotateCcw,
  X,
  Battery,
  HardDrive,
  Check,
  ChevronDown,
} from 'lucide-react'

const CATEGORIES = [
  { id: 'all', label: 'All Catalog' },
  { id: 'phones', label: 'Phones' },
  { id: 'laptops', label: 'Laptops' },
  { id: 'gaming', label: 'Gaming Consoles' },
  { id: 'accessories', label: 'Accessories' },
  { id: 'cameras', label: 'Cameras' },
  { id: 'tablets', label: 'Tablets' },
  { id: 'monitors', label: 'Displays & Monitors' },
]

const CONDITIONS = [
  { id: 'all', label: 'Any Condition' },
  { id: 'brand_new', label: 'Brand New' },
  { id: 'open_box', label: 'Open Box' },
  { id: 'refurbished', label: 'Refurbished' },
  { id: 'used', label: 'Pre-owned / UK Used' },
]

const ABUJA_HUBS = [
  'All Abuja',
  'Banex Plaza',
  'Emab Plaza',
  'Wuse 2',
  'Gwarinpa',
  'Maitama',
  'Garki',
  'Jabi',
]

const PRICE_PRESETS = [
  { label: 'Under ₦250k', min: '0', max: '250000' },
  { label: '₦250k - ₦600k', min: '250000', max: '600000' },
  { label: '₦600k - ₦1.2M', min: '600000', max: '1200000' },
  { label: '₦1.2M+', min: '1200000', max: '' },
]

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{
    category?: string
    q?: string
    condition?: string
    district?: string
    min_price?: string
    max_price?: string
    sort?: string
    verified_only?: string
  }>
}) {
  const params = await searchParams
  const {
    category = 'all',
    q,
    condition = 'all',
    district,
    min_price,
    max_price,
    sort = 'newest',
    verified_only,
  } = params

  const supabase = await createClient()

  // Base Supabase Query
  let query = supabase
    .from('products')
    .select('*, profiles!products_seller_id_fkey(business_name, tech_trust_status, district)')
    .eq('status', 'published')

  // 1. Text Search
  if (q) {
    query = query.or(`title.ilike.%${q}%,brand.ilike.%${q}%,description.ilike.%${q}%`)
  }

  // 2. Category Filter
  if (category && category !== 'all') {
    query = query.ilike('category', `%${category}%`)
  }

  // 3. Condition Filter
  if (condition && condition !== 'all') {
    query = query.eq('condition', condition)
  }

  // 4. District / Location Filter
  if (district && district !== 'All Abuja') {
    query = query.or(`location.ilike.%${district}%,profiles.district.ilike.%${district}%`)
  }

  // 5. Price Bracket Filtering
  if (min_price && Number(min_price) > 0) {
    query = query.gte('price', Number(min_price))
  }
  if (max_price && Number(max_price) > 0) {
    query = query.lte('price', Number(max_price))
  }

  // 6. Sorting
  if (sort === 'price_asc') {
    query = query.order('price', { ascending: true })
  } else if (sort === 'price_desc') {
    query = query.order('price', { ascending: false })
  } else {
    query = query.order('created_at', { ascending: false })
  }

  const { data: rawProducts } = await query

  // Filter Verified Merchants if requested
  const products = verified_only === 'true'
    ? (rawProducts || []).filter((p) => p.profiles?.tech_trust_status === 'verified')
    : (rawProducts || [])

  // Helper for generating updated filter URLs
  const createFilterUrl = (key: string, value: string | null) => {
    const p = new URLSearchParams()
    if (category && category !== 'all') p.set('category', category)
    if (q) p.set('q', q)
    if (condition && condition !== 'all') p.set('condition', condition)
    if (district && district !== 'All Abuja') p.set('district', district)
    if (min_price) p.set('min_price', min_price)
    if (max_price) p.set('max_price', max_price)
    if (sort && sort !== 'newest') p.set('sort', sort)
    if (verified_only) p.set('verified_only', verified_only)

    if (value === null) {
      p.delete(key)
    } else {
      p.set(key, value)
    }

    const qs = p.toString()
    return `/products${qs ? `?${qs}` : ''}`
  }

  const hasActiveFilters =
    (category && category !== 'all') ||
    (condition && condition !== 'all') ||
    Boolean(q) ||
    (district && district !== 'All Abuja') ||
    Boolean(min_price) ||
    Boolean(max_price) ||
    Boolean(verified_only)

  return (
    <div className="min-h-screen bg-slate-100/60 flex flex-col">
      <Navbar />

      <div className="max-w-[1700px] w-full mx-auto flex flex-1">
        <BuyerSidebar />

        <main className="flex-1 min-w-0 p-4 md:p-6 space-y-6">
          {/* Top Category Slider */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {CATEGORIES.map((cat) => {
              const isActive = category.toLowerCase() === cat.id.toLowerCase()
              return (
                <Link
                  key={cat.id}
                  href={createFilterUrl('category', cat.id === 'all' ? null : cat.id)}
                  className={`px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all shadow-xs ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-blue-500/20'
                      : 'bg-white text-slate-600 border border-slate-200/80 hover:border-blue-400 hover:text-blue-600'
                  }`}
                >
                  {cat.label}
                </Link>
              )
            })}
          </div>

          {/* Intelligent Header & Controls Bar */}
          <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                    <Grid className="w-5 h-5 text-blue-600" />
                    {q ? `Results for "${q}"` : 'Browse Verified Devices'}
                  </h1>
                  <span className="text-xs bg-slate-100 text-slate-700 font-bold px-2.5 py-0.5 rounded-full">
                    {products.length} {products.length === 1 ? 'gadget' : 'gadgets'}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Physical stock ready for prompt dispatch or secure Banex/Wuse 2 inspection
                </p>
              </div>

              {/* Sorting & Verification Toggle */}
              <div className="flex flex-wrap items-center gap-2.5 text-xs">
                {/* TechTrust Verified Filter */}
                <Link
                  href={createFilterUrl('verified_only', verified_only === 'true' ? null : 'true')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold border transition ${
                    verified_only === 'true'
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Verified Dealers Only</span>
                  {verified_only === 'true' && <Check className="w-3 h-3 text-emerald-600" />}
                </Link>

                {/* Sort Selector */}
                <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1 text-slate-600">
                  <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-[11px] font-medium text-slate-400">Sort:</span>
                  <Link
                    href={createFilterUrl('sort', sort === 'newest' ? 'price_asc' : sort === 'price_asc' ? 'price_desc' : 'newest')}
                    className="font-bold text-slate-900 hover:text-blue-600 flex items-center gap-1"
                  >
                    {sort === 'price_asc' ? 'Price: Low → High' : sort === 'price_desc' ? 'Price: High → Low' : 'Newest First'}
                    <ChevronDown className="w-3 h-3 text-slate-400" />
                  </Link>
                </div>
              </div>
            </div>

            {/* Micro Filters: Condition, Abuja Hubs, & Price Brackets */}
            <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center gap-2 text-xs">
              {/* Condition Filter */}
              <div className="flex items-center gap-1 overflow-x-auto scrollbar-none py-0.5">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">
                  Grade:
                </span>
                {CONDITIONS.map((cond) => {
                  const isSelected = condition === cond.id
                  return (
                    <Link
                      key={cond.id}
                      href={createFilterUrl('condition', cond.id === 'all' ? null : cond.id)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition ${
                        isSelected
                          ? 'bg-slate-900 text-white'
                          : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {cond.label}
                    </Link>
                  )
                })}
              </div>

              {/* Abuja Hub Selector */}
              <div className="flex items-center gap-1 overflow-x-auto scrollbar-none py-0.5 lg:ml-auto">
                <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">
                  Hub:
                </span>
                {ABUJA_HUBS.map((hub) => {
                  const isSelected = (district || 'All Abuja') === hub
                  return (
                    <Link
                      key={hub}
                      href={createFilterUrl('district', hub === 'All Abuja' ? null : hub)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap transition ${
                        isSelected
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {hub}
                    </Link>
                  )
                })}
              </div>
            </div>

            {/* Quick Price Range Chips & Reset */}
            <div className="pt-2 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">
                  Budget:
                </span>
                {PRICE_PRESETS.map((preset, idx) => {
                  const isSelected = min_price === preset.min && (preset.max ? max_price === preset.max : !max_price)
                  const p = new URLSearchParams()
                  if (category && category !== 'all') p.set('category', category)
                  if (q) p.set('q', q)
                  if (condition && condition !== 'all') p.set('condition', condition)
                  if (district && district !== 'All Abuja') p.set('district', district)
                  if (sort && sort !== 'newest') p.set('sort', sort)

                  if (!isSelected) {
                    if (preset.min) p.set('min_price', preset.min)
                    if (preset.max) p.set('max_price', preset.max)
                  }

                  return (
                    <Link
                      key={idx}
                      href={`/products${p.toString() ? `?${p.toString()}` : ''}`}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition ${
                        isSelected
                          ? 'bg-blue-600 text-white font-bold'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {preset.label}
                    </Link>
                  )
                })}
              </div>

              {hasActiveFilters && (
                <Link
                  href="/products"
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-red-600 hover:text-red-700 transition"
                >
                  <RotateCcw className="w-3 h-3" /> Reset Filters
                </Link>
              )}
            </div>
          </div>

          {/* Inline AI Matching Banner */}
          <div className="bg-gradient-to-r from-blue-900 via-indigo-950 to-slate-950 text-white rounded-3xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center text-amber-400 shrink-0">
                <Sparkles className="w-5 h-5 fill-amber-400" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-black text-white">Looking for a specific configuration?</h4>
                <p className="text-[11px] text-slate-300">
                  Let BenchTech AI match your exact software requirements and Naira budget across Abuja dealers.
                </p>
              </div>
            </div>
            <Link href="/assistant" className="shrink-0">
              <Button size="sm" className="bg-white hover:bg-slate-100 text-slate-950 font-bold text-xs rounded-xl gap-1.5 h-9">
                Consult AI <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </div>

          {/* Product Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {products && products.length > 0 ? (
              products.map((item) => {
                const seller = item.profiles
                const isVerified = seller?.tech_trust_status === 'verified'
                const specs = item.specs || {}

                return (
                  <div key={item.id} className="relative group flex flex-col">
                    {/* Floating Wishlist Button */}
                    <SaveButton product={item} />

                    <Card className="h-full border border-slate-200/80 rounded-3xl overflow-hidden hover:shadow-md hover:border-slate-300 transition-all bg-white flex flex-col justify-between">
                      {/* Image Area */}
                      <Link href={`/products/${item.id}`} className="block">
                        <div className="aspect-[4/3] bg-slate-50 relative overflow-hidden p-3 flex items-center justify-center">
                          {item.images?.[0] ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={item.images[0]}
                              alt={item.title}
                              className="max-h-full object-contain group-hover:scale-105 transition duration-300"
                            />
                          ) : (
                            <div className="text-xs text-slate-400">No Image</div>
                          )}

                          {/* Condition Grade Pill */}
                          <Badge className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-md text-white border-none text-[10px] capitalize font-bold">
                            {item.condition?.replace('_', ' ') || 'Refurbished'}
                          </Badge>
                        </div>
                      </Link>

                      {/* Content Area */}
                      <CardContent className="p-4 flex-1 flex flex-col justify-between space-y-3">
                        <div className="space-y-1.5">
                          {/* Brand & Location Micro-Tag */}
                          <div className="flex items-center justify-between text-[10px] text-slate-400">
                            <span className="uppercase font-extrabold text-blue-600 tracking-wider">
                              {item.brand || 'Device'}
                            </span>
                            <span className="flex items-center gap-1 truncate max-w-[110px]">
                              <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                              {item.location || seller?.district || 'Abuja, NG'}
                            </span>
                          </div>

                          {/* Title */}
                          <Link href={`/products/${item.id}`} className="block">
                            <h3 className="font-bold text-xs text-slate-900 group-hover:text-blue-600 transition line-clamp-2 leading-snug">
                              {item.title}
                            </h3>
                          </Link>

                          {/* Hardware Spec Badges */}
                          <div className="flex flex-wrap items-center gap-1.5 pt-1">
                            {specs.ram && (
                              <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded-md">
                                <Cpu className="w-2.5 h-2.5 text-slate-500" /> {specs.ram}
                              </span>
                            )}
                            {specs.storage && (
                              <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded-md">
                                <HardDrive className="w-2.5 h-2.5 text-slate-500" /> {specs.storage}
                              </span>
                            )}
                            {specs.battery_health && (
                              <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-md">
                                <Battery className="w-2.5 h-2.5 text-emerald-600" /> {specs.battery_health}
                              </span>
                            )}
                          </div>

                          {/* Seller Identity */}
                          {seller && (
                            <div className="pt-1 flex items-center gap-1 text-[11px] text-slate-500">
                              <span className="truncate">{seller.business_name || 'Verified Vendor'}</span>
                              {isVerified && <ShieldCheck className="w-3 h-3 text-emerald-600 shrink-0" />}
                            </div>
                          )}
                        </div>

                        {/* Price & Action Cluster */}
                        <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                          <div>
                            <p className="text-[10px] text-slate-400 font-medium">Outright Price</p>
                            <p className="text-sm font-black text-slate-900 tracking-tight">
                              ₦{Number(item.price).toLocaleString()}
                            </p>
                          </div>

                          {/* Quick Interactive Actions */}
                          <div className="flex items-center gap-1.5">
                            <CompareButton product={item as any} />
                            <AddToCartButton product={item} variant="icon" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )
              })
            ) : (
              /* Thoughtful Empty State */
              <div className="col-span-full py-16 px-4 text-center bg-white rounded-3xl border border-slate-200/80 space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto shadow-inner">
                  <Search className="w-6 h-6" />
                </div>
                <div className="max-w-md mx-auto space-y-1">
                  <h3 className="text-base font-black text-slate-900">No matching devices found</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    We couldn't find hardware that meets all your selected filters. Try broadening your price range, clearing the location filter, or consulting our AI.
                  </p>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                  <Link href="/products">
                    <Button variant="outline" size="sm" className="text-xs font-bold rounded-xl h-9">
                      Clear All Filters
                    </Button>
                  </Link>
                  <Link href="/assistant">
                    <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl h-9 gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" /> Find Alternatives with AI
                    </Button>
                  </Link>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}