import { createClient as createAdminClient } from '@supabase/supabase-js'
import { AdminSidebar } from '@/components/admin/AdminSidebar'

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
  const adminDb = getAdminClient()

  const [
    verificationsRes,
    ordersRes,
    disputesRes,
    withdrawalsRes,
    ticketsRes,
  ] = await Promise.all([
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
      .from('audit_events')
      .select('id', { count: 'exact', head: true })
      .eq('action', 'seller_requested_bank_withdrawal')
      .eq('result', 'processing'),
    adminDb
      .from('support_tickets')
      .select('id', { count: 'exact', head: true })
      .neq('status', 'resolved')
      .neq('status', 'closed'),
  ])

  const counts = {
    pendingVerifications: verificationsRes.count || 0,
    pendingOrders: ordersRes.count || 0,
    openDisputes: disputesRes.count || 0,
    pendingPayouts: withdrawalsRes.count || 0,
    openTickets: ticketsRes.count || 0,
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