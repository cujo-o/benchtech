import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { updateUserRole, toggleUserSuspension } from './actions'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Search, Ban, CheckCircle } from 'lucide-react'

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string; q?: string }>
}) {
  const params = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login?next=/admin/users')

  let query = supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })

  if (params.role && params.role !== 'all') {
    query = query.eq('role', params.role)
  }

  if (params.q) {
    query = query.or(`full_name.ilike.%${params.q}%,email.ilike.%${params.q}%,business_name.ilike.%${params.q}%`)
  }

  const { data: profiles } = await query
  const activeTab = params.role || 'all'

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">User Management</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Audit registered accounts, update access roles, and monitor account health.
          </p>
        </div>

        {/* Role Filter Tabs */}
        <div className="flex items-center gap-1.5 bg-slate-200/60 p-1 rounded-xl">
          {[
            { label: 'All Users', value: 'all' },
            { label: 'Buyers', value: 'buyer' },
            { label: 'Sellers', value: 'seller' },
            { label: 'Admins', value: 'admin' },
          ].map((tab) => (
            <Link
              key={tab.value}
              href={`/admin/users?role=${tab.value}`}
              className={`text-xs px-3 py-1.5 rounded-lg font-bold transition ${
                activeTab === tab.value
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
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
            placeholder="Search by name, email, or store..."
            className="w-full h-9 pl-9 pr-4 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>
      </form>

      {/* Users Table */}
      <Card className="border-slate-200/80 shadow-sm rounded-2xl bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-400 font-bold border-b border-slate-100 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-5 py-3.5">User Identity</th>
                <th className="px-5 py-3.5">Store Details</th>
                <th className="px-5 py-3.5">Current Role</th>
                <th className="px-5 py-3.5">Trust Status</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {profiles && profiles.length > 0 ? (
                profiles.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/60 transition">
                    <td className="px-5 py-3.5">
                      <p className="font-bold text-slate-900">{p.full_name || 'No Name'}</p>
                      <p className="text-[11px] text-slate-400">{p.email}</p>
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="font-semibold text-slate-700">{p.business_name || '—'}</p>
                      <p className="text-[11px] text-slate-400">{p.phone || 'No phone'}</p>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-block px-2 py-0.5 rounded-full font-bold text-[10px] capitalize ${
                        p.role === 'admin'
                          ? 'bg-slate-900 text-white'
                          : p.role === 'seller'
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : 'bg-slate-100 text-slate-600'
                      }`}>
                        {p.role}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-block px-2 py-0.5 rounded-full font-bold text-[10px] capitalize ${
                        p.tech_trust_status === 'verified'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : p.tech_trust_status === 'pending'
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-slate-100 text-slate-500'
                      }`}>
                        {p.tech_trust_status || 'unverified'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {p.role !== 'admin' && (
                          <form action={updateUserRole.bind(null, p.id, p.role === 'seller' ? 'buyer' : 'seller')}>
                            <Button size="sm" variant="outline" className="h-7 text-[10px] font-bold">
                              Switch to {p.role === 'seller' ? 'Buyer' : 'Seller'}
                            </Button>
                          </form>
                        )}
                        <form action={toggleUserSuspension.bind(null, p.id, p.status)}>
                          <Button
                            size="sm"
                            variant="ghost"
                            className={`h-7 px-2 text-[11px] ${
                              p.status === 'suspended' ? 'text-emerald-600 hover:bg-emerald-50' : 'text-rose-600 hover:bg-rose-50'
                            }`}
                            title={p.status === 'suspended' ? 'Reactivate' : 'Suspend'}
                          >
                            {p.status === 'suspended' ? <CheckCircle className="w-3.5 h-3.5" /> : <Ban className="w-3.5 h-3.5" />}
                          </Button>
                        </form>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-400">No users found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}