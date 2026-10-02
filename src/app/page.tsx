import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { getSponsoredProducts } from '@/lib/ads/getSponsoredProducts'
import { AdProductCardWrapper } from '@/components/storefront/AdProductCardWrapper'
import { AdImpressionTracker } from '@/components/storefront/AdImpressionTracker'
import { 
  ShoppingCart, 
  Store, 
  ArrowRight, 
  ShieldCheck, 
  Lock, 
  Layers, 
  Headphones, 
  Star, 
  Sparkles,
  Package,
} from 'lucide-react'

export const metadata = {
  title: 'BenchTech | Nigeria’s Trusted Tech Marketplace',
  description: 'Buy or sell genuine gadgets, laptops, and consoles with verified specs in Abuja.',
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

export default async function LandingGatewayPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role === 'seller') {
      redirect('/seller/dashboard')
    } else {
      redirect('/feed')
    }
  }

  // Fetch top active sponsored gadgets for Abuja showcase
  const sponsoredProducts = await getSponsoredProducts({ limit: 4 })

  return (
    <div className="min-h-screen bg-slate-950 text-white selection:bg-blue-600 selection:text-white flex flex-col">
      {/* Top Header */}
      <header className="border-b border-white/10 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="bg-blue-600 text-white w-8 h-8 rounded-xl flex items-center justify-center font-black text-base shadow-sm">
              T
            </div>
            <div>
              <span className="font-black text-lg text-white tracking-tight leading-none block">BenchTech</span>
              <span className="text-[9px] text-slate-400 font-semibold tracking-wider block">Buy Smart. Sell Easy.</span>
            </div>
          </Link>

          <div className="flex items-center gap-6 text-xs text-slate-300 font-medium">
            <Link href="#how-it-works" className="hover:text-white transition hidden sm:inline-block">How it works</Link>
            <Link href="#guarantees" className="hover:text-white transition hidden sm:inline-block">Safety</Link>
            <Link href="/products" className="hover:text-white transition hidden sm:inline-block text-blue-400 font-bold">
              Explore Catalog
            </Link>
            <Link href="/login">
              <Button size="sm" variant="ghost" className="text-xs text-slate-300 hover:text-white hover:bg-white/10">
                Log in
              </Button>
            </Link>
            <Link href="/register">
              <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl px-4">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-16 px-6">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-blue-600/20 blur-[120px] pointer-events-none rounded-full" />

        <div className="max-w-5xl mx-auto text-center space-y-6 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-[11px] text-blue-400 font-medium">
            <Sparkles className="w-3.5 h-3.5" /> Nigeria&apos;s Trusted Tech Marketplace
          </div>

          <h1 className="text-4xl sm:text-6xl md:text-7xl font-black tracking-tight text-white leading-tight">
            Everything Tech <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">
              In One Place
            </span>
          </h1>

          <p className="text-sm sm:text-base text-slate-400 max-w-xl mx-auto leading-relaxed">
            Buy or sell genuine tech products. Great deals. Trusted dealers. Safe physical inspection in Abuja.
          </p>

          {/* Interactive Role Selector Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl mx-auto pt-6 text-left">
            <Link
              href="/register?role=buyer"
              className="group relative bg-gradient-to-b from-blue-600/20 to-slate-900/60 border border-blue-500/30 hover:border-blue-500 rounded-3xl p-6 transition duration-300 flex flex-col justify-between hover:shadow-2xl hover:shadow-blue-500/10"
            >
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-600/30">
                  <ShoppingCart className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">I&apos;m a Buyer</h3>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                    Find genuine smartphones, laptops, and gear with verified specs.
                  </p>
                </div>
              </div>

              <div className="pt-6 flex items-center justify-between border-t border-white/10 mt-6">
                <span className="text-xs text-blue-400 font-semibold">Great deals. Better tech.</span>
                <div className="w-8 h-8 rounded-full bg-white/10 group-hover:bg-blue-600 text-white flex items-center justify-center transition">
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition" />
                </div>
              </div>
            </Link>

            <Link
              href="/register?role=seller"
              className="group relative bg-gradient-to-b from-purple-600/10 to-slate-900/60 border border-purple-500/20 hover:border-purple-500 rounded-3xl p-6 transition duration-300 flex flex-col justify-between hover:shadow-2xl hover:shadow-purple-500/10"
            >
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-purple-600 text-white flex items-center justify-center shadow-lg shadow-purple-600/30">
                  <Store className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">I&apos;m a Seller</h3>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                    Reach thousands of tech buyers in Abuja and grow your store.
                  </p>
                </div>
              </div>

              <div className="pt-6 flex items-center justify-between border-t border-white/10 mt-6">
                <span className="text-xs text-purple-400 font-semibold">Sell smart. Grow faster.</span>
                <div className="w-8 h-8 rounded-full bg-white/10 group-hover:bg-purple-600 text-white flex items-center justify-center transition">
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition" />
                </div>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* Live Sponsored Showcase */}
      {sponsoredProducts.length > 0 && (
        <section className="py-10 px-6 border-t border-white/10 bg-slate-900/30">
          <div className="max-w-5xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-emerald-400 text-[10px] font-black uppercase tracking-wider block">
                  Live Deals in Abuja
                </span>
                <h2 className="text-lg sm:text-xl font-black text-white">
                  Trending &amp; Sponsored Listings
                </h2>
              </div>
              <Link
                href="/products"
                className="text-xs font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1 transition"
              >
                Browse All ({sponsoredProducts.length}+) <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {sponsoredProducts.map((ad) => {
                const item = ad.product
                const firstImg = resolveFirstImage(item.images)

                return (
                  <div
                    key={item.id}
                    className="relative bg-slate-900/80 border border-emerald-500/40 rounded-2xl overflow-hidden hover:border-emerald-500 transition group flex flex-col justify-between"
                  >
                    <div className="absolute top-2 left-2 z-10">
                      <span className="bg-emerald-600 text-white text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded shadow-xs">
                        Sponsored
                      </span>
                    </div>

                    <AdProductCardWrapper
                      campaignId={ad.campaignId}
                      productId={item.id}
                      sellerId={ad.sellerId}
                      isSponsored={true}
                    >
                      <AdImpressionTracker
                        campaignId={ad.campaignId}
                        productId={item.id}
                        sellerId={ad.sellerId}
                        isSponsored={true}
                      />
                      <Link href={`/products/${item.id}`} className="flex-1 flex flex-col">
                        <div className="relative w-full aspect-square bg-slate-800/40 overflow-hidden border-b border-white/5">
                          {firstImg ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={firstImg}
                              alt={item.title}
                              loading="lazy"
                              className="absolute inset-0 w-full h-full object-contain p-3 group-hover:scale-105 transition-transform duration-300"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Package className="w-6 h-6 text-slate-500" />
                            </div>
                          )}
                        </div>

                        <div className="p-3.5 flex-1 flex flex-col justify-between space-y-1">
                          <p className="text-xs font-bold text-white truncate group-hover:text-blue-400 transition">
                            {item.title}
                          </p>
                          <div className="flex items-center justify-between pt-1">
                            <span className="text-xs font-black text-white">
                              ₦{Number(item.price).toLocaleString()}
                            </span>
                            <span className="text-[10px] text-slate-400 capitalize">
                              {item.condition?.replace('_', ' ') || 'Device'}
                            </span>
                          </div>
                        </div>
                      </Link>
                    </AdProductCardWrapper>
                  </div>
                )
              })}
            </div>
          </div>
        </section>
      )}

      {/* Trust Badges */}
      <section id="guarantees" className="border-y border-white/10 bg-slate-900/40 py-8 px-6">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-white">Verified Sellers</p>
              <p className="text-[11px] text-slate-400">TechTrust identity proof</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-white">Secure Escrow</p>
              <p className="text-[11px] text-slate-400">Pay only upon inspection</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-white">Wide Selection</p>
              <p className="text-[11px] text-slate-400">Phones, laptops, gaming</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
              <Headphones className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-white">Fast Support</p>
              <p className="text-[11px] text-slate-400">We are here to help</p>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section id="how-it-works" className="py-20 px-6 bg-slate-950">
        <div className="max-w-5xl mx-auto space-y-12">
          <div className="text-center space-y-2">
            <h2 className="text-2xl sm:text-3xl font-black text-white">How It Works</h2>
            <p className="text-xs text-slate-400">Get started in just a few steps.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-3">
              <div className="w-9 h-9 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center font-black text-sm">
                1
              </div>
              <h3 className="font-bold text-sm text-white">Create an account</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Sign up as a buyer looking for gadgets or as a seller with inventory.
              </p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-600/20 text-emerald-400 flex items-center justify-center font-black text-sm">
                2
              </div>
              <h3 className="font-bold text-sm text-white">Browse or list</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Explore catalog specs or publish hardware listings with battery health and storage.
              </p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-3">
              <div className="w-9 h-9 rounded-xl bg-purple-600/20 text-purple-400 flex items-center justify-center font-black text-sm">
                3
              </div>
              <h3 className="font-bold text-sm text-white">Connect securely</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Send direct in-app inquiries and inspect devices before completing payment.
              </p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-3">
              <div className="w-9 h-9 rounded-xl bg-amber-600/20 text-amber-400 flex items-center justify-center font-black text-sm">
                4
              </div>
              <h3 className="font-bold text-sm text-white">Enjoy the tech</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Get your verified gadgets or scale your Abuja tech storefront.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-white/10 py-10 px-6 bg-slate-900/60">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <p>© 2026 BenchTech. Buy Smart. Sell Easy.</p>
          <div className="flex items-center gap-4">
            <Link href="/login" className="hover:text-white transition">Sign In</Link>
            <Link href="/register" className="hover:text-white transition">Create Account</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}