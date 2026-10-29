import { createClient as createAdminClient } from '@supabase/supabase-js'
import { SupportDeskClient } from './SupportDeskClient'

export const dynamic = 'force-dynamic'

function getAdminDb() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  return createAdminClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

export default async function AdminSupportDeskPage() {
  const adminDb = getAdminDb()

  const [{ data: rawTickets }, { data: messages }, { count: exceptionsCount }] =
    await Promise.all([
      adminDb
        .from('support_tickets')
        .select('*, order:orders(id, order_number, total_amount, amount, delivery_status, payout_status)')
        .order('created_at', { ascending: false }),
      adminDb
        .from('support_ticket_messages')
        .select('*')
        .order('created_at', { ascending: true }),
      adminDb
        .from('orders')
        .select('id', { count: 'exact', head: true })
        .eq('delivery_status', 'exception'),
    ])

  const msgMap = new Map<string, any[]>()
  for (const m of messages || []) {
    const list = msgMap.get(m.ticket_id) || []
    list.push(m)
    msgMap.set(m.ticket_id, list)
  }

  const hydratedTickets = (rawTickets || []).map((t: any) => ({
    ...t,
    messages: msgMap.get(t.id) || [],
  }))

  return (
    <SupportDeskClient
      tickets={hydratedTickets}
      deliveryExceptionsCount={exceptionsCount || 0}
    />
  )
}