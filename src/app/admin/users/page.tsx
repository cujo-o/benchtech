import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import {
  updateUserRole,
  toggleAdminStatus,
  toggleDeliveryStatus,
  toggleUserSuspension,
} from './actions'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Search,
  Ban,
  CheckCircle,
  Truck,
  ShieldAlert,
  UserCheck,
  UserMinus,
} from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string; q?: string }>
}) {
  const params = await searchParams
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login?next=/admin/users')

  let query = supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })

  if (params.role && params.role !== 'all') {
    if (params.role === 'admin') {
      query = query.or('role.eq.admin,is_admin.eq.true')
    } else if (params.role === 'delivery') {
      query = query.or('role.eq.delivery,is_delivery.eq.true')
    } else {
      query = query.eq('role', params.role)
    }
  }

  if (params.q) {
    query = query.or(
      `full_name.ilike.%${params.q}%,email.ilike.%${params.q}%,business_name.ilike.%${params.q}%,phone.ilike.%${params.q}%`
    )
  }

  const { data: profiles } = await query
  const activeTab = params.role || 'all'

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto p-4 sm:p-6 text-slate-900 dark:text-slate-100">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight">User Management</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Audit registered accounts, assign delivery drivers, and manage admin privileges.
          </p>
        </div>

        {/* Role Filter Tabs (Includes Delivery Fleet) */}
        <div className="flex items-center gap-1.5 bg-slate-200/70 dark:bg-slate-800 p-1 rounded-xl overflow-x-auto [scrollbar-width:none]">
          {[
            { label: 'All Users', value: 'all' },
            { label: 'Buyers', value: 'buyer' },
            { label: 'Sellers', value: 'seller' },
            { label: 'Delivery Fleet', value: 'delivery' },
            { label: 'Admins', value: 'admin' },
          ].map((tab) => (
            <Link
              key={tab.value}
              href={`/admin/users?role=${tab.value}`}
              className={`text-xs px-3 py-1.5 rounded-lg font-bold transition whitespace-nowrap ${
                activeTab === tab.value
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              {tab.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Search Input */}
      <form method="GET" className="max-w-md">
        <input type="hidden" name="role" value={activeTab} />
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            name="q"
            defaultValue={params.q || ''}
            placeholder="Search by name, email, store, or phone..."
            className="w-full h-9 pl-9 pr-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 outline-none font-medium"
          />
        </div>
      </form>

      {/* Users Table */}
      <Card className="border-slate-200/80 dark:border-slate-800 shadow-xs rounded-3xl bg-white dark:bg-slate-900 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-400 font-bold border-b border-slate-100 dark:border-slate-800 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-5 py-3.5">User Identity</th>
                <th className="px-5 py-3.5">Contact / Store</th>
                <th className="px-5 py-3.5">Current Role</th>
                <th className="px-5 py-3.5">Trust / Logistics</th>
                <th className="px-5 py-3.5 text-right">Assign Roles &amp; Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {profiles && profiles.length > 0 ? (
                profiles.map((p) => {
                  const isAdmin = p.is_admin === true || p.role === 'admin'
                  const isDelivery = p.is_delivery === true || p.role === 'delivery'
                  const isSeller = p.role === 'seller'

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold flex items-center justify-center shrink-0 text-xs">
                            {(p.full_name || p.business_name || 'U')[0]?.toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 dark:text-slate-100">{p.full_name || 'No Name'}</p>
                            <p className="text-[11px] text-slate-400 font-mono">{p.email || p.id.slice(0, 12)}</p>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-3.5">
                        <p className="font-semibold text-slate-700 dark:text-slate-300">{p.business_name || '—'}</p>
                        <p className="text-[11px] text-slate-400">{p.phone || 'No phone'}</p>
                      </td>

                      <td className="px-5 py-3.5">
                        <div className="flex flex-wrap gap-1">
                          {isAdmin && (
                            <Badge className="bg-purple-900 text-purple-200 border border-purple-700 text-[10px] font-bold">
                              Admin
                            </Badge>
                          )}
                          {isDelivery && (
                            <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 text-[10px] font-bold">
                              Delivery Fleet
                            </Badge>
                          )}
                          {isSeller && (
                            <Badge className="bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-[10px] font-bold">
                              Seller
                            </Badge>
                          )}
                          {!isAdmin && !isDelivery && !isSeller && (
                            <Badge variant="outline" className="text-[10px]">
                              Buyer
                            </Badge>
                          )}
                        </div>
                      </td>

                      <td className="px-5 py-3.5">
                        {isDelivery ? (
                          <div className="text-[11px] space-y-0.5">
                            <span className="font-bold text-emerald-600 dark:text-emerald-400 block">
                              ₦{Number(p.delivery_earnings || 0).toLocaleString()} earned
                            </span>
                            <span className="text-slate-400 block text-[10px]">
                              {p.total_deliveries_completed || 0} trips • {p.is_online ? 'Online' : 'Offline'}
                            </span>
                          </div>
                        ) : (
                          <span
                            className={`inline-block px-2 py-0.5 rounded-full font-bold text-[10px] capitalize ${
                              p.tech_trust_status === 'verified'
                                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200'
                                : p.tech_trust_status === 'pending'
                                ? 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border border-amber-200'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                            }`}
                          >
                            {p.tech_trust_status || 'unverified'}
                          </span>
                        )}
                      </td>

                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5 flex-wrap">
                          {/* 1. Toggle Delivery Fleet Role */}
                          <form action={toggleDeliveryStatus.bind(null, p.id, !isDelivery)}>
                            <Button
                              size="sm"
                              variant="outline"
                              type="submit"
                              className={`h-7 px-2.5 text-[10px] font-bold gap-1 rounded-lg cursor-pointer ${
                                isDelivery
                                  ? 'border-emerald-500 text-emerald-700 dark:text-emerald-300 bg-emerald-50/50 dark:bg-emerald-950/40'
                                  : 'border-slate-200 dark:border-slate-700'
                              }`}
                            >
                              <Truck className="w-3 h-3" />
                              <span>{isDelivery ? 'Remove Delivery' : 'Make Delivery'}</span>
                            </Button>
                          </form>

                          {/* 2. Toggle Admin Privilege */}
                          <form action={toggleAdminStatus.bind(null, p.id, !isAdmin)}>
                            <Button
                              size="sm"
                              variant="outline"
                              type="submit"
                              className={`h-7 px-2.5 text-[10px] font-bold gap-1 rounded-lg cursor-pointer ${
                                isAdmin
                                  ? 'border-purple-500 text-purple-700 dark:text-purple-300 bg-purple-50/50 dark:bg-purple-950/40'
                                  : 'border-slate-200 dark:border-slate-700'
                              }`}
                            >
                              <ShieldAlert className="w-3 h-3" />
                              <span>{isAdmin ? 'Demote Admin' : 'Make Admin'}</span>
                            </Button>
                          </form>

                          {/* 3. Switch Buyer <-> Seller (For non-admin base role) */}
                          {!isAdmin && (
                            <form
                              action={updateUserRole.bind(
                                null,
                                p.id,
                                p.role === 'seller' ? 'buyer' : 'seller'
                              )}
                            >
                              <Button
                                size="sm"
                                variant="ghost"
                                type="submit"
                                className="h-7 text-[10px] font-bold rounded-lg cursor-pointer text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                              >
                                To {p.role === 'seller' ? 'Buyer' : 'Seller'}
                              </Button>
                            </form>
                          )}

                          {/* 4. Suspend / Reactivate Account */}
                          <form action={toggleUserSuspension.bind(null, p.id, p.status)}>
                            <Button
                              size="sm"
                              variant="ghost"
                              type="submit"
                              className={`h-7 px-2 text-[11px] rounded-lg cursor-pointer ${
                                p.status === 'suspended'
                                  ? 'text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950'
                                  : 'text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950'
                              }`}
                              title={p.status === 'suspended' ? 'Reactivate' : 'Suspend'}
                            >
                              {p.status === 'suspended' ? (
                                <CheckCircle className="w-3.5 h-3.5" />
                              ) : (
                                <Ban className="w-3.5 h-3.5" />
                              )}
                            </Button>
                          </form>
                        </div>
                      </td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-400">
                    No users found matching your criteria.
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