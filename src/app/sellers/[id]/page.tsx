import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/Navbar'
import { SaveButton } from '@/components/SaveButton'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import {
  ShieldCheck,
  MapPin,
  Calendar,
  ArrowLeft,
  Package,
  Truck,
} from 'lucide-react'
import type { Metadata } from 'next'

export const revalidate = 60

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

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()

  const { data: seller } = await supabase
    .from('profiles')
    .select('business_name, full_name, district')
    .eq('id', id)
    .maybeSingle()

  if (!seller) {
    return { title: 'Store Not Found | BenchTech' }
  }

  const storeName = seller.business_name || seller.full_name || 'Vendor Store'
  const location = seller.district ? `${seller.district}, Abuja` : 'Abuja'

  return {
    title: `${storeName} (${location}) | BenchTech`,
    description: `Browse available electronics and hardware listed by ${storeName} in ${location}.`,
  }
}

export default async function SellerprofilePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const [{ data: seller }, { data: products }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', id).maybeSingle(),
    supabase
      .from('products')
      .select('*')
      .eq('seller_id', id)
      .eq('status', 'published')
      .order('created_at', { ascending: false }),
  ])

  if (!seller) {
    notFound()
  }

  const inventory = products || []
  const storeName = seller.business_name || seller.full_name || 'Vendor'
  const isVerified = seller.tech_trust_status === 'verified'
  const joinedYear = seller.created_at
    ? new Date(seller.created_at).getFullYear()
    : 2026

  const sellerAvatar =
    seller.avatar_url ||
    seller.profile_image ||
    seller.logo_url ||
    seller.photo_url ||
    seller.image ||
    null

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      <Navbar />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 md:py-10 space-y-6 sm:space-y-8">
        {/* Back Link */}
        <div>
          <Link
            href="/products"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Catalog</span>
          </Link>
        </div>

        {/* Store Profile Header */}
        <Card className="rounded-3xl border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden">
          <CardContent className="p-5 sm:p-7 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="flex items-start sm:items-center gap-4">
              {/* Seller Profile Picture */}
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center font-black text-xl text-blue-600 dark:text-blue-400 overflow-hidden shrink-0 shadow-2xs">
                {sellerAvatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={sellerAvatar}
                    alt={storeName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  storeName[0]?.toUpperCase() || 'S'
                )}
              </div>

              <div className="space-y-2 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white truncate">
                    {storeName}
                  </h1>
                  {isVerified && (
                    <Badge className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-[10px] font-bold px-2 py-0.5 flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" />
                      <span>Verified Seller</span>
                    </Badge>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    {seller.district ? `${seller.district}, Abuja` : 'Abuja, NG'}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    Member since {joinedYear}
                  </span>
                </div>

                {seller.bio && (
                  <p className="text-xs text-slate-600 dark:text-slate-300 max-w-xl line-clamp-2 pt-0.5">
                    {seller.bio}
                  </p>
                )}
              </div>
            </div>

            {/* Store Info Summary */}
            <div className="flex sm:flex-col items-center sm:items-end justify-between border-t sm:border-t-0 border-slate-100 dark:border-slate-800 pt-4 sm:pt-0 gap-2 shrink-0">
              <div className="text-left sm:text-right">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Available Stock
                </span>
                <span className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                  {inventory.length} {inventory.length === 1 ? 'Item' : 'Items'}
                </span>
              </div>

              <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/70 px-3 py-1.5 rounded-xl border border-slate-200/70 dark:border-slate-700">
                <Truck className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                Abuja Delivery Available
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Store Inventory Section */}
        <section className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-slate-800 pb-3">
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                Store Inventory
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Items currently listed by {storeName}
              </p>
            </div>
            <Badge
              variant="outline"
              className="text-xs font-bold border-slate-200 dark:border-slate-800 px-3 py-1 rounded-xl"
            >
              {inventory.length} active
            </Badge>
          </div>

          {inventory.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
              {inventory.map((item) => {
                const firstImg = resolveFirstImage(item.images)

                return (
                  <div key={item.id} className="relative group">
                    <SaveButton product={item} />
                    <Link href={`/products/${item.id}`}>
                      <Card className="h-full rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-md transition-all flex flex-col justify-between overflow-hidden">
                        <div className="relative w-full aspect-square bg-slate-50 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800 flex items-center justify-center p-3 overflow-hidden">
                          <Badge className="absolute top-2.5 left-2.5 z-10 bg-slate-900/80 text-white border-none text-[9px] font-bold capitalize px-2 py-0.5">
                            {item.condition?.replace(/_/g, ' ') || 'Used'}
                          </Badge>

                          {firstImg ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={firstImg}
                              alt={item.title}
                              loading="lazy"
                              className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-300"
                            />
                          ) : (
                            <Package className="w-7 h-7 text-slate-300 dark:text-slate-600" />
                          )}
                        </div>

                        <CardContent className="p-3 sm:p-3.5 flex-1 flex flex-col justify-between space-y-2">
                          <div>
                            <h3 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-1">
                              {item.title}
                            </h3>
                            <p className="text-[10px] text-slate-400 uppercase font-semibold mt-0.5 truncate">
                              {item.brand || item.category || 'Hardware'}
                            </p>
                          </div>

                          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                            <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-white">
                              ₦{Number(item.price).toLocaleString()}
                            </span>
                            <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 group-hover:underline">
                              View
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-12 text-center space-y-2">
              <Package className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
              <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                No active listings
              </p>
              <p className="text-xs text-slate-400">
                This seller does not have any published items at the moment.
              </p>
            </div>
          )}
        </section>
      </main>
    </div>
  )
}