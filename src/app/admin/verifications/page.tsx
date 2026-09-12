import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { setSellerTrustStatus } from '../actions'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ShieldCheck, Check, X, FileText, ExternalLink, UserCheck, AlertCircle } from 'lucide-react'

export default async function AdminVerificationsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login?next=/admin/verifications')

  // Fetch pending submissions
  const { data: pendingVendors } = await supabase
    .from('profiles')
    .select('*')
    .eq('tech_trust_status', 'pending')
    .order('updated_at', { ascending: false })

  // Generate signed view URLs for private bucket files
  const vendorsWithDocUrls = await Promise.all(
    (pendingVendors || []).map(async (vendor) => {
      let idSignedUrl = null
      let cacSignedUrl = null

      if (vendor.id_document_url) {
        const { data } = await supabase.storage
          .from('vendor-documents')
          .createSignedUrl(vendor.id_document_url, 3600) // 1 hr token
        idSignedUrl = data?.signedUrl || null
      }

      if (vendor.cac_document_url) {
        const { data } = await supabase.storage
          .from('vendor-documents')
          .createSignedUrl(vendor.cac_document_url, 3600)
        cacSignedUrl = data?.signedUrl || null
      }

      return {
        ...vendor,
        idSignedUrl,
        cacSignedUrl,
      }
    })
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">TechTrust Verification Queue</h1>
        <p className="text-xs text-slate-500 mt-1">
          Review government documents and CAC business filings for Abuja vendors.
        </p>
      </div>

      {vendorsWithDocUrls.length > 0 ? (
        <div className="space-y-4">
          {vendorsWithDocUrls.map((vendor) => (
            <Card key={vendor.id} className="border border-slate-200/80 shadow-sm bg-white rounded-2xl overflow-hidden">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 pb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-base text-slate-900">{vendor.business_name || vendor.full_name}</h3>
                      <Badge className="bg-amber-50 text-amber-700 border-amber-200 text-[10px]">
                        Pending Review
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Phone: <span className="font-semibold text-slate-800">{vendor.phone || 'N/A'}</span> • City: <span className="font-semibold text-slate-800">{vendor.city || 'Abuja'}</span>
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <form action={setSellerTrustStatus.bind(null, vendor.id, 'rejected')}>
                      <Button size="sm" variant="outline" className="text-xs h-9 border-rose-200 text-rose-600 hover:bg-rose-50 font-bold gap-1">
                        <X className="w-3.5 h-3.5" /> Reject
                      </Button>
                    </form>

                    <form action={setSellerTrustStatus.bind(null, vendor.id, 'verified')}>
                      <Button size="sm" className="text-xs h-9 bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-1.5 shadow-sm">
                        <Check className="w-3.5 h-3.5" /> Approve & Verify
                      </Button>
                    </form>
                  </div>
                </div>

                {/* Submitted Files Preview Tray */}
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Government ID */}
                  <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-900 capitalize">
                          {vendor.id_type ? `${vendor.id_type.replace('_', ' ')} Document` : 'Government ID'}
                        </p>
                        <p className="text-[10px] text-slate-400">Owner Identity Proof</p>
                      </div>
                    </div>

                    {vendor.idSignedUrl ? (
                      <a href={vendor.idSignedUrl} target="_blank" rel="noopener noreferrer">
                        <Button size="sm" variant="outline" className="h-8 text-xs font-semibold gap-1 bg-white">
                          View File <ExternalLink className="w-3 h-3" />
                        </Button>
                      </a>
                    ) : (
                      <span className="text-[10px] text-slate-400">File unavailable</span>
                    )}
                  </div>

                  {/* CAC Certificate */}
                  <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center">
                        <ShieldCheck className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-900">CAC Registration</p>
                        <p className="text-[10px] text-slate-400">Corporate Affairs Commission</p>
                      </div>
                    </div>

                    {vendor.cacSignedUrl ? (
                      <a href={vendor.cacSignedUrl} target="_blank" rel="noopener noreferrer">
                        <Button size="sm" variant="outline" className="h-8 text-xs font-semibold gap-1 bg-white">
                          View File <ExternalLink className="w-3 h-3" />
                        </Button>
                      </a>
                    ) : (
                      <span className="text-[10px] text-slate-400 italic">Not provided</span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200/80">
          <UserCheck className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <p className="text-slate-800 font-bold text-sm">All caught up!</p>
          <p className="text-xs text-slate-400 mt-0.5">There are currently no seller verification requests awaiting review.</p>
        </div>
      )}
    </div>
  )
}