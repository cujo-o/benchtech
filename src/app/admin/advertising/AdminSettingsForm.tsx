'use client'

import { useState } from 'react'
import { updatePlatformSettings } from '@/app/actions/adminAds'
import { Button } from '@/components/ui/button'
import { Loader2, Save } from 'lucide-react'

export function AdminSettingsForm({ initialSettings }: { initialSettings: any }) {
  const [loading, setLoading] = useState(false)
  const [marketplaceCommission, setMarketplaceCommission] = useState(
    initialSettings?.marketplace_commission_rate || 7
  )
  const [promoteRate, setPromoteRate] = useState(
    initialSettings?.promote_product_rate || 2.5
  )
  const [attributionDays, setAttributionDays] = useState(
    initialSettings?.attribution_window_days || 7
  )
  const [cpcMin, setCpcMin] = useState(initialSettings?.cpc_min || 50)
  const [cpcSuggested, setCpcSuggested] = useState(initialSettings?.cpc_suggested || 100)
  const [cpcMax, setCpcMax] = useState(initialSettings?.cpc_max || 500)
  const [minDailyBudget, setMinDailyBudget] = useState(
    initialSettings?.min_daily_budget || 2000
  )

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    const res = await updatePlatformSettings({
      marketplaceCommission: Number(marketplaceCommission),
      promoteRate: Number(promoteRate),
      attributionDays: Number(attributionDays),
      cpcMin: Number(cpcMin),
      cpcSuggested: Number(cpcSuggested),
      cpcMax: Number(cpcMax),
      minDailyBudget: Number(minDailyBudget),
    })

    setLoading(false)
    if (res.success) {
      alert('Platform commercial settings saved successfully.')
    } else {
      alert(res.error || 'Failed to save settings')
    }
  }

  return (
    <form
      onSubmit={handleSave}
      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 space-y-4 shadow-2xs"
    >
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
            Global Commercial Controls
          </h3>
          <p className="text-[11px] text-slate-400">
            Changes take effect immediately across all active auctions and checkouts.
          </p>
        </div>
        <Button
          type="submit"
          disabled={loading}
          size="sm"
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl gap-1.5 shadow-xs"
        >
          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
          Save Configuration
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-1">
        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
            Marketplace Commission (%)
          </label>
          <input
            type="number"
            step="0.1"
            value={marketplaceCommission}
            onChange={(e) => setMarketplaceCommission(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold"
          />
          <p className="text-[10px] text-slate-400">Current Standard: 7%</p>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
            Promote Product Fee (%)
          </label>
          <input
            type="number"
            step="0.1"
            value={promoteRate}
            onChange={(e) => setPromoteRate(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold"
          />
          <p className="text-[10px] text-slate-400">Current Standard: 2.5%</p>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
            Attribution Window (Days)
          </label>
          <input
            type="number"
            value={attributionDays}
            onChange={(e) => setAttributionDays(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold"
          />
          <p className="text-[10px] text-slate-400">Default: 7 Days</p>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
            Min Daily Budget (₦)
          </label>
          <input
            type="number"
            step="500"
            value={minDailyBudget}
            onChange={(e) => setMinDailyBudget(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold"
          />
          <p className="text-[10px] text-slate-400">Default: ₦2,000</p>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
            Minimum CPC (₦)
          </label>
          <input
            type="number"
            value={cpcMin}
            onChange={(e) => setCpcMin(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold"
          />
          <p className="text-[10px] text-slate-400">Floor: ₦50</p>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
            Suggested CPC (₦)
          </label>
          <input
            type="number"
            value={cpcSuggested}
            onChange={(e) => setCpcSuggested(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold"
          />
          <p className="text-[10px] text-slate-400">Default: ₦100</p>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
            Maximum CPC (₦)
          </label>
          <input
            type="number"
            value={cpcMax}
            onChange={(e) => setCpcMax(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold"
          />
          <p className="text-[10px] text-slate-400">Ceiling: ₦500</p>
        </div>
      </div>
    </form>
  )
}