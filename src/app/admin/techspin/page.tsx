import { createClient as createAdminClient } from '@supabase/supabase-js'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  adminCreateTechSpinPrize,
  adminDeleteTechSpinPrize,
} from '@/app/admin/actions'
import { Disc, Plus, Trash2 } from 'lucide-react'

export const dynamic = 'force-dynamic'

function getAdminDb() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  return createAdminClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

const DEFAULT_SEGMENTS = [
  { id: 'def-1', label: 'Free Abuja Delivery', code: 'ABUJAFREE', color: '#2563EB', discount_amount: 2500 },
  { id: 'def-2', label: '₦5,000 Off Laptop', code: 'TECH5K', color: '#7C3AED', discount_amount: 5000 },
  { id: 'def-3', label: '₦2,000 Gadget Voucher', code: 'SPIN2K', color: '#059669', discount_amount: 2000 },
  { id: 'def-4', label: 'Try Again Tomorrow', code: null, color: '#475569', discount_amount: 0 },
]

export default async function AdminTechSpinPage() {
  const adminDb = getAdminDb()

  let prizes: any[] = []
  try {
    const { data } = await adminDb
      .from('techspin_prizes')
      .select('*')
      .order('created_at', { ascending: false })
    if (data && data.length > 0) prizes = data
  } catch {}

  const displayPrizes = prizes.length > 0 ? prizes : DEFAULT_SEGMENTS

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xs">
        <div className="flex items-center gap-2">
          <Disc className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            TechSpin Wheel &amp; Voucher Configuration
          </h1>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Configure daily reward wheel segments, checkout promo codes, and delivery fee waivers.
        </p>
      </div>

      {/* Add New Segment Form */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
        <h2 className="text-sm font-black text-slate-900 dark:text-white">
          Add Wheel Reward Segment
        </h2>

        <form
          action={adminCreateTechSpinPrize}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3"
        >
          <input
            type="text"
            name="label"
            required
            placeholder="Label (e.g. ₦3,000 Off)"
            className="h-10 px-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium"
          />
          <input
            type="text"
            name="code"
            placeholder="Promo Code (e.g. SPIN3K)"
            className="h-10 px-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono uppercase"
          />
          <input
            type="number"
            name="discountAmount"
            placeholder="Value in ₦ (e.g. 3000)"
            className="h-10 px-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium"
          />
          <select
            name="color"
            className="h-10 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium"
          >
            <option value="#2563EB">Blue (#2563EB)</option>
            <option value="#059669">Emerald (#059669)</option>
            <option value="#7C3AED">Purple (#7C3AED)</option>
            <option value="#D97706">Amber (#D97706)</option>
            <option value="#475569">Slate (#475569)</option>
          </select>

          <Button
            type="submit"
            className="h-10 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Add Segment
          </Button>
        </form>
      </div>

      {/* Active Segments */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
        <h2 className="text-sm font-black text-slate-900 dark:text-white">
          Active Wheel Segments ({displayPrizes.length})
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {displayPrizes.map((prize) => (
            <div
              key={prize.id}
              className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex flex-col justify-between space-y-3 text-xs"
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span
                    className="w-4 h-4 rounded-full border border-white/20"
                    style={{ backgroundColor: prize.color || '#2563EB' }}
                  />
                  {prize.code ? (
                    <Badge className="font-mono text-[10px] bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                      {prize.code}
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-[10px]">
                      No Prize
                    </Badge>
                  )}
                </div>
                <p className="font-black text-sm text-slate-900 dark:text-white pt-1">
                  {prize.label}
                </p>
                <p className="text-[11px] text-slate-400">
                  Discount Value: ₦{Number(prize.discount_amount || 0).toLocaleString()}
                </p>
              </div>

              {!String(prize.id).startsWith('def-') && (
                <form
                  action={async () => {
                    'use server'
                    await adminDeleteTechSpinPrize(prize.id)
                  }}
                >
                  <Button
                    type="submit"
                    size="xs"
                    variant="ghost"
                    className="w-full text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg font-bold cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5 mr-1" /> Remove
                  </Button>
                </form>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}