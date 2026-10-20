import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { AdminSidebar } from '@/components/admin/AdminSidebar'

export const dynamic = 'force-dynamic'

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  return createAdminClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login?next=/admin')
  }

  const adminDb = getAdminClient()
  const { data: profile } = await adminDb
    .from('profiles')
    .select('role, roles, is_admin')
    .eq('id', user.id)
    .maybeSingle()

  const roles: string[] = Array.isArray(profile?.roles)
    ? profile.roles
    : profile?.role
    ? [profile.role]
    : []

  const isAdmin =
    profile?.role === 'admin' || profile?.is_admin === true || roles.includes('admin')

  if (!isAdmin) {
    redirect('/feed')
  }

  // Fetch live action counts for sidebar badges
  const [verificationsRes, ordersRes, disputesRes, payoutsRes] = await Promise.all([
    adminDb
      .from('seller_verifications')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'under_review'),
    adminDb
      .from('orders')
      .select('id', { count: 'exact', head: true })
      .neq('delivery_status', 'verified')
      .neq('order_status', 'cancelled'),
    adminDb
      .from('disputes')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'open'),
    adminDb
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .gt('available_payout', 0),
  ])

  const counts = {
    pendingVerifications: verificationsRes.count || 0,
    pendingOrders: ordersRes.count || 0,
    openDisputes: disputesRes.count || 0,
    pendingPayouts: payoutsRes.count || 0,
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col lg:flex-row">
      <AdminSidebar counts={counts} />
      <div className="flex-1 min-w-0 flex flex-col">
        <main className="flex-1 p-3 sm:p-6 lg:p-8 max-w-[1600px] w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  )
}