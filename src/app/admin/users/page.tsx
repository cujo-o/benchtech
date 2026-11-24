import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { Badge } from '@/components/ui/badge'
import { UserActionsMenu } from './UserActionsMenu'
import { Users, Search } from 'lucide-react'

export const dynamic = 'force-dynamic'

function getAdminDb() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  return createAdminClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string; q?: string }>
}) {
  const params = await searchParams
  const roleFilter = params?.role || 'all'
  const query = (params?.q || '').trim().toLowerCase()

  const supabase = await createClient()
  const adminDb = getAdminDb()

  const [
    {
      data: { user: currentAdmin },
    },
    { data: profiles },
  ] = await Promise.all([
    supabase.auth.getUser(),
    adminDb
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false }),
  ])

  const allUsers = profiles || []

  const getUserFlags = (u: any) => {
    const roles: string[] = Array.isArray(u.roles) ? u.roles : []
    const isAdmin =
      u.role === 'admin' || u.is_admin === true || roles.includes('admin')
    const isDeliverer =
      u.role === 'delivery' ||
      u.is_delivery === true ||
      roles.includes('delivery')
    const isSeller =
      u.role === 'seller' ||
      u.is_seller === true ||
      roles.includes('seller') ||
      Boolean(u.business_name)
    const isVerified = u.tech_trust_status === 'verified'
    const isPro =
      u.seller_plan === 'pro' ||
      u.subscription_tier === 'pro' ||
      u.subscription_plan === 'professional'
    const isSuspended = u.verification_state === 'suspended'

    return {
      isAdmin,
      isDeliverer,
      isSeller,
      isVerified,
      isPro,
      isSuspended,
    }
  }

  const filteredUsers = allUsers.filter((u) => {
    const matchesQuery =
      !query ||
      (u.full_name || '').toLowerCase().includes(query) ||
      (u.business_name || '').toLowerCase().includes(query) ||
      (u.email || '').toLowerCase().includes(query) ||
      (u.phone || '').toLowerCase().includes(query)

    if (!matchesQuery) return false

    const flags = getUserFlags(u)
    if (roleFilter === 'sellers') return flags.isSeller
    if (roleFilter === 'deliverers') return flags.isDeliverer
    if (roleFilter === 'verified') return flags.isVerified
    if (roleFilter === 'pro') return flags.isPro
    if (roleFilter === 'admins') return flags.isAdmin
    return true
  })

  return (
    <div className="space-y-6">
      {/* Header & Search */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white">
              Users, Merchants &amp; Deliverers
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Manage Admin, Seller, Deliverer, Buyer, Verification, and Pro Plan access from each user&apos;s menu.
          </p>
        </div>

        <form action="/admin/users" method="GET" className="w-full md:w-72">
          <input type="hidden" name="role" value={roleFilter} />
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              name="q"
              defaultValue={params?.q || ''}
              placeholder="Search name, store, email..."
              className="w-full h-10 pl-9 pr-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </form>
      </div>

      {/* Role Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {[
          { id: 'all', label: `All Accounts (${allUsers.length})` },
          {
            id: 'admins',
            label: `Admins (${allUsers.filter((u) => getUserFlags(u).isAdmin).length})`,
          },
          {
            id: 'deliverers',
            label: `Deliverers (${allUsers.filter((u) => getUserFlags(u).isDeliverer).length})`,
          },
          {
            id: 'sellers',
            label: `Sellers (${allUsers.filter((u) => getUserFlags(u).isSeller).length})`,
          },
          { id: 'verified', label: 'Verified Stores' },
          { id: 'pro', label: 'Pro Sellers' },
        ].map((tab) => (
          <Link
            key={tab.id}
            href={`/admin/users?role=${tab.id}${
              params?.q ? `&q=${encodeURIComponent(params.q)}` : ''
            }`}
          >
            <button
              type="button"
              className={`px-3.5 py-2 rounded-xl text-xs font-bold shrink-0 transition cursor-pointer ${
                roleFilter === tab.id
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
              }`}
            >
              {tab.label}
            </button>
          </Link>
        ))}
      </div>

      {/* Users Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 sm:p-6 shadow-xs overflow-x-auto">
        <table className="w-full text-left text-xs whitespace-nowrap">
          <thead>
            <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-bold uppercase text-[10px]">
              <th className="pb-3 pr-4">User / Store</th>
              <th className="pb-3 px-4">Contact</th>
              <th className="pb-3 px-4">Roles</th>
              <th className="pb-3 px-4">Status</th>
              <th className="pb-3 px-4">Plan</th>
              <th className="pb-3 pl-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredUsers.length > 0 ? (
              filteredUsers.map((u) => {
                const flags = getUserFlags(u)
                const displayName = u.business_name || u.full_name || 'User'

                return (
                  <tr
                    key={u.id}
                    className="text-slate-700 dark:text-slate-300 hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition"
                  >
                    <td className="py-3.5 pr-4">
                      <p className="font-bold text-slate-900 dark:text-white">
                        {displayName}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        {u.district || 'Abuja'}
                      </p>
                    </td>

                    <td className="py-3.5 px-4">
                      <p className="font-medium">{u.email || '—'}</p>
                      <p className="text-[11px] text-slate-400">
                        {u.phone || '—'}
                      </p>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex flex-wrap items-center gap-1.5">
                        {flags.isAdmin && (
                          <Badge className="bg-red-50 text-red-700 dark:bg-red-950/70 dark:text-red-300 border border-red-200 dark:border-red-800 text-[10px] font-bold uppercase">
                            Admin
                          </Badge>
                        )}
                        {flags.isSeller && (
                          <Badge className="bg-blue-50 text-blue-700 dark:bg-blue-950/70 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-[10px] font-bold uppercase">
                            Seller
                          </Badge>
                        )}
                        {flags.isDeliverer && (
                          <Badge className="bg-sky-50 text-sky-700 dark:bg-sky-950/70 dark:text-sky-300 border border-sky-200 dark:border-sky-800 text-[10px] font-bold uppercase">
                            Deliverer
                          </Badge>
                        )}
                        {!flags.isAdmin &&
                          !flags.isSeller &&
                          !flags.isDeliverer && (
                            <Badge
                              variant="outline"
                              className="text-[10px] font-bold uppercase"
                            >
                              Buyer
                            </Badge>
                          )}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      {flags.isSuspended ? (
                        <Badge className="bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300 text-[10px] font-bold">
                          Suspended
                        </Badge>
                      ) : (
                        <Badge
                          className={`text-[10px] font-bold capitalize ${
                            flags.isVerified
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                              : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                          }`}
                        >
                          {u.tech_trust_status || 'unverified'}
                        </Badge>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      {flags.isPro ? (
                        <Badge className="bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300 text-[10px] font-bold">
                          Pro Seller
                        </Badge>
                      ) : (
                        <span className="text-slate-400">Free</span>
                      )}
                    </td>

                    <td className="py-3.5 pl-4 text-right">
                      <UserActionsMenu
                        userId={u.id}
                        currentAdminId={currentAdmin?.id || null}
                        displayName={displayName}
                        email={u.email || ''}
                        isAdmin={flags.isAdmin}
                        isSeller={flags.isSeller}
                        isDeliverer={flags.isDeliverer}
                        isVerified={flags.isVerified}
                        isPro={flags.isPro}
                        isSuspended={flags.isSuspended}
                      />
                    </td>
                  </tr>
                )
              })
            ) : (
              <tr>
                <td colSpan={6} className="py-10 text-center text-slate-400">
                  No accounts match this filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}