import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/Navbar'
import { SaveButton } from '@/components/SaveButton'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Store, 
  MapPin, 
  ShieldCheck, 
  Phone, 
  Calendar, 
  ArrowLeft,
  ShoppingBag,
  ExternalLink 
} from 'lucide-react'
import type { Metadata } from 'next'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()

  const { data: seller } = await supabase
    .from('profiles')
    .select('business_name, district, full_name')
    .eq('id', id)
    .maybeSingle()

  const name = seller?.business_name || seller?.full_name || 'Verified Vendor'
  const location = seller?.district ? `${seller.district}, Abuja` : 'Abuja, Nigeria'

  return {
    title: `${name} - Verified Tech Merchant in ${location} | BenchTech`,
    description: `Shop inspected gadgets, laptops, and phones from ${name} in ${location}. Verified BenchTech dealer with buyer protection.`,
    alternates: {
      canonical: `https://shopbenchtech.com/sellers/${id}`,
    },
    openGraph: {
      title: `${name} | BenchTech Abuja`,
      description: `View active listings and verified store profile for ${name} in ${location}.`,
      url: `https://shopbenchtech.com/sellers/${id}`,
      type: 'profile',
    },
  }
}

export default async function SellerProfilePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  // 1. Fetch seller profile
  const { data: seller, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !seller) {
    notFound()
  }

  // 2. Fetch all products belonging to this seller
  const { data: products } = await supabase
    .from('products')
    .select('*')
    .eq('seller_id', seller.id)
    .eq('status', 'published')
    .order('created_at', { ascending: false })

  const isVerified = seller.tech_trust_status === 'verified'
  const formattedPhone = seller.phone ? seller.phone.replace(/[^0-9]/g, '').replace(/^0/, '234') : null

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        {/* Back Link */}
        <Link href="/products" className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-blue-600 transition">
          <ArrowLeft className="w-4 h-4" /> Back to Catalog
        </Link>

        {/* Seller Profile Header Banner */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 md:p-8 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-blue-600 text-white font-black text-2xl flex items-center justify-center shadow-md shadow-blue-500/20">
              {seller.business_name ? seller.business_name[0].toUpperCase() : 'S'}
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl md:text-2xl font-black text-slate-900">
                  {seller.business_name || seller.full_name || 'Verified Vendor'}
                </h1>
                <Badge
                  className={`text-[10px] font-bold uppercase gap-1 border-none ${
                    isVerified ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  {isVerified ? 'TechTrust Verified' : 'Unverified Vendor'}
                </Badge>
              </div>

              <div className="flex items-center gap-4 text-xs text-slate-500 flex-wrap">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  {seller.district ? `${seller.district}, Abuja` : 'Abuja, NG'}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  Member since {new Date(seller.created_at || Date.now()).getFullYear()}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Contact Action */}
          {formattedPhone && (
            <a
              href={`https://wa.me/${formattedPhone}?text=Hello%20${encodeURIComponent(seller.business_name || 'Seller')},%20I%20saw%20your%20store%20on%20BenchTech.`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-10 px-5 rounded-xl gap-2 shadow-sm">
                <Phone className="w-3.5 h-3.5" /> Chat on WhatsApp
              </Button>
            </a>
          )}
        </div>

        {/* Seller's Active Inventory */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-black text-slate-900">Store Inventory</h2>
              <p className="text-xs text-slate-500">
                Browse all available tech listed by {seller.business_name || 'this seller'}.
              </p>
            </div>
            <span className="text-xs font-bold text-slate-600 bg-white border border-slate-200/80 px-3 py-1 rounded-full">
              {products?.length || 0} active {products?.length === 1 ? 'item' : 'items'}
            </span>
          </div>

          {products && products.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {products.map((item) => (
                <div key={item.id} className="relative group">
                  <SaveButton product={item} />
                  <Link href={`/products/${item.id}`}>
                    <Card className="h-full border border-slate-200/80 rounded-2xl overflow-hidden hover:shadow-md transition bg-white flex flex-col">
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
                          {item.condition?.replace('_', ' ')}
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
                          <button
                            type="button"
                            className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-blue-600 hover:text-white flex items-center justify-center text-slate-600 transition"
                          >
                            <ShoppingBag className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center bg-white rounded-3xl border border-slate-200/80">
              <Store className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-slate-600 font-bold text-sm">No Active Listings</p>
              <p className="text-xs text-slate-400 mt-1">This seller currently has no published gadgets in stock.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}