import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { MessageSquare, Calendar } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function SellerEnquiriesPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login?next=/seller/enquiries')

  const { data: enquiries } = await supabase
    .from('enquiries')
    .select('*, product:products(id, title, price)')
    .eq('seller_id', user.id)
    .order('created_at', { ascending: false })

  const allEnquiries = enquiries || []

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xs">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            Buyer Product Enquiries
          </h1>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Questions submitted by shoppers regarding your active listings.
        </p>
      </div>

      <div className="space-y-3">
        {allEnquiries.length > 0 ? (
          allEnquiries.map((enq: any) => (
            <div
              key={enq.id}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs space-y-3 text-xs"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-2.5">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900 dark:text-white">
                    {enq.buyer_name || 'Prospective Buyer'}
                  </span>
                  <Badge variant="outline" className="text-[10px] capitalize">
                    {enq.status || 'new'}
                  </Badge>
                </div>
                <span className="text-[11px] text-slate-400 flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {new Date(enq.created_at).toLocaleDateString('en-NG')}
                </span>
              </div>

              {enq.product && (
                <p className="text-[11px] font-bold text-blue-600 dark:text-blue-400">
                  Item: {enq.product.title} (₦{Number(enq.product.price || 0).toLocaleString()})
                </p>
              )}

              <p className="text-slate-700 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800">
                {enq.message}
              </p>
            </div>
          ))
        ) : (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-12 text-center text-xs text-slate-400">
            No buyer enquiries received yet.
          </div>
        )}
      </div>
    </div>
  )
}