import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/Navbar'
import { BuyerSidebar } from '@/components/storefront/BuyerSidebar'
import { BuyerRightSidebar } from '@/components/storefront/BuyerRightSidebar'
import { SaveButton } from '@/components/SaveButton'
//import { AddToCartButton } from '@/components/cart/AddToCartButton'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { 
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
  ShieldCheck, 
  Lock, 
  Truck, 
  RotateCcw,
  Flame,
  ArrowRight,
  Sparkles,
  Crown,
  Package,
  MapPin
} from 'lucide-react'

// Cache this public page on edge for 30s instead of force-dynamic querying on every user hit
export const revalidate = 30

const CATEGORY_CHIPS = [
  { id: 'phones', label: 'Phones', icon: Smartphone },
  { id: 'laptops', label: 'Laptops', icon: Laptop },
  { id: 'gaming', label: 'Gaming', icon: Gamepad2 },
  { id: 'accessories', label: 'Accessories', icon: Headphones },
  { id: 'cameras', label: 'Cameras', icon: Camera },
  { id: 'networking', label: 'Networking', icon: Network },
  { id: 'smarthome', label: 'Smart Home', icon: HomeIcon },
  { id: 'wearables', label: 'Wearables', icon: Watch },
  { id: 'tablets', label: 'Tablets', icon: Tablet },
  { id: 'monitors', label: 'Monitors', icon: Monitor },
  { id: 'all', label: 'View All', icon: Grid },
]

