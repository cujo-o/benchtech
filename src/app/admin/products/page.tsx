import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { toggleProductStatus } from '../actions'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  EyeOff,
  CheckCircle,
  ExternalLink,
  Search,
  Package,
  SlidersHorizontal,
  MapPin,
  Eye,
  Store,
  Phone,
  Filter,
} from 'lucide-react'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'All Products Moderation | BenchTech Admin',
}

const CATEGORIES = [
  'all',
  'phones',
  'laptops',
  'gaming',
  'tablets',
  'accessories',
  'cameras',
  'monitors',
]

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; category?: string; q?: string }>
}) {
  const params = await searchParams
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login?next=/admin/products')

  let query = supabase
    .from('products')
    .select('*, profiles!products_seller_id_fkey(business_name, full_name, phone, district)')
    .order('created_at', { ascending: false })

  if (params.status && params.status !== 'all') {
    query = query.eq('status', params.status)
  }

  if (params.category && params.category !== 'all') {
    query = query.eq('category', params.category)
  }

  if (params.q) {
    query = query.ilike('title', `%${params.q}%`)
  }

  const { data: products } = await query
  const allListings = products || []

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
              All Marketplace Products
            </h1>
            <Badge className="bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 text-[10px] font-black">
              {allListings.length} Total
            </Badge>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Audit specifications, monitor view counts, and remove policy-violating devices in Abuja.
          </p>
        </div>

        {/* Status Pill Filters */}
        <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800/60 p-1.5 rounded-2xl border border-slate-200/80 dark:border-slate-700">
          <Link href={`/admin/products?${new URLSearchParams({ ...params, status: 'all' }).toString()}`}>
            <Button
              size="sm"
              variant={!params.status || params.status === 'all' ? 'default' : 'ghost'}
              className="text-xs h-8 px-3 rounded-xl font-bold"
            >
              All
            </Button>
          </Link>
          <Link href={`/admin/products?${new URLSearchParams({ ...params, status: 'published' }).toString()}`}>
            <Button
              size="sm"
              variant={params.status === 'published' ? 'default' : 'ghost'}
              className="text-xs h-8 px-3 rounded-xl font-bold"
            >
              Published
            </Button>
          </Link>
          <Link href={`/admin/products?${new URLSearchParams({ ...params, status: 'hidden' }).toString()}`}>
            <Button
              size="sm"
              variant={params.status === 'hidden' ? 'default' : 'ghost'}
              className="text-xs h-8 px-3 rounded-xl font-bold"
            >
              Taken Down
            </Button>
          </Link>
        </div>
      </div>

      {/* Interactive Search & Category Filter Toolbar */}
      <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs flex flex-col md:flex-row items-center gap-3">
        <form method="GET" action="/admin/products" className="flex-1 w-full relative">
          <input type="hidden" name="status" value={params.status || 'all'} />
          <input type="hidden" name="category" value={params.category || 'all'} />
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
          <input
            type="text"
            name="q"
            defaultValue={params.q || ''}
            placeholder="Search listings by title, processor, brand, or seller..."
            className="w-full h-10 pl-10 pr-24 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            className="absolute right-1.5 top-1.5 h-7 px-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg transition"
          >
            Search
          </button>
        </form>

        {/* Category Selector */}
        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0 flex items-center gap-1">
            <Filter className="w-3 h-3" /> Category:
          </span>
          <div className="flex items-center gap-1">
            {CATEGORIES.map((cat) => (
              <Link
                key={cat}
                href={`/admin/products?${new URLSearchParams({
                  ...params,
                  category: cat,
                }).toString()}`}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold capitalize shrink-0 transition ${
                  (params.category || 'all') === cat
                    ? 'bg-blue-600 text-white font-bold'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                {cat}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Products Moderation Table */}
      <Card className="border border-slate-200/90 dark:border-slate-800 shadow-2xs rounded-3xl bg-white dark:bg-slate-900 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-400 font-bold border-b border-slate-100 dark:border-slate-800 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-5 py-3.5">Listing</th>
                <th className="px-5 py-3.5">Store / Location</th>
                <th className="px-5 py-3.5">Key Specs</th>
                <th className="px-5 py-3.5">Price</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Moderation Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {allListings.length > 0 ? (
                allListings.map((item) => {
                  const seller = item.profiles
                  const cleanPhone = seller?.phone
                    ? seller.phone.replace(/[^0-9]/g, '').replace(/^0/, '234')
                    : null

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition">
                      {/* Product details */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-11 h-11 rounded-xl bg-slate-50 dark:bg-slate-800 overflow-hidden shrink-0 flex items-center justify-center border border-slate-200/80 dark:border-slate-700 p-1">
                            {item.images?.[0] ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={item.images[0]}
                                alt={item.title}
                                className="max-h-full object-contain"
                              />
                            ) : (
                              <Package className="w-4 h-4 text-slate-300" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-slate-900 dark:text-slate-100 line-clamp-1">
                              {item.title}
                            </p>
                            <div className="flex items-center gap-2 text-[10px] text-slate-400 capitalize mt-0.5">
                              <span>{item.brand || 'Device'}</span>
                              <span>•</span>
                              <span>{item.category || 'Tech'}</span>
                              <span>•</span>
                              <span className="flex items-center gap-0.5 font-medium text-slate-500">
                                <Eye className="w-2.5 h-2.5" /> {item.views || 0} views
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Store / Contact */}
                      <td className="px-5 py-3.5">
                        <div className="space-y-0.5">
                          <p className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1">
                            <Store className="w-3 h-3 text-slate-400" />
                            <span>{seller?.business_name || seller?.full_name || 'Vendor'}</span>
                          </p>
                          <div className="flex items-center gap-2 text-[10px] text-slate-400">
                            <span className="flex items-center gap-0.5">
                              <MapPin className="w-2.5 h-2.5" /> {seller?.district || 'Abuja'}
                            </span>
                            {cleanPhone && (
                              <a
                                href={`https://wa.me/${cleanPhone}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-emerald-600 hover:underline flex items-center gap-0.5 font-bold"
                              >
                                <Phone className="w-2.5 h-2.5" /> Chat
                              </a>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Specs */}
                      <td className="px-5 py-3.5">
                        {item.specs && typeof item.specs === 'object' && Object.keys(item.specs).length > 0 ? (
                          <div className="flex flex-wrap gap-1 max-w-xs">
                            {Object.entries(item.specs)
                              .slice(0, 2)
                              .map(([k, v]) => (
                                <span
                                  key={k}
                                  className="text-[10px] bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded font-medium text-slate-700 dark:text-slate-300 capitalize"
                                >
                                  {k}: {String(v)}
                                </span>
                              ))}
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-400">Standard Specs</span>
                        )}
                      </td>

                      {/* Price */}
                      <td className="px-5 py-3.5 font-black text-slate-900 dark:text-slate-100">
                        ₦{Number(item.price).toLocaleString()}
                      </td>

                      {/* Status */}
                      <td className="px-5 py-3.5">
                        <Badge
                          className={`text-[10px] capitalize font-bold ${
                            item.status === 'published'
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200'
                              : 'bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300 border border-rose-200'
                          }`}
                        >
                          {item.status}
                        </Badge>
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link href={`/products/${item.id}`} target="_blank">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 px-2 text-slate-400 hover:text-blue-600 rounded-xl"
                              title="Open Live Listing"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </Button>
                          </Link>

                          {item.status === 'published' ? (
                            <form action={toggleProductStatus.bind(null, item.id, 'hidden')}>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 text-[11px] text-rose-600 border-rose-200 hover:bg-rose-50 dark:hover:bg-rose-950/40 font-bold gap-1 rounded-xl"
                              >
                                <EyeOff className="w-3 h-3" /> Take Down
                              </Button>
                            </form>
                          ) : (
                            <form action={toggleProductStatus.bind(null, item.id, 'published')}>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 text-[11px] text-emerald-600 border-emerald-200 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 font-bold gap-1 rounded-xl"
                              >
                                <CheckCircle className="w-3 h-3" /> Restore
                              </Button>
                            </form>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-slate-400">
                    No hardware listings matched your filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}