import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { setSellerTrustStatus } from '../actions'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  ShieldCheck,
  Check,
  X,
  FileText,
  ExternalLink,
  UserCheck,
  MapPin,
  Phone,
  MessageCircle,
  Store,
  AlertCircle,
} from 'lucide-react'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'TechTrust Verifications | BenchTech Admin',
}

export default async function AdminVerificationsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login?next=/admin/verifications')

  // 1. Fetch pending submissions
  const { data: pendingVendors } = await supabase
    .from('profiles')
    .select('*')
    .eq('tech_trust_status', 'pending')
    .order('updated_at', { ascending: false })

  // 2. Fetch recently verified vendors for historical context
  const { data: verifiedVendors } = await supabase
    .from('profiles')
    .select('id, business_name, full_name, phone, district, updated_at')
    .eq('tech_trust_status', 'verified')
    .order('updated_at', { ascending: false })
    .limit(4)

  // Generate signed view URLs for private bucket files
  const vendorsWithDocUrls = await Promise.all(
    (pendingVendors || []).map(async (vendor) => {
      let idSignedUrl = null
      let cacSignedUrl = null

      if (vendor.id_document_url) {
        try {
          const { data } = await supabase.storage
            .from('vendor-documents')
            .createSignedUrl(vendor.id_document_url, 3600)
          idSignedUrl = data?.signedUrl || null
        } catch {}
      }

      if (vendor.cac_document_url) {
        try {
          const { data } = await supabase.storage
            .from('vendor-documents')
            .createSignedUrl(vendor.cac_document_url, 3600)
          cacSignedUrl = data?.signedUrl || null
        } catch {}
      }

      return {
        ...vendor,
        idSignedUrl,
        cacSignedUrl,
      }
    })
  )

  return (
    <div className="space-y-6 sm:space-y-8 max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
              TechTrust Verification Queue
            </h1>
            <Badge className="bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border border-amber-200 text-[10px] font-black uppercase">
              {vendorsWithDocUrls.length} Pending
            </Badge>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Review government identification, plaza booth numbers, and CAC business filings for Abuja electronics vendors.
          </p>
        </div>

        <Link href="/admin/overview">
          <Button variant="outline" size="sm" className="text-xs font-bold rounded-xl h-10 border-slate-200">
            &larr; Back to Control Centre
          </Button>
        </Link>
      </div>

      {/* Main Review Section */}
      {vendorsWithDocUrls.length > 0 ? (
        <div className="space-y-4">
          {vendorsWithDocUrls.map((vendor) => {
            const cleanPhone = vendor.phone
              ? vendor.phone.replace(/[^0-9]/g, '').replace(/^0/, '234')
              : null

            return (
              <Card
                key={vendor.id}
                className="border border-slate-200/90 dark:border-slate-800 shadow-2xs bg-white dark:bg-slate-900 rounded-3xl overflow-hidden"
              >
                <CardContent className="p-5 sm:p-6 space-y-5">
                  {/* Vendor Identity Row */}
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 font-black text-sm flex items-center justify-center">
                          {(vendor.business_name || vendor.full_name || 'V')[0]?.toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-black text-sm sm:text-base text-slate-900 dark:text-slate-100">
                              {vendor.business_name || vendor.full_name}
                            </h3>
                            <Badge className="bg-amber-50 text-amber-700 border-amber-200 text-[9px] font-bold">
                              Awaiting Approval
                            </Badge>
                          </div>
                          <p className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" /> {vendor.district || 'Banex Plaza, Wuse 2'}
                            </span>
                            <span>•</span>
                            <span>Applied: {new Date(vendor.updated_at || Date.now()).toLocaleDateString('en-NG')}</span>
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Actions & WhatsApp Contact */}
                    <div className="flex items-center gap-2 w-full md:w-auto">
                      {cleanPhone && (
                        <a
                          href={`https://wa.me/${cleanPhone}?text=Hello%20${encodeURIComponent(vendor.business_name || 'Vendor')},%20this%20is%20BenchTech%20Admin%20regarding%20your%20verification%20documents.`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 md:flex-none"
                        >
                          <Button
                            size="sm"
                            variant="outline"
                            className="w-full md:w-auto text-xs h-9 border-emerald-200 text-emerald-700 hover:bg-emerald-50 font-bold gap-1 rounded-xl"
                          >
                            <MessageCircle className="w-3.5 h-3.5" /> Chat Vendor
                          </Button>
                        </a>
                      )}

                      <form action={setSellerTrustStatus.bind(null, vendor.id, 'rejected')} className="flex-1 md:flex-none">
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full md:w-auto text-xs h-9 border-rose-200 text-rose-600 hover:bg-rose-50 font-bold gap-1 rounded-xl"
                        >
                          <X className="w-3.5 h-3.5" /> Reject
                        </Button>
                      </form>

                      <form action={setSellerTrustStatus.bind(null, vendor.id, 'verified')} className="flex-1 md:flex-none">
                        <Button
                          size="sm"
                          className="w-full md:w-auto text-xs h-9 bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-1.5 shadow-xs rounded-xl"
                        >
                          <Check className="w-3.5 h-3.5" /> Approve &amp; Verify
                        </Button>
                      </form>
                    </div>
                  </div>

                  {/* Documents Tray */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {/* Government ID Preview */}
                    <div className="p-3.5 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-600 flex items-center justify-center">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-900 dark:text-slate-100 capitalize">
                            {vendor.id_type ? `${vendor.id_type.replace('_', ' ')}` : 'Government ID Proof'}
                          </p>
                          <p className="text-[10px] text-slate-400">National ID / Drivers License / Voter Card</p>
                        </div>
                      </div>

                      {vendor.idSignedUrl ? (
                        <a href={vendor.idSignedUrl} target="_blank" rel="noopener noreferrer">
                          <Button size="sm" variant="outline" className="h-8 text-xs font-bold gap-1 bg-white dark:bg-slate-900 rounded-xl">
                            Inspect ID <ExternalLink className="w-3 h-3" />
                          </Button>
                        </a>
                      ) : (
                        <span className="text-[11px] font-bold text-slate-400 italic">No file attached</span>
                      )}
                    </div>

                    {/* CAC Business Certificate */}
                    <div className="p-3.5 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-purple-100 dark:bg-purple-950 text-purple-600 flex items-center justify-center">
                          <ShieldCheck className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-900 dark:text-slate-100">
                            CAC Registration Proof
                          </p>
                          <p className="text-[10px] text-slate-400">BN or RC Corporate Affairs Filing</p>
                        </div>
                      </div>

                      {vendor.cacSignedUrl ? (
                        <a href={vendor.cacSignedUrl} target="_blank" rel="noopener noreferrer">
                          <Button size="sm" variant="outline" className="h-8 text-xs font-bold gap-1 bg-white dark:bg-slate-900 rounded-xl">
                            Inspect CAC <ExternalLink className="w-3 h-3" />
                          </Button>
                        </a>
                      ) : (
                        <span className="text-[11px] font-bold text-slate-400 italic">Optional / Not provided</span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      ) : (
        <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 space-y-3 shadow-2xs">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center mx-auto">
            <UserCheck className="w-6 h-6" />
          </div>
          <h3 className="font-black text-sm text-slate-900 dark:text-slate-100">Verification Queue Clear</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            There are currently no Abuja electronics vendors awaiting manual document inspection.
          </p>
        </div>
      )}

      {/* Audit Trail: Recently Verified Vendors */}
      {verifiedVendors && verifiedVendors.length > 0 && (
        <Card className="rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-6 shadow-2xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Recently Verified Merchants
            </h4>
            <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> Badge Active
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {verifiedVendors.map((v) => (
              <div key={v.id} className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-1">
                <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">{v.business_name || v.full_name}</p>
                <p className="text-[10px] text-slate-400">{v.district || 'Abuja'}</p>
                <p className="text-[10px] text-slate-400">{v.phone || 'No phone'}</p>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}