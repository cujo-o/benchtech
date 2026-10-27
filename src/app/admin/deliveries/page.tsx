import Link from 'next/link'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { adminAssignCourierAction } from '@/app/actions/delivery'
import { adminVerifyOrderDelivery } from '@/app/admin/actions'
import { Truck, CheckCircle2, UserPlus } from 'lucide-react'

export const dynamic = 'force-dynamic'

function getAdminDb() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  return createAdminClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

export default async function AdminDeliveriesPage() {
  const adminDb = getAdminDb()

  const [{ data: orders }, { data: profiles }] = await Promise.all([
    adminDb
      .from('orders')
      .select(`
        *,
        product:products(title),
        buyer:profiles!orders_buyer_id_fkey(full_name, phone, district),
        seller:profiles!orders_seller_id_fkey(business_name, full_name, district)
      `)
      .neq('order_status', 'cancelled')
      .order('created_at', { ascending: false }),
    adminDb.from('profiles').select('id, full_name, business_name, phone, role, roles, is_delivery'),
  ])

  const allOrders = orders || []
  const deliverers = (profiles || []).filter((p) => {
    const roles: string[] = Array.isArray(p.roles) ? p.roles : []
    return (
      p.role === 'delivery' ||
      p.is_delivery === true ||
      roles.includes('delivery')
    )
  })

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Truck className="w-6 h-6 text-sky-600 dark:text-sky-400" />
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white">
              Abuja Delivery &amp; Courier Dispatch
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Assign orders to authorized deliverers ({deliverers.length} active) and monitor handovers.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/admin/users?role=deliverers">
            <Button
              size="sm"
              variant="outline"
              className="text-xs font-bold rounded-xl h-9 gap-1.5 border-slate-200 dark:border-slate-700 cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5 text-blue-600" />
              <span>Manage Deliverers ({deliverers.length})</span>
            </Button>
          </Link>
          <Link href="/delivery">
            <Button
              size="sm"
              className="bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-xl h-9 cursor-pointer"
            >
              Open Courier View
            </Button>
          </Link>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xs overflow-x-auto">
        <table className="w-full text-left text-xs whitespace-nowrap">
          <thead>
            <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-bold uppercase text-[10px]">
              <th className="pb-3 pr-4">Order</th>
              <th className="pb-3 px-4">Item</th>
              <th className="pb-3 px-4">Route (Pickup &rarr; Dropoff)</th>
              <th className="pb-3 px-4">Assigned Deliverer</th>
              <th className="pb-3 px-4">Status</th>
              <th className="pb-3 pl-4 text-right">Dispatch Control</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {allOrders.map((o) => {
              const isVerified = o.delivery_status === 'verified'
              return (
                <tr key={o.id} className="text-slate-700 dark:text-slate-300">
                  <td className="py-3.5 pr-4 font-mono font-bold text-slate-900 dark:text-white">
                    {o.order_number || o.id.slice(0, 8)}
                  </td>
                  <td className="py-3.5 px-4 font-semibold truncate max-w-[180px]">
                    {o.product?.title || 'Hardware'}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="font-semibold">
                      {o.seller?.district || 'Abuja'}
                    </span>
                    <span className="mx-1.5 text-slate-400">&rarr;</span>
                    <span className="font-semibold text-blue-600 dark:text-blue-400">
                      {o.delivery_area || o.buyer?.district || 'Abuja'}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    {o.courier_name ? (
                      <span className="font-bold text-slate-900 dark:text-white">
                        {o.courier_name}
                      </span>
                    ) : (
                      <span className="text-slate-400">Unassigned</span>
                    )}
                  </td>
                  <td className="py-3.5 px-4">
                    <Badge
                      className={`text-[10px] font-bold capitalize ${
                        isVerified
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                      }`}
                    >
                      {o.delivery_status?.replace(/_/g, ' ') || 'Pending'}
                    </Badge>
                  </td>
                  <td className="py-3.5 pl-4 text-right">
                    {!isVerified && (
                      <div className="inline-flex items-center gap-2">
                        <form
                          action={adminAssignCourierAction}
                          className="inline-flex items-center gap-1.5"
                        >
                          <input type="hidden" name="orderId" value={o.id} />
                          <select
                            name="courierId"
                            defaultValue={o.courier_id || ''}
                            required
                            className="h-8 px-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] font-medium"
                          >
                            <option value="">Select Deliverer...</option>
                            {deliverers.map((d) => (
                              <option key={d.id} value={d.id}>
                                {d.full_name || d.business_name}
                              </option>
                            ))}
                          </select>
                          <Button
                            type="submit"
                            size="xs"
                            variant="outline"
                            className="rounded-lg text-[11px] font-bold cursor-pointer"
                          >
                            Assign
                          </Button>
                        </form>

                        <form
                          action={async () => {
                            'use server'
                            await adminVerifyOrderDelivery(o.id)
                          }}
                        >
                          <Button
                            type="submit"
                            size="xs"
                            className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold cursor-pointer"
                          >
                            <CheckCircle2 className="w-3 h-3 mr-1" /> Verify
                          </Button>
                        </form>
                      </div>
                    )}
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