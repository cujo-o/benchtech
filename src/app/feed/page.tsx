import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/Navbar'
import { BuyerSidebar } from '@/components/storefront/BuyerSidebar'
import { BuyerRightSidebar } from '@/components/storefront/BuyerRightSidebar'
import { SaveButton } from '@/components/SaveButton'
import { AddToCartButton } from '@/components/cart/AddToCartButton'
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
  MapPin,
  Tag
} from 'lucide-react'

export const dynamic = 'force-dynamic'

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

  // 1. Fetch user profile
  const { data: userProfile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  // 2. Fetch live Homepage Hero Showcase promotion (ends_at > now())
  const { data: heroPromos } = await supabase
    .from('promotions')
    .select('*, products(*), profiles(business_name, district, tech_trust_status)')
    .eq('package_type', 'homepage_hero')
    .eq('status', 'active')
    .gt('ends_at', now)
    .order('created_at', { ascending: false })
    .limit(1)

  const activeHero = heroPromos?.[0] || null

  // 3. Fetch live Deals & Clearance Spotlight promotions (ends_at > now())
  const { data: dealsPromos } = await supabase
    .from('promotions')
    .select('*, products(*), profiles(business_name, district)')
    .eq('package_type', 'deals_spotlight')
    .eq('status', 'active')
    .gt('ends_at', now)
    .order('created_at', { ascending: false })
    .limit(4)

  // 4. Fetch Product Catalog: prioritize Featured listings first, then newly listed
  const { data: products } = await supabase
    .from('products')
    .select('*, profiles!products_seller_id_fkey(business_name, district, tech_trust_status)')
    .eq('status', 'published')
    .order('is_featured', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false })
    .limit(16)

  return (
    <div className="min-h-screen bg-slate-100/60 flex flex-col">
      <Navbar />

      <div className="max-w-[1700px] w-full mx-auto flex flex-1">
        <BuyerSidebar />

        <main className="flex-1 min-w-0 p-4 md:p-6 space-y-6">
          {/* =========================================================
              1. HERO BANNER (Dynamic Pro Hero Spotlight or Default)
          ========================================================= */}
          {activeHero?.products ? (
            <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-blue-950 text-white rounded-3xl p-6 md:p-10 relative overflow-hidden shadow-sm flex flex-col md:flex-row justify-between items-center gap-6 border border-blue-900/40">
              <div className="space-y-4 max-w-lg z-10">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className="bg-amber-400 text-slate-950 font-black text-[10px] uppercase tracking-wider px-2.5 py-0.5 border-none flex items-center gap-1 shadow-xs">
                    <Crown className="w-3 h-3 fill-slate-950" /> Featured Tech Spotlight
                  </Badge>
                  <span className="text-xs text-blue-300 font-semibold flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                    {activeHero.profiles?.business_name || 'Verified Vendor'}
                  </span>
                </div>

                <h1 className="text-2xl md:text-4xl font-black tracking-tight text-white leading-tight">
                  {activeHero.products.title}
                </h1>

                <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                  {activeHero.products.description || 'Verified Abuja technology available for physical inspection and pickup or express dispatch.'}
                </p>

                <div className="flex flex-wrap items-center gap-4 pt-1">
                  <span className="text-2xl md:text-3xl font-black text-amber-300">
                    ₦{Number(activeHero.products.price).toLocaleString()}
                  </span>
                  <Link href={`/products/${activeHero.products.id}`}>
                    <Button className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-6 h-10 rounded-xl gap-2 shadow-md">
                      View Gadget <ArrowRight className="w-3.5 h-3.5" />
                    </Button>
                  </Link>
                </div>
              </div>

              <div className="relative z-10 w-full md:w-80 aspect-[16/11] bg-white/5 rounded-2xl border border-white/10 flex items-center justify-center p-4 backdrop-blur-xs">
                {activeHero.products.images?.[0] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={activeHero.products.images[0]}
                    alt={activeHero.products.title}
                    className="max-h-full max-w-full object-contain drop-shadow-xl"
                  />
                ) : (
                  <Package className="w-14 h-14 text-slate-400" />
                )}
              </div>
            </div>
          ) : (
            <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-blue-950 text-white rounded-3xl p-6 md:p-10 relative overflow-hidden shadow-sm flex flex-col md:flex-row justify-between items-center gap-6">
              <div className="space-y-4 max-w-md z-10">
                <span className="text-[11px] uppercase tracking-wider text-blue-400 font-bold">
                  Your One-Stop Tech Marketplace
                </span>
                <h1 className="text-3xl md:text-5xl font-black tracking-tight leading-none">
                  The Latest Tech. <br />
                  <span className="text-blue-500">The Best Deals.</span>
                </h1>
                <p className="text-xs text-slate-300">
                  Phones, Laptops, Gaming, Accessories, and More in Abuja.
                </p>
                <Link href="/products" className="inline-block pt-2">
                  <Button className="bg-white text-slate-950 hover:bg-slate-100 font-bold text-xs px-6 h-10 rounded-xl gap-2">
                    Shop Now <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                </Link>
              </div>

              <div className="relative z-10 text-right">
                <span className="text-slate-400 italic text-xs font-serif block mb-2">Better Tech, A Brighter You</span>
                <div className="w-64 md:w-80 aspect-[16/10] bg-blue-500/10 rounded-2xl border border-white/10 flex items-center justify-center p-4">
                  <div className="text-center space-y-1">
                    <p className="text-xs font-bold text-slate-200">Abuja Tech Hub</p>
                    <p className="text-[10px] text-slate-400">Verified gadgets available today</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* =========================================================
              2. CATEGORY CHIPS BAR
          ========================================================= */}
          <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-none">
            {CATEGORY_CHIPS.map((cat) => {
              const Icon = cat.icon
              return (
                <Link
                  key={cat.id}
                  href={cat.id === 'all' ? '/products' : `/products?category=${cat.id}`}
                  className="flex flex-col items-center gap-1.5 p-3 rounded-2xl bg-white border border-slate-200/80 hover:border-blue-500 hover:shadow-xs min-w-[76px] transition group shrink-0"
                >
                  <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-600 group-hover:bg-blue-50 group-hover:text-blue-600 transition">
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-[11px] font-semibold text-slate-700 group-hover:text-blue-600 text-center whitespace-nowrap">
                    {cat.label}
                  </span>
                </Link>
              )
            })}
          </div>

          {/* =========================================================
              3. DEALS SPOTLIGHT CAROUSEL (Dynamic Promotions)
          ========================================================= */}
          {dealsPromos && dealsPromos.length > 0 && (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-red-100 text-red-600 flex items-center justify-center">
                    <Flame className="w-4 h-4" />
                  </div>
                  <h2 className="text-sm md:text-base font-black text-slate-900">Deals &amp; Clearance Spotlight</h2>
                  <Badge className="bg-red-50 text-red-600 border border-red-200 text-[10px] font-black uppercase">
                    Promoted
                  </Badge>
                </div>
                <Link href="/products?filter=deals" className="text-xs font-bold text-blue-600 hover:underline">
                  View All &rarr;
                </Link>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4">
                {dealsPromos.map((deal) => {
                  const item = deal.products
                  if (!item) return null

                  return (
                    <div key={deal.id} className="relative group">
                      <SaveButton product={item} />
                      <Link href={`/products/${item.id}`}>
                        <Card className="h-full border border-red-200/80 rounded-2xl overflow-hidden hover:shadow-md transition bg-white flex flex-col justify-between">
                          <div className="aspect-[4/3] bg-red-50/30 relative overflow-hidden p-3 flex items-center justify-center">
                            <Badge className="absolute top-2.5 left-2.5 bg-red-600 text-white border-none text-[9px] font-bold uppercase shadow-xs">
                              Hot Deal
                            </Badge>

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

                          <CardContent className="p-3 flex-1 flex flex-col justify-between space-y-2">
                            <div>
                              <h3 className="font-bold text-xs text-slate-900 group-hover:text-blue-600 transition line-clamp-1">
                                {item.title}
                              </h3>
                              <p className="text-[10px] text-slate-400 mt-0.5 truncate">
                                {deal.profiles?.business_name || 'Verified Seller'}
                              </p>
                            </div>

                            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                              <p className="text-sm font-black text-red-600">
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
            </div>
          )}

          {/* =========================================================
              4. TRUST GUARANTEES
          ========================================================= */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="flex items-center gap-2.5 px-2">
              <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900">Verified Sellers</p>
                <p className="text-[10px] text-slate-400">Shop with confidence</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 px-2 border-l border-slate-100">
              <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
                <Lock className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900">Secure Payments</p>
                <p className="text-[10px] text-slate-400">Your money is protected</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 px-2 border-l border-slate-100">
              <div className="w-8 h-8 rounded-full bg-sky-50 flex items-center justify-center text-sky-600 shrink-0">
                <Truck className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900">Fast Delivery</p>
                <p className="text-[10px] text-slate-400">Abuja &amp; nationwide</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 px-2 border-l border-slate-100">
              <div className="w-8 h-8 rounded-full bg-purple-50 flex items-center justify-center text-purple-600 shrink-0">
                <RotateCcw className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900">Easy Returns</p>
                <p className="text-[10px] text-slate-400">Hassle-free inspection</p>
              </div>
            </div>
          </div>

          {/* =========================================================
              5. PRODUCT FEED (With Featured Badging & Priority Ranking)
          ========================================================= */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Flame className="w-5 h-5 text-red-500 fill-red-500" />
                <h2 className="text-base font-black text-slate-900">Available Technology Catalog</h2>
                <span className="text-[11px] text-slate-400">Live verified listings</span>
              </div>
              <Link href="/products" className="text-xs font-bold text-blue-600 hover:underline">
                View All &rarr;
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
                        <Card className={`h-full rounded-2xl overflow-hidden hover:shadow-md transition bg-white flex flex-col justify-between ${
                          isFeatured 
                            ? 'border-2 border-blue-400/80 ring-2 ring-blue-500/10 shadow-xs' 
                            : 'border border-slate-200/80'
                        }`}>
                          <div className="aspect-[4/3] bg-slate-50 relative overflow-hidden p-3 flex items-center justify-center">
                            {/* Badges */}
                            <div className="absolute top-2.5 left-2.5 flex flex-col gap-1 z-10">
                              {isFeatured && (
                                <Badge className="bg-blue-600 text-white border-none text-[9px] font-black uppercase tracking-wider flex items-center gap-1 shadow-xs">
                                  <Sparkles className="w-2.5 h-2.5" /> Featured
                                </Badge>
                              )}
                              <Badge className="bg-slate-900/80 backdrop-blur-md text-white border-none text-[9px] capitalize">
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
                              <div className="text-xs text-slate-400">No Image</div>
                            )}
                          </div>

                          <CardContent className="p-3.5 flex-1 flex flex-col justify-between space-y-2">
                            <div>
                              <h3 className="font-bold text-xs text-slate-900 group-hover:text-blue-600 transition line-clamp-1">
                                {item.title}
                              </h3>
                              <div className="flex items-center justify-between text-[11px] text-slate-400 mt-0.5">
                                <span className="uppercase tracking-wider font-semibold">{item.brand || 'Device'}</span>
                                {item.profiles?.district && (
                                  <span className="flex items-center gap-0.5 text-[10px]">
                                    <MapPin className="w-2.5 h-2.5 text-slate-400" />
                                    {item.profiles.district.split(' ')[0]}
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                              <p className="text-sm font-black text-slate-900">
                                ₦{Number(item.price).toLocaleString()}
                              </p>
                              <AddToCartButton product={item} variant="icon" />
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    </div>
                  )
                })
              ) : (
                <div className="col-span-full p-8 text-center bg-white rounded-2xl border border-slate-200">
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