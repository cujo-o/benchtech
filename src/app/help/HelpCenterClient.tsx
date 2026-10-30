'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  APPROVED_KNOWLEDGE_BASE,
  SUPPORT_OPERATING_HOURS,
  OPERATIONAL_QUEUES,
  PRIORITY_SLA_HOURS,
} from '@/lib/support/knowledgeBase'
import {
  getOrderStatusTool,
  getRefundStatusTool,
  cancelEligibleOrderTool,
  createSupportTicketAction,
  replyToSupportTicketAction,
  submitTicketCsatAction,
} from './actions'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Bot,
  Send,
  Search,
  Ticket,
  BookOpen,
  ShieldCheck,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  UserCheck,
  Package,
  RotateCcw,
  Star,
  Lock,
} from 'lucide-react'

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export function HelpCenterClient({
  user,
  profile,
  initialTickets,
  initialOrders,
}: {
  user: { id: string; email: string } | null
  profile: any
  initialTickets: any[]
  initialOrders: any[]
}) {
  const [activeTab, setActiveTab] = useState<
    'assistant' | 'tickets' | 'new_ticket' | 'knowledge'
  >('assistant')

  // AI Assistant State
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: `Welcome to BenchTech Support. I can check your verified order and delivery status, verify refund requests, answer policy questions from our approved knowledge base, or route a support ticket to our operations team.\n\n• AI Assistant: ${SUPPORT_OPERATING_HOURS.aiAvailability}\n• Human Support Desk: ${SUPPORT_OPERATING_HOURS.humanSupportHours}`,
    },
  ])
  const [chatInput, setChatInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)

  // Live Order & Refund Lookup State
  const [lookupRef, setLookupRef] = useState(
    initialOrders?.[0]?.order_number ||
      initialOrders?.[0]?.payment_reference ||
      ''
  )
  const [lookupLoading, setLookupLoading] = useState(false)
  const [lookupError, setLookupError] = useState<string | null>(null)
  const [verifiedOrder, setVerifiedOrder] = useState<any | null>(null)
  const [verifiedRefund, setVerifiedRefund] = useState<any | null>(null)
  const [cancelLoading, setCancelLoading] = useState(false)

  // Ticket Creation & Reply State
  const [tickets, setTickets] = useState<any[]>(initialTickets || [])
  const [category, setCategory] = useState('delivery_issue')
  const [selectedOrderId, setSelectedOrderId] = useState(
    initialOrders?.[0]?.id || ''
  )
  const [subject, setSubject] = useState('')
  const [summary, setSummary] = useState('')
  const [guestEmail, setGuestEmail] = useState(user?.email || '')
  const [guestName, setGuestName] = useState(
    profile?.full_name || profile?.business_name || ''
  )
  const [ticketSubmitting, setTicketSubmitting] = useState(false)
  const [ticketAlert, setTicketAlert] = useState<{
    type: 'success' | 'error'
    text: string
  } | null>(null)

  const [replyTextMap, setReplyTextMap] = useState<Record<string, string>>({})
  const [replyingId, setReplyingId] = useState<string | null>(null)

  async function handleSendChat(customPrompt?: string) {
    const text = (customPrompt ?? chatInput).trim()
    if (!text || chatLoading) return

    const nextMessages: ChatMessage[] = [
      ...messages,
      { role: 'user', content: text },
    ]
    setMessages(nextMessages)
    setChatInput('')
    setChatLoading(true)

    try {
      const res = await fetch('/api/support/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: nextMessages }),
      })
      const data = await res.json()

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content:
            data.reply ||
            'Unable to retrieve response. Please open a support ticket so our team can assist you.',
        },
      ])

      if (data.verifiedOrder) {
        setVerifiedOrder(data.verifiedOrder)
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content:
            'Connection interrupted. You can still check verified order records or submit a support ticket directly on this page.',
        },
      ])
    } finally {
      setChatLoading(false)
    }
  }

  async function handleEscalateChatToHuman() {
    const userMessages = messages
      .filter((m) => m.role === 'user')
      .map((m) => m.content)
      .join(' | ')

    const autoSubject = userMessages
      ? `Escalated Support Case: ${userMessages.slice(0, 60)}`
      : 'Customer Support Escalation Request'

    const conversationTranscript = messages
      .slice(-6)
      .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
      .join('\n\n')

    setSubject(autoSubject)
    setSummary(conversationTranscript)
    setActiveTab('new_ticket')
  }

  async function handleOrderLookup(mode: 'order' | 'refund') {
    if (!lookupRef.trim()) return
    setLookupLoading(true)
    setLookupError(null)
    setVerifiedOrder(null)
    setVerifiedRefund(null)

    if (mode === 'order') {
      const res = await getOrderStatusTool(lookupRef)
      setLookupLoading(false)
      if (!res.ok) {
        setLookupError(res.error || 'Could not verify order.')
        return
      }
      setVerifiedOrder(res.order)
    } else {
      const res: any = await getRefundStatusTool(lookupRef)
      setLookupLoading(false)
      if (!res.ok) {
        setLookupError(res.error || 'Could not verify refund status.')
        return
      }
      setVerifiedRefund(res.refund)
    }
  }

  async function handleCancelOrder(orderId: string) {
    setCancelLoading(true)
    const res = await cancelEligibleOrderTool(orderId)
    setCancelLoading(false)

    if (!res.ok) {
      setLookupError(res.error || 'Cancellation not permitted.')
      return
    }
    if (lookupRef) {
      await handleOrderLookup('order')
    }
  }

  async function handleCreateTicket(e: React.FormEvent) {
    e.preventDefault()
    if (ticketSubmitting) return

    setTicketSubmitting(true)
    setTicketAlert(null)

    const res = await createSupportTicketAction({
      category,
      subject,
      summary,
      orderId: selectedOrderId || undefined,
      customerEmail: guestEmail,
      customerName: guestName,
      escalatedFromAi: subject.startsWith('Escalated Support Case:'),
    })

    setTicketSubmitting(false)

    if (!res.ok) {
      setTicketAlert({
        type: 'error',
        text: res.error || 'Could not create ticket.',
      })
      return
    }

    if (res.ticket) {
      setTickets((prev) => [
        res.ticket,
        ...prev.filter((t) => t.id !== res.ticket.id),
      ])
    }

    setSubject('')
    setSummary('')
    setTicketAlert({
      type: 'success',
      text: `Ticket ${res.ticket.ticket_number} created and routed to ${res.ticket.queue.replace(
        /_/g,
        ' '
      )} (${res.ticket.priority}).`,
    })
    setActiveTab('tickets')
  }

  async function handleReplyTicket(ticketId: string) {
    const text = (replyTextMap[ticketId] || '').trim()
    if (!text) return

    setReplyingId(ticketId)
    const res = await replyToSupportTicketAction(ticketId, text)
    setReplyingId(null)

    if (res.ok) {
      setReplyTextMap((prev) => ({ ...prev, [ticketId]: '' }))
      window.location.reload()
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Header & Operating Hours Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white">
              BenchTech Customer Support &amp; Operations Center
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            24/7 AI assistance grounded in live order records, plus tracked human operational queues.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs">
          <div className="px-3.5 py-2 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-800">
            <span className="text-[10px] font-bold uppercase text-blue-600 dark:text-blue-400 block">
              AI Assistant
            </span>
            <span className="font-bold text-slate-900 dark:text-white">
              24/7 Instant Access
            </span>
          </div>

          <div className="px-3.5 py-2 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-800">
            <span className="text-[10px] font-bold uppercase text-emerald-600 dark:text-emerald-400 block">
              Human Support Hours
            </span>
            <span className="font-bold text-slate-900 dark:text-white">
              Mon–Sat, 8 AM – 6 PM WAT
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {[
          {
            id: 'assistant',
            label: 'AI Assistant & Order Lookup',
            icon: Bot,
          },
          {
            id: 'tickets',
            label: `My Support Cases (${tickets.length})`,
            icon: Ticket,
          },
          {
            id: 'new_ticket',
            label: 'Open Support Ticket',
            icon: UserCheck,
          },
          {
            id: 'knowledge',
            label: 'Knowledge Base & Privacy Policy',
            icon: BookOpen,
          },
        ].map((tab) => {
          const Icon = tab.icon
          const active = activeTab === tab.id
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 shrink-0 transition cursor-pointer ${
                active
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          )
        })}
      </div>

      {ticketAlert && (
        <div
          className={`p-4 rounded-2xl border text-xs font-semibold flex items-center justify-between gap-3 ${
            ticketAlert.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
              : 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-900 text-red-700 dark:text-red-300'
          }`}
        >
          <span>{ticketAlert.text}</span>
          <button
            type="button"
            onClick={() => setTicketAlert(null)}
            className="underline text-[11px]"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* =====================================================================
          TAB 1: AI SUPPORT ASSISTANT + LIVE ORDER & REFUND VERIFICATION
          ===================================================================== */}
      {activeTab === 'assistant' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left 7 Cols: Grounded AI Support Assistant */}
          <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-xs flex flex-col h-[560px]">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/60 dark:bg-slate-900/60">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center">
                  <Bot className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white">
                    BenchTech Support Assistant
                  </h2>
                  <p className="text-[10px] text-slate-400">
                    Connected to approved policies &amp; your verified order records
                  </p>
                </div>
              </div>

              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={handleEscalateChatToHuman}
                className="text-[11px] font-bold rounded-xl h-8 px-3 border-slate-200 dark:border-slate-700 gap-1.5 cursor-pointer"
              >
                <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                <span>Escalate to Human Queue</span>
              </Button>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3.5 text-xs">
              {messages.map((m, idx) => (
                <div
                  key={idx}
                  className={`flex ${
                    m.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl p-3.5 leading-relaxed whitespace-pre-line ${
                      m.role === 'user'
                        ? 'bg-blue-600 text-white font-medium'
                        : 'bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-800 text-slate-800 dark:text-slate-200'
                    }`}
                  >
                    {m.content}
                  </div>
                </div>
              ))}

              {chatLoading && (
                <div className="flex items-center gap-2 text-xs text-slate-400 p-2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
                  <span>Checking verified records...</span>
                </div>
              )}
            </div>

            {/* Quick Prompts */}
            <div className="px-4 py-2 border-t border-slate-100 dark:border-slate-800 flex items-center gap-1.5 overflow-x-auto [scrollbar-width:none] bg-slate-50/50 dark:bg-slate-900/40">
              {[
                'Check my latest order status',
                'How does the 7-day inspection hold work?',
                'My delivery is delayed',
                'How do I request a refund?',
                'Seller one-time verification rules',
              ].map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => handleSendChat(q)}
                  className="px-2.5 py-1 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[10px] font-semibold text-slate-600 dark:text-slate-300 hover:border-blue-500 shrink-0 transition cursor-pointer"
                >
                  {q}
                </button>
              ))}
            </div>

            {/* Input Bar */}
            <form
              onSubmit={(e) => {
                e.preventDefault()
                handleSendChat()
              }}
              className="p-3 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2"
            >
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Ask about an order, delivery, refund, or seller verification..."
                className="flex-1 h-10 px-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <Button
                type="submit"
                disabled={chatLoading || !chatInput.trim()}
                className="h-10 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl gap-1.5 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send</span>
              </Button>
            </form>
          </div>

          {/* Right 5 Cols: Authenticated Order & Refund Lookup Tool */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
              <div>
                <h2 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <Package className="w-4 h-4 text-blue-600" />
                  Verified Order &amp; Refund Lookup
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Check confirmed order stages, handover OTPs, or refund status. Requires account ownership.
                </p>
              </div>

              {initialOrders && initialOrders.length > 0 && (
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                    Select From Your Recent Orders
                  </label>
                  <select
                    value={lookupRef}
                    onChange={(e) => setLookupRef(e.target.value)}
                    className="w-full h-9 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium"
                  >
                    {initialOrders.map((o: any) => {
                      const ref =
                        o.order_number || o.payment_reference || o.id.slice(0, 8)
                      return (
                        <option key={o.id} value={ref}>
                          #{ref} — {o.product?.title || 'Hardware'} (₦
                          {Number(o.total_amount || o.amount || 0).toLocaleString()})
                        </option>
                      )
                    })}
                  </select>
                </div>
              )}

              <div className="flex gap-2">
                <input
                  type="text"
                  value={lookupRef}
                  onChange={(e) => setLookupRef(e.target.value)}
                  placeholder="Order ID or Payment Ref"
                  className="flex-1 h-10 px-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono font-bold"
                />
                <Button
                  type="button"
                  disabled={lookupLoading}
                  onClick={() => handleOrderLookup('order')}
                  className="h-10 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl px-3.5 cursor-pointer"
                >
                  {lookupLoading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Search className="w-3.5 h-3.5" />
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={lookupLoading}
                  onClick={() => handleOrderLookup('refund')}
                  className="h-10 text-xs font-bold rounded-xl px-3 border-slate-200 dark:border-slate-700 cursor-pointer"
                >
                  Refund Status
                </Button>
              </div>

              {lookupError && (
                <div className="p-3.5 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-xs text-red-700 dark:text-red-300 font-semibold flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
                  <span>{lookupError}</span>
                </div>
              )}

              {verifiedOrder && (
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 space-y-3 text-xs">
                  <div className="flex items-center justify-between border-b border-slate-200/70 dark:border-slate-700 pb-2">
                    <span className="font-mono font-black text-slate-900 dark:text-white">
                      #{verifiedOrder.reference}
                    </span>
                    <Badge className="bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 text-[10px] font-bold">
                      {verifiedOrder.currentHeadline}
                    </Badge>
                  </div>

                  <div className="space-y-1">
                    <p className="font-bold text-slate-900 dark:text-white">
                      {verifiedOrder.itemTitle}
                    </p>
                    <p className="text-slate-500">
                      Amount: <strong>₦{verifiedOrder.amount.toLocaleString()}</strong> • Store:{' '}
                      {verifiedOrder.sellerName}
                    </p>
                    {verifiedOrder.handoverOtp && (
                      <p className="text-emerald-600 dark:text-emerald-400 font-mono font-bold pt-1">
                        Buyer Handover OTP: {verifiedOrder.handoverOtp}
                      </p>
                    )}
                    {verifiedOrder.deliveryException && (
                      <p className="text-amber-600 dark:text-amber-400 font-bold pt-1">
                        Reported Issue: {verifiedOrder.deliveryException}
                      </p>
                    )}
                  </div>

                  {/* Confirmed Lifecycle Stages */}
                  <div className="space-y-1.5 pt-2 border-t border-slate-200/70 dark:border-slate-700">
                    <span className="text-[10px] font-bold uppercase text-slate-400 block">
                      Confirmed System Stages
                    </span>
                    {verifiedOrder.stages.map((st: any) => (
                      <div
                        key={st.key}
                        className="flex items-center gap-2 text-[11px]"
                      >
                        <CheckCircle2
                          className={`w-3.5 h-3.5 shrink-0 ${
                            st.confirmed
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-slate-300 dark:text-slate-700'
                          }`}
                        />
                        <span
                          className={
                            st.confirmed
                              ? 'font-bold text-slate-900 dark:text-white'
                              : 'text-slate-400'
                          }
                        >
                          {st.label}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="pt-2 flex flex-wrap items-center gap-2">
                    {verifiedOrder.canCancelAutomatically && (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={cancelLoading}
                        onClick={() => handleCancelOrder(verifiedOrder.id)}
                        className="text-xs font-bold rounded-xl h-8 border-red-200 text-red-600 cursor-pointer gap-1"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Cancel Unshipped Order</span>
                      </Button>
                    )}
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => {
                        setSelectedOrderId(verifiedOrder.id)
                        setCategory('delivery_issue')
                        setSubject(`Order #${verifiedOrder.reference} Assistance`)
                        setActiveTab('new_ticket')
                      }}
                      className="bg-slate-900 dark:bg-slate-700 text-white text-xs font-bold rounded-xl h-8 px-3 cursor-pointer"
                    >
                      Open Case for This Order
                    </Button>
                  </div>
                </div>
              )}

              {verifiedRefund && (
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 space-y-1.5 text-xs">
                  <p className="font-bold text-slate-900 dark:text-white">
                    Order #{verifiedRefund.orderReference} — {verifiedRefund.itemTitle}
                  </p>
                  <p className="text-blue-600 dark:text-blue-400 font-bold">
                    {verifiedRefund.refundState}
                  </p>
                  <p className="text-[11px] text-slate-400">
                    {verifiedRefund.policyNote}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          TAB 2: MY TRACKED SUPPORT CASES (TICKET LIFECYCLE)
          ===================================================================== */}
      {activeTab === 'tickets' && (
        <div className="space-y-4">
          {tickets.length > 0 ? (
            tickets.map((t) => (
              <div
                key={t.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4 text-xs"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono font-black text-sm text-blue-600 dark:text-blue-400">
                      {t.ticket_number}
                    </span>
                    <span className="font-bold text-sm text-slate-900 dark:text-white">
                      {t.subject}
                    </span>
                    <Badge variant="outline" className="text-[10px] font-bold uppercase">
                      {t.priority}
                    </Badge>
                    <Badge className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-semibold capitalize">
                      Queue: {t.queue?.replace(/_/g, ' ')}
                    </Badge>
                  </div>

                  <Badge
                    className={`text-[10px] font-bold uppercase ${
                      t.status === 'resolved' || t.status === 'closed'
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                        : t.status === 'awaiting_info'
                        ? 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                        : 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                    }`}
                  >
                    {t.status?.replace(/_/g, ' ')}
                  </Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                  <div>
                    <span className="text-[10px] font-bold uppercase text-slate-400 block">
                      Next Tracked Action
                    </span>
                    <p className="font-bold text-slate-900 dark:text-white mt-0.5">
                      {t.next_action || 'Assigned queue review'}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase text-slate-400 block">
                      Assigned Owner / Queue
                    </span>
                    <p className="font-semibold text-slate-700 dark:text-slate-300 mt-0.5 capitalize">
                      {t.assigned_owner_name || t.queue?.replace(/_/g, ' ')}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase text-slate-400 block">
                      Target Response Window
                    </span>
                    <p className="text-slate-600 dark:text-slate-400 mt-0.5 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-blue-600" />
                      {t.sla_due_at
                        ? new Date(t.sla_due_at).toLocaleString('en-NG', {
                            dateStyle: 'medium',
                            timeStyle: 'short',
                          })
                        : 'Standard SLA'}
                    </p>
                  </div>
                </div>

                {t.resolution_notes && (
                  <div className="p-3.5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 text-emerald-900 dark:text-emerald-200">
                    <span className="text-[10px] font-black uppercase block mb-0.5">
                      Official Resolution Notes
                    </span>
                    <p>{t.resolution_notes}</p>
                  </div>
                )}

                {/* Message History */}
                {Array.isArray(t.messages) && t.messages.length > 0 && (
                  <div className="space-y-2 pt-1">
                    {t.messages.map((msg: any) => (
                      <div
                        key={msg.id}
                        className={`p-3 rounded-xl border ${
                          msg.sender_role === 'support_agent'
                            ? 'bg-blue-50/50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900'
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                        }`}
                      >
                        <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                          <strong className="text-slate-800 dark:text-slate-200 uppercase">
                            {msg.sender_name || msg.sender_role}
                          </strong>
                          <span>
                            {new Date(msg.created_at).toLocaleString('en-NG', {
                              dateStyle: 'short',
                              timeStyle: 'short',
                            })}
                          </span>
                        </div>
                        <p className="text-slate-700 dark:text-slate-300 whitespace-pre-line">
                          {msg.message}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Customer Reply or Reopen Input */}
                {t.status !== 'closed' && (
                  <div className="flex gap-2 pt-2">
                    <input
                      type="text"
                      value={replyTextMap[t.id] || ''}
                      onChange={(e) =>
                        setReplyTextMap((prev) => ({
                          ...prev,
                          [t.id]: e.target.value,
                        }))
                      }
                      placeholder={
                        t.status === 'resolved'
                          ? 'Issue still unresolved? Reply here to reopen this ticket...'
                          : 'Add additional information or reply to support...'
                      }
                      className="flex-1 h-9 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
                    />
                    <Button
                      type="button"
                      size="sm"
                      disabled={replyingId === t.id}
                      onClick={() => handleReplyTicket(t.id)}
                      className="h-9 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl px-4 cursor-pointer"
                    >
                      {t.status === 'resolved' ? 'Reopen & Reply' : 'Send Reply'}
                    </Button>
                  </div>
                )}

                {/* CSAT Rating when Resolved */}
                {t.status === 'resolved' && (
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400">
                      How satisfied are you with the resolution of this case?
                    </span>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((score) => (
                        <button
                          key={score}
                          type="button"
                          onClick={() => submitTicketCsatAction(t.id, score)}
                          className={`p-1.5 rounded-lg border transition cursor-pointer ${
                            t.csat_rating === score
                              ? 'bg-amber-500 text-white border-amber-500'
                              : 'border-slate-200 dark:border-slate-700 text-slate-400 hover:text-amber-500'
                          }`}
                        >
                          <Star className="w-3.5 h-3.5" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-12 text-center space-y-3">
              <Ticket className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
              <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                You have no support tickets
              </p>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Need help with an order, delivery, refund, or seller verification? Open a tracked case and we will assign it to the right operational queue.
              </p>
              <Button
                type="button"
                onClick={() => setActiveTab('new_ticket')}
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl h-10 px-5 cursor-pointer"
              >
                Open Support Ticket
              </Button>
            </div>
          )}
        </div>
      )}

      {/* =====================================================================
          TAB 3: OPEN TRACKED SUPPORT CASE (QUEUE & PRIORITY ROUTING)
          ===================================================================== */}
      {activeTab === 'new_ticket' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-7 shadow-xs max-w-3xl space-y-5">
          <div>
            <h2 className="text-base font-black text-slate-900 dark:text-white">
              Open a Tracked Support Case
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Your case will receive a unique ticket reference, priority level (P1–P4), and automatic assignment to the responsible operational queue.
            </p>
          </div>

          <form onSubmit={handleCreateTicket} className="space-y-4 text-xs">
            {!user && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Your Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    placeholder="Full name"
                    className="w-full h-10 px-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={guestEmail}
                    onChange={(e) => setGuestEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full h-10 px-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  />
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Issue Category (Auto-Routes Queue &amp; Priority)
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full h-10 px-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-medium"
                >
                  <option value="delivery_issue">
                    Delivery Delay, Failed Collection or Handover Issue (P2)
                  </option>
                  <option value="payment_refund">
                    Payment Verification, Escrow Hold or Refund Request (P2)
                  </option>
                  <option value="seller_verification">
                    Seller Onboarding, KYC/CAC or Listing Issue (P3)
                  </option>
                  <option value="security_compromise">
                    Account Compromise, Fraud or Counterfeit Report (P1 Critical)
                  </option>
                  <option value="general_enquiry">
                    General Account or Platform Question (P4)
                  </option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Related Order (Optional)
                </label>
                <select
                  value={selectedOrderId}
                  onChange={(e) => setSelectedOrderId(e.target.value)}
                  className="w-full h-10 px-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-medium"
                >
                  <option value="">No specific order</option>
                  {(initialOrders || []).map((o: any) => (
                    <option key={o.id} value={o.id}>
                      #{o.order_number || o.id.slice(0, 8)} —{' '}
                      {o.product?.title || 'Hardware'}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Subject / Brief Summary
              </label>
              <input
                type="text"
                required
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. Courier has not arrived for Order #ORD-1234"
                className="w-full h-10 px-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-medium"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Detailed Description &amp; Evidence
              </label>
              <textarea
                rows={4}
                required
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                placeholder="Describe what happened, any references, and the outcome you need..."
                className="w-full p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-medium"
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-[11px] text-slate-400">
                Human Support Operating Hours: {SUPPORT_OPERATING_HOURS.humanSupportHours}
              </span>
              <Button
                type="submit"
                disabled={ticketSubmitting}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl h-10 px-6 cursor-pointer gap-1.5"
              >
                {ticketSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Submit Support Case</span>
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* =====================================================================
          TAB 4: APPROVED KNOWLEDGE BASE & PRIVACY POLICY
          ===================================================================== */}
      {activeTab === 'knowledge' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {APPROVED_KNOWLEDGE_BASE.map((art) => (
              <div
                key={art.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs space-y-3 text-xs"
              >
                <div className="flex items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-2.5">
                  <h3 className="font-black text-sm text-slate-900 dark:text-white">
                    {art.title}
                  </h3>
                  <Badge variant="outline" className="text-[10px] shrink-0">
                    v{art.version}
                  </Badge>
                </div>
                <p className="text-slate-500 dark:text-slate-400 font-medium">
                  {art.summary}
                </p>
                <ul className="space-y-1.5 text-slate-700 dark:text-slate-300">
                  {art.content.map((line, i) => (
                    <li key={i} className="leading-relaxed">
                      {line}
                    </li>
                  ))}
                </ul>
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[10px] text-slate-400">
                  <span>Owner: {art.owner}</span>
                  <span>Reviewed: {art.lastReviewed}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Operational Queues & Priority Matrix Reference */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
            <h3 className="text-sm font-black text-slate-900 dark:text-white">
              Operational Support Queues &amp; Priority Targets
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              {Object.entries(PRIORITY_SLA_HOURS).map(([key, val]) => (
                <div
                  key={key}
                  className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 space-y-1"
                >
                  <span className="font-black text-slate-900 dark:text-white block">
                    {val.label} (Target: {val.hours}h)
                  </span>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {val.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}