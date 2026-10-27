import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getSponsoredProducts } from '@/lib/ads/getSponsoredProducts'
import { Navbar } from '@/components/Navbar'
import { BuyerSidebar } from '@/components/storefront/BuyerSidebar'
import { BuyerRightSidebar } from '@/components/storefront/BuyerRightSidebar'
import { AdImpressionTracker } from '@/components/storefront/AdImpressionTracker'
import { AdProductCardWrapper } from '@/components/storefront/AdProductCardWrapper'
import { SaveButton } from '@/components/SaveButton'
import { AddToCartButton } from '@/components/cart/AddToCartButton'
import { Button } from '@/components/ui/button'
import {
  ShieldCheck,
  Truck,
  ArrowRight,
  MapPin,
  Package,
  Sparkles,
  Scale,
  Wrench,
  Tag,
  BookOpen,
  Smartphone,
  Laptop,
  Gamepad2,
  Headphones,
  Camera,
  Wifi,
  Home,
  Watch,
  Tablet,
  Monitor,
  LayoutGrid,
  GraduationCap,
  Lock,
} from 'lucide-react'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Marketplace Feed | BenchTech Abuja',
  description: 'Buy, compare, and sell verified electronics and hardware in Abuja.',
}

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

function shuffleArray<T>(items: T[]): T[] {
  const arr = [...items]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

const CATEGORIES = [
  { label: 'Phones', href: '/products?category=phones', icon: Smartphone },
  { label: 'Laptops', href: '/products?category=laptops', icon: Laptop },
  { label: 'Gaming', href: '/products?category=gaming', icon: Gamepad2 },
  { label: 'Accessories', href: '/products?category=accessories', icon: Headphones },
  { label: 'Cameras', href: '/products?category=cameras', icon: Camera },
  { label: 'Networking', href: '/products?category=networking', icon: Wifi },
  { label: 'Smart Home', href: '/products?category=smart_home', icon: Home },
  { label: 'Wearables', href: '/products?category=wearables', icon: Watch },
  { label: 'Tablets', href: '/products?category=tablets', icon: Tablet },
  { label: 'Monitors', href: '/products?category=monitors', icon: Monitor },
  { label: 'View All', href: '/products', icon: LayoutGrid },
]

export default async function MarketplaceFeedPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Parallel fetch: User Profile, Sponsored Products, and Published Catalog
  const [profileRes, sponsoredResults, { data: rawProducts }] = await Promise.all([
    user
      ? supabase.from('profiles').select('*').eq('id', user.id).maybeSingle()
      : Promise.resolve({ data: null }),
    getSponsoredProducts({ limit: 8 }).catch(() => []),
    supabase
      .from('products')
      .select(
        '*, profiles!products_seller_id_fkey(business_name, full_name, district, tech_trust_status)'
      )
      .eq('status', 'published')
      .limit(48),
  ])

  const profile = profileRes.data

  const userRoles: string[] = Array.isArray(profile?.roles)
    ? profile.roles
    : profile?.role
    ? [profile.role]
    : []
  const isSeller =
    Boolean(profile?.business_name) ||
    profile?.is_seller === true ||
    profile?.role === 'seller' ||
    userRoles.includes('seller') ||
    profile?.role === 'admin'

  // Build prioritized + randomized product list without duplicates
  const seenIds = new Set<string>()
  const feedItems: Array<{
    product: any
    isSponsored: boolean
    campaignId?: string
    sellerId?: string
  }> = []

  // 1. Active Sponsored Campaign Products First
  for (const sp of sponsoredResults || []) {
    if (sp?.product?.id && !seenIds.has(sp.product.id)) {
      seenIds.add(sp.product.id)
      feedItems.push({
        product: sp.product,
        isSponsored: true,
        campaignId: sp.campaignId,
        sellerId: sp.sellerId,
      })
    }
  }

  const allPublished = rawProducts || []

  // 2. Featured Listings (Randomized among featured)
  const featuredPool = shuffleArray(
    allPublished.filter((p) => p.is_featured && !seenIds.has(p.id))
  )
  for (const feat of featuredPool) {
    seenIds.add(feat.id)
    feedItems.push({
      product: feat,
      isSponsored: true,
      sellerId: feat.seller_id,
    })
  }

  // 3. Organic Listings (Randomized on every page load)
  const organicPool = shuffleArray(
    allPublished.filter((p) => !seenIds.has(p.id))
  )
  for (const org of organicPool) {
    seenIds.add(org.id)
    feedItems.push({
      product: org,
      isSponsored: false,
      sellerId: org.seller_id,
    })
  }

  const sidebarUser = user
    ? {
        id: user.id,
        email: user.email,
        fullName: profile?.full_name,
        businessName: profile?.business_name,
        role: profile?.role,
        roles: profile?.roles,
        techTrustStatus: profile?.tech_trust_status,
      }
    : null

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col transition-colors">
      <Navbar />

      <div className="max-w-[1700px] w-full mx-auto flex flex-1">
        <BuyerSidebar />

        <main className="flex-1 min-w-0 p-3 sm:p-6 space-y-6 sm:space-y-8">
          {/* 1. HERO BANNER WITH NEW HARDWARE IMAGE */}
          <section className="rounded-3xl bg-slate-900 dark:bg-[#0b111e] border border-slate-800 p-5 sm:p-8 text-white shadow-xs">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
              <div className="lg:col-span-7 space-y-4">
                <span className="text-[10px] font-black uppercase tracking-widest text-blue-400 block">
                  YOUR ONE-STOP TECH MARKETPLACE
                </span>

                <h1 className="text-2xl sm:text-4xl lg:text-[40px] font-black tracking-tight leading-[1.12]">
                  Find the Right Tech. <br />
                  <span className="text-blue-500">For Your Life.</span>
                </h1>

                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-lg">
                  Buy, compare, and sell authentic hardware in Abuja. Every order includes physical inspection before funds are released.
                </p>

                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800/90 border border-slate-700 text-[11px] font-bold text-slate-200">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    Verified Sellers
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800/90 border border-slate-700 text-[11px] font-bold text-slate-200">
                    <Truck className="w-3.5 h-3.5 text-sky-400" />
                    Abuja Fast Delivery
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <Link href="/products">
                    <Button className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl h-10 px-5 gap-1.5 cursor-pointer">
                      <span>Shop Now</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Button>
                  </Link>
                  <Link href="/help">
                    <Button
                      variant="outline"
                      className="bg-slate-800/80 hover:bg-slate-800 text-slate-200 border-slate-700 font-bold text-xs rounded-xl h-10 px-4 cursor-pointer"
                    >
                      Buyer Safety Guide
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Framed New Hardware Image */}
              <div className="lg:col-span-5">
                <div className="rounded-2xl overflow-hidden border border-slate-700/80 bg-slate-950/60 p-2 shadow-xl">
                  <div className="relative aspect-[16/10] w-full rounded-xl overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="https://images.unsplash.com/photo-1526738549149-8e07eca6c147?auto=format&fit=crop&w=1200&q=80"
                      alt="Abuja Electronics and Hardware"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* 2. FIVE FEATURE / TOOL CARDS */}
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
            {/* Card 1: Find My Tech */}
            <div className="bg-white dark:bg-[#0b111e] border border-slate-200/90 dark:border-slate-800/90 rounded-2xl p-4 flex flex-col justify-between space-y-4 shadow-2xs">
              <div className="space-y-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/80 border border-blue-200/60 dark:border-blue-800/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white">
                    Find My Tech
                  </h2>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed mt-1">
                    Filter devices by budget, workload, and performance specifications.
                  </p>
                </div>
              </div>
              <Link href="/assistant" className="block">
                <Button className="w-full h-8 bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] rounded-xl gap-1 cursor-pointer">
                  <span>Start</span>
                  <ArrowRight className="w-3 h-3" />
                </Button>
              </Link>
            </div>

            {/* Card 2: Compare Tech */}
            <div className="bg-white dark:bg-[#0b111e] border border-slate-200/90 dark:border-slate-800/90 rounded-2xl p-4 flex flex-col justify-between space-y-4 shadow-2xs">
              <div className="space-y-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-950/80 border border-purple-200/60 dark:border-purple-800/60 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                  <Scale className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white">
                    Compare Tech
                  </h2>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed mt-1">
                    Compare hardware specifications and prices side by side.
                  </p>
                </div>
              </div>
              <Link href="/compare" className="block">
                <Button className="w-full h-8 bg-purple-600 hover:bg-purple-700 text-white font-bold text-[11px] rounded-xl gap-1 cursor-pointer">
                  <span>Compare</span>
                  <ArrowRight className="w-3 h-3" />
                </Button>
              </Link>
            </div>

            {/* Card 3: Build My Setup */}
            <div className="bg-white dark:bg-[#0b111e] border border-slate-200/90 dark:border-slate-800/90 rounded-2xl p-4 flex flex-col justify-between space-y-4 shadow-2xs">
              <div className="space-y-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-200/60 dark:border-emerald-800/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <Wrench className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white">
                    Build My Setup
                  </h2>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed mt-1">
                    Assemble custom workstation and gaming hardware bundles.
                  </p>
                </div>
              </div>
              <Link href="/build" className="block">
                <Button className="w-full h-8 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] rounded-xl gap-1 cursor-pointer">
                  <span>Build Setup</span>
                  <ArrowRight className="w-3 h-3" />
                </Button>
              </Link>
            </div>

            {/* Card 4: Sell Your Tech */}
            <div className="bg-white dark:bg-[#0b111e] border border-slate-200/90 dark:border-slate-800/90 rounded-2xl p-4 flex flex-col justify-between space-y-4 shadow-2xs">
              <div className="space-y-2.5">
                <div className="w-9 h-9 rounded-xl bg-orange-50 dark:bg-orange-950/80 border border-orange-200/60 dark:border-orange-800/60 text-orange-600 dark:text-orange-400 flex items-center justify-center">
                  <Tag className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white">
                    Sell Your Tech
                  </h2>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed mt-1">
                    List laptops, phones, and hardware for verified buyers in Abuja.
                  </p>
                </div>
              </div>
              <Link
                href={isSeller ? '/seller/listings/new' : '/seller/onboarding'}
                className="block"
              >
                <Button className="w-full h-8 bg-orange-600 hover:bg-orange-700 text-white font-bold text-[11px] rounded-xl gap-1 cursor-pointer">
                  <span>Start Selling</span>
                  <ArrowRight className="w-3 h-3" />
                </Button>
              </Link>
            </div>

            {/* Card 5: Learn Tech */}
            <div className="bg-white dark:bg-[#0b111e] border border-slate-200/90 dark:border-slate-800/90 rounded-2xl p-4 flex flex-col justify-between space-y-4 shadow-2xs sm:col-span-2 lg:col-span-1">
              <div className="space-y-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/80 border border-amber-200/60 dark:border-amber-800/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white">
                    Learn Tech
                  </h2>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed mt-1">
                    Inspection checklists, serial number verification, and safety guides.
                  </p>
                </div>
              </div>
              <Link href="/help" className="block">
                <Button className="w-full h-8 bg-amber-600 hover:bg-amber-700 text-white font-bold text-[11px] rounded-xl gap-1 cursor-pointer">
                  <span>Safety Guide</span>
                  <ArrowRight className="w-3 h-3" />
                </Button>
              </Link>
            </div>
          </section>

          {/* 3. SHOP BY CATEGORY (11 TILES) */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
                Shop by Category
              </h2>
              <Link
                href="/products"
                className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
              >
                <span>View All Categories</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-11 gap-2.5">
              {CATEGORIES.map((cat) => {
                const Icon = cat.icon
                return (
                  <Link
                    key={cat.label}
                    href={cat.href}
                    className="group bg-white dark:bg-[#0b111e] border border-slate-200/90 dark:border-slate-800/90 hover:border-blue-500 dark:hover:border-blue-500 rounded-2xl p-3 flex flex-col items-center justify-center gap-2 text-center transition shadow-2xs"
                  >
                    <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 flex items-center justify-center transition">
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200 truncate w-full">
                      {cat.label}
                    </span>
                  </Link>
                )
              })}
            </div>
          </section>

          {/* 4. SERVICES & PROGRAMS */}
          <section className="space-y-3">
            <h2 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
              Services &amp; Programs
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* TechPass Membership */}
              <div className="bg-white dark:bg-[#0b111e] border border-slate-200/90 dark:border-slate-800/90 rounded-2xl p-5 flex flex-col justify-between space-y-4 shadow-2xs">
                <div className="space-y-2.5">
                  <div className="w-9 h-9 rounded-xl bg-rose-50 dark:bg-rose-950/70 border border-rose-200/60 dark:border-rose-800/60 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white">
                      TechPass Membership
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed mt-1">
                      Zero delivery charges and direct store verification records across Abuja plazas.
                    </p>
                  </div>
                </div>
                <Link href="/subscription" className="block">
                  <Button
                    variant="outline"
                    className="w-full h-9 text-xs font-bold rounded-xl border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    View Membership
                  </Button>
                </Link>
              </div>

              {/* Student Tech Program */}
              <div className="bg-white dark:bg-[#0b111e] border border-slate-200/90 dark:border-slate-800/90 rounded-2xl p-5 flex flex-col justify-between space-y-4 shadow-2xs">
                <div className="space-y-2.5">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/70 border border-blue-200/60 dark:border-blue-800/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                    <GraduationCap className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white">
                      Student Tech Program
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed mt-1">
                      Student pricing on laptops, tablets, and peripherals for Abuja tertiary campuses.
                    </p>
                  </div>
                </div>
                <Link href="/deals" className="block">
                  <Button
                    variant="outline"
                    className="w-full h-9 text-xs font-bold rounded-xl border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    View Student Pricing
                  </Button>
                </Link>
              </div>

              {/* TechTrust Protection */}
              <div className="bg-white dark:bg-[#0b111e] border border-slate-200/90 dark:border-slate-800/90 rounded-2xl p-5 flex flex-col justify-between space-y-4 shadow-2xs">
                <div className="space-y-2.5">
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-200/60 dark:border-emerald-800/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                    <Lock className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white">
                      TechTrust Protection
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed mt-1">
                      Inspect screen condition, hardware, and battery health in person before payment releases.
                    </p>
                  </div>
                </div>
                <Link href="/help" className="block">
                  <Button
                    variant="outline"
                    className="w-full h-9 text-xs font-bold rounded-xl border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    Inspection Protocols
                  </Button>
                </Link>
              </div>
            </div>
          </section>

          {/* 5. AVAILABLE TECHNOLOGY (SPONSORED PRIORITY + RANDOMIZED ORGANIC) */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white">
                  Available Technology
                </h2>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Recent listings from verified merchants in Abuja
                </p>
              </div>
              <Link
                href="/products"
                className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
              >
                <span>View Catalog</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {feedItems.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-4">
                {feedItems.map(({ product, isSponsored, campaignId, sellerId }) => {
                  const firstImage = resolveFirstImage(product.images)
                  const sellerProfile = Array.isArray(product.profiles)
                    ? product.profiles[0]
                    : product.profiles
                  const sellerName =
                    sellerProfile?.business_name ||
                    sellerProfile?.full_name ||
                    'Vendor'
                  const isVerifiedSeller =
                    sellerProfile?.tech_trust_status === 'verified'
                  const district = sellerProfile?.district || 'Abuja'

                  return (
                    <div
                      key={product.id}
                      className="relative group bg-white dark:bg-[#0b111e] border border-slate-200/90 dark:border-slate-800/90 hover:border-blue-500/60 dark:hover:border-blue-500/60 rounded-2xl overflow-hidden flex flex-col justify-between transition shadow-2xs hover:shadow-md"
                    >
                      <SaveButton product={product} />

                      <AdProductCardWrapper
                        productId={product.id}
                        sellerId={sellerId || product.seller_id}
                        campaignId={campaignId}
                        isSponsored={isSponsored}
                      >
                        <Link
                          href={`/products/${product.id}`}
                          className="flex-1 flex flex-col justify-between"
                        >
                          <AdImpressionTracker
                            productId={product.id}
                            sellerId={sellerId || product.seller_id}
                            campaignId={campaignId}
                            isSponsored={isSponsored}
                          />

                          {/* Product Image Container */}
                          <div className="relative aspect-[4/3] w-full bg-slate-100/80 dark:bg-slate-900 flex items-center justify-center p-3 overflow-hidden border-b border-slate-100 dark:border-slate-800/80">
                            <div className="absolute top-2.5 left-2.5 z-10 flex items-center gap-1">
                              {isSponsored && (
                                <span className="bg-blue-600 text-white text-[9px] font-black uppercase px-2 py-0.5 rounded-md shadow-2xs">
                                  Featured
                                </span>
                              )}
                              <span className="bg-slate-900/85 text-white text-[9px] font-bold capitalize px-2 py-0.5 rounded-md backdrop-blur-xs">
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
                            <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition line-clamp-1">
                              {product.title}
                            </h3>

                            <div className="flex items-center justify-between gap-1 text-[11px] text-slate-500 dark:text-slate-400">
                              <span className="flex items-center gap-1 truncate font-medium">
                                <span className="truncate">{sellerName}</span>
                                {isVerifiedSeller && (
                                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                                )}
                              </span>
                              <span className="flex items-center gap-0.5 text-[10px] text-slate-400 shrink-0">
                                <MapPin className="w-2.5 h-2.5" />
                                {district}
                              </span>
                            </div>
                          </div>
                        </Link>
                      </AdProductCardWrapper>

                      {/* Bottom Price & Quick Cart Action */}
                      <div className="px-3 sm:px-3.5 pb-3 pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2">
                        <span className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
                          ₦{Number(product.price).toLocaleString()}
                        </span>
                        <AddToCartButton product={product} variant="icon" />
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="bg-white dark:bg-[#0b111e] border border-slate-200 dark:border-slate-800 rounded-3xl p-12 text-center space-y-2">
                <Package className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
                <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  No published listings found
                </p>
                <p className="text-xs text-slate-400">
                  New electronics listings from Abuja stores will appear here.
                </p>
              </div>
            )}
          </section>
        </main>

        <BuyerRightSidebar
          user={sidebarUser}
          activeListingsCount={feedItems.length}
        />
      </div>
    </div>
  )
}