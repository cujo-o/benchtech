import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { AdminSettingsForm } from './AdminSettingsForm'
import { CampaignAdminRow } from './CampaignAdminRow'
import {
  ShieldAlert,
  DollarSign,
  TrendingUp,
  MousePointerClick,
  Layers,
} from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function AdminAdvertisingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') redirect('/')

  // Fetch settings, campaigns, attribution ledger, and fraud logs
  const [{ data: settings }, { data: campaigns }, { data: attributions }, { data: invalidEvents }] =
    await Promise.all([
      supabase.from('platform_settings').select('*').eq('id', 'global_config').single(),
      supabase
        .from('ad_campaigns')
        .select('*, profiles(business_name, full_name, email)')
        .order('created_at', { ascending: false }),
      supabase.from('ad_attributions').select('*'),
      supabase
        .from('ad_events')
        .select('*')
        .eq('is_valid', false)
        .order('created_at', { ascending: false })
        .limit(20),
    ])

  const totalAdRevenue = (attributions || []).reduce(
    (acc, curr) => acc + Number(curr.ad_fee_charged || 0),
    0
  )
  const totalGmvAttributed = (attributions || []).reduce(
    (acc, curr) => acc + Number(curr.gmv_amount || 0),
    0
  )

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-red-500" />
            Advertising &amp; Commercial Settings
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Configure platform commissions, advertising rates, CPC constraints, and manage active campaigns.
          </p>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
          <p className="text-[10px] font-bold text-slate-400 uppercase">Total Attributed GMV</p>
          <p className="text-lg font-black text-slate-900 dark:text-slate-100">
            ₦{totalGmvAttributed.toLocaleString()}
          </p>
          <span className="text-[10px] text-blue-600 font-bold">From Promoted Ads</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
          <p className="text-[10px] font-bold text-slate-400 uppercase">Ad Revenue Collected</p>
          <p className="text-lg font-black text-emerald-600 dark:text-emerald-400">
            ₦{totalAdRevenue.toLocaleString()}
          </p>
          <span className="text-[10px] text-slate-400">Promote Fees Settled</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
          <p className="text-[10px] font-bold text-slate-400 uppercase">Active Campaigns</p>
          <p className="text-lg font-black text-slate-900 dark:text-slate-100">
            {campaigns?.filter((c) => c.status === 'active').length || 0}
          </p>
          <span className="text-[10px] text-slate-400">Total: {campaigns?.length || 0}</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
          <p className="text-[10px] font-bold text-slate-400 uppercase">Blocked Invalid Clicks</p>
          <p className="text-lg font-black text-red-600 dark:text-red-400">
            {invalidEvents?.length || 0}
          </p>
          <span className="text-[10px] text-slate-400">Bot / Flooding Filtered</span>
        </div>
      </div>

      {/* Dynamic Settings Editor Form */}
      <AdminSettingsForm initialSettings={settings} />

      {/* Campaigns Moderation Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 space-y-4">
        <h3 className="font-black text-sm text-slate-900 dark:text-slate-100">
          Campaign Moderation &amp; Control
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-bold uppercase text-[10px]">
                <th className="pb-3">Seller / Store</th>
                <th className="pb-3">Campaign Name</th>
                <th className="pb-3">Type</th>
                <th className="pb-3">Budget / Rate</th>
                <th className="pb-3">Status</th>
                <th className="pb-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {campaigns?.map((c) => (
                <CampaignAdminRow key={c.id} campaign={c} />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}