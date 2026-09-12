import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { toggleProductStatus } from '../actions'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Layers, Users, ShieldCheck, ArrowRight, EyeOff, CheckCircle } from 'lucide-react'

export default async function AdminOverviewPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login?next=/admin/overview')

  const { data: currentProfile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (currentProfile?.role !== 'admin') {
    redirect('/feed')
  }

  // 1. Metric Counts
  const { count: listingsCount } = await supabase
    .from('products')
    .select('*', { count: 'exact', head: true })

  const { count: usersCount } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })

  const { count: pendingCount } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('tech_trust_status', 'pending')

  // 2. Fetch products for moderation
  const { data: products } = await supabase
    .from('products')
    .select('*, profiles!products_seller_id_fkey(business_name, phone)')
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Admin Control Centre</h1>
        <p className="text-xs text-slate-500 mt-1">Platform moderation, verifications, and listing health.</p>
      </div>

      {/* KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-slate-200/80 shadow-sm rounded-2xl bg-white">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-400">Total Listings</p>
              <h2 className="text-2xl font-black text-slate-900 mt-1">{listingsCount || 0}</h2>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Layers className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200/80 shadow-sm rounded-2xl bg-white">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-400">Total Users</p>
              <h2 className="text-2xl font-black text-slate-900 mt-1">{usersCount || 0}</h2>
            </div>
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className={`border-slate-200/80 shadow-sm rounded-2xl bg-white ${(pendingCount || 0) > 0 ? 'border-amber-300 bg-amber-50/20' : ''}`}>
          <CardContent className="p-5 flex flex-col justify-between h-full space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-400">Pending Verifications</p>
                <h2 className="text-2xl font-black text-slate-900 mt-1">{pendingCount || 0}</h2>
              </div>
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
            </div>
            <Link href="/admin/verifications" className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1">
              Review Queue <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Moderation Table */}
      <Card className="border-slate-200/80 shadow-sm rounded-2xl bg-white overflow-hidden">
        <div className="p-5 border-b border-slate-100">
          <h3 className="text-sm font-bold text-slate-900">All Products (Moderation Queue)</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-400 font-bold border-b border-slate-100 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-5 py-3">Product</th>
                <th className="px-5 py-3">Seller</th>
                <th className="px-5 py-3">Price</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 text-right">Moderation Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {products && products.length > 0 ? (
                products.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/60 transition">
                    <td className="px-5 py-3.5 font-bold text-slate-900">
                      <div>
                        <p>{item.title}</p>
                        <p className="text-[10px] text-slate-400 font-normal capitalize">{item.brand} • {item.category}</p>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="font-semibold text-slate-800">{item.profiles?.business_name || 'Vendor'}</p>
                      <p className="text-[10px] text-slate-400">{item.profiles?.phone || 'No phone'}</p>
                    </td>
                    <td className="px-5 py-3.5 font-black text-slate-900">
                      ₦{Number(item.price).toLocaleString()}
                    </td>
                    <td className="px-5 py-3.5">
                      <Badge variant="secondary" className={`text-[10px] capitalize font-bold ${
                        item.status === 'published' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'
                      }`}>
                        {item.status}
                      </Badge>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      {item.status === 'published' ? (
                        <form action={toggleProductStatus.bind(null, item.id, 'hidden')}>
                          <Button size="sm" variant="outline" className="h-7 text-[11px] text-rose-600 border-rose-200 hover:bg-rose-50 font-bold gap-1">
                            <EyeOff className="w-3 h-3" /> Take Down
                          </Button>
                        </form>
                      ) : (
                        <form action={toggleProductStatus.bind(null, item.id, 'published')}>
                          <Button size="sm" variant="outline" className="h-7 text-[11px] text-emerald-600 border-emerald-200 hover:bg-emerald-50 font-bold gap-1">
                            <CheckCircle className="w-3 h-3" /> Restore
                          </Button>
                        </form>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-400">No products uploaded yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}