import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getSponsoredProducts } from '@/lib/ads/getSponsoredProducts'
import { BenchTechLogo } from '@/components/BenchTechLogo'
import { AdImpressionTracker } from '@/components/storefront/AdImpressionTracker'
import { AdProductCardWrapper } from '@/components/storefront/AdProductCardWrapper'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  ShoppingBag,
  Store,
  ArrowRight,
  ShieldCheck,
  Lock,
  Truck,
  MapPin,
  Package,
  Search,
  Settings,
} from 'lucide-react'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'BenchTech | Verified Electronics Marketplace in Abuja',
  description:
    'Buy and sell verified smartphones, laptops, consoles, and hardware in Abuja with physical inspection.',
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

const FEATURED_CATEGORIES = [
  {
    name: 'Laptops & Workstations',
    slug: 'laptops',
    image:
      'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=600&q=80',
  },
  {
    name: 'Smartphones & Tablets',
    slug: 'phones',
    image:
      'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=600&q=80',
  },
  {
    name: 'Consoles & Gaming',
    slug: 'gaming',
    image:
      'https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?auto=format&fit=crop&w=600&q=80',
  },
  {
    name: 'Monitors & Accessories',
    slug: 'accessories',
    image:
      'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=600&q=80',
  },
]

export default async function LandingGatewayPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    redirect('/feed')
  }

  // 1. Fetch Sponsored Products (Top Priority) + All Published Products in parallel
  const [sponsoredResults, { data: rawProducts }] = await Promise.all([
    getSponsoredProducts({ limit: 6 }).catch(() => []),
    supabase
      .from('products')
      .select('*, profiles!products_seller_id_fkey(business_name, full_name, district, tech_trust_status)')
      .eq('status', 'published')
      .limit(40),
  ])

  // 2. Build prioritized + randomized product feed without duplicates
  const seenIds = new Set<string>()
  const finalProducts: Array<{
    product: any
    isSponsored: boolean
    campaignId?: string
    sellerId?: string
  }> = []

  // First: Active Sponsored Campaign Products
  for (const sp of sponsoredResults || []) {
    if (sp?.product?.id && !seenIds.has(sp.product.id)) {
      seenIds.add(sp.product.id)
      finalProducts.push({
        product: sp.product,
        isSponsored: true,
        campaignId: sp.campaignId,
        sellerId: sp.sellerId,
      })
    }
  }

  const allPublished = rawProducts || []

  // Second: Featured Products (shuffled among featured)
  const featuredPool = shuffleArray(
    allPublished.filter((p) => p.is_featured && !seenIds.has(p.id))
  )
  for (const feat of featuredPool) {
    seenIds.add(feat.id)
    finalProducts.push({
      product: feat,
      isSponsored: true,
      sellerId: feat.seller_id,
    })
  }

  // Third: Remaining Organic Products (randomized on every load)
  const organicPool = shuffleArray(
    allPublished.filter((p) => !seenIds.has(p.id))
  )
  for (const org of organicPool) {
    seenIds.add(org.id)
    finalProducts.push({
      product: org,
      isSponsored: false,
      sellerId: org.seller_id,
    })
  }

  const displayProducts = finalProducts.slice(0, 12)

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col transition-colors">
      {/* Sticky Header */}
      <header className="sticky top-0 z-50 border-b border-slate-200/80 dark:border-slate-800 bg-white/95 dark:bg-slate-950/95 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
          <Link href="/" className="flex items-center gap-2.5 shrink-0">
            <BenchTechLogo className="w-8 h-8" />
            <div>
              <span className="font-black text-base sm:text-lg text-slate-900 dark:text-white tracking-tight leading-none block">
                BenchTech
              </span>
              <span className="text-[9px] text-slate-400 font-semibold tracking-wider hidden sm:block mt-0.5">
                Buy Smart. Sell Easy.
              </span>
            </div>
          </Link>

          {/* Search Bar */}
          <form
            action="/products"
            method="GET"
            className="hidden md:flex flex-1 max-w-md mx-4 relative"
          >
            <input
              type="text"
              name="q"
              placeholder="Search laptops, phones, consoles in Abuja..."
              className="w-full h-9 pl-3.5 pr-9 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              aria-label="Search"
              className="absolute right-1.5 top-1/2 -translate-y-1/2 bg-blue-600 hover:bg-blue-700 text-white p-1.5 rounded-lg"
            >
              <Search className="w-3.5 h-3.5" />
            </button>
          </form>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/products"
              className="text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hidden sm:inline-block px-2"
            >
              Catalog
            </Link>
            <Link
              href="/sellers"
              className="text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hidden sm:inline-block px-2"
            >
              Sellers
            </Link>
            <Link
              href="/settings"
              title="Appearance & Settings"
              className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              <Settings className="w-4 h-4" />
            </Link>
            <Link href="/login">
              <Button
                size="sm"
                variant="ghost"
                className="text-xs font-bold rounded-xl h-9 px-3"
              >
                Sign In
              </Button>
            </Link>
            <Link href="/register">
              <Button
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl h-9 px-3.5"
              >
                Register
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-8 sm:space-y-10">
        {/* 1. Split Hero Banner with Hardware Photography */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5">
          {/* Main Hero Visual */}
          <div className="lg:col-span-8 relative rounded-3xl overflow-hidden bg-slate-900 text-white border border-slate-800 min-h-[280px] sm:min-h-[340px] flex flex-col justify-between p-6 sm:p-8">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=1400&q=80"
              alt="Hardware Showcase"
              className="absolute inset-0 w-full h-full object-cover opacity-35"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/85 to-slate-950/30" />

            <div className="relative z-10 max-w-xl space-y-3">
              <Badge className="bg-blue-600/20 text-blue-300 border border-blue-500/30 text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5">
                Abuja Electronics Marketplace
              </Badge>
              <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white leading-tight">
                Buy and Sell Verified Hardware in Abuja.
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-lg">
                Browse laptops, smartphones, and consoles from identity-verified Abuja stores. Every order includes physical inspection upon delivery.
              </p>
            </div>

            <div className="relative z-10 pt-6 flex flex-wrap items-center gap-3">
              <Link href="/products">
                <Button className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl h-10 px-5 gap-1.5 cursor-pointer">
                  <span>Explore Catalog</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </Link>
              <Link href="/sellers">
                <Button
                  variant="outline"
                  className="bg-white/10 hover:bg-white/20 text-white border-white/20 font-bold text-xs rounded-xl h-10 px-4 cursor-pointer"
                >
                  Verified Stores
                </Button>
              </Link>
            </div>
          </div>

          {/* Right Column: Buyer & Seller Quick Entry Cards */}
          <div className="lg:col-span-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
            <Link
              href="/register?role=buyer"
              className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-blue-500 dark:hover:border-blue-500 rounded-3xl p-5 flex flex-col justify-between transition shadow-2xs"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shrink-0">
                  <ShoppingBag className="w-5 h-5" />
                </div>
                <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1 group-hover:translate-x-0.5 transition">
                  <span>Start Shopping</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
              <div className="pt-4">
                <h2 className="text-base font-black text-slate-900 dark:text-white">
                  Buyer Account
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Compare device specs, order with delivery inspection, and track warranties.
                </p>
              </div>
            </Link>

            <Link
              href="/register?role=seller"
              className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-purple-500 dark:hover:border-purple-500 rounded-3xl p-5 flex flex-col justify-between transition shadow-2xs"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="w-10 h-10 rounded-2xl bg-purple-600 text-white flex items-center justify-center shrink-0">
                  <Store className="w-5 h-5" />
                </div>
                <span className="text-[11px] font-bold text-purple-600 dark:text-purple-400 flex items-center gap-1 group-hover:translate-x-0.5 transition">
                  <span>Open a Store</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
              <div className="pt-4">
                <h2 className="text-base font-black text-slate-900 dark:text-white">
                  Seller Account
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Complete one-time verification to list inventory and receive bank payouts.
                </p>
              </div>
            </Link>
          </div>
        </section>

        {/* 2. Visual Hardware Categories */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
              Browse by Category
            </h2>
            <Link
              href="/products"
              className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {FEATURED_CATEGORIES.map((cat) => (
              <Link
                key={cat.slug}
                href={`/products?category=${cat.slug}`}
                className="group relative h-28 sm:h-36 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-900 flex items-end p-4"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={cat.image}
                  alt={cat.name}
                  loading="lazy"
                  className="absolute inset-0 w-full h-full object-cover opacity-55 group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-transparent" />
                <div className="relative z-10 flex items-center justify-between w-full">
                  <span className="text-xs sm:text-sm font-black text-white">
                    {cat.name}
                  </span>
                  <ArrowRight className="w-4 h-4 text-white/80 group-hover:translate-x-0.5 transition" />
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* 3. Sponsored-First + Randomized Marketplace Feed */}
        <section className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-slate-800 pb-3">
            <div>
              <h2 className="text-base sm:text-xl font-black text-slate-900 dark:text-white">
                Available Hardware in Abuja
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Featured and verified listings ready for pickup or Abuja courier delivery
              </p>
            </div>
            <Link
              href="/products"
              className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 shrink-0"
            >
              <span>Full Catalog</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {displayProducts.map(({ product, isSponsored, campaignId, sellerId }) => {
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
              const district = sellerProfile?.district || 'Abuja'

              return (
                <AdProductCardWrapper
                  key={product.id}
                  productId={product.id}
                  sellerId={sellerId || product.seller_id}
                  campaignId={campaignId}
                  isSponsored={isSponsored}
                >
                  <Link
                    href={`/products/${product.id}`}
                    className="group bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 hover:border-blue-500/60 dark:hover:border-blue-500/60 rounded-2xl overflow-hidden flex flex-col justify-between transition shadow-2xs hover:shadow-md"
                  >
                    <AdImpressionTracker
                      productId={product.id}
                      sellerId={sellerId || product.seller_id}
                      campaignId={campaignId}
                      isSponsored={isSponsored}
                    />

                    {/* Smoothly Integrated Image Container */}
                    <div className="relative aspect-[4/3] w-full bg-slate-100/80 dark:bg-slate-800/60 flex items-center justify-center p-3 overflow-hidden border-b border-slate-100 dark:border-slate-800/80">
                      <div className="absolute top-2.5 left-2.5 z-10 flex items-center gap-1.5">
                        {isSponsored && (
                          <span className="bg-blue-600 text-white text-[9px] font-black uppercase px-2 py-0.5 rounded-md shadow-2xs">
                            Featured
                          </span>
                        )}
                        <span className="bg-slate-900/80 text-white text-[9px] font-bold capitalize px-2 py-0.5 rounded-md backdrop-blur-xs">
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

                    {/* Product Details */}
                    <div className="p-3 sm:p-4 flex-1 flex flex-col justify-between space-y-2.5">
                      <div className="space-y-1">
                        <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition line-clamp-1">
                          {product.title}
                        </h3>
                        <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400 truncate">
                          <span className="truncate font-medium">{sellerName}</span>
                          {isVerifiedSeller && (
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                          )}
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                        <span className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
                          ₦{Number(product.price).toLocaleString()}
                        </span>
                        <span className="text-[10px] text-slate-400 flex items-center gap-0.5 truncate">
                          <MapPin className="w-3 h-3 shrink-0" />
                          <span className="truncate">{district}</span>
                        </span>
                      </div>
                    </div>
                  </Link>
                </AdProductCardWrapper>
              )
            })}
          </div>
        </section>

        {/* 4. Trust Bar */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xs">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs font-black text-slate-900 dark:text-white">
                Identity &amp; CAC Verified Stores
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Every merchant completes one-time identity and bank verification.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs font-black text-slate-900 dark:text-white">
                7-Day Buyer Inspection Window
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Seller payouts are held until delivery is confirmed with your OTP.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs font-black text-slate-900 dark:text-white">
                Abuja Dispatch &amp; Plaza Pickup
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Same-day courier delivery across Abuja districts or in-store pickup.
              </p>
            </div>
          </div>
        </section>
      </main>

      <footer className="mt-auto border-t border-slate-200 dark:border-slate-800 py-8 px-4 sm:px-6 bg-white dark:bg-slate-900">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
          <p>© 2026 BenchTech Abuja. Buy Smart. Sell Easy.</p>
          <div className="flex items-center gap-4 font-semibold">
            <Link href="/products" className="hover:text-blue-600 transition">
              Catalog
            </Link>
            <Link href="/sellers" className="hover:text-blue-600 transition">
              Verified Sellers
            </Link>
            <Link href="/settings" className="hover:text-blue-600 transition">
              Settings &amp; Theme
            </Link>
            <Link href="/help" className="hover:text-blue-600 transition">
              Help
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}