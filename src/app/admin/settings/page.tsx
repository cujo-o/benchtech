import { createClient as createAdminClient } from '@supabase/supabase-js'
import { PlatformSettingsClient } from './PlatformSettingsClient'

export const dynamic = 'force-dynamic'

function getAdminDb() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  return createAdminClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

export default async function AdminPlatformSettingsPage() {
  const adminDb = getAdminDb()

  const { data: latestConfig } = await adminDb
    .from('audit_events')
    .select('metadata, created_at')
    .eq('action', 'admin_updated_platform_settings')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  const meta = latestConfig?.metadata || {}

  const initialSettings = {
    standardCommission: Number(meta.standardCommission ?? 7.0),
    proCommission: Number(meta.proCommission ?? 5.0),
    adSaleFee: Number(meta.adSaleFee ?? 2.5),
    inspectionDays: Number(meta.inspectionDays ?? 7),
    highValueThreshold: Number(meta.highValueThreshold ?? 800000),
    minWithdrawalAmount: Number(meta.minWithdrawalAmount ?? 2000),
    abujaDispatchFee: Number(meta.abujaDispatchFee ?? 2500),
    lastUpdated: latestConfig?.created_at || null,
  }

  return <PlatformSettingsClient initialSettings={initialSettings} />
}