import { createClient as createAdminClient } from '@supabase/supabase-js'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { adminUpdateBuyingRequestStatus } from '@/app/admin/actions'
import { MessageSquarePlus, CheckCircle2, XCircle } from 'lucide-react'

export const dynamic = 'force-dynamic'

function getAdminDb() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  return createAdminClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

export default async function AdminBuyerRequestsPage() {
  const adminDb = getAdminDb()

  const { data: buyingRequests } = await adminDb
    .from('buying_requests')
    .select(`
      *,
      product:products(id, title, price),
      buyer:profiles!buying_requests_buyer_id_fkey(full_name, phone),
      seller:profiles!buying_requests_seller_id_fkey(business_name, full_name, phone)
    `)
    .order('created_at', { ascending: false })

  const allRequests = buyingRequests || []

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xs">
        <div className="flex items-center gap-2">
          <MessageSquarePlus className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            Buyer Sourcing &amp; Purchase Requests
          </h1>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Monitor buyer purchase expressions, pickup coordination in Abuja, and custom sourcing requests.
        </p>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xs overflow-x-auto">
        <table className="w-full text-left text-xs whitespace-nowrap">
          <thead>
            <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-bold uppercase text-[10px]">
              <th className="pb-3 pr-4">Item</th>
              <th className="pb-3 px-4">Buyer</th>
              <th className="pb-3 px-4">Seller</th>
              <th className="pb-3 px-4">Agreed Price</th>
              <th className="pb-3 px-4">Area &amp; Method</th>
              <th className="pb-3 px-4">Status</th>
              <th className="pb-3 pl-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {allRequests.length > 0 ? (
              allRequests.map((req: any) => (
                <tr key={req.id} className="text-slate-700 dark:text-slate-300">
                  <td className="py-3.5 pr-4 font-bold text-slate-900 dark:text-white">
                    {req.product?.title || 'Requested Hardware'}
                  </td>
                  <td className="py-3.5 px-4">
                    <p className="font-semibold">{req.buyer?.full_name || 'Buyer'}</p>
                    <p className="text-[11px] text-slate-400">{req.buyer?.phone || '—'}</p>
                  </td>
                  <td className="py-3.5 px-4">
                    {req.seller?.business_name || req.seller?.full_name || 'Vendor'}
                  </td>
                  <td className="py-3.5 px-4 font-black text-blue-600 dark:text-blue-400">
                    ₦{Number(req.agreed_price || req.product?.price || 0).toLocaleString()}
                  </td>
                  <td className="py-3.5 px-4">
                    <p>{req.delivery_area || 'Abuja'}</p>
                    <p className="text-[10px] uppercase text-slate-400">{req.delivery_method}</p>
                  </td>
                  <td className="py-3.5 px-4">
                    <Badge variant="outline" className="text-[10px] font-bold capitalize">
                      {req.status?.replace(/_/g, ' ') || 'new request'}
                    </Badge>
                  </td>
                  <td className="py-3.5 pl-4 text-right">
                    <div className="inline-flex items-center gap-1.5">
                      <form
                        action={async () => {
                          'use server'
                          await adminUpdateBuyingRequestStatus(req.id, 'completed')
                        }}
                      >
                        <Button
                          type="submit"
                          size="xs"
                          variant="outline"
                          className="rounded-lg text-[11px] font-bold text-emerald-600 cursor-pointer"
                        >
                          <CheckCircle2 className="w-3 h-3 mr-1" /> Complete
                        </Button>
                      </form>
                      <form
                        action={async () => {
                          'use server'
                          await adminUpdateBuyingRequestStatus(req.id, 'cancelled')
                        }}
                      >
                        <Button
                          type="submit"
                          size="xs"
                          variant="ghost"
                          className="rounded-lg text-[11px] font-bold text-red-600 cursor-pointer"
                        >
                          <XCircle className="w-3 h-3" />
                        </Button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="py-8 text-center text-slate-400">
                  No direct buyer requests submitted yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}