export default async function FeedPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login?next=/feed')
  }

  const now = new Date().toISOString()

  // Execute all 4 database queries in parallel for high throughput & low TTFB
  const [
    { data: userProfile },
    { data: heroPromos },
    { data: dealsPromos },
    { data: products },
  ] = await Promise.all([
    supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single(),

    supabase
      .from('promotions')
      .select('*, products(*), profiles(business_name, district, tech_trust_status)')
      .eq('package_type', 'homepage_hero')
      .eq('status', 'active')
      .gt('ends_at', now)
      .order('created_at', { ascending: false })
      .limit(1),

    supabase
      .from('promotions')
      .select('*, products(*), profiles(business_name, district)')
      .eq('package_type', 'deals_spotlight')
      .eq('status', 'active')
      .gt('ends_at', now)
      .order('created_at', { ascending: false })
      .limit(4),

    supabase
      .from('products')
      .select('*, profiles!products_seller_id_fkey(business_name, district, tech_trust_status)')
      .eq('status', 'published')
      .order('is_featured', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false })
      .limit(16),
  ])

  const activeHero = heroPromos?.[0] || null

  return (
    <div className="min-h-screen bg-slate-100/60 dark:bg-slate-950 flex flex-col">
      <Navbar />

      <div className="max-w-[1700px] w-full mx-auto flex flex-1">
        <BuyerSidebar />

        <main className="flex-1 min-w-0 p-2.5 sm:p-4 md:p-6 space-y-4 sm:space-y-6">
          {/* 1. HERO BANNER */}
          {activeHero?.products ? (
            <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-blue-950 text-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 relative overflow-hidden shadow-xs flex flex-col md:flex-row items-center justify-between gap-4 border border-blue-900/40">
              <div className="space-y-2.5 sm:space-y-3 max-w-lg z-10 w-full">
                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                  <Badge className="bg-amber-400 text-slate-950 font-black text-[9px] sm:text-[10px] uppercase tracking-wider px-2 py-0.5 border-none flex items-center gap-1 shadow-xs">
                    <Crown className="w-2.5 h-2.5 fill-slate-950" /> Featured Tech
                  </Badge>
                  <span className="text-[10px] sm:text-xs text-blue-300 font-semibold truncate max-w-[200px]">
                    {activeHero.profiles?.business_name || 'Verified Vendor'}
                  </span>
                </div>

                <h1 className="text-lg sm:text-2xl md:text-3xl font-black tracking-tight text-white leading-tight">
                  {activeHero.products.title}
                </h1>

                <p className="text-[11px] sm:text-xs text-slate-300 line-clamp-2 leading-relaxed">
                  {activeHero.products.description || 'Verified Abuja technology available for physical inspection and pickup or express dispatch.'}
                </p>

                <div className="flex items-center gap-3 pt-1">
                  <span className="text-base sm:text-2xl font-black text-amber-300">
                    ₦{Number(activeHero.products.price).toLocaleString()}
                  </span>
                  <Link href={`/products/${activeHero.products.id}`}>
                    <Button className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] sm:text-xs px-3.5 sm:px-5 h-8 sm:h-9 rounded-xl gap-1.5 shadow-xs">
                      View Gadget <ArrowRight className="w-3 h-3" />
                    </Button>
                  </Link>
                </div>
              </div>

              <div className="relative z-10 w-full md:w-64 aspect-[16/9] md:aspect-[4/3] bg-white/5 rounded-xl border border-white/10 flex items-center justify-center p-2.5 backdrop-blur-xs">
                {activeHero.products.images?.[0] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={activeHero.products.images[0]}
                    alt={activeHero.products.title}
                    loading="lazy"
                    decoding="async"
                    className="max-h-full max-w-full object-contain drop-shadow-xl"
                  />
                ) : (
                  <Package className="w-10 h-10 text-slate-400" />
                )}
              </div>
            </div>
          ) : (
            <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-blue-950 text-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 relative overflow-hidden shadow-xs flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="space-y-1.5 sm:space-y-2.5 max-w-md z-10 w-full">
                <span className="text-[9px] sm:text-[10px] uppercase tracking-wider text-blue-400 font-bold block">
                  Your One-Stop Tech Marketplace
                </span>
                <h1 className="text-xl sm:text-3xl md:text-4xl font-black tracking-tight leading-tight">
                  The Latest Tech. <br className="hidden sm:inline" />
                  <span className="text-blue-500">The Best Deals.</span>
                </h1>
                <p className="text-[11px] sm:text-xs text-slate-300 line-clamp-2">
                  Phones, Laptops, Gaming, Accessories, and More in Abuja.
                </p>
                <div className="pt-1">
                  <Link href="/products">
                    <Button className="bg-white text-slate-950 hover:bg-slate-100 font-bold text-[11px] sm:text-xs px-4 sm:px-5 h-8 sm:h-9 rounded-xl gap-1.5">
                      Shop Now <ArrowRight className="w-3 h-3" />
                    </Button>
                  </Link>
                </div>
              </div>

              <div className="hidden md:flex flex-col items-center justify-center p-4 bg-white/5 border border-white/10 rounded-2xl text-center w-60 shrink-0">
                <Sparkles className="w-6 h-6 text-amber-400 mb-1" />
                <p className="text-xs font-bold text-slate-200">Abuja Tech Hub</p>
                <p className="text-[10px] text-slate-400">Verified gadgets available today</p>
              </div>
            </div>
          )}

          {/* 2. SLIM CATEGORY CHIPS */}
          <div className="flex items-center gap-2 sm:gap-2.5 overflow-x-auto pb-1 scrollbar-none -mx-1 px-1">
            {CATEGORY_CHIPS.map((cat) => {
              const Icon = cat.icon
              return (
                <Link
                  key={cat.id}
                  href={cat.id === 'all' ? '/products' : `/products?category=${cat.id}`}
                  className="flex flex-col items-center gap-1 p-2 sm:p-2.5 rounded-xl sm:rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-blue-500 hover:shadow-2xs min-w-[58px] sm:min-w-[70px] transition group shrink-0"
                >
                  <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 group-hover:bg-blue-50 group-hover:text-blue-600 transition">
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] sm:text-[11px] font-semibold text-slate-700 dark:text-slate-300 group-hover:text-blue-600 text-center whitespace-nowrap">
                    {cat.label}
                  </span>
                </Link>
              )
            })}
          </div>

          {/* 3. DEALS & SPOTLIGHT ROW */}
          {dealsPromos && dealsPromos.length > 0 && (
            <div className="space-y-2.5">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-1.5">
                  <div className="w-6 h-6 rounded-lg bg-red-100 text-red-600 flex items-center justify-center">
                    <Flame className="w-3.5 h-3.5" />
                  </div>
                  <h2 className="text-xs sm:text-sm md:text-base font-black text-slate-900 dark:text-slate-100">Deals Spotlight</h2>
                  <Badge className="bg-red-50 text-red-600 border border-red-200 text-[8px] sm:text-[9px] font-black uppercase px-1.5 py-0">
                    Hot
                  </Badge>
                </div>
                <Link href="/products?filter=deals" className="text-[11px] sm:text-xs font-bold text-blue-600 hover:underline">
                  View All &rarr;
                </Link>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
                {dealsPromos.map((deal) => {
                  const item = deal.products
                  if (!item) return null

                  return (
                    <div key={deal.id} className="relative group">
                      <SaveButton product={item} />
                      <Link href={`/products/${item.id}`}>
                        <Card className="h-full border border-red-200/80 dark:border-red-900/60 rounded-xl sm:rounded-2xl overflow-hidden hover:shadow-xs transition bg-white dark:bg-slate-900 flex flex-col justify-between">
                          <div className="aspect-square bg-red-50/20 relative overflow-hidden p-2 flex items-center justify-center">
                            <Badge className="absolute top-2 left-2 bg-red-600 text-white border-none text-[8px] font-bold uppercase">
                              Deal
                            </Badge>

                            {item.images?.[0] ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={item.images[0]}
                                alt={item.title}
                                loading="lazy"
                                decoding="async"
                                className="max-h-full object-contain group-hover:scale-105 transition duration-300"
                              />
                            ) : (
                              <Package className="w-7 h-7 text-slate-300" />
                            )}
                          </div>

                          <CardContent className="p-2 sm:p-3 flex-1 flex flex-col justify-between space-y-1.5">
                            <div>
                              <h3 className="font-bold text-[11px] sm:text-xs text-slate-900 dark:text-slate-100 group-hover:text-blue-600 transition line-clamp-1">
                                {item.title}
                              </h3>
                              <p className="text-[9px] sm:text-[10px] text-slate-400 truncate">
                                {deal.profiles?.business_name || 'Verified Seller'}
                              </p>
                            </div>

                            <div className="pt-1.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                              <p className="text-xs sm:text-sm font-black text-red-600">
                                ₦{Number(item.price).toLocaleString()}
                              </p>
                              {/* <AddToCartButton product={item} variant="icon" /> */}
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* 4. COMPACT TRUST GUARANTEES */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 bg-white dark:bg-slate-900 p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
            <div className="flex items-center gap-2 px-1">
              <div className="w-7 h-7 rounded-full bg-blue-50 dark:bg-blue-950 flex items-center justify-center text-blue-600 shrink-0">
                <ShieldCheck className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] sm:text-xs font-bold text-slate-900 dark:text-slate-100 truncate">Verified Sellers</p>
                <p className="text-[9px] sm:text-[10px] text-slate-400 truncate">Shop with confidence</p>
              </div>
            </div>

            <div className="flex items-center gap-2 px-1 sm:border-l border-slate-100 dark:border-slate-800">
              <div className="w-7 h-7 rounded-full bg-emerald-50 dark:bg-emerald-950 flex items-center justify-center text-emerald-600 shrink-0">
                <Lock className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] sm:text-xs font-bold text-slate-900 dark:text-slate-100 truncate">Secure Payments</p>
                <p className="text-[9px] sm:text-[10px] text-slate-400 truncate">Protected escrow</p>
              </div>
            </div>

            <div className="flex items-center gap-2 px-1 border-t sm:border-t-0 sm:border-l border-slate-100 dark:border-slate-800 pt-1.5 sm:pt-0">
              <div className="w-7 h-7 rounded-full bg-sky-50 dark:bg-sky-950 flex items-center justify-center text-sky-600 shrink-0">
                <Truck className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] sm:text-xs font-bold text-slate-900 dark:text-slate-100 truncate">Fast Delivery</p>
                <p className="text-[9px] sm:text-[10px] text-slate-400 truncate">Abuja &amp; nationwide</p>
              </div>
            </div>

            <div className="flex items-center gap-2 px-1 border-t sm:border-t-0 sm:border-l border-slate-100 dark:border-slate-800 pt-1.5 sm:pt-0">
              <div className="w-7 h-7 rounded-full bg-purple-50 dark:bg-purple-950 flex items-center justify-center text-purple-600 shrink-0">
                <RotateCcw className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] sm:text-xs font-bold text-slate-900 dark:text-slate-100 truncate">Easy Returns</p>
                <p className="text-[9px] sm:text-[10px] text-slate-400 truncate">Hassle-free inspection</p>
              </div>
            </div>
          </div>

          {/* 5. 2-COLUMN PRODUCT FEED */}
          <div className="space-y-2.5 sm:space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-1.5">
                <Flame className="w-4 h-4 sm:w-5 sm:h-5 text-red-500 fill-red-500" />
                <h2 className="text-xs sm:text-sm md:text-base font-black text-slate-900 dark:text-slate-100">Available Technology</h2>
                <span className="text-[10px] text-slate-400 hidden sm:inline">• Live verified listings</span>
              </div>
              <Link href="/products" className="text-[11px] sm:text-xs font-bold text-blue-600 hover:underline">
                View All &rarr;
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3.5">
              {products && products.length > 0 ? (
                products.map((item) => {
                  const isFeatured =
                    item.is_featured &&
                    item.featured_until &&
                    new Date(item.featured_until) > new Date()

                  return (
                    <div key={item.id} className="relative group">
                      <SaveButton product={item} />
                      <Link href={`/products/${item.id}`}>
                        <Card className={`h-full rounded-xl sm:rounded-2xl overflow-hidden hover:shadow-md transition bg-white dark:bg-slate-900 flex flex-col justify-between ${
                          isFeatured 
                            ? 'border-2 border-blue-400/80 ring-2 ring-blue-500/10 shadow-2xs' 
                            : 'border border-slate-200/80 dark:border-slate-800 shadow-2xs'
                        }`}>
                          <div className="aspect-square bg-slate-50 dark:bg-slate-800/40 relative overflow-hidden p-2 flex items-center justify-center">
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
                                loading="lazy"
                                decoding="async"
                                className="max-h-full object-contain group-hover:scale-105 transition duration-300"
                              />
                            ) : (
                              <div className="text-[10px] text-slate-400">No Image</div>
                            )}
                          </div>

                          <CardContent className="p-2.5 sm:p-3.5 flex-1 flex flex-col justify-between space-y-1.5">
                            <div>
                              <h3 className="font-bold text-[11px] sm:text-xs text-slate-900 dark:text-slate-100 group-hover:text-blue-600 transition line-clamp-1">
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

                            <div className="pt-1.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                              <p className="text-xs sm:text-sm font-black text-slate-900 dark:text-slate-100">
                                ₦{Number(item.price).toLocaleString()}
                              </p>
                              {/* <AddToCartButton product={item} variant="icon" /> */}
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    </div>
                  )
                })
              ) : (
                <div className="col-span-full p-8 text-center bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                  <p className="text-xs text-slate-500">No items available yet.</p>
                </div>
              )}
            </div>
          </div>
        </main>

        <BuyerRightSidebar
          user={{
            id: user.id,
            email: user.email,
            fullName: userProfile?.full_name,
            role: userProfile?.role,
            techTrustStatus: userProfile?.tech_trust_status,
          }}
          activeListingsCount={products?.length || 0}
        />
      </div>
    </div>
  )
}