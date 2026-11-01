import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { Navbar } from '@/components/Navbar'
import { BuyerSidebar } from '@/components/storefront/BuyerSidebar'
import { NewRequestForm } from './NewRequestForm'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Request a Device | BenchTech Abuja',
  description:
    'Broadcast your target hardware specs and budget to verified Abuja electronics stores.',
}

function getAdminDb() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  return createAdminClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

export default async function RequestDevicePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login?next=/requests/new')
  }

  const adminDb = getAdminDb()

  const [
    { data: requestEvents },
    { data: responseEvents },
    { data: enquiries },
    { data: enquiryReplyEvents },
  ] = await Promise.all([
    adminDb
      .from('audit_events')
      .select('*')
      .eq('action', 'buyer_device_request')
      .eq('actor_id', user.id)
      .order('created_at', { ascending: false }),
    adminDb
      .from('audit_events')
      .select('*')
      .eq('action', 'seller_fulfilled_device_request')
      .order('created_at', { ascending: false }),
    adminDb
      .from('enquiries')
      .select('*, product:products(id, title, price)')
      .eq('buyer_id', user.id)
      .order('created_at', { ascending: false }),
    adminDb
      .from('audit_events')
      .select('*')
      .eq('action', 'seller_replied_product_enquiry')
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

  const myRequests = (requestEvents || []).map((ev: any) => ({
    id: ev.id,
    status: ev.result || 'open',
    title: ev.metadata?.title || 'Requested Device',
    category: ev.metadata?.category || 'hardware',
    condition: ev.metadata?.condition || 'any',
    budget: ev.metadata?.budget || 0,
    preferred_district: ev.metadata?.preferred_district || 'Abuja',
    specs_notes: ev.metadata?.specs_notes || '',
    created_at: ev.created_at,
    responses: responseMap.get(ev.id) || [],
  }))

  const replyMap = new Map<string, string>()
  for (const rep of enquiryReplyEvents || []) {
    if (rep.target_id && rep.metadata?.reply_text) {
      replyMap.set(rep.target_id, rep.metadata.reply_text)
    }
  }

  const myEnquiries = (enquiries || []).map((e: any) => ({
    ...e,
    seller_reply: replyMap.get(e.id) || null,
  }))

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col">
      <Navbar />
      <div className="max-w-[1700px] w-full mx-auto flex flex-1">
        <BuyerSidebar />
        <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8">
          <NewRequestForm myRequests={myRequests} myEnquiries={myEnquiries} />
        </main>
      </div>
    </div>
  )
}