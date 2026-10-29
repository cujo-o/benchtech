'use client'

import { useState } from 'react'
import {
  OPERATIONAL_QUEUES,
  PRIORITY_SLA_HOURS,
} from '@/lib/support/knowledgeBase'
import {
  adminUpdateSupportTicketAction,
  adminAddTicketMessageAction,
} from '@/app/help/actions'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Headphones,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Search,
  Send,
  Lock,
  Package,
  Star,
  Loader2,
} from 'lucide-react'

export function SupportDeskClient({
  tickets,
  deliveryExceptionsCount,
}: {
  tickets: any[]
  deliveryExceptionsCount: number
}) {
  const [queueFilter, setQueueFilter] = useState<string>('all')
  const [priorityFilter, setPriorityFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('active')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(
    tickets[0]?.id || null
  )

  // Staff Edit State
  const [savingId, setSavingId] = useState<string | null>(null)
  const [replyText, setReplyText] = useState('')
  const [isInternalNote, setIsInternalNote] = useState(false)
  const [replyNextStatus, setReplyNextStatus] = useState('in_progress')

  const now = Date.now()

  const isOverdue = (t: any) =>
    t.status !== 'resolved' &&
    t.status !== 'closed' &&
    t.sla_due_at &&
    new Date(t.sla_due_at).getTime() < now

  const openTickets = tickets.filter(
    (t) => t.status !== 'resolved' && t.status !== 'closed'
  )
  const overdueTickets = tickets.filter(isOverdue)
  const p1Tickets = openTickets.filter((t) => t.priority === 'P1')
  const resolvedTickets = tickets.filter(
    (t) => t.status === 'resolved' || t.status === 'closed'
  )
  const resolutionRate =
    tickets.length > 0
      ? Math.round((resolvedTickets.length / tickets.length) * 100)
      : 100

  const ratedTickets = tickets.filter((t) => typeof t.csat_rating === 'number')
  const avgCsat =
    ratedTickets.length > 0
      ? (
          ratedTickets.reduce((sum, t) => sum + Number(t.csat_rating), 0) /
          ratedTickets.length
        ).toFixed(1)
      : '—'

  const filteredTickets = tickets.filter((t) => {
    if (queueFilter !== 'all' && t.queue !== queueFilter) return false
    if (priorityFilter !== 'all' && t.priority !== priorityFilter) return false

    if (statusFilter === 'active') {
      if (t.status === 'resolved' || t.status === 'closed') return false
    } else if (statusFilter === 'overdue') {
      if (!isOverdue(t)) return false
    } else if (statusFilter !== 'all' && t.status !== statusFilter) {
      return false
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      const match =
        (t.ticket_number || '').toLowerCase().includes(q) ||
        (t.subject || '').toLowerCase().includes(q) ||
        (t.customer_name || '').toLowerCase().includes(q) ||
        (t.customer_email || '').toLowerCase().includes(q)
      if (!match) return false
    }

    return true
  })

  const activeTicket =
    filteredTickets.find((t) => t.id === selectedTicketId) ||
    filteredTickets[0] ||
    null

  async function handleSaveTicketMeta(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!activeTicket) return
    setSavingId(activeTicket.id)

    const fd = new FormData(e.currentTarget)
    await adminUpdateSupportTicketAction({
      ticketId: activeTicket.id,
      status: (fd.get('status') as string) || activeTicket.status,
      priority: (fd.get('priority') as string) || activeTicket.priority,
      queue: (fd.get('queue') as string) || activeTicket.queue,
      assignedOwnerName:
        (fd.get('assignedOwnerName') as string) || 'Support Desk',
      nextAction: (fd.get('nextAction') as string) || '',
      resolutionNotes: (fd.get('resolutionNotes') as string) || '',
    })

    setSavingId(null)
    window.location.reload()
  }

  async function handleSendStaffReply() {
    if (!activeTicket || !replyText.trim()) return
    setSavingId(activeTicket.id)

    await adminAddTicketMessageAction({
      ticketId: activeTicket.id,
      message: replyText,
      isInternalNote,
      nextStatus: isInternalNote ? undefined : replyNextStatus,
    })

    setReplyText('')
    setSavingId(null)
    window.location.reload()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <Headphones className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white">
              Human Support &amp; Operations Desk
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Shared operational inbox, queue routing, P1–P4 SLA monitoring, and order lookup.
          </p>
        </div>

        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search TKT-#, customer, subject..."
            className="w-full h-10 pl-9 pr-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium"
          />
        </div>
      </div>

      {/* Proactive Operational Intelligence Alerts (Section 13) */}
      {(p1Tickets.length > 0 ||
        overdueTickets.length > 0 ||
        deliveryExceptionsCount > 0) && (
        <div className="p-4 rounded-2xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5 font-bold text-amber-900 dark:text-amber-200">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              Proactive Operations Intelligence:{' '}
              {p1Tickets.length > 0 && `${p1Tickets.length} P1 Critical Case(s) • `}
              {overdueTickets.length > 0 &&
                `${overdueTickets.length} Overdue Ticket(s) past SLA • `}
              {deliveryExceptionsCount > 0 &&
                `${deliveryExceptionsCount} Active Delivery Exception(s)`}
            </span>
          </div>
          {overdueTickets.length > 0 && (
            <button
              type="button"
              onClick={() => setStatusFilter('overdue')}
              className="font-bold text-amber-800 dark:text-amber-300 underline cursor-pointer"
            >
              Filter Overdue Cases &rarr;
            </button>
          )}
        </div>
      )}

      {/* Management Reporting KPIs (Section 16) */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 shadow-xs">
          <span className="text-[10px] font-bold uppercase text-slate-400 block">
            Open Backlog
          </span>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">
            {openTickets.length}
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 shadow-xs">
          <span className="text-[10px] font-bold uppercase text-slate-400 block">
            P1 Critical Queue
          </span>
          <p className="text-2xl font-black text-red-600 dark:text-red-400 mt-1">
            {p1Tickets.length}
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 shadow-xs">
          <span className="text-[10px] font-bold uppercase text-slate-400 block">
            Overdue Past SLA
          </span>
          <p className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">
            {overdueTickets.length}
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 shadow-xs">
          <span className="text-[10px] font-bold uppercase text-slate-400 block">
            Resolution Rate
          </span>
          <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
            {resolutionRate}%
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 shadow-xs col-span-2 lg:col-span-1">
          <span className="text-[10px] font-bold uppercase text-slate-400 block">
            Customer CSAT
          </span>
          <p className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-1 flex items-center gap-1">
            <span>{avgCsat}</span>
            <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
          </p>
        </div>
      </div>

      {/* Queue & Priority Filters */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          <button
            type="button"
            onClick={() => setQueueFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 cursor-pointer ${
              queueFilter === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300'
            }`}
          >
            All Queues
          </button>
          {OPERATIONAL_QUEUES.map((q) => (
            <button
              key={q.id}
              type="button"
              onClick={() => setQueueFilter(q.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 cursor-pointer ${
                queueFilter === q.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300'
              }`}
            >
              {q.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1.5">
          {['all', 'P1', 'P2', 'P3', 'P4'].map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPriorityFilter(p)}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-bold cursor-pointer ${
                priorityFilter === p
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                  : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500'
              }`}
            >
              {p === 'all' ? 'All Priorities' : p}
            </button>
          ))}

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-8 px-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold"
          >
            <option value="active">Active Open Cases</option>
            <option value="overdue">Overdue Past SLA</option>
            <option value="awaiting_info">Awaiting Customer Info</option>
            <option value="resolved">Resolved / Closed</option>
            <option value="all">All Statuses</option>
          </select>
        </div>
      </div>

      {/* Split Inbox View: Ticket Queue List (Left) + Active Case Inspector (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left 5 Cols: Queue List */}
        <div className="lg:col-span-5 space-y-2.5 max-h-[750px] overflow-y-auto pr-1">
          {filteredTickets.length > 0 ? (
            filteredTickets.map((t) => {
              const selected = activeTicket?.id === t.id
              const overdue = isOverdue(t)
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setSelectedTicketId(t.id)}
                  className={`w-full text-left p-4 rounded-2xl border transition space-y-2 cursor-pointer ${
                    selected
                      ? 'border-2 border-blue-600 bg-blue-50/30 dark:bg-blue-950/30 shadow-xs'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-black text-xs text-blue-600 dark:text-blue-400">
                        {t.ticket_number}
                      </span>
                      <Badge
                        className={`text-[9px] font-black uppercase ${
                          t.priority === 'P1'
                            ? 'bg-red-600 text-white'
                            : t.priority === 'P2'
                            ? 'bg-amber-500 text-slate-950'
                            : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {t.priority}
                      </Badge>
                      {overdue && (
                        <Badge className="bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300 text-[9px] font-bold">
                          Overdue
                        </Badge>
                      )}
                    </div>

                    <span className="text-[10px] font-bold uppercase text-slate-400">
                      {t.status?.replace(/_/g, ' ')}
                    </span>
                  </div>

                  <p className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1">
                    {t.subject}
                  </p>

                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span className="truncate">{t.customer_name}</span>
                    <span className="capitalize shrink-0">
                      {t.queue?.replace(/_/g, ' ')}
                    </span>
                  </div>
                </button>
              )
            })
          ) : (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-10 text-center text-xs text-slate-400">
              No support tickets match the current filter.
            </div>
          )}
        </div>

        {/* Right 7 Cols: Active Case Workspace */}
        <div className="lg:col-span-7">
          {activeTicket ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xs space-y-5 text-xs">
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-black text-sm text-blue-600 dark:text-blue-400">
                      {activeTicket.ticket_number}
                    </span>
                    <h2 className="text-base font-black text-slate-900 dark:text-white">
                      {activeTicket.subject}
                    </h2>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Customer: <strong>{activeTicket.customer_name}</strong> (
                    {activeTicket.customer_email || activeTicket.customer_phone || 'No contact'})
                  </p>
                </div>

                {activeTicket.escalated_to_human && (
                  <Badge className="bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300 border border-purple-200 text-[10px] font-bold">
                    AI Escalated Case
                  </Badge>
                )}
              </div>

              {/* Linked Order Lookup Summary (if attached) */}
              {activeTicket.order && (
                <div className="p-3.5 rounded-2xl bg-blue-50/50 dark:bg-blue-950/30 border border-blue-200/80 dark:border-blue-900 flex flex-wrap items-center justify-between gap-3">
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-black uppercase text-blue-600 dark:text-blue-400 flex items-center gap-1">
                      <Package className="w-3 h-3" /> Linked Marketplace Order
                    </span>
                    <p className="font-bold text-slate-900 dark:text-white">
                      #{activeTicket.order.order_number || activeTicket.order.id.slice(0, 8)} —{' '}
                      ₦{Number(activeTicket.order.total_amount || activeTicket.order.amount || 0).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[10px] capitalize">
                      Delivery: {activeTicket.order.delivery_status || 'pending'}
                    </Badge>
                    <Badge variant="outline" className="text-[10px] capitalize">
                      Payout: {activeTicket.order.payout_status || 'on_hold'}
                    </Badge>
                  </div>
                </div>
              )}

              {/* Case Summary */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 space-y-1">
                <span className="text-[10px] font-bold uppercase text-slate-400 block">
                  Initial Case Summary &amp; Context
                </span>
                <p className="text-slate-700 dark:text-slate-300 whitespace-pre-line leading-relaxed">
                  {activeTicket.summary}
                </p>
              </div>

              {/* Staff Queue, Priority, Status & Next Action Form */}
              <form
                key={activeTicket.id}
                onSubmit={handleSaveTicketMeta}
                className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800"
              >
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                      Status
                    </label>
                    <select
                      name="status"
                      defaultValue={activeTicket.status}
                      className="w-full h-9 px-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold"
                    >
                      <option value="open">Open</option>
                      <option value="assigned">Assigned</option>
                      <option value="in_progress">In Progress</option>
                      <option value="awaiting_info">Awaiting Info</option>
                      <option value="resolved">Resolved</option>
                      <option value="closed">Closed</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                      Priority
                    </label>
                    <select
                      name="priority"
                      defaultValue={activeTicket.priority}
                      className="w-full h-9 px-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold"
                    >
                      <option value="P1">P1 — Critical (2h)</option>
                      <option value="P2">P2 — High (8h)</option>
                      <option value="P3">P3 — Standard (24h)</option>
                      <option value="P4">P4 — Low (48h)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                      Queue
                    </label>
                    <select
                      name="queue"
                      defaultValue={activeTicket.queue}
                      className="w-full h-9 px-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold"
                    >
                      {OPERATIONAL_QUEUES.map((q) => (
                        <option key={q.id} value={q.id}>
                          {q.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                      Owner Name
                    </label>
                    <input
                      type="text"
                      name="assignedOwnerName"
                      defaultValue={
                        activeTicket.assigned_owner_name || 'Operations Desk'
                      }
                      className="w-full h-9 px-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-medium"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                      Next Action Required
                    </label>
                    <input
                      type="text"
                      name="nextAction"
                      defaultValue={activeTicket.next_action || ''}
                      placeholder="e.g. Confirm courier handover log"
                      className="w-full h-9 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                      Resolution Outcome Notes
                    </label>
                    <input
                      type="text"
                      name="resolutionNotes"
                      defaultValue={activeTicket.resolution_notes || ''}
                      placeholder="Summary of final resolution..."
                      className="w-full h-9 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-medium"
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button
                    type="submit"
                    size="sm"
                    disabled={savingId === activeTicket.id}
                    className="bg-slate-900 dark:bg-slate-800 text-white text-xs font-bold rounded-xl h-8 px-4 cursor-pointer"
                  >
                    {savingId === activeTicket.id ? 'Saving...' : 'Update Case Metadata'}
                  </Button>
                </div>
              </form>

              {/* Conversation Thread & Internal Notes */}
              <div className="space-y-2.5 pt-3 border-t border-slate-100 dark:border-slate-800 max-h-64 overflow-y-auto">
                <span className="text-[10px] font-bold uppercase text-slate-400 block">
                  Case Thread &amp; Internal Audit Notes
                </span>
                {(activeTicket.messages || []).map((m: any) => (
                  <div
                    key={m.id}
                    className={`p-3 rounded-xl border ${
                      m.is_internal_note
                        ? 'bg-amber-50/70 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900'
                        : m.sender_role === 'support_agent'
                        ? 'bg-blue-50/50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900'
                        : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                      <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                        {m.is_internal_note && <Lock className="w-3 h-3 text-amber-600" />}
                        {m.sender_name || m.sender_role}{' '}
                        {m.is_internal_note ? '(Internal Staff Note)' : ''}
                      </span>
                      <span>
                        {new Date(m.created_at).toLocaleString('en-NG', {
                          dateStyle: 'short',
                          timeStyle: 'short',
                        })}
                      </span>
                    </div>
                    <p className="text-slate-700 dark:text-slate-300 whitespace-pre-line">
                      {m.message}
                    </p>
                  </div>
                ))}
              </div>

              {/* Staff Reply / Internal Note Box */}
              <div className="space-y-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <label className="inline-flex items-center gap-1.5 font-bold cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isInternalNote}
                        onChange={(e) => setIsInternalNote(e.target.checked)}
                        className="rounded border-slate-300 text-amber-600"
                      />
                      <span>Internal Staff Note Only</span>
                    </label>
                  </div>

                  {!isInternalNote && (
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] text-slate-400">
                        Set status on reply:
                      </span>
                      <select
                        value={replyNextStatus}
                        onChange={(e) => setReplyNextStatus(e.target.value)}
                        className="h-7 px-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] font-bold"
                      >
                        <option value="in_progress">In Progress</option>
                        <option value="awaiting_info">Awaiting Customer Info</option>
                        <option value="resolved">Resolved</option>
                      </select>
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <textarea
                    rows={2}
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder={
                      isInternalNote
                        ? 'Write an internal note visible only to staff...'
                        : 'Write a response to the customer...'
                    }
                    className="flex-1 p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
                  />
                  <Button
                    type="button"
                    disabled={savingId === activeTicket.id || !replyText.trim()}
                    onClick={handleSendStaffReply}
                    className={`h-auto px-4 rounded-xl text-xs font-bold text-white cursor-pointer gap-1.5 ${
                      isInternalNote
                        ? 'bg-amber-600 hover:bg-amber-700'
                        : 'bg-blue-600 hover:bg-blue-700'
                    }`}
                  >
                    {savingId === activeTicket.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Send className="w-3.5 h-3.5" />
                    )}
                    <span>{isInternalNote ? 'Save Note' : 'Send Reply'}</span>
                  </Button>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}