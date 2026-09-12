import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Headphones, CheckCircle2, MessageSquare, Clock } from 'lucide-react'

export default async function AdminSupportPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login?next=/admin/support')

  // Sample tickets table or fallback state
  return (
    <div className="space-y-6 max-w-[1600px] mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Headphones className="w-6 h-6 text-blue-600" />
            <h1 className="text-2xl font-bold text-slate-900">Support & Trust Operations</h1>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Resolve buyer hardware disputes, delivery queries, and vendor onboarding tickets.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs px-3 py-1 font-semibold">
            0 Escalations
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-white border-slate-200/80 shadow-sm rounded-2xl">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-400">Open Tickets</p>
              <h2 className="text-2xl font-black text-slate-900 mt-1">0</h2>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <MessageSquare className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200/80 shadow-sm rounded-2xl">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-400">Average First Response</p>
              <h2 className="text-2xl font-black text-slate-900 mt-1">12m</h2>
            </div>
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200/80 shadow-sm rounded-2xl">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-400">Resolved Rate</p>
              <h2 className="text-2xl font-black text-emerald-600 mt-1">100%</h2>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="p-12 text-center bg-white rounded-2xl border border-slate-200/80 max-w-xl mx-auto space-y-3">
        <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-6 h-6" />
        </div>
        <h3 className="font-bold text-sm text-slate-900">Support Desk is Clear</h3>
        <p className="text-xs text-slate-500 leading-relaxed max-w-sm mx-auto">
          No active dispute or verification issues need administrator intervention right now.
        </p>
      </Card>
    </div>
  )
}