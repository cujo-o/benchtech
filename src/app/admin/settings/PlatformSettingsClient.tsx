'use client'

import { useState } from 'react'
import { adminSavePlatformSettings } from '@/app/admin/actions'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Settings,
  ShieldCheck,
  Percent,
  Mail,
  CheckCircle2,
  Loader2,
  Truck,
} from 'lucide-react'

interface PlatformSettingsProps {
  initialSettings: {
    standardCommission: number
    proCommission: number
    adSaleFee: number
    inspectionDays: number
    highValueThreshold: number
    minWithdrawalAmount: number
    abujaDispatchFee: number
    lastUpdated?: string | null
  }
}

export function PlatformSettingsClient({
  initialSettings,
}: PlatformSettingsProps) {
  const [saving, setSaving] = useState(false)
  const [savedBanner, setSavedBanner] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSaving(true)
    setSavedBanner(false)

    const formData = new FormData(e.currentTarget)
    await adminSavePlatformSettings(formData)

    setSaving(false)
    setSavedBanner(true)
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Settings className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white">
              Platform Economics &amp; Trust Policy Settings
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Configure marketplace commission rates, buyer inspection windows, high-value thresholds, and dispatch fees.
          </p>
        </div>

        {initialSettings.lastUpdated && (
          <Badge variant="outline" className="text-[10px] font-bold shrink-0">
            Updated{' '}
            {new Date(initialSettings.lastUpdated).toLocaleDateString('en-NG')}
          </Badge>
        )}
      </div>

      {savedBanner && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs font-bold text-emerald-800 dark:text-emerald-200 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>
            Platform economics and trust policy settings saved and logged to the audit trail.
          </span>
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-7 shadow-xs space-y-6"
      >
        {/* Commission & Fee Structure */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2.5">
            <Percent className="w-4 h-4 text-blue-600" />
            <h2 className="text-sm font-black text-slate-900 dark:text-white">
              Commission &amp; Fee Structure
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                Standard Seller Commission (%)
              </label>
              <input
                type="number"
                step="0.5"
                name="standardCommission"
                defaultValue={initialSettings.standardCommission}
                className="w-full h-10 px-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                Pro Seller Commission (%)
              </label>
              <input
                type="number"
                step="0.5"
                name="proCommission"
                defaultValue={initialSettings.proCommission}
                className="w-full h-10 px-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                Pay-When-You-Sell Ad Fee (%)
              </label>
              <input
                type="number"
                step="0.5"
                name="adSaleFee"
                defaultValue={initialSettings.adSaleFee}
                className="w-full h-10 px-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold"
              />
            </div>
          </div>
        </div>

        {/* Buyer Protection & Risk Thresholds */}
        <div className="space-y-4 pt-2">
          <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <h2 className="text-sm font-black text-slate-900 dark:text-white">
              Inspection Hold, Payouts &amp; Risk Thresholds
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                Post-Delivery Buyer Inspection Window (Days)
              </label>
              <input
                type="number"
                name="inspectionDays"
                defaultValue={initialSettings.inspectionDays}
                className="w-full h-10 px-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                High-Value Listing Risk Threshold (₦)
              </label>
              <input
                type="number"
                step="50000"
                name="highValueThreshold"
                defaultValue={initialSettings.highValueThreshold}
                className="w-full h-10 px-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                Minimum Seller Bank Withdrawal (₦)
              </label>
              <input
                type="number"
                step="500"
                name="minWithdrawalAmount"
                defaultValue={initialSettings.minWithdrawalAmount}
                className="w-full h-10 px-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                Standard Abuja Courier Dispatch Fee (₦)
              </label>
              <div className="relative">
                <Truck className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="number"
                  step="500"
                  name="abujaDispatchFee"
                  defaultValue={initialSettings.abujaDispatchFee}
                  className="w-full h-10 pl-9 pr-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold"
                />
              </div>
            </div>
          </div>
        </div>

        {/* System Transactional Email Info */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-800 flex items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-3">
            <Mail className="w-5 h-5 text-blue-600 shrink-0" />
            <div>
              <p className="font-bold text-slate-900 dark:text-white">
                System Recovery &amp; Verification Sender
              </p>
              <p className="text-[11px] text-slate-500">
                admin@shopbenchtech.com (Configured via Supabase Custom SMTP)
              </p>
            </div>
          </div>
          <Badge className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 text-[10px] font-bold">
            Active
          </Badge>
        </div>

        <div className="flex justify-end pt-2">
          <Button
            type="submit"
            disabled={saving}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl h-10 px-6 gap-2 cursor-pointer"
          >
            {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            <span>Save Configuration</span>
          </Button>
        </div>
      </form>
    </div>
  )
}