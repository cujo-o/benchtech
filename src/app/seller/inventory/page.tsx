import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import {
  Boxes,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Search,
  Filter,
  SlidersHorizontal,
  Lock,
  Crown,
  ArrowRight,
  Edit2,
  RefreshCw,
} from 'lucide-react'

export const metadata = {
  title: 'Inventory Manager | BenchTech Seller',
}

export default async function InventoryPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login?next=/seller/inventory')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const isPro =
    profile?.seller_plan === 'pro' ||
    profile?.subscription_tier === 'pro' ||
    profile?.subscription_plan === 'professional'

  const { data: products } = await supabase
    .from('products')
    .select('*')
    .eq('seller_id', user.id)
    .order('created_at', { ascending: false })

  const totalCount = products?.length || 0
  const lowStockCount = products?.filter((p) => (p.stock || 1) <= 2 && (p.stock || 1) > 0).length || 0
  const outOfStockCount = products?.filter((p) => p.status === 'sold' || p.stock === 0).length || 0
  const inStockCount = totalCount - outOfStockCount

  return (
    <div className="space-y-6 sm:space-y-8 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Inventory Management
            </h1>
            <Badge className="bg-purple-100 text-purple-800 text-[10px] font-black uppercase">
              Pro Feature
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Keep track of stock levels, manage low-stock alerts, and perform bulk price updates.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="text-xs font-bold rounded-xl h-10 border-slate-200">
            Export Inventory (.CSV)
          </Button>
          <Link href="/seller/listings/new">
            <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl h-10">
              + Add Item
            </Button>
          </Link>
        </div>
      </div>

      <div className="relative">
        {/* Pro Lock Overlay */}
        {!isPro && (
          <div className="absolute inset-0 z-20 backdrop-blur-md bg-white/80 rounded-3xl flex flex-col items-center justify-center p-6 text-center">
            <div className="max-w-md bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mx-auto">
                <Lock className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900">Advanced Inventory is Pro-Only</h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Avoid overselling on Banex walk-ins. Get automatic low-stock alerts, bulk price modifiers, and stock movements.
                </p>
              </div>
              <Link href="/seller/subscription" className="block pt-2">
                <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black text-xs h-11 rounded-xl shadow-md gap-2">
                  Upgrade to Pro — ₦5,000/month <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </Link>
            </div>
          </div>
        )}

        <div className={`space-y-6 ${!isPro ? 'select-none pointer-events-none opacity-40' : ''}`}>
          {/* Stock Stat Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="rounded-2xl border-slate-200/80 bg-white p-4 shadow-xs">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Products</span>
              <p className="text-2xl font-black text-slate-900 mt-1">{totalCount}</p>
              <p className="text-[10px] text-slate-400">All registered SKUs</p>
            </Card>

            <Card className="rounded-2xl border-slate-200/80 bg-white p-4 shadow-xs">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">In Stock</span>
              <p className="text-2xl font-black text-emerald-600 mt-1">{inStockCount}</p>
              <p className="text-[10px] text-emerald-600 font-semibold">Available for Abuja buyers</p>
            </Card>

            <Card className="rounded-2xl border-slate-200/80 bg-white p-4 shadow-xs">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Low Stock Warning</span>
              <p className="text-2xl font-black text-amber-500 mt-1">{lowStockCount}</p>
              <p className="text-[10px] text-amber-600 font-semibold">2 units or fewer remaining</p>
            </Card>

            <Card className="rounded-2xl border-slate-200/80 bg-white p-4 shadow-xs">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Out of Stock</span>
              <p className="text-2xl font-black text-slate-400 mt-1">{outOfStockCount}</p>
              <p className="text-[10px] text-slate-400">Marked sold or archived</p>
            </Card>
          </div>

          {/* Search, Filter & Bulk Actions Bar */}
          <Card className="rounded-3xl border-slate-200/80 bg-white p-4 sm:p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  placeholder="Search by device title, brand, or specs..."
                  className="w-full h-10 pl-9 pr-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-600"
                />
              </div>

              <div className="flex items-center gap-2">
                <select className="h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700">
                  <option>All Categories</option>
                  <option>Phones</option>
                  <option>Laptops</option>
                  <option>Gaming</option>
                </select>

                <select className="h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700">
                  <option>All Stock Status</option>
                  <option>In Stock</option>
                  <option>Low Stock</option>
                  <option>Out of Stock</option>
                </select>
              </div>
            </div>

            {/* Inventory Table */}
            <div className="overflow-x-auto pt-2">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase text-[10px] tracking-wider">
                    <th className="pb-3 w-8"><input type="checkbox" className="rounded" /></th>
                    <th className="pb-3">Product</th>
                    <th className="pb-3">Category</th>
                    <th className="pb-3">Stock Units</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3">Outright Price</th>
                    <th className="pb-3 text-right">Quick Edit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {products && products.length > 0 ? (
                    products.map((item) => {
                      const stock = item.stock || 1
                      const isLow = stock <= 2 && stock > 0
                      const isOut = stock === 0 || item.status === 'sold'

                      return (
                        <tr key={item.id} className="hover:bg-slate-50 transition">
                          <td className="py-3.5"><input type="checkbox" className="rounded" /></td>
                          <td className="py-3.5 flex items-center gap-3">
                            <div className="w-10 h-10 bg-slate-50 rounded-xl overflow-hidden shrink-0 border border-slate-100 p-1 flex items-center justify-center">
                              {item.images?.[0] ? (
                                <img src={item.images[0]} alt={item.title} className="max-h-full object-contain" />
                              ) : (
                                <Boxes className="w-4 h-4 text-slate-300" />
                              )}
                            </div>
                            <div>
                              <p className="font-bold text-slate-900 line-clamp-1">{item.title}</p>
                              <p className="text-[10px] text-slate-400 uppercase">{item.brand || 'Device'}</p>
                            </div>
                          </td>
                          <td className="py-3.5 capitalize font-medium text-slate-600">{item.category || 'Hardware'}</td>
                          <td className="py-3.5 font-bold text-slate-900">{stock} units</td>
                          <td className="py-3.5">
                            {isOut ? (
                              <Badge className="bg-slate-100 text-slate-600 border-none text-[10px]">Out of Stock</Badge>
                            ) : isLow ? (
                              <Badge className="bg-amber-50 text-amber-700 border-amber-200 text-[10px]">Low Stock</Badge>
                            ) : (
                              <Badge className="bg-emerald-50 text-emerald-700 border-none text-[10px]">In Stock</Badge>
                            )}
                          </td>
                          <td className="py-3.5 font-black text-slate-900">₦{Number(item.price).toLocaleString()}</td>
                          <td className="py-3.5 text-right">
                            <Link href={`/seller/listings/${item.id}/edit`}>
                              <Button variant="ghost" size="sm" className="h-8 text-slate-500 hover:text-blue-600">
                                <Edit2 className="w-3.5 h-3.5 mr-1" /> Edit
                              </Button>
                            </Link>
                          </td>
                        </tr>
                      )
                    })
                  ) : (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400">
                        No hardware listings registered yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}