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
import { Badge } from '@/components/ui/badge'
import {
  ShieldCheck,
  ArrowRight,
  MapPin,
  Package,
  Scale,
  SlidersHorizontal,
  Sparkles,
  Megaphone,
  Smartphone,
  Laptop,
  Gamepad2,
  Headphones,
  Monitor,
  Cpu,
} from 'lucide-react'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Marketplace Feed | BenchTech Abuja',
  description: 'Shop verified smartphones, laptops, and hardware in Abuja.',
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

const QUICK_CATEGORIES = [
  { label: 'Phones', slug: 'phones', icon: Smartphone },
  { label: 'Laptops', slug: 'laptops', icon: Laptop },
  { label: 'Gaming', slug: 'gaming', icon: Gamepad2 },
  { label: 'Monitors', slug: 'monitors', icon: Monitor },
  { label: 'Audio & Gear', slug: 'accessories', icon: Headphones },
  { label: 'Components', slug: 'components', icon: Cpu },
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
      .select('*, profiles!products_seller_id_fkey(business_name, full_name, district, tech_trust_status)')
      .eq('status', 'published')
      .limit(48),
  ])

  const profile = profileRes.data

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

        <main className="flex-1 min-w-0 p-3 sm:p-6 space-y-6">
          {/* 1. Compact Hardware Hero Banner */}
          <section className="relative rounded-3xl overflow-hidden bg-slate-900 text-white border border-slate-800 p-5 sm:p-7 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://images.unsplash.com/photo-1526738549149-8e07eca6c147?auto=format&fit=crop&w=1200&q=80"
              alt="Abuja Electronics"
              className="absolute inset-0 w-full h-full object-cover opacity-30"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/85 to-slate-950/40" />

            <div className="relative z-10 max-w-xl space-y-2.5">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold">
                  <ShieldCheck className="w-3 h-3 mr-1" /> Verified Abuja Stores
                </Badge>
                <Badge className="bg-blue-500/20 text-blue-300 border border-blue-500/30 text-[10px] font-bold">
                  7-Day Inspection Protection
                </Badge>
              </div>

              <h1 className="text-xl sm:text-3xl font-black tracking-tight text-white leading-tight">
                Verified Hardware Across Abuja
              </h1>
              <p className="text-xs text-slate-300 leading-relaxed">
                Shop inspected phones, laptops, and workstations from verified stores in Wuse 2, Banex, Gwarinpa, and Maitama.
              </p>
            </div>

            <div className="relative z-10 flex flex-wrap items-center gap-2.5 shrink-0">
              <Link href="/products">
                <Button className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl h-10 px-5 gap-1.5 cursor-pointer">
                  <span>Browse All</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </Link>
              <Link href="/sellers">
                <Button
                  variant="outline"
                  className="bg-white/10 hover:bg-white/20 text-white border-white/20 font-bold text-xs rounded-xl h-10 px-4 cursor-pointer"
                >
                  Verified Sellers
                </Button>
              </Link>
            </div>
          </section>

          {/* 2. Quick Category Strip + Tool Shortcuts */}
          <section className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
              {QUICK_CATEGORIES.map((cat) => {
                const Icon = cat.icon
                return (
                  <Link
                    key={cat.slug}
                    href={`/products?category=${cat.slug}`}
                    className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-blue-500 dark:hover:border-blue-500 text-xs font-bold text-slate-700 dark:text-slate-200 shrink-0 transition shadow-2xs"
                  >
                    <Icon className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                    <span>{cat.label}</span>
                  </Link>
                )
              })}
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-1 [scrollbar-width:none] shrink-0">
              <Link
                href="/compare"
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 shrink-0 transition"
              >
                <Scale className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                <span>Compare</span>
              </Link>
              <Link
                href="/build"
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 shrink-0 transition"
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Build Setup</span>
              </Link>
              <Link
                href="/assistant"
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 shrink-0 transition"
              >
                <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <span>Advisor</span>
              </Link>
              <Link
                href="/requests/new"
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 shrink-0 transition"
              >
                <Megaphone className="w-3.5 h-3.5 text-amber-500" />
                <span>Request Device</span>
              </Link>
            </div>
          </section>

          {/* 3. Main Product Feed (Sponsored Priority + Randomized Organic) */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              
              <Link
                href="/products"
                className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
              >
                <span>View All ({feedItems.length})</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {feedItems.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
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
                      className="relative group bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 hover:border-blue-500/60 dark:hover:border-blue-500/60 rounded-2xl overflow-hidden flex flex-col justify-between transition shadow-2xs hover:shadow-md"
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

                          {/* Integrated Product Image Area */}
                          <div className="relative aspect-[4/3] w-full bg-slate-100/80 dark:bg-slate-800/60 flex items-center justify-center p-3 overflow-hidden border-b border-slate-100 dark:border-slate-800/80">
                            <div className="absolute top-2.5 left-2.5 z-10 flex items-center gap-1">
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
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-12 text-center space-y-2">
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