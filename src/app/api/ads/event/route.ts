import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  )
}

function hashString(input: string) {
  return crypto.createHash('sha256').update(input).digest('hex')
}

export async function POST(req: Request) {
  try {
    const supabase = getSupabaseAdmin()
    const { productId, eventType } = await req.json()

    if (!productId || !['view', 'add_to_cart', 'impression'].includes(eventType)) {
      return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 })
    }

    // 1. Inspect 7-Day Attribution Cookie
    const cookies = req.headers.get('cookie') || ''
    const attrMatch = cookies.match(new RegExp(`bt_attr_${productId}=([^;]+)`))
    if (!attrMatch) {
      return NextResponse.json({ tracked: false, reason: 'unattributed' })
    }

    const attrData = JSON.parse(decodeURIComponent(attrMatch[1]))
    const forwarded = req.headers.get('x-forwarded-for') || '127.0.0.1'
    const ip = forwarded.split(',')[0].trim()
    const userAgent = req.headers.get('user-agent') || 'unknown'

    // 2. Insert Funnel Event
    await supabase.from('ad_events').insert({
      campaign_id: attrData.campaignId,
      product_id: productId,
      seller_id: attrData.sellerId,
      event_type: eventType,
      cost_charged: 0,
      is_valid: true,
      ip_hash: hashString(ip),
      user_agent_hash: hashString(userAgent),
    })

    return NextResponse.json({ tracked: true, eventType })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}