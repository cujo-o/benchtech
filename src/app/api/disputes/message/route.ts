import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
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
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    let disputeId: string | null = null
    let message: string | null = null

    const contentType = request.headers.get('content-type') || ''
    if (contentType.includes('application/json')) {
      const body = await request.json()
      disputeId = body.disputeId
      message = body.message
    } else {
      const formData = await request.formData()
      disputeId = formData.get('disputeId') as string
      message = formData.get('message') as string
    }

    if (!disputeId || !message?.trim()) {
      return NextResponse.json({ success: false, error: 'Dispute ID and message are required' }, { status: 400 })
    }

    const adminClient = getAdminClient()

    // Verify user is buyer, seller, or admin on this dispute
    const { data: dispute } = await adminClient
      .from('disputes')
      .select('id, buyer_id, seller_id')
      .eq('id', disputeId)
      .single()

    if (!dispute) {
      return NextResponse.json({ success: false, error: 'Dispute case not found' }, { status: 404 })
    }

    const { data: profile } = await adminClient
      .from('profiles')
      .select('role, is_admin')
      .eq('id', user.id)
      .single()

    const isAdmin = profile?.role === 'admin' || profile?.is_admin === true
    if (dispute.buyer_id !== user.id && dispute.seller_id !== user.id && !isAdmin) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    // Insert message into thread
    const { error: msgError } = await adminClient.from('dispute_messages').insert({
      dispute_id: disputeId,
      sender_id: user.id,
      message: message.trim(),
    })

    if (msgError) {
      return NextResponse.json({ success: false, error: msgError.message }, { status: 500 })
    }

    // Advance dispute state to under_review if seller responded
    if (dispute.seller_id === user.id) {
      await adminClient
        .from('disputes')
        .update({ status: 'under_review', updated_at: new Date().toISOString() })
        .eq('id', disputeId)
    }

    revalidatePath(`/disputes/${disputeId}`)

    // If submitted via standard form action, redirect back to dispute screen
    if (!contentType.includes('application/json')) {
      return NextResponse.redirect(new URL(`/disputes/${disputeId}`, request.url), 303)
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}