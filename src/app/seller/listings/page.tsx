import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { updateProductStatus, deleteProduct } from './actions'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  PackagePlus, 
  Trash2, 
  CheckCircle2, 
  PauseCircle, 
  PlayCircle, 
  Edit2, 
  ExternalLink 
} from 'lucide-react'

export default async function SellerListingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: products } = await supabase
    .from('products')
    .select('*')
    .eq('seller_id', user!.id)
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Inventory & Listings</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage active items, adjust prices and specs, update availability, or mark items as sold.
          </p>
        </div>
        <Link href="/seller/listings/new">
          <Button className="bg-blue-600 hover:bg-blue-700 text-xs font-bold gap-2 h-10 px-4 shadow-sm">
            <PackagePlus className="w-4 h-4" /> Add New Listing
          </Button>
        </Link>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-sm">
        {products && products.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-[11px] uppercase font-bold text-slate-400 border-b border-slate-100">
                <tr>
                  <th className="px-6 py-3.5">Product</th>
                  <th className="px-6 py-3.5">Category</th>
                  <th className="px-6 py-3.5">Price</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {products.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-slate-100 overflow-hidden shrink-0 border border-slate-200/80 flex items-center justify-center">
                          {item.images?.[0] ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={item.images[0]} alt={item.title} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-[10px] text-slate-400">No Img</span>
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 text-xs line-clamp-1">{item.title}</p>
                          <p className="text-[11px] text-slate-400 capitalize">
                            {item.brand} • {item.condition.replace('_', ' ')}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 capitalize font-semibold text-slate-700">{item.category}</td>
                    <td className="px-6 py-4 font-black text-slate-900 text-xs">
                      ₦{Number(item.price).toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <Badge
                        variant="secondary"
                        className={`text-[10px] font-bold capitalize ${
                          item.status === 'published'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : item.status === 'sold'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {item.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {/* View in Storefront */}
                        <Link href={`/products/${item.id}`} target="_blank" title="View live page">
                          <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-slate-500 hover:text-slate-900">
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Button>
                        </Link>

                        {/* Edit Listing */}
                        <Link href={`/seller/listings/${item.id}/edit`} title="Edit details & specs">
                          <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-slate-500 hover:text-blue-600">
                            <Edit2 className="w-3.5 h-3.5" />
                          </Button>
                        </Link>

                        {/* Toggle Publish / Pause */}
                        {item.status === 'published' ? (
                          <form action={updateProductStatus.bind(null, item.id, 'paused')}>
                            <Button size="sm" variant="ghost" title="Pause listing" className="h-8 w-8 p-0 text-slate-500 hover:text-amber-600">
                              <PauseCircle className="w-4 h-4" />
                            </Button>
                          </form>
                        ) : (
                          <form action={updateProductStatus.bind(null, item.id, 'published')}>
                            <Button size="sm" variant="ghost" title="Publish listing" className="h-8 w-8 p-0 text-slate-500 hover:text-emerald-600">
                              <PlayCircle className="w-4 h-4" />
                            </Button>
                          </form>
                        )}

                        {/* Mark Sold */}
                        {item.status !== 'sold' && (
                          <form action={updateProductStatus.bind(null, item.id, 'sold')}>
                            <Button size="sm" variant="ghost" title="Mark as Sold" className="h-8 w-8 p-0 text-slate-500 hover:text-blue-600">
                              <CheckCircle2 className="w-4 h-4" />
                            </Button>
                          </form>
                        )}

                        {/* Delete */}
                        <form action={deleteProduct.bind(null, item.id)}>
                          <Button size="sm" variant="ghost" title="Delete listing" className="h-8 w-8 p-0 text-slate-400 hover:text-red-600 hover:bg-red-50">
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </form>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center space-y-3">
            <p className="text-xs text-slate-500">No listings found in your catalogue.</p>
            <Link href="/seller/listings/new">
              <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-xs font-bold">
                Create First Listing
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}