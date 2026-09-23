import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { toggleProductStatus } from '../actions'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  AlertOctagon,
  CheckCircle2,
  ShieldAlert,
  ArrowLeft,
  EyeOff,
  Phone,
  MessageCircle,
  ExternalLink,
  Store,
} from 'lucide-react'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Disputes & Incident Reports | BenchTech Admin',
}

export default async function AdminReportsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login?next=/admin/reports')

  // Fetch reports if reports table exists, with fallback
  let reports: any[] = []
  try {
    const { data, error } = await supabase
      .from('reports')
      .select('*, products(id, title, price, seller_id, status)')
      .order('created_at', { ascending: false })

    if (!error && data) {
      reports = data
    }
  } catch {
    reports = []
  }

  return (
    <div className="space-y-6 sm:space-y-8 max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
              Listing Disputes &amp; Policy Violations
            </h1>
            <Badge className="bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300 border border-rose-200 text-[10px] font-black uppercase">
              {reports.length} Incidents
            </Badge>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Items reported by buyers in Abuja for counterfeit specs, fake battery health, or fraudulent deposit demands.
          </p>
        </div>

        <Link href="/admin/overview">
          <Button variant="outline" size="sm" className="text-xs font-bold rounded-xl h-10 border-slate-200">
            &larr; Back to Control Centre
          </Button>
        </Link>
      </div>

      {reports.length > 0 ? (
        <div className="space-y-4">
          {reports.map((report) => {
            const product = report.products
            return (
              <Card
                key={report.id}
                className="border border-slate-200/90 dark:border-slate-800 shadow-2xs bg-white dark:bg-slate-900 rounded-3xl overflow-hidden"
              >
                <CardContent className="p-5 sm:p-6 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                        <AlertOctagon className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-xs font-black text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                          {report.reason || 'Suspicious Hardware Listing'}
                        </span>
                        <p className="text-[10px] text-slate-400">
                          Reported on {new Date(report.created_at).toLocaleDateString('en-NG')}
                        </p>
                      </div>
                    </div>

                    <Badge className="bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-bold">
                      Needs Resolution
                    </Badge>
                  </div>

                  <div className="text-xs bg-slate-50 dark:bg-slate-800/40 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800 text-slate-700 dark:text-slate-300">
                    <p className="font-bold text-[11px] text-slate-500 uppercase mb-1">Buyer Complaint Note:</p>
                    <p className="leading-relaxed">{report.details || 'Buyer reported discrepancy in device battery health and serial IMEI specifications.'}</p>
                  </div>

                  {product && (
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                      <div className="space-y-0.5">
                        <Link href={`/products/${product.id}`} target="_blank" className="font-bold text-xs text-blue-600 hover:underline flex items-center gap-1">
                          <span>{product.title}</span> <ExternalLink className="w-3 h-3" />
                        </Link>
                        <p className="text-[11px] font-black text-slate-900 dark:text-slate-100">
                          ₦{Number(product.price).toLocaleString()}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        {report.buyer_phone && (
                          <a href={`tel:${report.buyer_phone}`}>
                            <Button size="sm" variant="outline" className="text-xs h-8 rounded-xl font-bold gap-1 border-slate-200">
                              <Phone className="w-3 h-3" /> Call Reporter
                            </Button>
                          </a>
                        )}

                        {product.status === 'published' && (
                          <form action={toggleProductStatus.bind(null, product.id, 'hidden')}>
                            <Button size="sm" className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs h-8 rounded-xl gap-1 shadow-xs">
                              <EyeOff className="w-3 h-3" /> Take Down Listing
                            </Button>
                          </form>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      ) : (
        <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 max-w-xl mx-auto space-y-3 shadow-2xs">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">Dispute Queue Clean</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-md mx-auto">
            There are currently no active dispute cases or reported listings flagged by buyers in Abuja. Any incident forms submitted at <code>/help#report</code> will surface here for action.
          </p>
        </div>
      )}
    </div>
  )
}