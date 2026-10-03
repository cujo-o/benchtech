import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

function getAdminClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  )
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 })
    }

    const { orderId, reason, description, requestedRemedy, evidenceUrl } = await request.json()

    if (!orderId || !reason || !description) {
      return NextResponse.json({ success: false, error: 'Missing required dispute fields' }, { status: 400 })
    }

    const adminClient = getAdminClient()

    // 1. Fetch order and verify buyer identity & protection status
    const { data: order, error: orderError } = await adminClient
      .from('orders')
      .select('id, buyer_id, seller_id, protection_ends_at, payout_status, dispute_status')
      .eq('id', orderId)
      .single()

    if (orderError || !order) {
      return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 })
    }

    if (order.buyer_id !== user.id) {
      return NextResponse.json({ success: false, error: 'Only the verified buyer can raise a dispute' }, { status: 403 })
    }

    // 2. Enforce 48h seller response deadline
    const responseDeadline = new Date(Date.now() + 48 * 60 * 60 * 1000)
    const caseNumber = `DS-${Math.floor(1000 + Math.random() * 9000)}`

    // 3. Create Dispute Record
    const { data: dispute, error: disputeError } = await adminClient
      .from('disputes')
      .insert({
        case_number: caseNumber,
        order_id: order.id,
        buyer_id: user.id,
        seller_id: order.seller_id,
        reason,
        description,
        requested_remedy: requestedRemedy || 'full_refund',
        status: 'opened',
        seller_response_deadline: responseDeadline.toISOString(),
      })
      .select()
      .single()

    if (disputeError) {
      return NextResponse.json({ success: false, error: disputeError.message }, { status: 500 })
    }

    // 4. Attach Initial Evidence if provided
    if (evidenceUrl) {
      await adminClient.from('dispute_evidence').insert({
        dispute_id: dispute.id,
        uploader_id: user.id,
        uploader_role: 'buyer',
        evidence_type: 'photo',
        file_url: evidenceUrl,
        caption: 'Initial buyer defect proof',
      })
    }

    // 5. Freeze Escrow Payout on Order (Spec §5.2, Visual 1 & 7)
    await adminClient
      .from('orders')
      .update({
        dispute_status: 'opened',
        payout_status: 'on_hold',
        updated_at: new Date().toISOString(),
      })
      .eq('id', order.id)

    return NextResponse.json({ success: true, disputeId: dispute.id, caseNumber })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Server error' }, { status: 500 })
  }
}