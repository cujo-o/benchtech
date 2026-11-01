import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { SellerEnquiriesClient } from './SellerEnquiriesClient'

export const dynamic = 'force-dynamic'

function getAdminDb() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  return createAdminClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

export default async function SellerEnquiriesPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login?next=/seller/enquiries')

  const adminDb = getAdminDb()

  const [
    { data: enquiries },
    { data: requestEvents },
    { data: responseEvents },
    { data: replyEvents },
    { data: sellerProducts },
  ] = await Promise.all([
    adminDb
      .from('enquiries')
      .select('*, product:products(id, title, price)')
      .eq('seller_id', user.id)
      .order('created_at', { ascending: false }),
    adminDb
      .from('audit_events')
      .select('*')
      .eq('action', 'buyer_device_request')
      .neq('result', 'closed')
      .order('created_at', { ascending: false })
      .limit(50),
    adminDb
      .from('audit_events')
      .select('*')
      .eq('action', 'seller_fulfilled_device_request')
      .order('created_at', { ascending: false }),
    adminDb
      .from('audit_events')
      .select('*')
      .eq('action', 'seller_replied_product_enquiry')
      .eq('actor_id', user.id),
    adminDb
      .from('products')
      .select('id, title, price')
      .eq('seller_id', user.id)
      .eq('status', 'published')
      .order('created_at', { ascending: false }),
  ])

  const responseMap = new Map<string, any[]>()
  for (const r of responseEvents || []) {
    const reqId = r.target_id || r.metadata?.request_id
    if (reqId) {
      const list = responseMap.get(reqId) || []
      list.push(r.metadata)
      responseMap.set(reqId, list)
    }
  }

  const deviceRequests = (requestEvents || []).map((ev: any) => ({
    id: ev.id,
    buyer_id: ev.actor_id || ev.metadata?.buyer_id,
    buyer_name: ev.metadata?.buyer_name || 'Abuja Buyer',
    title: ev.metadata?.title || 'Hardware Request',
    category: ev.metadata?.category || 'hardware',
    condition: ev.metadata?.condition || 'any',
    budget: ev.metadata?.budget || 0,
    preferred_district: ev.metadata?.preferred_district || 'Abuja',
    specs_notes: ev.metadata?.specs_notes || '',
    created_at: ev.created_at,
    responses: responseMap.get(ev.id) || [],
  }))

  const replyMap = new Map<string, string>()
  for (const rep of replyEvents || []) {
    if (rep.target_id && rep.metadata?.reply_text) {
      replyMap.set(rep.target_id, rep.metadata.reply_text)
    }
  }

  const hydratedEnquiries = (enquiries || []).map((e: any) => ({
    ...e,
    seller_reply: replyMap.get(e.id) || null,
  }))

  return (
    <SellerEnquiriesClient
      sellerId={user.id}
      enquiries={hydratedEnquiries}
      deviceRequests={deviceRequests}
      sellerProducts={sellerProducts || []}
    />
  )
}