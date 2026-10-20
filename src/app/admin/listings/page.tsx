import Link from 'next/link'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  adminUpdateProductStatus,
  adminToggleProductFeatured,
  adminDeleteProduct,
} from '@/app/admin/actions'
import {
  Boxes,
  Search,
  Star,
  EyeOff,
  Eye,
  Trash2,
  ExternalLink,
} from 'lucide-react'

export const dynamic = 'force-dynamic'

function getAdminDb() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  return createAdminClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

export default async function AdminListingsPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string; q?: string }>
}) {
  const params = await searchParams
  const filter = params?.filter || 'all'
  const query = (params?.q || '').trim().toLowerCase()

  const adminDb = getAdminDb()
  const { data: products } = await adminDb
    .from('products')
    .select('*, seller:profiles!products_seller_id_fkey(business_name, full_name, district)')
    .order('created_at', { ascending: false })

  const allProducts = products || []

  const filteredProducts = allProducts.filter((p) => {
    const matchesSearch =
      !query ||
      (p.title || '').toLowerCase().includes(query) ||
      (p.brand || '').toLowerCase().includes(query) ||
      (p.category || '').toLowerCase().includes(query) ||
      (p.seller?.business_name || '').toLowerCase().includes(query)

    if (!matchesSearch) return false

    if (filter === 'published') return p.status === 'published'
    if (filter === 'featured') return Boolean(p.is_featured)
    if (filter === 'hidden') return p.status !== 'published'
    return true
  })

  return (
    <div className="space-y-6">
      {/* Header & Search */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Boxes className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white">
              Product Catalog Moderation
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Inspect listings, feature top hardware on the feed, or hide non-compliant items.
          </p>
        </div>

        <form action="/admin/listings" method="GET" className="w-full md:w-72">
          <input type="hidden" name="filter" value={filter} />
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              name="q"
              defaultValue={params?.q || ''}
              placeholder="Search title, brand, seller..."
              className="w-full h-10 pl-9 pr-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </form>
      </div>

      {/* Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {[
          { id: 'all', label: `All Listings (${allProducts.length})` },
          { id: 'published', label: 'Published' },
          { id: 'featured', label: 'Featured' },
          { id: 'hidden', label: 'Hidden / Draft' },
        ].map((tab) => (
          <Link
            key={tab.id}
            href={`/admin/listings?filter=${tab.id}${
              params?.q ? `&q=${encodeURIComponent(params.q)}` : ''
            }`}
          >
            <button
              type="button"
              className={`px-3.5 py-2 rounded-xl text-xs font-bold shrink-0 transition cursor-pointer ${
                filter === tab.id
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
              }`}
            >
              {tab.label}
            </button>
          </Link>
        ))}
      </div>

      {/* Products Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xs overflow-x-auto">
        <table className="w-full text-left text-xs whitespace-nowrap">
          <thead>
            <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-bold uppercase text-[10px]">
              <th className="pb-3 pr-4">Listing</th>
              <th className="pb-3 px-4">Seller</th>
              <th className="pb-3 px-4">Category</th>
              <th className="pb-3 px-4">Price</th>
              <th className="pb-3 px-4">Status</th>
              <th className="pb-3 pl-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredProducts.map((p) => {
              const isPublished = p.status === 'published'
              const isFeatured = Boolean(p.is_featured)

              return (
                <tr key={p.id} className="text-slate-700 dark:text-slate-300">
                  <td className="py-3.5 pr-4">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/products/${p.id}`}
                        target="_blank"
                        className="font-bold text-slate-900 dark:text-white hover:text-blue-600 flex items-center gap-1 truncate max-w-[220px]"
                      >
                        <span className="truncate">{p.title}</span>
                        <ExternalLink className="w-3 h-3 shrink-0 opacity-60" />
                      </Link>
                      {isFeatured && (
                        <Badge className="bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300 text-[9px] font-bold">
                          Featured
                        </Badge>
                      )}
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    {p.seller?.business_name || p.seller?.full_name || 'Vendor'}
                  </td>
                  <td className="py-3.5 px-4 capitalize">{p.category || 'Hardware'}</td>
                  <td className="py-3.5 px-4 font-black text-slate-900 dark:text-white">
                    ₦{Number(p.price || 0).toLocaleString()}
                  </td>
                  <td className="py-3.5 px-4">
                    <Badge
                      className={`text-[10px] font-bold capitalize ${
                        isPublished
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                      }`}
                    >
                      {p.status || 'draft'}
                    </Badge>
                  </td>
                  <td className="py-3.5 pl-4 text-right">
                    <div className="inline-flex items-center gap-1.5">
                      <form
                        action={async () => {
                          'use server'
                          await adminToggleProductFeatured(p.id, !isFeatured)
                        }}
                      >
                        <Button
                          type="submit"
                          size="xs"
                          variant="outline"
                          className="rounded-lg text-[11px] font-bold cursor-pointer"
                        >
                          <Star className="w-3 h-3 mr-1 text-amber-500" />
                          {isFeatured ? 'Unfeature' : 'Feature'}
                        </Button>
                      </form>

                      <form
                        action={async () => {
                          'use server'
                          await adminUpdateProductStatus(
                            p.id,
                            isPublished ? 'hidden' : 'published'
                          )
                        }}
                      >
                        <Button
                          type="submit"
                          size="xs"
                          variant="outline"
                          className="rounded-lg text-[11px] font-bold cursor-pointer"
                        >
                          {isPublished ? (
                            <>
                              <EyeOff className="w-3 h-3 mr-1" /> Hide
                            </>
                          ) : (
                            <>
                              <Eye className="w-3 h-3 mr-1" /> Publish
                            </>
                          )}
                        </Button>
                      </form>

                      <form
                        action={async () => {
                          'use server'
                          await adminDeleteProduct(p.id)
                        }}
                      >
                        <Button
                          type="submit"
                          size="xs"
                          variant="ghost"
                          className="rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </form>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}