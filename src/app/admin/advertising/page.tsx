import { createClient as createAdminClient } from '@supabase/supabase-js'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  adminToggleAdCampaign,
  adminCreditSellerAdWallet,
} from '@/app/admin/actions'
import { Megaphone, Wallet, TrendingUp } from 'lucide-react'

export const dynamic = 'force-dynamic'

function getAdminDb() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  return createAdminClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

export default async function AdminAdvertisingPage() {
  const adminDb = getAdminDb()

  const [
    { data: campaigns },
    { data: wallets },
    { data: attributions },
    { data: sellers },
  ] = await Promise.all([
    adminDb
      .from('ad_campaigns')
      .select('*, seller:profiles!ad_campaigns_seller_id_fkey(business_name, full_name)')
      .order('created_at', { ascending: false }),
    adminDb.from('ad_wallets').select('*'),
    adminDb.from('ad_attributions').select('*'),
    adminDb
      .from('profiles')
      .select('id, business_name, full_name')
      .not('business_name', 'is', null),
  ])

  const allCampaigns = campaigns || []
  const allWallets = wallets || []
  const allAttributions = attributions || []

  const totalWalletBalance = allWallets.reduce(
    (sum, w) => sum + Number(w.balance || 0),
    0
  )
  const totalAttributedGMV = allAttributions.reduce(
    (sum, a) => sum + Number(a.gmv_amount || 0),
    0
  )
  const activeCount = allCampaigns.filter((c) => c.status === 'active').length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xs">
        <div className="flex items-center gap-2">
          <Megaphone className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            Promotions &amp; Advertising Console
          </h1>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Monitor seller ad campaigns, attributed sales GMV, and promotion wallet balances.
        </p>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs">
          <span className="text-[11px] font-bold uppercase text-slate-400 block">
            Active Ad Campaigns
          </span>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">
            {activeCount} / {allCampaigns.length}
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs">
          <span className="text-[11px] font-bold uppercase text-slate-400 block">
            Seller Ad Wallet Float
          </span>
          <p className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-1">
            ₦{totalWalletBalance.toLocaleString()}
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs">
          <span className="text-[11px] font-bold uppercase text-slate-400 block">
            Attributed Ad Sales (GMV)
          </span>
          <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
            ₦{totalAttributedGMV.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Manual Ad Credit Form */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xs space-y-3">
        <h2 className="text-sm font-black text-slate-900 dark:text-white">
          Credit Seller Promotion Wallet
        </h2>
        <form
          action={adminCreditSellerAdWallet}
          className="grid grid-cols-1 sm:grid-cols-3 gap-3"
        >
          <select
            name="sellerId"
            required
            className="h-10 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium"
          >
            <option value="">Select Seller Store...</option>
            {(sellers || []).map((s) => (
              <option key={s.id} value={s.id}>
                {s.business_name || s.full_name}
              </option>
            ))}
          </select>

          <input
            type="number"
            name="amount"
            min={500}
            step={500}
            required
            placeholder="Credit Amount (₦)"
            className="h-10 px-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold"
          />

          <Button
            type="submit"
            className="h-10 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl cursor-pointer"
          >
            Credit Ad Wallet
          </Button>
        </form>
      </div>

      {/* Campaigns Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xs overflow-x-auto">
        <table className="w-full text-left text-xs whitespace-nowrap">
          <thead>
            <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-bold uppercase text-[10px]">
              <th className="pb-3 pr-4">Campaign</th>
              <th className="pb-3 px-4">Seller</th>
              <th className="pb-3 px-4">Model</th>
              <th className="pb-3 px-4">Rate / Budget</th>
              <th className="pb-3 px-4">Spend Today</th>
              <th className="pb-3 px-4">Status</th>
              <th className="pb-3 pl-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {allCampaigns.map((c) => {
              const isActive = c.status === 'active'
              return (
                <tr key={c.id} className="text-slate-700 dark:text-slate-300">
                  <td className="py-3.5 pr-4 font-bold text-slate-900 dark:text-white">
                    {c.campaign_name}
                  </td>
                  <td className="py-3.5 px-4">
                    {c.seller?.business_name || c.seller?.full_name || 'Vendor'}
                  </td>
                  <td className="py-3.5 px-4 capitalize">
                    {c.type === 'promote_product' ? 'Pay On Sale' : 'Sponsored Search'}
                  </td>
                  <td className="py-3.5 px-4">
                    {c.type === 'promote_product'
                      ? `${c.ad_rate_percentage || 2.5}% per sale`
                      : `₦${Number(c.daily_budget || 0).toLocaleString()}/day`}
                  </td>
                  <td className="py-3.5 px-4 font-bold">
                    ₦{Number(c.spent_today || 0).toLocaleString()}
                  </td>
                  <td className="py-3.5 px-4">
                    <Badge
                      className={`text-[10px] font-bold capitalize ${
                        isActive
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                      }`}
                    >
                      {c.status}
                    </Badge>
                  </td>
                  <td className="py-3.5 pl-4 text-right">
                    <form
                      action={async () => {
                        'use server'
                        await adminToggleAdCampaign(
                          c.id,
                          isActive ? 'paused' : 'active'
                        )
                      }}
                    >
                      <Button
                        type="submit"
                        size="xs"
                        variant="outline"
                        className="rounded-lg text-[11px] font-bold cursor-pointer"
                      >
                        {isActive ? 'Pause' : 'Activate'}
                      </Button>
                    </form>
                  </td>
                </tr>
              )
            })}
            {allCampaigns.length === 0 && (
              <tr>
                <td colSpan={7} className="py-8 text-center text-slate-400">
                  No advertising campaigns created yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}