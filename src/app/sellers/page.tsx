import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/Navbar'
import { BuyerSidebar } from '@/components/BuyerSidebar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Store,
  MapPin,
  ShieldCheck,
  Phone,
  Calendar,
  ShoppingBag,
  Search,
  CheckCircle2,
  ArrowRight,
  Sparkles,
} from 'lucide-react'

const ABUJA_DISTRICTS = [
  { label: 'All Abuja', value: 'all' },
  { label: 'Gwarinpa', value: 'gwarinpa' },
  { label: 'Wuse 2', value: 'wuse 2' },
  { label: 'Maitama', value: 'maitama' },
  { label: 'Banex', value: 'banex' },
  { label: 'Utako', value: 'utako' },
  { label: 'Jabi', value: 'jabi' },
]

export default async function VerifiedSellersPage({
  searchParams,
}: {
  searchParams: Promise<{ query?: string; district?: string }>
}) {
  const { query = '', district = 'all' } = await searchParams
  const supabase = await createClient()

  // 1. Fetch seller profiles
  const { data: profiles } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })

  // 2. Fetch published products to get active inventory counts per seller
  const { data: products } = await supabase
    .from('products')
    .select('id, seller_id')
    .eq('status', 'published')

  // Map published product count per seller
  const productCountMap = new Map<string, number>()
  products?.forEach((item) => {
    if (item.seller_id) {
      productCountMap.set(
        item.seller_id,
        (productCountMap.get(item.seller_id) || 0) + 1
      )
    }
  })

  // 3. Filter for vendor profiles (verified, has business name, seller role, or active stock)
  const sellers = (profiles || []).filter((p) => {
    const isVerified = p.tech_trust_status === 'verified'
    const hasBusiness = Boolean(p.business_name && p.business_name.trim().length > 0)
    const isSellerRole = p.role === 'seller' || p.role === 'vendor'
    const hasProducts = (productCountMap.get(p.id) || 0) > 0

    return isVerified || hasBusiness || isSellerRole || hasProducts
  })

  // Sort verified sellers first, then by active inventory count
  sellers.sort((a, b) => {
    const aVerified = a.tech_trust_status === 'verified' ? 1 : 0
    const bVerified = b.tech_trust_status === 'verified' ? 1 : 0
    if (bVerified !== aVerified) return bVerified - aVerified
    return (productCountMap.get(b.id) || 0) - (productCountMap.get(a.id) || 0)
  })

  // 4. Apply search & location filters
  const filteredSellers = sellers.filter((seller) => {
    const name = (seller.business_name || seller.full_name || '').toLowerCase()
    const districtName = (seller.district || '').toLowerCase()
    const q = query.toLowerCase().trim()

    const matchesQuery = !q || name.includes(q) || districtName.includes(q)
    const matchesDistrict =
      district === 'all' || districtName.includes(district.toLowerCase())

    return matchesQuery && matchesDistrict
  })

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      <div className="flex-1 flex w-full">
        {/* Buyer Navigation Sidebar */}
        <BuyerSidebar />

        {/* Main Content Area */}
        <main className="flex-1 min-w-0 p-4 md:p-6 lg:p-8 space-y-6">
          {/* Header & Search */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="p-1.5 rounded-xl bg-blue-50 text-blue-600">
                  <ShieldCheck className="w-5 h-5" />
                </span>
                <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
                  Verified Sellers
                </h1>
              </div>
              <p className="text-xs md:text-sm text-slate-500">
                Browse TechTrust-verified stores and certified gadget vendors across Abuja.
              </p>
            </div>

            {/* Search Input */}
            <form action="/sellers" method="GET" className="relative w-full md:w-80">
              {district !== 'all' && (
                <input type="hidden" name="district" value={district} />
              )}
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                name="query"
                defaultValue={query}
                placeholder="Search vendor or location..."
                className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 bg-white text-xs md:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition"
              />
            </form>
          </div>

          {/* Abuja District Filter Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
            {ABUJA_DISTRICTS.map((item) => {
              const isActive = district === item.value
              const href =
                item.value === 'all'
                  ? query ? `/sellers?query=${encodeURIComponent(query)}` : '/sellers'
                  : `/sellers?district=${encodeURIComponent(item.value)}${
                      query ? `&query=${encodeURIComponent(query)}` : ''
                    }`

              return (
                <Link
                  key={item.value}
                  href={href}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-white border border-slate-200/80 text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  {item.label}
                </Link>
              )
            })}
          </div>

          {/* Result Count */}
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>
              <strong className="text-slate-900 font-bold">{filteredSellers.length}</strong>{' '}
              {filteredSellers.length === 1 ? 'store' : 'stores'} found
            </span>
          </div>

          {/* Sellers Grid */}
          {filteredSellers.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredSellers.map((seller) => {
                const isVerified = seller.tech_trust_status === 'verified'
                const displayName = seller.business_name || seller.full_name || 'Verified Vendor'
                const displayDistrict = seller.district ? `${seller.district}, Abuja` : 'Abuja, NG'
                const itemCount = productCountMap.get(seller.id) || 0
                const formattedPhone = seller.phone
                  ? seller.phone.replace(/[^0-9]/g, '').replace(/^0/, '234')
                  : null

                return (
                  <div
                    key={seller.id}
                    className="group bg-white rounded-3xl border border-slate-200/80 p-5 hover:shadow-md hover:border-blue-500/40 transition duration-200 flex flex-col justify-between"
                  >
                    <div>
                      {/* Top Header: Avatar & Badge */}
                      <div className="flex items-start justify-between gap-3 mb-4">
                        <div className="w-13 h-13 rounded-2xl bg-blue-600 text-white font-black text-xl flex items-center justify-center shadow-md shadow-blue-500/20 shrink-0">
                          {seller.business_name
                            ? seller.business_name[0].toUpperCase()
                            : 'S'}
                        </div>

                        <Badge
                          className={`text-[10px] font-bold uppercase gap-1 border-none ${
                            isVerified
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-amber-50 text-amber-700'
                          }`}
                        >
                          <ShieldCheck className="w-3.5 h-3.5" />
                          {isVerified ? 'TechTrust Verified' : 'Vendor'}
                        </Badge>
                      </div>

                      {/* Store Details */}
                      <h2 className="font-black text-base text-slate-900 group-hover:text-blue-600 transition line-clamp-1">
                        {displayName}
                      </h2>

                      <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                        <span className="truncate">{displayDistrict}</span>
                      </p>

                      {/* Metadata */}
                      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                        <span className="flex items-center gap-1 font-semibold text-slate-700">
                          <ShoppingBag className="w-3.5 h-3.5 text-slate-400" />
                          {itemCount} {itemCount === 1 ? 'gadget' : 'gadgets'}
                        </span>

                        <span className="flex items-center gap-1 text-[11px] text-slate-400">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          Since {new Date(seller.created_at || Date.now()).getFullYear()}
                        </span>
                      </div>
                    </div>

                    {/* Bottom Actions */}
                    <div className="mt-5 pt-3 border-t border-slate-100 flex items-center gap-2">
                      <Link href={`/sellers/${seller.id}`} className="flex-1">
                        <Button className="w-full bg-slate-900 hover:bg-blue-600 text-white text-xs font-bold h-9 rounded-xl flex items-center justify-center gap-1 transition">
                          <span>Visit Store</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Button>
                      </Link>

                      {formattedPhone && (
                        <a
                          href={`https://wa.me/${formattedPhone}?text=Hello%20${encodeURIComponent(
                            displayName
                          )},%20I%20saw%20your%20store%20on%20BenchTech.`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="h-9 w-9 rounded-xl bg-emerald-50 hover:bg-emerald-600 text-emerald-600 hover:text-white flex items-center justify-center transition border border-emerald-200/60"
                          title="WhatsApp Vendor"
                        >
                          <Phone className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="p-16 text-center bg-white rounded-3xl border border-slate-200/80">
              <Store className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-slate-800 font-bold text-sm">No Verified Sellers Found</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                No stores found matching your criteria. Try selecting another area in Abuja or clear your search query.
              </p>
              {(query || district !== 'all') && (
                <Link href="/sellers" className="inline-block mt-4">
                  <Button variant="outline" className="text-xs font-bold rounded-xl h-8">
                    Clear Filters
                  </Button>
                </Link>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}