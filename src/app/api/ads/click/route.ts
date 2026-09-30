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
    const body = await req.json()
    const { campaignId, productId, sellerId } = body

    if (!campaignId || !productId || !sellerId) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 })
    }

    // 1. Telemetry Capture
    const forwarded = req.headers.get('x-forwarded-for') || '127.0.0.1'
    const ip = forwarded.split(',')[0].trim()
    const userAgent = req.headers.get('user-agent') || 'unknown'
    const ipHash = hashString(ip)
    const uaHash = hashString(userAgent)

    // 2. Fetch Campaign & Settings
    const [{ data: campaign }, { data: settings }] = await Promise.all([
      supabase.from('ad_campaigns').select('*').eq('id', campaignId).single(),
      supabase.from('platform_settings').select('*').eq('id', 'global_config').single(),
    ])

    if (!campaign || campaign.status !== 'active') {
      return NextResponse.json({ proceed: true, billed: false })
    }

    // 3. Fraud & Validity Filtering:
    // A) Bot check
    const isBot = /bot|spider|crawl|headless/i.test(userAgent)
    // B) Click flooding check (clicks from same IP on same product in past 15 mins)
    const fifteenMinsAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString()
    const { count: recentClicks } = await supabase
      .from('ad_events')
      .select('id', { count: 'exact', head: true })
      .eq('product_id', productId)
      .eq('ip_hash', ipHash)
      .eq('event_type', 'click')
      .gte('created_at', fifteenMinsAgo)

    let isValid = true
    let invalidReason = null

    if (isBot) {
      isValid = false
      invalidReason = 'bot_traffic'
    } else if ((recentClicks || 0) >= 3) {
      isValid = false
      invalidReason = 'click_flooding'
    }

    let costCharged = 0

    // 4. CPC Auction Deduction (Only for Sponsored Search)
    if (campaign.type === 'sponsored_search' && isValid) {
      const actualCpc = Math.min(Number(campaign.max_cpc), Number(settings?.cpc_suggested || 100))
      
      // Atomic wallet deduction RPC
      const { data: wallet } = await supabase
        .from('ad_wallets')
        .select('balance, total_spent')
        .eq('seller_id', sellerId)
        .single()

      if (wallet && wallet.balance >= actualCpc) {
        costCharged = actualCpc
        await supabase
          .from('ad_wallets')
          .update({
            balance: wallet.balance - actualCpc,
            total_spent: (wallet.total_spent || 0) + actualCpc,
          })
          .eq('seller_id', sellerId)

        // Increment today's campaign spend
        const newSpentToday = Number(campaign.spent_today || 0) + actualCpc
        const isExhausted = newSpentToday >= Number(campaign.daily_budget)

        await supabase
          .from('ad_campaigns')
          .update({
            spent_today: newSpentToday,
            status: isExhausted ? 'exhausted' : 'active',
          })
          .eq('id', campaignId)
      } else {
        isValid = false
        invalidReason = 'insufficient_wallet_balance'
      }
    }

    // 5. Log Ad Event
    const { data: adEvent } = await supabase
      .from('ad_events')
      .insert({
        campaign_id: campaignId,
        product_id: productId,
        seller_id: sellerId,
        event_type: 'click',
        cost_charged: costCharged,
        is_valid: isValid,
        invalid_reason: invalidReason,
        ip_hash: ipHash,
        user_agent_hash: uaHash,
      })
      .select('id')
      .single()

    // 6. Set 7-day Attribution Cookie
    const attrPayload = JSON.stringify({
      campaignId,
      productId,
      sellerId,
      adEventId: adEvent?.id,
      timestamp: Date.now(),
    })

    const response = NextResponse.json({ success: true, isValid, costCharged })
    const days = settings?.attribution_window_days || 7
    response.cookies.set(`bt_attr_${productId}`, attrPayload, {
      maxAge: days * 24 * 60 * 60,
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
    })

    return response
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}