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
  ArrowRight
} from 'lucide-react'

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

  const { data: userProfile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const { data: products } = await supabase
    .from('products')
    .select('*, profiles!products_seller_id_fkey(business_name, tech_trust_status)')
    .eq('status', 'published')
    .order('created_at', { ascending: false })
    .limit(8)

  return (
    <div className="min-h-screen bg-slate-100/60 flex flex-col">
      <Navbar />

      <div className="max-w-[1700px] w-full mx-auto flex flex-1">
        <BuyerSidebar />

        <main className="flex-1 min-w-0 p-4 md:p-6 space-y-6">
          {/* Hero Banner */}
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
                Phones, Laptops, Gaming, Accessories, and More.
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

          {/* Category Chips Bar */}
          <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-none">
            {CATEGORY_CHIPS.map((cat) => {
              const Icon = cat.icon
              return (
                <Link
                  key={cat.id}
                  href={`/products?category=${cat.id}`}
                  className="flex flex-col items-center gap-1.5 p-3 rounded-2xl bg-white border border-slate-200/80 hover:border-blue-500 hover:shadow-sm min-w-[76px] transition group"
                >
                  <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-600 group-hover:bg-blue-50 group-hover:text-blue-600 transition">
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-[11px] font-semibold text-slate-700 group-hover:text-blue-600 text-center">
                    {cat.label}
                  </span>
                </Link>
              )
            })}
          </div>

          {/* Trust Guarantees */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-white p-3.5 rounded-2xl border border-slate-200/80">
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

          {/* Product Feed */}
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
                products.map((item) => (
                  <div key={item.id} className="relative group">
                    <SaveButton product={item} />
                    <Link href={`/products/${item.id}`}>
                      <Card className="h-full border border-slate-200/80 rounded-2xl overflow-hidden hover:shadow-md transition bg-white flex flex-col justify-between">
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
                          <Badge className="absolute top-2.5 left-2.5 bg-slate-900/80 backdrop-blur-md text-white border-none text-[10px] capitalize">
                            {item.condition?.replace('_', ' ') || 'Good'}
                          </Badge>
                        </div>

                        <CardContent className="p-3.5 flex-1 flex flex-col justify-between space-y-2">
                          <div>
                            <h3 className="font-bold text-xs text-slate-900 group-hover:text-blue-600 transition line-clamp-1">
                              {item.title}
                            </h3>
                            <p className="text-[11px] text-slate-400 uppercase tracking-wider mt-0.5">
                              {item.brand}
                            </p>
                          </div>

                          <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                            <p className="text-sm font-black text-slate-900">
                              ₦{Number(item.price).toLocaleString()}
                            </p>
                            {/* Live Interactive Add-to-Cart Trigger */}
                            <AddToCartButton product={item} variant="icon" />
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  </div>
                ))
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