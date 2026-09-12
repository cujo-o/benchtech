import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { toggleProductStatus } from '../actions'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { EyeOff, CheckCircle, ExternalLink, Search } from 'lucide-react'

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; category?: string; q?: string }>
}) {
  const params = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login?next=/admin/products')

  let query = supabase
    .from('products')
    .select('*, profiles!products_seller_id_fkey(business_name, phone)')
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

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">All Marketplace Products</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Monitor live listings, review specifications, and enforce listing compliance.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/admin/products?status=published">
            <Button size="sm" variant={params.status === 'published' ? 'default' : 'outline'} className="text-xs h-8">
              Live Published
            </Button>
          </Link>
          <Link href="/admin/products?status=hidden">
            <Button size="sm" variant={params.status === 'hidden' ? 'default' : 'outline'} className="text-xs h-8">
              Taken Down
            </Button>
          </Link>
          <Link href="/admin/products">
            <Button size="sm" variant={!params.status ? 'default' : 'outline'} className="text-xs h-8">
              View All
            </Button>
          </Link>
        </div>
      </div>

      <Card className="border-slate-200/80 shadow-sm rounded-2xl bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-400 font-bold border-b border-slate-100 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-5 py-3.5">Listing</th>
                <th className="px-5 py-3.5">Store / Contact</th>
                <th className="px-5 py-3.5">Specs Snapshot</th>
                <th className="px-5 py-3.5">Price</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Moderation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {products && products.length > 0 ? (
                products.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/60 transition">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-slate-100 overflow-hidden shrink-0 flex items-center justify-center border border-slate-200">
                          {item.images?.[0] ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={item.images[0]} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-[9px] text-slate-400">No Img</span>
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 line-clamp-1">{item.title}</p>
                          <p className="text-[10px] text-slate-400 capitalize">{item.brand} • {item.category}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="font-semibold text-slate-800">{item.profiles?.business_name || 'Vendor'}</p>
                      <p className="text-[10px] text-slate-400">{item.profiles?.phone || 'No phone'}</p>
                    </td>
                    <td className="px-5 py-3.5">
                      {item.specs ? (
                        <span className="text-[11px] text-slate-600 bg-slate-100 px-2 py-0.5 rounded font-mono">
                          {Object.entries(item.specs).slice(0, 2).map(([k, v]) => `${k}: ${v}`).join(' | ') || 'None'}
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 font-black text-slate-900">
                      ₦{Number(item.price).toLocaleString()}
                    </td>
                    <td className="px-5 py-3.5">
                      <Badge className={`text-[10px] capitalize ${
                        item.status === 'published' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'
                      }`}>
                        {item.status}
                      </Badge>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link href={`/products/${item.id}`} target="_blank">
                          <Button size="sm" variant="ghost" className="h-7 px-2 text-slate-500 hover:text-slate-900">
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Button>
                        </Link>
                        {item.status === 'published' ? (
                          <form action={toggleProductStatus.bind(null, item.id, 'hidden')}>
                            <Button size="sm" variant="outline" className="h-7 text-[10px] text-rose-600 border-rose-200 hover:bg-rose-50 font-bold gap-1">
                              <EyeOff className="w-3 h-3" /> Take Down
                            </Button>
                          </form>
                        ) : (
                          <form action={toggleProductStatus.bind(null, item.id, 'published')}>
                            <Button size="sm" variant="outline" className="h-7 text-[10px] text-emerald-600 border-emerald-200 hover:bg-emerald-50 font-bold gap-1">
                              <CheckCircle className="w-3 h-3" /> Restore
                            </Button>
                          </form>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">No listings found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}