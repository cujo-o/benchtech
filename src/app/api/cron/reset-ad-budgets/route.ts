import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  )
}

export async function GET(request: Request) {
  try {
    // Verify Vercel Cron authorization header if configured
    const authHeader = request.headers.get('authorization')
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized cron invocation' }, { status: 401 })
    }

    const supabase = getSupabaseAdmin()
    const nowIso = new Date().toISOString()

    // 1. Mark campaigns that reached end_date as 'completed'
    await supabase
      .from('ad_campaigns')
      .update({ status: 'completed' })
      .lt('end_date', nowIso)
      .in('status', ['active', 'exhausted', 'paused'])

    // 2. Fetch all 'exhausted' or 'active' Sponsored Search campaigns
    const { data: searchCampaigns, error: fetchError } = await supabase
      .from('ad_campaigns')
      .select('id, seller_id, status, max_cpc')
      .eq('type', 'sponsored_search')
      .in('status', ['active', 'exhausted'])

    if (fetchError) throw fetchError

    // 3. Check seller wallet balances and reset daily spend
    let reactivatedCount = 0
    let keptExhaustedCount = 0

    for (const campaign of searchCampaigns || []) {
      const { data: wallet } = await supabase
        .from('ad_wallets')
        .select('balance')
        .eq('seller_id', campaign.seller_id)
        .maybeSingle()

      const hasMinBalance = Number(wallet?.balance || 0) >= Number(campaign.max_cpc || 50)
      const nextStatus = hasMinBalance ? 'active' : 'exhausted'

      await supabase
        .from('ad_campaigns')
        .update({
          spent_today: 0.00,
          status: nextStatus,
          updated_at: nowIso,
        })
        .eq('id', campaign.id)

      if (nextStatus === 'active' && campaign.status === 'exhausted') {
        reactivatedCount++
      } else if (nextStatus === 'exhausted') {
        keptExhaustedCount++
      }
    }

    return NextResponse.json({
      success: true,
      processed: searchCampaigns?.length || 0,
      reactivated: reactivatedCount,
      keptExhaustedDueToZeroWallet: keptExhaustedCount,
      timestamp: nowIso,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}