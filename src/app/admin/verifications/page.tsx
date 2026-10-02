import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { setSellerTrustStatus } from '@/app/admin/actions'
import {
  ShieldCheck,
  Building2,
  Phone,
  FileText,
  ArrowLeft,
  ExternalLink,
  MapPin,
  Check,
  X,
  Store,
} from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function AdminVerificationsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login?next=/admin/verifications')

  // Fetch pending and reviewed vendor applications
  const { data: sellers } = await supabase
    .from('profiles')
    .select('*')
    .or('role.eq.seller,seller_plan.eq.pro')
    .order('created_at', { ascending: false })

  const sellerList = sellers || []
  const pendingList = sellerList.filter((s) => s.tech_trust_status === 'pending')
  const verifiedList = sellerList.filter((s) => s.tech_trust_status === 'verified')

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full text-slate-900 dark:text-slate-100">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-2xs">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/overview"
            className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl sm:text-2xl font-black flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              TechTrust Merchant Verification Desk
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Review physical shop locations, CAC documents, and identity proofs for Abuja tech dealers.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge className="bg-amber-50 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-200 text-xs py-1.5 px-3 rounded-xl font-bold">
            {pendingList.length} Pending KYC
          </Badge>
          <Badge className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 text-xs py-1.5 px-3 rounded-xl font-bold">
            {verifiedList.length} Verified Dealers
          </Badge>
        </div>
      </div>

      {/* Verification Queue Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xs space-y-4">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-bold uppercase text-[10px]">
                <th className="pb-3">Dealer / Store</th>
                <th className="pb-3">Abuja Hub / District</th>
                <th className="pb-3">Contact</th>
                <th className="pb-3">Documents</th>
                <th className="pb-3">Status</th>
                <th className="pb-3 text-right">Verification Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {sellerList.length > 0 ? (
                sellerList.map((seller) => {
                  const cleanPhone = seller.phone
                    ? seller.phone.replace(/[^0-9]/g, '').replace(/^0/, '234')
                    : null

                  return (
                    <tr key={seller.id} className="text-slate-700 dark:text-slate-300">
                      {/* Store info */}
                      <td className="py-3.5 font-bold text-slate-900 dark:text-slate-100">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-xs shrink-0">
                            {(seller.business_name || seller.full_name || 'V')[0].toUpperCase()}
                          </div>
                          <div>
                            <span className="block truncate max-w-[160px]">
                              {seller.business_name || seller.full_name || 'Unnamed Vendor'}
                            </span>
                            <span className="text-[10px] text-slate-400 font-normal">
                              Plan: {seller.seller_plan || 'free'}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* District location */}
                      <td className="py-3.5">
                        <span className="flex items-center gap-1 font-medium text-slate-900 dark:text-slate-100">
                          <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                          {seller.district || 'Abuja, NG'}
                        </span>
                        {seller.shop_address && (
                          <span className="text-[10px] text-slate-400 block truncate max-w-[180px]">
                            {seller.shop_address}
                          </span>
                        )}
                      </td>

                      {/* Phone & Chat */}
                      <td className="py-3.5">
                        <span className="block font-mono text-[11px]">{seller.phone || 'No phone'}</span>
                        {cleanPhone && (
                          <a
                            href={`https://wa.me/${cleanPhone}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-emerald-600 hover:underline text-[10px] font-bold inline-flex items-center gap-0.5 mt-0.5"
                          >
                            <Phone className="w-2.5 h-2.5" /> WhatsApp
                          </a>
                        )}
                      </td>

                      {/* Attached Documents */}
                      <td className="py-3.5">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {seller.cac_document_url ? (
                            <a
                              href={seller.cac_document_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-2 py-0.5 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-[10px] font-bold flex items-center gap-1 hover:underline"
                            >
                              <FileText className="w-3 h-3" /> CAC
                            </a>
                          ) : null}

                          {seller.id_card_url ? (
                            <a
                              href={seller.id_card_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-2 py-0.5 rounded-lg bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 text-[10px] font-bold flex items-center gap-1 hover:underline"
                            >
                              <FileText className="w-3 h-3" /> ID
                            </a>
                          ) : null}

                          {!seller.cac_document_url && !seller.id_card_url && (
                            <span className="text-[10px] text-slate-400">None uploaded</span>
                          )}
                        </div>
                      </td>

                      {/* Trust Status Badge */}
                      <td className="py-3.5">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold capitalize ${
                            seller.tech_trust_status === 'verified'
                              ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-300'
                              : seller.tech_trust_status === 'rejected'
                              ? 'bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-300'
                              : 'bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-300'
                          }`}
                        >
                          {seller.tech_trust_status || 'unverified'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {seller.tech_trust_status !== 'verified' && (
                            <form
                              action={async () => {
                                'use server'
                                await setSellerTrustStatus(seller.id, 'verified')
                              }}
                            >
                              <Button
                                size="sm"
                                type="submit"
                                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] h-8 px-2.5 rounded-lg cursor-pointer"
                              >
                                <Check className="w-3 h-3 mr-0.5" /> Approve
                              </Button>
                            </form>
                          )}

                          {seller.tech_trust_status !== 'rejected' && (
                            <form
                              action={async () => {
                                'use server'
                                await setSellerTrustStatus(seller.id, 'rejected')
                              }}
                            >
                              <Button
                                size="sm"
                                variant="ghost"
                                type="submit"
                                className="text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 text-[11px] h-8 px-2 rounded-lg cursor-pointer"
                              >
                                <X className="w-3 h-3 mr-0.5" /> Reject
                              </Button>
                            </form>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    No merchant verification applications submitted yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}