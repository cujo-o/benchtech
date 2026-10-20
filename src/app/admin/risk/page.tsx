import Link from 'next/link'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  adminTriggerSellerReverify,
  adminSetSellerRestriction,
} from '@/app/admin/actions'
import {
  Radar,
  AlertTriangle,
  ShieldAlert,
  RefreshCw,
  Ban,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react'

export const dynamic = 'force-dynamic'

function getAdminDb() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  return createAdminClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

export default async function AdminRiskEnginePage() {
  const adminDb = getAdminDb()

  const [{ data: profiles }, { data: products }, { data: verifications }] =
    await Promise.all([
      adminDb.from('profiles').select('*').order('created_at', { ascending: false }),
      adminDb
        .from('products')
        .select('*, seller:profiles!products_seller_id_fkey(id, business_name, full_name, tech_trust_status)')
        .eq('status', 'published'),
      adminDb.from('seller_verifications').select('*'),
    ])

  const allProfiles = profiles || []
  const allProducts = products || []
  const allVerifications = verifications || []

  // 1. Detect Duplicate Bank Accounts across different accounts
  const bankCountMap = new Map<string, any[]>()
  for (const v of allVerifications) {
    if (v.account_number) {
      const list = bankCountMap.get(v.account_number) || []
      list.push(v)
      bankCountMap.set(v.account_number, list)
    }
  }
  const duplicateBanks = Array.from(bankCountMap.entries()).filter(
    ([, list]) => list.length > 1
  )

  // 2. Detect High-Value Listings (>= ₦800,000) from Unverified Sellers
  const highValueUnverifiedProducts = allProducts.filter(
    (p) =>
      Number(p.price || 0) >= 800000 &&
      p.seller?.tech_trust_status !== 'verified'
  )

  // 3. Detect Off-Platform Contact Attempts in Product Descriptions (phone numbers / WhatsApp keywords)
  const offPlatformRegex = /(\b0[789][01]\d{8}\b|\b234[789][01]\d{8}\b|whatsapp|call me|dm me)/i
  const offPlatformListings = allProducts.filter((p) =>
    offPlatformRegex.test(`${p.title || ''} ${p.description || ''}`)
  )

  // 4. Sellers currently Restricted, Suspended, or Flagged for Re-verification
  const sellersMap = allProfiles.filter(
    (p) => p.role === 'seller' || p.is_seller === true || Boolean(p.business_name)
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xs">
        <div className="flex items-center gap-2">
          <Radar className="w-6 h-6 text-red-600 dark:text-red-400" />
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            Risk Engine &amp; Anti-Fraud Controls
          </h1>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Automated detection for duplicate bank accounts, off-platform contact attempts, high-value unverified listings, and risk-triggered seller re-verification.
        </p>
      </div>

      {/* Risk Signal Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs space-y-1">
          <span className="text-[11px] font-bold uppercase text-slate-400 block">
            Duplicate Bank Accounts
          </span>
          <p className="text-2xl font-black text-red-600 dark:text-red-400">
            {duplicateBanks.length} Clusters
          </p>
          <p className="text-[11px] text-slate-400">
            Multiple seller profiles sharing the same NUBAN
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs space-y-1">
          <span className="text-[11px] font-bold uppercase text-slate-400 block">
            High-Value Unverified Listings
          </span>
          <p className="text-2xl font-black text-amber-600 dark:text-amber-400">
            {highValueUnverifiedProducts.length} Items
          </p>
          <p className="text-[11px] text-slate-400">
            Listings ≥ ₦800,000 by unverified accounts
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs space-y-1">
          <span className="text-[11px] font-bold uppercase text-slate-400 block">
            Off-Platform Contact Signals
          </span>
          <p className="text-2xl font-black text-blue-600 dark:text-blue-400">
            {offPlatformListings.length} Listings
          </p>
          <p className="text-[11px] text-slate-400">
            Phone numbers or external links inside descriptions
          </p>
        </div>
      </div>

      {/* Flagged Listings (Off-Platform & High-Value Unverified) */}
      {(offPlatformListings.length > 0 || highValueUnverifiedProducts.length > 0) && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
          <h2 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            Flagged Product Listings Requiring Review
          </h2>

          <div className="space-y-2.5">
            {[...offPlatformListings, ...highValueUnverifiedProducts]
              .slice(0, 10)
              .map((item, idx) => {
                const isOffPlatform = offPlatformRegex.test(
                  `${item.title || ''} ${item.description || ''}`
                )
                return (
                  <div
                    key={`${item.id}-${idx}`}
                    className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/products/${item.id}`}
                          target="_blank"
                          className="font-bold text-slate-900 dark:text-white hover:text-blue-600 flex items-center gap-1"
                        >
                          <span>{item.title}</span>
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                        <Badge
                          className={
                            isOffPlatform
                              ? 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300 text-[10px]'
                              : 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300 text-[10px]'
                          }
                        >
                          {isOffPlatform
                            ? 'Off-Platform Phone/Link Detected'
                            : 'High-Value + Unverified Seller'}
                        </Badge>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Price: ₦{Number(item.price || 0).toLocaleString()} • Seller:{' '}
                        {item.seller?.business_name || item.seller?.full_name || 'Vendor'}
                      </p>
                    </div>

                    <Link href={`/admin/listings?q=${encodeURIComponent(item.title)}`}>
                      <Button size="xs" variant="outline" className="rounded-lg text-[11px] font-bold">
                        Moderate Listing
                      </Button>
                    </Link>
                  </div>
                )
              })}
          </div>
        </div>
      )}

      {/* Seller Risk State & Re-Verification Controls */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
        <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
          <h2 className="text-sm font-black text-slate-900 dark:text-white">
            Seller Risk Controls &amp; Re-Verification Triggers
          </h2>
          <p className="text-xs text-slate-400">
            Trigger exceptional risk-based re-verification or restrict/suspend seller accounts per policy.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs whitespace-nowrap">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-bold uppercase text-[10px]">
                <th className="pb-3 pr-4">Seller / Store</th>
                <th className="pb-3 px-4">Type</th>
                <th className="pb-3 px-4">Verification State</th>
                <th className="pb-3 px-4">Bank Account</th>
                <th className="pb-3 pl-4 text-right">Risk Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {sellersMap.map((s) => {
                const state = s.verification_state || s.tech_trust_status || 'draft'
                return (
                  <tr key={s.id} className="text-slate-700 dark:text-slate-300">
                    <td className="py-3.5 pr-4">
                      <p className="font-bold text-slate-900 dark:text-white">
                        {s.business_name || s.full_name || 'Seller'}
                      </p>
                      <p className="text-[11px] text-slate-400">{s.email || s.phone || '—'}</p>
                    </td>
                    <td className="py-3.5 px-4 capitalize">
                      {s.seller_type || 'individual'}
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge
                        className={`text-[10px] font-bold capitalize ${
                          state === 'verified'
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                            : state === 'suspended'
                            ? 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300'
                            : state === 'reverify' || state === 'restricted'
                            ? 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                            : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                        }`}
                      >
                        {state.replace(/_/g, ' ')}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[11px]">
                      {s.bank_name ? `${s.bank_name} • ${s.account_number}` : 'Not Linked'}
                    </td>
                    <td className="py-3.5 pl-4 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <form
                          action={async () => {
                            'use server'
                            await adminTriggerSellerReverify(
                              s.id,
                              'Risk review: Please re-confirm your identity and bank details.'
                            )
                          }}
                        >
                          <Button
                            type="submit"
                            size="xs"
                            variant="outline"
                            className="rounded-lg text-[11px] font-bold cursor-pointer"
                          >
                            <RefreshCw className="w-3 h-3 mr-1 text-blue-600" />
                            Trigger Re-verify
                          </Button>
                        </form>

                        {state !== 'suspended' ? (
                          <form
                            action={async () => {
                              'use server'
                              await adminSetSellerRestriction(s.id, 'suspended')
                            }}
                          >
                            <Button
                              type="submit"
                              size="xs"
                              variant="outline"
                              className="rounded-lg text-[11px] font-bold border-red-200 text-red-600 cursor-pointer"
                            >
                              <Ban className="w-3 h-3 mr-1" />
                              Suspend
                            </Button>
                          </form>
                        ) : (
                          <form
                            action={async () => {
                              'use server'
                              await adminSetSellerRestriction(s.id, 'verified')
                            }}
                          >
                            <Button
                              type="submit"
                              size="xs"
                              variant="outline"
                              className="rounded-lg text-[11px] font-bold border-emerald-200 text-emerald-600 cursor-pointer"
                            >
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                              Restore
                            </Button>
                          </form>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}