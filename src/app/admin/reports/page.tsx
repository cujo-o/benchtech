import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { AlertOctagon, CheckCircle2, ShieldAlert } from 'lucide-react'

export default async function AdminReportsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login?next=/admin/reports')

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Listing Disputes & Policy Violations</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Items reported by buyers for counterfeit specs, fake battery health, or pricing violations.
        </p>
      </div>

      <div className="p-12 text-center bg-white rounded-2xl border border-slate-200/80 max-w-xl mx-auto space-y-3">
        <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-6 h-6" />
        </div>
        <h3 className="font-bold text-sm text-slate-900">Dispute Queue Clean</h3>
        <p className="text-xs text-slate-500 leading-relaxed max-w-md mx-auto">
          There are currently no active dispute cases or reported listings flagged by buyers in Abuja.
        </p>
      </div>
    </div>
  )
}