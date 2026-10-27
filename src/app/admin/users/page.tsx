import Link from 'next/link'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  adminUpdateUserRole,
  adminToggleSellerVerify,
  adminToggleProPlan,
  adminToggleDeliverer,
} from '@/app/admin/actions'
import { Users, ShieldCheck, Crown, Search, Truck } from 'lucide-react'

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

  const adminDb = getAdminDb()
  const { data: profiles } = await adminDb
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })

  const allUsers = profiles || []

  const isUserDeliverer = (u: any) => {
    const roles: string[] = Array.isArray(u.roles) ? u.roles : []
    return (
      u.role === 'delivery' ||
      u.is_delivery === true ||
      roles.includes('delivery')
    )
  }

  const filteredUsers = allUsers.filter((u) => {
    const matchesQuery =
      !query ||
      (u.full_name || '').toLowerCase().includes(query) ||
      (u.business_name || '').toLowerCase().includes(query) ||
      (u.email || '').toLowerCase().includes(query) ||
      (u.phone || '').toLowerCase().includes(query)

    if (!matchesQuery) return false

    if (roleFilter === 'sellers') {
      return u.role === 'seller' || u.is_seller === true || Boolean(u.business_name)
    }
    if (roleFilter === 'deliverers') {
      return isUserDeliverer(u)
    }
    if (roleFilter === 'verified') {
      return u.tech_trust_status === 'verified'
    }
    if (roleFilter === 'pro') {
      return u.seller_plan === 'pro' || u.subscription_tier === 'pro'
    }
    if (roleFilter === 'admins') {
      return u.role === 'admin' || u.is_admin === true
    }
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
            Assign deliverer access, verify merchant stores, and manage Pro seller plans.
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
              className="w-full h-10 pl-9 pr-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </form>
      </div>

      {/* Role Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {[
          { id: 'all', label: `All Accounts (${allUsers.length})` },
          { id: 'deliverers', label: `Deliverers (${allUsers.filter(isUserDeliverer).length})` },
          { id: 'sellers', label: 'Sellers' },
          { id: 'verified', label: 'Verified Stores' },
          { id: 'pro', label: 'Pro Sellers' },
          { id: 'admins', label: 'Admins' },
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
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xs overflow-x-auto">
        <table className="w-full text-left text-xs whitespace-nowrap">
          <thead>
            <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-bold uppercase text-[10px]">
              <th className="pb-3 pr-4">User / Store</th>
              <th className="pb-3 px-4">Contact</th>
              <th className="pb-3 px-4">Roles</th>
              <th className="pb-3 px-4">Verification</th>
              <th className="pb-3 px-4">Plan</th>
              <th className="pb-3 pl-4 text-right">Quick Controls</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredUsers.map((u) => {
              const isVerified = u.tech_trust_status === 'verified'
              const isPro =
                u.seller_plan === 'pro' || u.subscription_tier === 'pro'
              const isDeliverer = isUserDeliverer(u)
              const currentRole = u.role || 'buyer'

              return (
                <tr key={u.id} className="text-slate-700 dark:text-slate-300">
                  <td className="py-3.5 pr-4">
                    <p className="font-bold text-slate-900 dark:text-white">
                      {u.business_name || u.full_name || 'User'}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      {u.district || 'Abuja'}
                    </p>
                  </td>
                  <td className="py-3.5 px-4">
                    <p className="font-medium">{u.email || '—'}</p>
                    <p className="text-[11px] text-slate-400">{u.phone || '—'}</p>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-1.5">
                      <Badge variant="outline" className="text-[10px] font-bold uppercase">
                        {currentRole}
                      </Badge>
                      {isDeliverer && currentRole !== 'delivery' && (
                        <Badge className="bg-sky-50 text-sky-700 dark:bg-sky-950 dark:text-sky-300 border border-sky-200 dark:border-sky-800 text-[10px] font-bold">
                          Deliverer
                        </Badge>
                      )}
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <Badge
                      className={`text-[10px] font-bold capitalize ${
                        isVerified
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                      }`}
                    >
                      {u.tech_trust_status || 'unverified'}
                    </Badge>
                  </td>
                  <td className="py-3.5 px-4">
                    {isPro ? (
                      <Badge className="bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300 text-[10px] font-bold">
                        Pro Seller
                      </Badge>
                    ) : (
                      <span className="text-slate-400">Free</span>
                    )}
                  </td>
                  <td className="py-3.5 pl-4 text-right">
                    <div className="inline-flex items-center gap-1.5">
                      {/* Toggle Deliverer Access */}
                      <form
                        action={async () => {
                          'use server'
                          await adminToggleDeliverer(u.id, !isDeliverer)
                        }}
                      >
                        <Button
                          type="submit"
                          size="xs"
                          variant="outline"
                          className={`rounded-lg text-[11px] font-bold cursor-pointer ${
                            isDeliverer
                              ? 'border-sky-300 bg-sky-50 text-sky-700 dark:border-sky-800 dark:bg-sky-950/60 dark:text-sky-300'
                              : ''
                          }`}
                        >
                          <Truck className="w-3 h-3 mr-1 text-sky-600" />
                          {isDeliverer ? 'Remove Deliverer' : 'Make Deliverer'}
                        </Button>
                      </form>

                      {/* Verify Seller */}
                      <form
                        action={async () => {
                          'use server'
                          await adminToggleSellerVerify(u.id, !isVerified)
                        }}
                      >
                        <Button
                          type="submit"
                          size="xs"
                          variant="outline"
                          className="rounded-lg text-[11px] font-bold cursor-pointer"
                        >
                          <ShieldCheck className="w-3 h-3 mr-1 text-emerald-600" />
                          {isVerified ? 'Unverify' : 'Verify'}
                        </Button>
                      </form>

                      {/* Toggle Pro */}
                      <form
                        action={async () => {
                          'use server'
                          await adminToggleProPlan(u.id, !isPro)
                        }}
                      >
                        <Button
                          type="submit"
                          size="xs"
                          variant="outline"
                          className="rounded-lg text-[11px] font-bold cursor-pointer"
                        >
                          <Crown className="w-3 h-3 mr-1 text-purple-600" />
                          {isPro ? 'Revoke Pro' : 'Grant Pro'}
                        </Button>
                      </form>

                      {/* Toggle Seller/Buyer */}
                      {currentRole !== 'admin' && (
                        <form
                          action={async () => {
                            'use server'
                            await adminUpdateUserRole(
                              u.id,
                              currentRole === 'seller' ? 'buyer' : 'seller'
                            )
                          }}
                        >
                          <Button
                            type="submit"
                            size="xs"
                            variant="ghost"
                            className="rounded-lg text-[11px] font-bold cursor-pointer"
                          >
                            {currentRole === 'seller' ? 'Make Buyer' : 'Make Seller'}
                          </Button>
                        </form>
                      )}
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