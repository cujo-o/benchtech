import Link from 'next/link'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { Badge } from '@/components/ui/badge'
import { VerificationReviewCard } from './VerificationReviewCard'
import { ShieldCheck } from 'lucide-react'

export const dynamic = 'force-dynamic'

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  return createAdminClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

export default async function AdminVerificationsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; type?: string }>
}) {
  const params = await searchParams
  const statusFilter = params?.status || 'under_review'
  const typeFilter = params?.type || 'all'

  const adminDb = getAdminClient()
  const { data: verifications } = await adminDb
    .from('seller_verifications')
    .select('*')
    .order('submitted_at', { ascending: false })

  const allItems = verifications || []

  const filteredItems = allItems.filter((item) => {
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter
    const matchesType = typeFilter === 'all' || item.seller_type === typeFilter
    return matchesStatus && matchesType
  })

  const pendingCount = allItems.filter((i) => i.status === 'under_review').length

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white">
              Seller Verification Queue
            </h1>
            <Badge className="bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 text-xs font-bold">
              {pendingCount} Awaiting Review
            </Badge>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Review Individual KYC and Registered Business KYB submissions, inspect documents, and approve sellers.
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {[
            { id: 'under_review', label: `Under Review (${pendingCount})` },
            { id: 'action_required', label: 'Action Required' },
            { id: 'verified', label: 'Verified' },
            { id: 'rejected', label: 'Rejected' },
            { id: 'all', label: `All (${allItems.length})` },
          ].map((tab) => (
            <Link
              key={tab.id}
              href={`/admin/verifications?status=${tab.id}&type=${typeFilter}`}
            >
              <button
                type="button"
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                  statusFilter === tab.id
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {tab.label}
              </button>
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-1.5">
          {[
            { id: 'all', label: 'All Types' },
            { id: 'individual', label: 'Individual' },
            { id: 'business', label: 'Business' },
          ].map((t) => (
            <Link
              key={t.id}
              href={`/admin/verifications?status=${statusFilter}&type=${t.id}`}
            >
              <button
                type="button"
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  typeFilter === t.id
                    ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                    : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500'
                }`}
              >
                {t.label}
              </button>
            </Link>
          ))}
        </div>
      </div>

      {/* Queue Cards */}
      <div className="space-y-4">
        {filteredItems.length > 0 ? (
          filteredItems.map((item) => (
            <VerificationReviewCard key={item.id} item={item} />
          ))
        ) : (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-12 text-center text-xs text-slate-400">
            No seller verification applications in this filter view.
          </div>
        )}
      </div>
    </div>
  )
}