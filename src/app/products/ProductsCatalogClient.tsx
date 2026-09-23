'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
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
  BatteryCharging,
  Cpu,
  HardDrive,
  RotateCcw,
} from 'lucide-react'

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

// Category-Specific Facet Specs
const PHONE_BRANDS = ['Apple', 'Samsung', 'Google', 'Xiaomi', 'OnePlus', 'Tecno', 'Infinix']
const LAPTOP_BRANDS = ['Apple', 'Dell', 'HP', 'Lenovo', 'ASUS', 'Acer', 'Microsoft']
const GENERAL_BRANDS = ['Apple', 'Samsung', 'Sony', 'Dell', 'HP', 'Lenovo', 'Logitech', 'Canon', 'LG']

const PHONE_STORAGE = ['64GB', '128GB', '256GB', '512GB', '1TB']
const LAPTOP_RAM = ['8GB', '16GB', '32GB', '64GB+']
const LAPTOP_STORAGE = ['256GB SSD', '512GB SSD', '1TB SSD', '2TB SSD']
const PROCESSORS = ['Apple M1/M2/M3', 'Core i5', 'Core i7', 'Core i9', 'Ryzen 5', 'Ryzen 7']
const BATTERY_HEALTH = ['90%+', '85%+', '80%+']

const CONDITIONS = [
  { id: 'brand_new', label: 'Brand New (Sealed)' },
  { id: 'open_box', label: 'Open Box / Mint' },
  { id: 'refurbished', label: 'Refurbished' },
  { id: 'used', label: 'Clean Fairly Used' },
]

