import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/Navbar'
import { BuyerSidebar } from '@/components/storefront/BuyerSidebar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  ShieldCheck,
  MapPin,
  Package,
  Calendar,
  ArrowRight,
  Search,
  Store,
} from 'lucide-react'
import type { Metadata } from 'next'

export const revalidate = 60

export const metadata: Metadata = {
  title: 'Verified Sellers | BenchTech Abuja',
  description: 'Browse verified electronics stores and hardware vendors across Abuja.',
}

const DISTRICTS = [
  'All Abuja',
  'Gwarinpa',
  'Wuse 2',
  'Maitama',
  'Banex',
  'Utako',
  'Jabi',
]

function resolveSellerAvatar(seller: any): string | null {
  return (
    seller?.avatar_url ||
    seller?.profile_image ||
    seller?.logo_url ||
    seller?.photo_url ||
    seller?.image ||
    null
  )
}

export default async function SellersDirectoryPage({
  searchParams,
}: {
  searchParams: Promise<{ district?: string; q?: string }>
}) {
  const params = await searchParams
  const selectedDistrict = params?.district || 'All Abuja'
  const searchQuery = (params?.q || '').trim().toLowerCase()

  const supabase = await createClient()

  // Parallel query: Fetch seller profiles and published products for accurate stock counts
  const [{ data: profiles }, { data: publishedProducts }] = await Promise.all([
    supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false }),
    supabase
      .from('products')
      .select('id, seller_id')
      .eq('status', 'published'),
  ])

  // Count active published listings per seller
  const productCounts = new Map<string, number>()
  for (const prod of publishedProducts || []) {
    if (prod.seller_id) {
      productCounts.set(prod.seller_id, (productCounts.get(prod.seller_id) || 0) + 1)
    }
  }

  // Filter for valid seller accounts
  const allSellers = (profiles || []).filter((p) => {
    const roles: string[] = Array.isArray(p.roles) ? p.roles : p.role ? [p.role] : []
    const hasListings = (productCounts.get(p.id) || 0) > 0
    return (
      p.role === 'seller' ||
      p.is_seller === true ||
      roles.includes('seller') ||
      Boolean(p.business_name) ||
      p.tech_trust_status === 'verified' ||
      hasListings
    )
  })

  // Apply District & Search Filters
  const filteredSellers = allSellers
    .filter((seller) => {
      const storeName = (seller.business_name || seller.full_name || '').toLowerCase()
      const district = (seller.district || 'Abuja').toLowerCase()

      const matchesDistrict =
        selectedDistrict === 'All Abuja' ||
        district.includes(selectedDistrict.toLowerCase())

      const matchesSearch =
        !searchQuery ||
        storeName.includes(searchQuery) ||
        district.includes(searchQuery)

      return matchesDistrict && matchesSearch
    })
    .sort((a, b) => {
      // Prioritize verified stores and stores with active inventory
      const aVerified = a.tech_trust_status === 'verified' ? 1 : 0
      const bVerified = b.tech_trust_status === 'verified' ? 1 : 0
      if (aVerified !== bVerified) return bVerified - aVerified

      const aCount = productCounts.get(a.id) || 0
      const bCount = productCounts.get(b.id) || 0
      return bCount - aCount
    })

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col transition-colors">
      <Navbar />

      <div className="max-w-[1700px] w-full mx-auto flex flex-1">
        <BuyerSidebar />

        <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 space-y-6">
          {/* Header & Search Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-6 h-6 text-blue-600 dark:text-blue-400 shrink-0" />
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                  Verified Sellers
                </h1>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                Browse verified electronics stores and hardware vendors across Abuja.
              </p>
            </div>

            <form action="/sellers" method="GET" className="w-full md:w-72">
              {selectedDistrict !== 'All Abuja' && (
                <input type="hidden" name="district" value={selectedDistrict} />
              )}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  name="q"
                  defaultValue={params?.q || ''}
                  placeholder="Search store or location..."
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl pl-9 pr-4 py-2.5 text-xs font-medium text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs"
                />
              </div>
            </form>
          </div>

          {/* District Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
            {DISTRICTS.map((district) => {
              const isSelected =
                selectedDistrict.toLowerCase() === district.toLowerCase()
              const href =
                district === 'All Abuja'
                  ? params?.q
                    ? `/sellers?q=${encodeURIComponent(params.q)}`
                    : '/sellers'
                  : `/sellers?district=${encodeURIComponent(district)}${
                      params?.q ? `&q=${encodeURIComponent(params.q)}` : ''
                    }`

              return (
                <Link key={district} href={href}>
                  <button
                    type="button"
                    className={`px-3.5 py-1.5 rounded-full text-xs font-bold shrink-0 transition cursor-pointer ${
                      isSelected
                        ? 'bg-blue-600 text-white shadow-2xs'
                        : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    {district}
                  </button>
                </Link>
              )
            })}
          </div>

          {/* Store Count */}
          <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
            <strong className="font-bold text-slate-900 dark:text-slate-100">
              {filteredSellers.length}
            </strong>{' '}
            {filteredSellers.length === 1 ? 'store' : 'stores'} found
          </div>

          {/* Sellers Grid */}
          {filteredSellers.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
              {filteredSellers.map((seller) => {
                const storeName =
                  seller.business_name || seller.full_name || 'Vendor Store'
                const avatar = resolveSellerAvatar(seller)
                const isVerified = seller.tech_trust_status === 'verified'
                const itemCount = productCounts.get(seller.id) || 0
                const joinedYear = seller.created_at
                  ? new Date(seller.created_at).getFullYear()
                  : 2026

                return (
                  <div
                    key={seller.id}
                    className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl p-5 shadow-2xs hover:border-slate-300 dark:hover:border-slate-700 transition flex flex-col justify-between space-y-5"
                  >
                    <div className="space-y-4">
                      {/* Avatar & Verification Badge */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white border border-slate-200/60 dark:border-slate-700 flex items-center justify-center font-black text-base overflow-hidden shrink-0 shadow-2xs">
                          {avatar ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={avatar}
                              alt={storeName}
                              loading="lazy"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            storeName[0]?.toUpperCase() || 'S'
                          )}
                        </div>

                        {isVerified ? (
                          <Badge className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-[10px] font-bold px-2.5 py-0.5 flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3" />
                            <span>Verified</span>
                          </Badge>
                        ) : (
                          <Badge className="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-[10px] font-bold px-2.5 py-0.5">
                            Vendor
                          </Badge>
                        )}
                      </div>

                      {/* Store Name & District */}
                      <div>
                        <h2 className="text-base font-black text-slate-900 dark:text-white truncate">
                          {storeName}
                        </h2>
                        <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">
                            {seller.district ? `${seller.district}, Abuja` : 'Abuja, NG'}
                          </span>
                        </p>
                      </div>

                      {/* Meta Stats */}
                      <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                        <span className="flex items-center gap-1.5 font-semibold text-slate-800 dark:text-slate-200">
                          <Package className="w-3.5 h-3.5 text-slate-400" />
                          {itemCount} {itemCount === 1 ? 'listing' : 'listings'}
                        </span>
                        <span className="flex items-center gap-1 text-[11px]">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          Since {joinedYear}
                        </span>
                      </div>
                    </div>

                    {/* Full-Width Store Link */}
                    <Link href={`/sellers/${seller.id}`} className="block">
                      <Button className="w-full h-10 bg-slate-950 hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-700 text-white font-bold text-xs rounded-xl gap-1.5 cursor-pointer transition">
                        <span>Visit Store</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Button>
                    </Link>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-12 text-center space-y-2">
              <Store className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
              <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                No stores match your filter
              </p>
              <p className="text-xs text-slate-400">
                Try selecting a different Abuja district or clearing your search query.
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}