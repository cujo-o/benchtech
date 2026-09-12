import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/Navbar'
import { BuyerSidebar } from '@/components/storefront/BuyerSidebar'
import { SaveButton } from '@/components/SaveButton'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Filter, MapPin, Search, ArrowUpDown } from 'lucide-react'

const ABUJA_DISTRICTS = ['All Abuja', 'Banex / Wuse 2', 'Garki', 'Utako', 'Maitama', 'Apo']

export default async function ProductsCatalogPage({
  searchParams,
}: {
  searchParams: Promise<{
    category?: string
    location?: string
    condition?: string
    minPrice?: string
    maxPrice?: string
    q?: string
    sort?: string
  }>
}) {
  const params = await searchParams
  const supabase = await createClient()

  let query = supabase
    .from('products')
    .select('*, profiles!products_seller_id_fkey(business_name, tech_trust_status)')
    .eq('status', 'published')

  if (params.category && params.category !== 'all') {
    query = query.eq('category', params.category)
  }

  if (params.location && params.location !== 'All Abuja') {
    query = query.ilike('location', `%${params.location}%`)
  }

  if (params.condition && params.condition !== 'all') {
    query = query.eq('condition', params.condition)
  }

  if (params.minPrice) {
    query = query.gte('price', parseFloat(params.minPrice))
  }

  if (params.maxPrice) {
    query = query.lte('price', parseFloat(params.maxPrice))
  }

  if (params.q) {
    query = query.ilike('title', `%${params.q}%`)
  }

  if (params.sort === 'price_asc') {
    query = query.order('price', { ascending: true })
  } else if (params.sort === 'price_desc') {
    query = query.order('price', { ascending: false })
  } else {
    query = query.order('created_at', { ascending: false })
  }

  const { data: products } = await query

  return (
    <div className="min-h-screen bg-slate-100/60 flex flex-col">
      <Navbar />

      <div className="max-w-[1700px] w-full mx-auto flex flex-1">
        <BuyerSidebar />

        <main className="flex-1 min-w-0 p-6 md:p-8 space-y-6">
          {/* Header & Search */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-2xl font-black text-slate-900">Abuja Gadget Catalog</h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Showing {products?.length || 0} hardware items available locally.
              </p>
            </div>

            {/* Quick Abuja Area Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-full">
              {ABUJA_DISTRICTS.map((district) => {
                const isSelected = (params.location || 'All Abuja') === district
                return (
                  <Link
                    key={district}
                    href={`/products?${new URLSearchParams({ ...params, location: district }).toString()}`}
                    className={`text-xs px-3 py-1.5 rounded-full font-semibold shrink-0 transition ${
                      isSelected
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <MapPin className="w-3 h-3 inline mr-1" />
                    {district}
                  </Link>
                )
              })}
            </div>
          </div>

          {/* Filter Bar */}
          <form method="GET" className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 items-end">
            <div>
              <label className="text-[11px] font-bold text-slate-500 uppercase">Search</label>
              <Input name="q" defaultValue={params.q || ''} placeholder="e.g. iPhone, Dell XPS..." className="h-9 text-xs mt-1" />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-500 uppercase">Category</label>
              <select name="category" defaultValue={params.category || 'all'} className="w-full h-9 mt-1 px-2.5 rounded-md border border-slate-200 text-xs bg-white">
                <option value="all">All Categories</option>
                <option value="phones">Phones</option>
                <option value="laptops">Laptops</option>
                <option value="gaming">Gaming</option>
                <option value="accessories">Accessories</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-500 uppercase">Condition</label>
              <select name="condition" defaultValue={params.condition || 'all'} className="w-full h-9 mt-1 px-2.5 rounded-md border border-slate-200 text-xs bg-white">
                <option value="all">Any Condition</option>
                <option value="brand_new">Brand New</option>
                <option value="open_box">Open Box</option>
                <option value="fairly_used">Fairly Used</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-500 uppercase">Sort By</label>
              <select name="sort" defaultValue={params.sort || 'latest'} className="w-full h-9 mt-1 px-2.5 rounded-md border border-slate-200 text-xs bg-white">
                <option value="latest">Latest Arrivals</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
              </select>
            </div>

            <Button type="submit" size="sm" className="h-9 bg-blue-600 hover:bg-blue-700 text-xs font-bold">
              <Filter className="w-3.5 h-3.5 mr-1" /> Apply Filters
            </Button>
          </form>

          {/* Product Grid */}
          {products && products.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {products.map((item) => (
                <div key={item.id} className="relative group">
                  <SaveButton product={item} />
                  <Link href={`/products/${item.id}`}>
                    <Card className="h-full border border-slate-200/80 rounded-2xl overflow-hidden hover:shadow-md transition bg-white flex flex-col">
                      <div className="aspect-[4/3] bg-slate-50 relative p-3 flex items-center justify-center">
                        {item.images?.[0] ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={item.images[0]} alt={item.title} className="max-h-full object-contain group-hover:scale-105 transition" />
                        ) : (
                          <div className="text-xs text-slate-400">No Image</div>
                        )}
                        <Badge className="absolute top-2.5 left-2.5 bg-slate-900/80 text-white text-[10px] capitalize">
                          {item.condition.replace('_', ' ')}
                        </Badge>
                      </div>

                      <CardContent className="p-4 flex-1 flex flex-col justify-between space-y-2">
                        <div>
                          <div className="flex items-center gap-1 text-[11px] text-slate-400">
                            <MapPin className="w-3 h-3 text-slate-400" />
                            <span>{item.location || 'Abuja'}</span>
                          </div>
                          <h3 className="font-bold text-xs text-slate-900 line-clamp-1 mt-1">{item.title}</h3>
                          
                          {item.specs && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {Object.entries(item.specs).slice(0, 2).map(([k, v]) => (
                                <span key={k} className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-medium">
                                  {String(v)}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                          <p className="text-sm font-black text-slate-900">₦{Number(item.price).toLocaleString()}</p>
                          {item.profiles?.tech_trust_status === 'verified' && (
                            <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[9px]">Verified Store</Badge>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
              <p className="text-xs text-slate-500">No gadgets match your selected filters in Abuja.</p>
              <Link href="/products">
                <Button size="sm" variant="outline" className="mt-3 text-xs">Reset All Filters</Button>
              </Link>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}