const ABUJA_HUBS = [
  'Banex Plaza',
  'Emab Plaza',
  'Wuse 2',
  'Garki',
  'CBD',
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

export function ProductsCatalogClient({ initialProducts }: { initialProducts: any[] }) {
  const searchParams = useSearchParams()

  const [drawerOpen, setDrawerOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string>(searchParams.get('category') || 'all')
  const [searchQuery, setSearchQuery] = useState<string>(searchParams.get('q') || '')
  const [selectedBrands, setSelectedBrands] = useState<string[]>([])
  const [selectedRam, setSelectedRam] = useState<string[]>([])
  const [selectedStorage, setSelectedStorage] = useState<string[]>([])
  const [selectedProcessors, setSelectedProcessors] = useState<string[]>([])
  const [selectedBatteryHealth, setSelectedBatteryHealth] = useState<string[]>([])
  const [selectedConditions, setSelectedConditions] = useState<string[]>([])
  const [selectedHubs, setSelectedHubs] = useState<string[]>([])
  const [selectedPriceRange, setSelectedPriceRange] = useState<{ min: number; max: number; label: string } | null>(null)
  const [verifiedOnly, setVerifiedOnly] = useState(false)
  const [sortBy, setSortBy] = useState<'featured' | 'newest' | 'price_low' | 'price_high'>('featured')

  // Section accordions inside the drawer
  const [openSections, setOpenSections] = useState({
    price: true,
    brand: true,
    specs: true,
    condition: true,
    hub: false,
  })

  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }))
  }

  // Active Brands list based on category
  const activeBrands = useMemo(() => {
    if (selectedCategory === 'phones') return PHONE_BRANDS
    if (selectedCategory === 'laptops') return LAPTOP_BRANDS
    return GENERAL_BRANDS
  }, [selectedCategory])

  // Real-Time Live Filtering
  const filteredProducts = useMemo(() => {
    return initialProducts
      .filter((item) => {
        // Category Match
        if (selectedCategory !== 'all' && item.category?.toLowerCase() !== selectedCategory.toLowerCase()) {
          return false
        }

        // Search Query Match
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase()
          const matchTitle = item.title?.toLowerCase().includes(q)
          const matchBrand = item.brand?.toLowerCase().includes(q)
          const matchDesc = item.description?.toLowerCase().includes(q)
          if (!matchTitle && !matchBrand && !matchDesc) return false
        }

        // Brands Match
        if (selectedBrands.length > 0 && !selectedBrands.some((b) => item.brand?.toLowerCase() === b.toLowerCase())) {
          return false
        }

        // Conditions Match
        if (selectedConditions.length > 0 && !selectedConditions.includes(item.condition)) {
          return false
        }

        // Hub Location Match
        if (selectedHubs.length > 0) {
          const district = item.profiles?.district || ''
          if (!selectedHubs.some((h) => district.toLowerCase().includes(h.toLowerCase()))) {
            return false
          }
        }

        // Price Budget Match
        if (selectedPriceRange) {
          const price = Number(item.price) || 0
          if (price < selectedPriceRange.min || price > selectedPriceRange.max) {
            return false
          }
        }

        // TechTrust Verified Sellers Only
        if (verifiedOnly && item.profiles?.tech_trust_status !== 'verified') {
          return false
        }

        // Category-Specific: RAM Capacity (Structured specs or title/desc search)
        if (selectedRam.length > 0) {
          const itemRam = item.specs?.ram || ''
          const content = `${item.title} ${item.description} ${itemRam}`.toUpperCase()
          if (!selectedRam.some((r) => content.includes(r.replace('+', '').toUpperCase()))) {
            return false
          }
        }

        // Category-Specific: Storage Capacity
        if (selectedStorage.length > 0) {
          const itemStorage = item.specs?.storage || ''
          const content = `${item.title} ${item.description} ${itemStorage}`.toUpperCase()
          if (!selectedStorage.some((s) => content.includes(s.replace(' SSD', '').toUpperCase()))) {
            return false
          }
        }

        // Category-Specific: Processor Type
        if (selectedProcessors.length > 0) {
          const itemProc = item.specs?.processor || ''
          const content = `${item.title} ${item.description} ${itemProc}`.toLowerCase()
          if (!selectedProcessors.some((p) => content.includes(p.toLowerCase().replace('apple ', '')))) {
            return false
          }
        }

        // Category-Specific: Battery Health
        if (selectedBatteryHealth.length > 0) {
          const healthNum = parseInt(item.specs?.battery_health || '0')
          const meetsThreshold = selectedBatteryHealth.some((threshold) => {
            const min = parseInt(threshold)
            return healthNum >= min
          })
          if (!meetsThreshold && item.specs?.battery_health) return false
        }

        return true
      })
      .sort((a, b) => {
        if (sortBy === 'price_low') return Number(a.price) - Number(b.price)
        if (sortBy === 'price_high') return Number(b.price) - Number(a.price)
        if (sortBy === 'newest') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        return (b.is_featured ? 1 : 0) - (a.is_featured ? 1 : 0)
      })
  }, [
    initialProducts,
    selectedCategory,
    searchQuery,
    selectedBrands,
    selectedConditions,
    selectedHubs,
    selectedPriceRange,
    verifiedOnly,
    selectedRam,
    selectedStorage,
    selectedProcessors,
    selectedBatteryHealth,
    sortBy,
  ])

  // Count active filter criteria
  const activeFilterCount =
    (selectedCategory !== 'all' ? 1 : 0) +
    selectedBrands.length +
    selectedConditions.length +
    selectedHubs.length +
    selectedRam.length +
    selectedStorage.length +
    selectedProcessors.length +
    selectedBatteryHealth.length +
    (selectedPriceRange ? 1 : 0) +
    (verifiedOnly ? 1 : 0)

  const clearAllFilters = () => {
    setSelectedBrands([])
    setSelectedRam([])
    setSelectedStorage([])
    setSelectedProcessors([])
    setSelectedBatteryHealth([])
    setSelectedConditions([])
    setSelectedHubs([])
    setSelectedPriceRange(null)
    setVerifiedOnly(false)
  }

  const toggleItem = (list: string[], setList: (val: string[]) => void, item: string) => {
    if (list.includes(item)) {
      setList(list.filter((x) => x !== item))
    } else {
      setList([...list, item])
    }
  }

  return (
    <main className="flex-1 min-w-0 p-3 sm:p-5 lg:p-7 space-y-4 max-w-[1550px] mx-auto w-full">
      {/* 1. Category Bar Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none -mx-1 px-1">
        {CATEGORIES.map((cat) => {
          const Icon = cat.icon
          const isSelected = selectedCategory === cat.id
          return (
            <button
              key={cat.id}
              onClick={() => {
                setSelectedCategory(cat.id)
                clearAllFilters() // Reset sub-filters cleanly when switching main hardware category
              }}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold shrink-0 transition ${
                isSelected
                  ? 'bg-blue-600 text-white font-bold shadow-xs'
                  : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-slate-500'}`} />
              <span>{cat.label}</span>
            </button>
          )
        })}
      </div>

      {/* 2. Top Toolbar (Clean, Uncluttered: Search count, Sort, and Hidden Drawer Trigger) */}
      <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-slate-100">
            {filteredProducts.length} {filteredProducts.length === 1 ? 'Device' : 'Devices'}
          </span>
          <span className="text-xs text-slate-400">found in Abuja</span>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Sort Selector */}
          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            <span className="hidden sm:inline font-bold">Sort:</span>
            <select
              value={sortBy}
              onChange={(e: any) => setSortBy(e.target.value)}
              className="h-9 px-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-600"
            >
              <option value="featured">Featured First</option>
              <option value="newest">Newest Listed</option>
              <option value="price_low">Price: Low to High</option>
              <option value="price_high">Price: High to Low</option>
            </select>
          </div>

          {/* Dedicated Filter Button (Opens the hidden Drawer) */}
          <Button
            size="sm"
            onClick={() => setDrawerOpen(true)}
            className="h-9 px-3.5 rounded-xl bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-white text-white dark:text-slate-950 font-bold text-xs gap-2 shadow-xs cursor-pointer"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Filters</span>
            {activeFilterCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-blue-600 text-white text-[9px] font-black flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </Button>
        </div>
      </div>

      {/* 3. Active Filter Chips Row (Quick-Dismiss Tags) */}
      {activeFilterCount > 0 && (
        <div className="flex items-center flex-wrap gap-1.5 pt-0.5">
          <span className="text-[11px] font-bold text-slate-400 mr-1">Active filters:</span>

          {verifiedOnly && (
            <Badge className="bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-[10px] font-bold gap-1 pl-2 pr-1.5 py-0.5 rounded-lg">
              Verified Only
              <X className="w-3 h-3 cursor-pointer hover:text-emerald-900" onClick={() => setVerifiedOnly(false)} />
            </Badge>
          )}

          {selectedPriceRange && (
            <Badge className="bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-[10px] font-bold gap-1 pl-2 pr-1.5 py-0.5 rounded-lg">
              {selectedPriceRange.label}
              <X className="w-3 h-3 cursor-pointer hover:text-blue-900" onClick={() => setSelectedPriceRange(null)} />
            </Badge>
          )}

          {selectedBrands.map((b) => (
            <Badge key={b} className="bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-none text-[10px] font-bold gap-1 pl-2 pr-1.5 py-0.5 rounded-lg">
              {b}
              <X className="w-3 h-3 cursor-pointer hover:text-red-600" onClick={() => toggleItem(selectedBrands, setSelectedBrands, b)} />
            </Badge>
          ))}

          {selectedRam.map((r) => (
            <Badge key={r} className="bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-none text-[10px] font-bold gap-1 pl-2 pr-1.5 py-0.5 rounded-lg">
              {r} RAM
              <X className="w-3 h-3 cursor-pointer hover:text-red-600" onClick={() => toggleItem(selectedRam, setSelectedRam, r)} />
            </Badge>
          ))}

          {selectedStorage.map((s) => (
            <Badge key={s} className="bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-none text-[10px] font-bold gap-1 pl-2 pr-1.5 py-0.5 rounded-lg">
              {s}
              <X className="w-3 h-3 cursor-pointer hover:text-red-600" onClick={() => toggleItem(selectedStorage, setSelectedStorage, s)} />
            </Badge>
          ))}

          {selectedProcessors.map((p) => (
            <Badge key={p} className="bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-none text-[10px] font-bold gap-1 pl-2 pr-1.5 py-0.5 rounded-lg">
              {p}
              <X className="w-3 h-3 cursor-pointer hover:text-red-600" onClick={() => toggleItem(selectedProcessors, setSelectedProcessors, p)} />
            </Badge>
          ))}

          {selectedBatteryHealth.map((bh) => (
            <Badge key={bh} className="bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-none text-[10px] font-bold gap-1 pl-2 pr-1.5 py-0.5 rounded-lg">
              {bh} Battery
              <X className="w-3 h-3 cursor-pointer hover:text-red-600" onClick={() => toggleItem(selectedBatteryHealth, setSelectedBatteryHealth, bh)} />
            </Badge>
          ))}

          {selectedConditions.map((c) => (
            <Badge key={c} className="bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-none text-[10px] font-bold gap-1 pl-2 pr-1.5 py-0.5 rounded-lg capitalize">
              {c.replace('_', ' ')}
              <X className="w-3 h-3 cursor-pointer hover:text-red-600" onClick={() => toggleItem(selectedConditions, setSelectedConditions, c)} />
            </Badge>
          ))}

          {selectedHubs.map((h) => (
            <Badge key={h} className="bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-none text-[10px] font-bold gap-1 pl-2 pr-1.5 py-0.5 rounded-lg">
              {h}
              <X className="w-3 h-3 cursor-pointer hover:text-red-600" onClick={() => toggleItem(selectedHubs, setSelectedHubs, h)} />
            </Badge>
          ))}

          <button
            onClick={clearAllFilters}
            className="text-[11px] font-bold text-red-600 dark:text-red-400 hover:underline ml-1"
          >
            Reset All
          </button>
        </div>
      )}

      {/* 4. Full-Width Product Grid (Now expanded across the entire layout!) */}
      {filteredProducts.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2.5 sm:gap-3.5">
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
                    className={`h-full rounded-2xl overflow-hidden hover:shadow-md transition bg-white dark:bg-slate-900 flex flex-col justify-between ${
                      isFeatured
                        ? 'border-2 border-blue-500/80 ring-2 ring-blue-500/10 shadow-2xs'
                        : 'border border-slate-200/90 dark:border-slate-800 shadow-2xs'
                    }`}
                  >
                    <div className="aspect-square bg-slate-50 dark:bg-slate-800/40 relative overflow-hidden p-2 flex items-center justify-center">
                      <div className="absolute top-2 left-2 flex flex-col gap-1 z-10">
                        {isFeatured && (
                          <Badge className="bg-blue-600 text-white border-none text-[8px] font-black uppercase tracking-wider flex items-center gap-0.5 shadow-xs px-1.5 py-0">
                            <Sparkles className="w-2.5 h-2.5" /> Featured
                          </Badge>
                        )}
                        <Badge className="bg-slate-900/85 backdrop-blur-xs text-white border-none text-[8px] capitalize px-1.5 py-0">
                          {item.condition?.replace('_', ' ') || 'Refurbished'}
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
                        <Package className="w-8 h-8 text-slate-300 dark:text-slate-600" />
                      )}
                    </div>

                    <CardContent className="p-3 sm:p-3.5 flex-1 flex flex-col justify-between space-y-2">
                      <div>
                        <h3 className="font-bold text-[11px] sm:text-xs text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition line-clamp-1">
                          {item.title}
                        </h3>
                        <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1">
                          <span className="uppercase tracking-wider font-semibold truncate max-w-[80px]">
                            {item.brand || 'Device'}
                          </span>
                          {item.profiles?.district && (
                            <span className="flex items-center gap-0.5 text-[10px] shrink-0">
                              <MapPin className="w-2.5 h-2.5 text-slate-400" />
                              {item.profiles.district.split(' ')[0]}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                        <p className="text-xs sm:text-sm font-black text-slate-900 dark:text-slate-100">
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
        <div className="p-16 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
            <SlidersHorizontal className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-black text-slate-800 dark:text-slate-200">No hardware found matching active filters</p>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Try adjusting your price budget, storage parameters, or clearing active filters to browse the catalog.
            </p>
          </div>
          <Button size="sm" onClick={clearAllFilters} variant="outline" className="text-xs font-bold rounded-xl mt-2">
            Clear Active Filters
          </Button>
        </div>
      )}

      {/* 5. HIDDEN SLIDE-OUT FILTER DRAWER (Mobile & Desktop) */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 flex">
          {/* Backdrop blur */}
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-in fade-in"
            onClick={() => setDrawerOpen(false)}
          />

          {/* Drawer Panel */}
          <div className="relative ml-auto w-96 max-w-[88vw] h-full bg-white dark:bg-slate-900 z-10 shadow-2xl flex flex-col justify-between border-l border-slate-200 dark:border-slate-800">
            {/* Drawer Header */}
            <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <span className="font-black text-sm text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                  <SlidersHorizontal className="w-4 h-4 text-blue-600" /> Filter Catalogue
                </span>
                {activeFilterCount > 0 && (
                  <Badge className="bg-blue-600 text-white text-[9px] font-black px-1.5 py-0.2 rounded-full">
                    {activeFilterCount}
                  </Badge>
                )}
              </div>

              <div className="flex items-center gap-2">
                {activeFilterCount > 0 && (
                  <button
                    type="button"
                    onClick={clearAllFilters}
                    className="text-[11px] font-bold text-red-600 dark:text-red-400 hover:underline mr-1"
                  >
                    Reset
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setDrawerOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Scrollable Filters Content */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5 text-xs text-slate-700 dark:text-slate-300">
              {/* TechTrust Badge Checkbox */}
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 rounded-2xl flex items-center justify-between">
                <label className="flex items-center gap-2.5 cursor-pointer font-bold text-emerald-950 dark:text-emerald-200">
                  <input
                    type="checkbox"
                    checked={verifiedOnly}
                    onChange={(e) => setVerifiedOnly(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    Verified Dealers Only
                  </span>
                </label>
              </div>

              {/* Price Budget Section */}
              <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
                <button
                  onClick={() => toggleSection('price')}
                  className="w-full flex items-center justify-between font-bold text-slate-900 dark:text-slate-100 mb-2.5"
                >
                  <span>Price Budget (Naira)</span>
                  {openSections.price ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                </button>
                {openSections.price && (
                  <div className="space-y-1.5 pl-0.5">
                    {PRICE_BUCKETS.map((b, i) => {
                      const isSelected = selectedPriceRange?.min === b.min && selectedPriceRange?.max === b.max
                      return (
                        <label key={i} className="flex items-center gap-2.5 cursor-pointer py-1 hover:text-blue-600 transition">
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
                          <span className={isSelected ? 'font-bold text-blue-600 dark:text-blue-400' : 'text-slate-600 dark:text-slate-400'}>
                            {b.label}
                          </span>
                        </label>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Brands Section (Adapts by category) */}
              <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
                <button
                  onClick={() => toggleSection('brand')}
                  className="w-full flex items-center justify-between font-bold text-slate-900 dark:text-slate-100 mb-2.5"
                >
                  <span className="capitalize">{selectedCategory !== 'all' ? `${selectedCategory} Brands` : 'Brands'}</span>
                  {openSections.brand ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                </button>
                {openSections.brand && (
                  <div className="grid grid-cols-2 gap-2 pl-0.5">
                    {activeBrands.map((brand) => (
                      <label key={brand} className="flex items-center gap-2 cursor-pointer py-0.5 hover:text-blue-600 transition">
                        <input
                          type="checkbox"
                          checked={selectedBrands.includes(brand)}
                          onChange={() => toggleItem(selectedBrands, setSelectedBrands, brand)}
                          className="w-3.5 h-3.5 rounded text-blue-600"
                        />
                        <span className={selectedBrands.includes(brand) ? 'font-bold text-blue-600 dark:text-blue-400' : 'text-slate-600 dark:text-slate-400'}>
                          {brand}
                        </span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {/* CATEGORY-DEPENDENT SECTION: Phones Specifics */}
              {selectedCategory === 'phones' && (
                <div className="border-b border-slate-100 dark:border-slate-800 pb-4 space-y-4">
                  {/* Phone Storage */}
                  <div>
                    <span className="font-bold text-slate-900 dark:text-slate-100 block mb-2 flex items-center gap-1.5">
                      <HardDrive className="w-3.5 h-3.5 text-blue-600" /> Storage Capacity
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {PHONE_STORAGE.map((storage) => {
                        const isSelected = selectedStorage.includes(storage)
                        return (
                          <button
                            key={storage}
                            type="button"
                            onClick={() => toggleItem(selectedStorage, setSelectedStorage, storage)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition ${
                              isSelected
                                ? 'bg-blue-600 text-white border-blue-600'
                                : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            {storage}
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Battery Health Thresholds */}
                  <div>
                    <span className="font-bold text-slate-900 dark:text-slate-100 block mb-2 flex items-center gap-1.5">
                      <BatteryCharging className="w-3.5 h-3.5 text-emerald-600" /> Minimum Battery Health
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {BATTERY_HEALTH.map((bh) => {
                        const isSelected = selectedBatteryHealth.includes(bh)
                        return (
                          <button
                            key={bh}
                            type="button"
                            onClick={() => toggleItem(selectedBatteryHealth, setSelectedBatteryHealth, bh)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition ${
                              isSelected
                                ? 'bg-emerald-600 text-white border-emerald-600'
                                : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            {bh}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* CATEGORY-DEPENDENT SECTION: Laptops Specifics */}
              {selectedCategory === 'laptops' && (
                <div className="border-b border-slate-100 dark:border-slate-800 pb-4 space-y-4">
                  {/* Laptop RAM */}
                  <div>
                    <span className="font-bold text-slate-900 dark:text-slate-100 block mb-2 flex items-center gap-1.5">
                      <Cpu className="w-3.5 h-3.5 text-blue-600" /> RAM Memory
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {LAPTOP_RAM.map((ram) => {
                        const isSelected = selectedRam.includes(ram)
                        return (
                          <button
                            key={ram}
                            type="button"
                            onClick={() => toggleItem(selectedRam, setSelectedRam, ram)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition ${
                              isSelected
                                ? 'bg-blue-600 text-white border-blue-600'
                                : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            {ram}
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Processor Family */}
                  <div>
                    <span className="font-bold text-slate-900 dark:text-slate-100 block mb-2">Processor Family</span>
                    <div className="grid grid-cols-2 gap-1.5">
                      {PROCESSORS.map((proc) => (
                        <label key={proc} className="flex items-center gap-2 cursor-pointer py-0.5 hover:text-blue-600 transition">
                          <input
                            type="checkbox"
                            checked={selectedProcessors.includes(proc)}
                            onChange={() => toggleItem(selectedProcessors, setSelectedProcessors, proc)}
                            className="w-3.5 h-3.5 rounded text-blue-600"
                          />
                          <span className={selectedProcessors.includes(proc) ? 'font-bold text-blue-600 dark:text-blue-400' : 'text-slate-600 dark:text-slate-400'}>
                            {proc}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Laptop Storage */}
                  <div>
                    <span className="font-bold text-slate-900 dark:text-slate-100 block mb-2 flex items-center gap-1.5">
                      <HardDrive className="w-3.5 h-3.5 text-blue-600" /> Solid State Drive (SSD)
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {LAPTOP_STORAGE.map((storage) => {
                        const isSelected = selectedStorage.includes(storage)
                        return (
                          <button
                            key={storage}
                            type="button"
                            onClick={() => toggleItem(selectedStorage, setSelectedStorage, storage)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition ${
                              isSelected
                                ? 'bg-blue-600 text-white border-blue-600'
                                : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            {storage}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* Hardware Condition Section */}
              <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
                <button
                  onClick={() => toggleSection('condition')}
                  className="w-full flex items-center justify-between font-bold text-slate-900 dark:text-slate-100 mb-2.5"
                >
                  <span>Device Condition</span>
                  {openSections.condition ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                </button>
                {openSections.condition && (
                  <div className="space-y-1.5 pl-0.5">
                    {CONDITIONS.map((c) => (
                      <label key={c.id} className="flex items-center gap-2.5 cursor-pointer py-1 hover:text-blue-600 transition">
                        <input
                          type="checkbox"
                          checked={selectedConditions.includes(c.id)}
                          onChange={() => toggleItem(selectedConditions, setSelectedConditions, c.id)}
                          className="w-3.5 h-3.5 rounded text-blue-600"
                        />
                        <span className={selectedConditions.includes(c.id) ? 'font-bold text-blue-600 dark:text-blue-400' : 'text-slate-600 dark:text-slate-400'}>
                          {c.label}
                        </span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {/* Abuja Plaza / Hub Location */}
              <div>
                <button
                  onClick={() => toggleSection('hub')}
                  className="w-full flex items-center justify-between font-bold text-slate-900 dark:text-slate-100 mb-2.5"
                >
                  <span>Abuja Hub Location</span>
                  {openSections.hub ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                </button>
                {openSections.hub && (
                  <div className="grid grid-cols-2 gap-1.5 pl-0.5">
                    {ABUJA_HUBS.map((hub) => (
                      <label key={hub} className="flex items-center gap-2 cursor-pointer py-0.5 hover:text-blue-600 transition">
                        <input
                          type="checkbox"
                          checked={selectedHubs.includes(hub)}
                          onChange={() => toggleItem(selectedHubs, setSelectedHubs, hub)}
                          className="w-3.5 h-3.5 rounded text-blue-600"
                        />
                        <span className={selectedHubs.includes(hub) ? 'font-bold text-blue-600 dark:text-blue-400' : 'text-slate-600 dark:text-slate-400'}>
                          {hub}
                        </span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Drawer Bottom Action Bar */}
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex items-center gap-2 shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={clearAllFilters}
                className="w-1/3 text-xs font-bold rounded-xl h-10 border-slate-200 dark:border-slate-700"
              >
                Reset
              </Button>
              <Button
                size="sm"
                onClick={() => setDrawerOpen(false)}
                className="w-2/3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl h-10 shadow-xs cursor-pointer"
              >
                Show ({filteredProducts.length} Results)
              </Button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}