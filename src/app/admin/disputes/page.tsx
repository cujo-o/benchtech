import { createClient as createAdminClient } from '@supabase/supabase-js'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { adminResolveDispute } from '@/app/admin/actions'
import { ShieldAlert, CheckCircle2, RotateCcw } from 'lucide-react'

export const dynamic = 'force-dynamic'

function getAdminDb() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  return createAdminClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

export default async function AdminDisputesPage() {
  const adminDb = getAdminDb()

  const { data: disputes } = await adminDb
    .from('disputes')
    .select(`
      *,
      order:orders(*, product:products(title)),
      buyer:profiles!disputes_buyer_id_fkey(full_name, phone),
      seller:profiles!disputes_seller_id_fkey(business_name, full_name, phone)
    `)
    .order('created_at', { ascending: false })

  const allDisputes = disputes || []

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xs">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-6 h-6 text-red-600 dark:text-red-400" />
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            Disputes &amp; Protection Cases
          </h1>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Arbitrate buyer inspection claims and decide whether to release settlement to the seller or refund the buyer.
        </p>
      </div>

      <div className="space-y-4">
        {allDisputes.length > 0 ? (
          allDisputes.map((d) => (
            <div
              key={d.id}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4"
            >
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-black text-xs text-slate-900 dark:text-white">
                    Case #{d.case_number || d.id.slice(0, 8)}
                  </span>
                  <span className="text-xs text-slate-400">
                    • {new Date(d.created_at).toLocaleDateString('en-NG')}
                  </span>
                </div>
                <Badge
                  className={`text-[10px] font-bold uppercase ${
                    d.status === 'resolved'
                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                      : 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300'
                  }`}
                >
                  {d.status || 'open'}
                </Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">
                    Order &amp; Product
                  </span>
                  <p className="font-bold text-slate-900 dark:text-white mt-0.5">
                    {d.order?.product?.title || 'Disputed Item'}
                  </p>
                  <p className="text-slate-500">
                    Amount: ₦{Number(d.order?.total_amount || d.order?.amount || 0).toLocaleString()}
                  </p>
                </div>

                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">
                    Parties
                  </span>
                  <p className="text-slate-700 dark:text-slate-300 mt-0.5">
                    Buyer: <strong>{d.buyer?.full_name || 'Buyer'}</strong>
                  </p>
                  <p className="text-slate-700 dark:text-slate-300">
                    Seller: <strong>{d.seller?.business_name || d.seller?.full_name || 'Seller'}</strong>
                  </p>
                </div>

                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">
                    Reason / Claim
                  </span>
                  <p className="text-slate-700 dark:text-slate-300 mt-0.5">
                    {d.reason || d.description || 'Hardware condition or specification dispute.'}
                  </p>
                </div>
              </div>

              {d.status !== 'resolved' && d.order_id && (
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
                  <form
                    action={async () => {
                      'use server'
                      await adminResolveDispute(d.id, d.order_id, 'release_to_seller')
                    }}
                  >
                    <Button
                      type="submit"
                      size="sm"
                      className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl h-9 gap-1.5 cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Release Funds to Seller</span>
                    </Button>
                  </form>

                  <form
                    action={async () => {
                      'use server'
                      await adminResolveDispute(d.id, d.order_id, 'refund_buyer')
                    }}
                  >
                    <Button
                      type="submit"
                      size="sm"
                      variant="outline"
                      className="border-red-300 text-red-600 text-xs font-bold rounded-xl h-9 gap-1.5 cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Refund Buyer</span>
                    </Button>
                  </form>
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-12 text-center text-xs text-slate-400">
            No active buyer disputes recorded.
          </div>
        )}
      </div>
    </div>
  )
}