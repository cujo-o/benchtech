import { createClient as createAdminClient } from '@supabase/supabase-js'
import { Badge } from '@/components/ui/badge'
import { ScrollText } from 'lucide-react'

export const dynamic = 'force-dynamic'

function getAdminDb() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  return createAdminClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

export default async function AdminAuditLogPage() {
  const adminDb = getAdminDb()

  const { data: events } = await adminDb
    .from('audit_events')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(150)

  const allEvents = events || []

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xs">
        <div className="flex items-center gap-2">
          <ScrollText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            Security &amp; Compliance Audit Log
          </h1>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Append-only record of seller verifications, bank payout releases, dispute arbitrations, and account security events.
        </p>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xs overflow-x-auto">
        <table className="w-full text-left text-xs whitespace-nowrap">
          <thead>
            <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-bold uppercase text-[10px]">
              <th className="pb-3 pr-4">Action</th>
              <th className="pb-3 px-4">Target Type</th>
              <th className="pb-3 px-4">Target ID</th>
              <th className="pb-3 px-4">Outcome</th>
              <th className="pb-3 px-4">Metadata</th>
              <th className="pb-3 pl-4 text-right">Timestamp</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {allEvents.length > 0 ? (
              allEvents.map((ev: any) => (
                <tr key={ev.id} className="text-slate-700 dark:text-slate-300">
                  <td className="py-3 pr-4 font-bold text-slate-900 dark:text-white">
                    {ev.action?.replace(/_/g, ' ')}
                  </td>
                  <td className="py-3 px-4 capitalize">
                    {ev.target_type?.replace(/_/g, ' ')}
                  </td>
                  <td className="py-3 px-4 font-mono text-[11px] text-slate-400">
                    {ev.target_id?.slice(0, 12)}
                  </td>
                  <td className="py-3 px-4">
                    <Badge variant="outline" className="text-[10px] font-bold uppercase">
                      {ev.result}
                    </Badge>
                  </td>
                  <td className="py-3 px-4 font-mono text-[10px] text-slate-400 max-w-[260px] truncate">
                    {ev.metadata ? JSON.stringify(ev.metadata) : '—'}
                  </td>
                  <td className="py-3 pl-4 text-right text-slate-400">
                    {new Date(ev.created_at).toLocaleString('en-NG', {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="py-8 text-center text-slate-400">
                  No audit events logged yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}