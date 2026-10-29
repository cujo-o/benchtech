'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { PRIORITY_SLA_HOURS } from '@/lib/support/knowledgeBase'

function getAdminDb() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  return createAdminClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

/**
 * Map actual database order fields to the verified 9-stage lifecycle
 * Never infers stages from elapsed time.
 */
function mapVerifiedOrderLifecycle(order: any) {
  const stages = [
    { key: 'placed', label: 'Order Placed & Payment Captured', confirmed: true },
    {
      key: 'seller_confirmed',
      label: 'Seller Confirmed / Preparing Item',
      confirmed: Boolean(
        order.order_status !== 'cancelled' && order.order_status !== 'refunded'
      ),
    },
    {
      key: 'carrier_assigned',
      label: 'Authorized Courier Assigned',
      confirmed: Boolean(order.courier_id || order.courier_name),
    },
    {
      key: 'in_transit',
      label: 'Dispatched / In Transit in Abuja',
      confirmed:
        order.delivery_status === 'dispatched' ||
        order.delivery_status === 'verified',
    },
    {
      key: 'delivered',
      label: 'Delivered & Handover OTP Verified',
      confirmed: order.delivery_status === 'verified',
    },
    {
      key: 'settled',
      label: 'Inspection Complete / Completed',
      confirmed:
        order.order_status === 'completed' || order.payout_status === 'paid',
    },
  ]

  let currentHeadline = 'Order Placed'
  if (order.order_status === 'cancelled') currentHeadline = 'Order Cancelled'
  else if (order.order_status === 'refunded') currentHeadline = 'Order Refunded'
  else if (order.delivery_status === 'exception')
    currentHeadline = `Delivery Exception: ${order.delivery_exception || 'Under investigation'}`
  else if (order.order_status === 'completed' || order.payout_status === 'paid')
    currentHeadline = 'Completed'
  else if (order.delivery_status === 'verified')
    currentHeadline = 'Delivered (In 7-Day Buyer Inspection Window)'
  else if (order.delivery_status === 'dispatched')
    currentHeadline = 'In Transit / Out for Delivery'
  else currentHeadline = 'Awaiting Seller Dispatch'

  return { currentHeadline, stages }
}

/* =========================================================================
   1. TOOL: get_order_status (Strict Ownership Verification - Test A & Test D)
   ========================================================================= */
export async function getOrderStatusTool(orderQuery: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return {
      ok: false,
      error: 'Please sign in so we can verify your account and look up your order.',
    }
  }

  const cleanRef = (orderQuery || '').trim().replace(/^#/, '')
  if (!cleanRef) {
    return { ok: false, error: 'Please enter a valid Order ID or Payment Reference.' }
  }

  const adminDb = getAdminDb()

  // Search by id prefix, order_number, or payment_reference
  const { data: candidates } = await adminDb
    .from('orders')
    .select(
      `
      *,
      product:products(id, title, price, condition),
      seller:profiles!orders_seller_id_fkey(business_name, full_name, district)
    `
    )
    .order('created_at', { ascending: false })
    .limit(100)

  const matchedOrder = (candidates || []).find((o: any) => {
    const idMatch = o.id?.toLowerCase().startsWith(cleanRef.toLowerCase())
    const numMatch =
      o.order_number?.toLowerCase() === cleanRef.toLowerCase()
    const refMatch =
      o.payment_reference?.toLowerCase() === cleanRef.toLowerCase()
    return idMatch || numMatch || refMatch
  })

  if (!matchedOrder) {
    return {
      ok: false,
      error: `No order found matching "${cleanRef}". Please verify the reference on your Orders page.`,
    }
  }

  // MANDATORY OWNERSHIP CHECK (Test D: Cross-Customer Access Prevention)
  const isOwner =
    matchedOrder.buyer_id === user.id || matchedOrder.seller_id === user.id

  if (!isOwner) {
    await adminDb.from('audit_events').insert({
      actor_id: user.id,
      action: 'unauthorized_order_lookup_attempt',
      target_type: 'order',
      target_id: matchedOrder.id,
      result: 'denied',
      metadata: { attempted_ref: cleanRef },
    })

    return {
      ok: false,
      error:
        'Access denied: You can only view status information for orders associated with your own account.',
    }
  }

  const lifecycle = mapVerifiedOrderLifecycle(matchedOrder)

  return {
    ok: true,
    order: {
      id: matchedOrder.id,
      reference:
        matchedOrder.order_number ||
        matchedOrder.payment_reference ||
        matchedOrder.id.slice(0, 8),
      itemTitle: matchedOrder.product?.title || 'Hardware Order',
      amount: Number(matchedOrder.total_amount || matchedOrder.amount || 0),
      orderStatus: matchedOrder.order_status || matchedOrder.status || 'paid',
      deliveryStatus: matchedOrder.delivery_status || 'pending',
      payoutStatus: matchedOrder.payout_status || 'on_hold',
      deliveryException: matchedOrder.delivery_exception || null,
      courierName: matchedOrder.courier_name || null,
      courierPhone: matchedOrder.courier_phone || null,
      handoverOtp:
        matchedOrder.buyer_id === user.id
          ? matchedOrder.delivery_otp || null
          : null,
      protectionEndsAt: matchedOrder.protection_ends_at || null,
      sellerName:
        matchedOrder.seller?.business_name ||
        matchedOrder.seller?.full_name ||
        'Verified Store',
      createdAt: matchedOrder.created_at,
      currentHeadline: lifecycle.currentHeadline,
      stages: lifecycle.stages,
      canCancelAutomatically:
        matchedOrder.buyer_id === user.id &&
        matchedOrder.delivery_status !== 'dispatched' &&
        matchedOrder.delivery_status !== 'verified' &&
        matchedOrder.order_status !== 'cancelled' &&
        matchedOrder.order_status !== 'refunded',
    },
  }
}

/* =========================================================================
   2. TOOL: get_product_details (Live Catalog Lookup without Restricted Data)
   ========================================================================= */
export async function getProductDetailsTool(searchQuery: string) {
  const clean = (searchQuery || '').trim()
  if (!clean) return { ok: false, products: [] }

  const adminDb = getAdminDb()
  const { data: products } = await adminDb
    .from('products')
    .select(
      'id, title, brand, model, category, condition, price, stock_quantity, specs, location, profiles!products_seller_id_fkey(business_name, district, tech_trust_status)'
    )
    .eq('status', 'published')
    .or(`title.ilike.%${clean}%,brand.ilike.%${clean}%,category.ilike.%${clean}%`)
    .limit(5)

  return {
    ok: true,
    products: (products || []).map((p: any) => {
      const seller = Array.isArray(p.profiles) ? p.profiles[0] : p.profiles
      return {
        id: p.id,
        title: p.title,
        brand: p.brand,
        condition: p.condition?.replace(/_/g, ' ') || 'Used',
        price: Number(p.price || 0),
        stock: Number(p.stock_quantity || 1),
        specs: {
          storage: p.specs?.storage || null,
          ram: p.specs?.ram || null,
          processor: p.specs?.processor || null,
          battery_health: p.specs?.battery_health || null,
          warranty: p.specs?.warranty || null,
        },
        sellerName: seller?.business_name || 'Abuja Vendor',
        district: seller?.district || p.location || 'Abuja',
        sellerVerified: seller?.tech_trust_status === 'verified',
      }
    }),
  }
}

/* =========================================================================
   3. TOOL: get_refund_status (Verified Refund & Dispute Lookup - Test C)
   ========================================================================= */
export async function getRefundStatusTool(orderQuery: string) {
  const orderCheck = await getOrderStatusTool(orderQuery)
  if (!orderCheck.ok || !orderCheck.order) {
    return orderCheck
  }

  const adminDb = getAdminDb()
  const { data: dispute } = await adminDb
    .from('disputes')
    .select('*')
    .eq('order_id', orderCheck.order.id)
    .maybeSingle()

  const isRefunded = orderCheck.order.orderStatus === 'refunded'

  return {
    ok: true,
    refund: {
      orderReference: orderCheck.order.reference,
      itemTitle: orderCheck.order.itemTitle,
      amount: orderCheck.order.amount,
      refundState: isRefunded
        ? 'Refund Approved & Processed'
        : dispute
        ? `Dispute Case #${dispute.case_number || dispute.id.slice(0, 8)}: ${
            dispute.status?.toUpperCase() || 'OPEN'
          }`
        : 'No active refund request on record for this order',
      resolution: dispute?.resolution || null,
      policyNote:
        'Refund releases require verification by the Payments & Disputes team.',
    },
  }
}

/* =========================================================================
   4. LEVEL 3 AUTHORIZED ACTION: Cancel Eligible Pre-Dispatch Order
   ========================================================================= */
export async function cancelEligibleOrderTool(orderId: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { ok: false, error: 'Authentication required.' }

  const adminDb = getAdminDb()
  const { data: order } = await adminDb
    .from('orders')
    .select('*')
    .eq('id', orderId)
    .maybeSingle()

  if (!order || order.buyer_id !== user.id) {
    return { ok: false, error: 'Order not found or unauthorized.' }
  }

  if (
    order.delivery_status === 'dispatched' ||
    order.delivery_status === 'verified' ||
    order.order_status === 'completed'
  ) {
    return {
      ok: false,
      error:
        'This order has already been dispatched or delivered and cannot be cancelled automatically. Please open a support ticket for assistance.',
    }
  }

  await adminDb
    .from('orders')
    .update({
      order_status: 'cancelled',
      status: 'cancelled',
      payout_status: 'cancelled',
      updated_at: new Date().toISOString(),
    })
    .eq('id', orderId)

  await adminDb.from('audit_events').insert({
    actor_id: user.id,
    action: 'customer_cancelled_eligible_order',
    target_type: 'order',
    target_id: orderId,
    result: 'cancelled',
  })

  revalidatePath('/help')
  revalidatePath('/orders')
  revalidatePath('/admin/orders')

  return {
    ok: true,
    message:
      'Your pre-dispatch order has been cancelled and queued for refund settlement.',
  }
}

/* =========================================================================
   5. TOOL: create_support_ticket (Routing, Priority, SLA & Duplicate Prevention)
   ========================================================================= */
function determineQueueAndPriority(category: string, summaryText: string) {
  const text = `${category} ${summaryText}`.toLowerCase()

  if (
    category === 'security_compromise' ||
    /hacked|compromise|unauthorized|stolen|fraud|scam/.test(text)
  ) {
    return {
      queue: 'trust_safety',
      priority: 'P1' as const,
      nextAction: 'Immediate Trust & Safety incident investigation',
    }
  }

  if (
    category === 'delivery_issue' ||
    /missing|not delivered|courier|otp|failed collection|damaged|broken/.test(text)
  ) {
    return {
      queue: 'delivery_operations',
      priority: 'P2' as const,
      nextAction: 'Verify courier handover logs and contact dispatch',
    }
  }

  if (
    category === 'payment_refund' ||
    /refund|payment|escrow|debit|chargeback|dispute/.test(text)
  ) {
    return {
      queue: 'payments_disputes',
      priority: 'P2' as const,
      nextAction: 'Verify Paystack reference and escrow ledger state',
    }
  }

  if (
    category === 'seller_verification' ||
    /kyc|cac|onboarding|seller|payout|listing/.test(text)
  ) {
    return {
      queue: 'seller_support',
      priority: 'P3' as const,
      nextAction: 'Review seller account verification or listing record',
    }
  }

  return {
    queue: 'customer_order_support',
    priority: 'P4' as const,
    nextAction: 'Customer support agent review and response',
  }
}

export async function createSupportTicketAction(input: {
  category: string
  subject: string
  summary: string
  orderId?: string
  paymentReference?: string
  customerEmail?: string
  customerName?: string
  customerPhone?: string
  escalatedFromAi?: boolean
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const adminDb = getAdminDb()

  let profile: any = null
  if (user) {
    const { data } = await adminDb
      .from('profiles')
      .select('full_name, business_name, email, phone')
      .eq('id', user.id)
      .maybeSingle()
    profile = data
  }

  const subjectClean = (input.subject || '').trim()
  const summaryClean = (input.summary || '').trim()

  if (!subjectClean || !summaryClean) {
    return { ok: false, error: 'Please provide both a subject and a description of the issue.' }
  }

  // Idempotency key to prevent duplicate tickets on rapid retries (Test F)
  const minuteBucket = Math.floor(Date.now() / 60000)
  const idempotencyKey = `${user?.id || input.customerEmail || 'guest'}_${
    input.category
  }_${subjectClean.toLowerCase().slice(0, 30)}_${minuteBucket}`

  const { data: existingTicket } = await adminDb
    .from('support_tickets')
    .select('*')
    .eq('idempotency_key', idempotencyKey)
    .maybeSingle()

  if (existingTicket) {
    return {
      ok: true,
      ticket: existingTicket,
      deduplicated: true,
    }
  }

  const routing = determineQueueAndPriority(input.category, `${subjectClean} ${summaryClean}`)
  const slaHours = PRIORITY_SLA_HOURS[routing.priority].hours
  const slaDueAt = new Date(Date.now() + slaHours * 60 * 60 * 1000).toISOString()
  const ticketNumber = `TKT-${Math.floor(100000 + Math.random() * 900000)}`

  const validOrderId =
    input.orderId && /^[0-9a-f-]{36}$/i.test(input.orderId.trim())
      ? input.orderId.trim()
      : null

  const { data: created, error } = await adminDb
    .from('support_tickets')
    .insert({
      ticket_number: ticketNumber,
      user_id: user?.id || null,
      customer_name:
        input.customerName ||
        profile?.full_name ||
        profile?.business_name ||
        user?.email?.split('@')[0] ||
        'Customer',
      customer_email: input.customerEmail || profile?.email || user?.email || null,
      customer_phone: input.customerPhone || profile?.phone || null,
      order_id: validOrderId,
      payment_reference: input.paymentReference?.trim() || null,
      category: input.category,
      queue: routing.queue,
      priority: routing.priority,
      status: 'open',
      subject: subjectClean,
      summary: summaryClean,
      actions_taken: input.escalatedFromAi
        ? 'AI assistant gathered initial context and escalated to human queue.'
        : 'Ticket submitted via BenchTech Support Center.',
      next_action: routing.nextAction,
      idempotency_key: idempotencyKey,
      escalated_to_human: Boolean(input.escalatedFromAi),
      sla_due_at: slaDueAt,
    })
    .select('*')
    .single()

  if (error || !created) {
    return {
      ok: false,
      error: error?.message || 'Could not create support ticket.',
    }
  }

  // Insert initial message into thread
  await adminDb.from('support_ticket_messages').insert({
    ticket_id: created.id,
    sender_id: user?.id || null,
    sender_role: 'customer',
    sender_name: created.customer_name,
    message: summaryClean,
    is_internal_note: false,
  })

  await adminDb.from('audit_events').insert({
    actor_id: user?.id || null,
    action: 'support_ticket_created',
    target_type: 'support_ticket',
    target_id: created.id,
    result: `${routing.priority}_${routing.queue}`,
    metadata: {
      ticket_number: ticketNumber,
      category: input.category,
      escalated: Boolean(input.escalatedFromAi),
    },
  })

  revalidatePath('/help')
  revalidatePath('/admin/support-desk')

  return { ok: true, ticket: created }
}

/* =========================================================================
   6. CUSTOMER TICKET REPLIES & REOPENING (Section 7 Lifecycle)
   ========================================================================= */
export async function replyToSupportTicketAction(
  ticketId: string,
  messageText: string
) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { ok: false, error: 'Please sign in to reply.' }
  const cleanMsg = (messageText || '').trim()
  if (!cleanMsg) return { ok: false, error: 'Message cannot be empty.' }

  const adminDb = getAdminDb()
  const { data: ticket } = await adminDb
    .from('support_tickets')
    .select('*')
    .eq('id', ticketId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!ticket) return { ok: false, error: 'Ticket not found.' }

  await adminDb.from('support_ticket_messages').insert({
    ticket_id: ticketId,
    sender_id: user.id,
    sender_role: 'customer',
    sender_name: ticket.customer_name || 'Customer',
    message: cleanMsg,
    is_internal_note: false,
  })

  // If ticket was awaiting_info or resolved, move back to in_progress
  const nextStatus =
    ticket.status === 'awaiting_info' || ticket.status === 'resolved'
      ? 'in_progress'
      : ticket.status

  await adminDb
    .from('support_tickets')
    .update({
      status: nextStatus,
      next_action: 'Customer replied — awaiting support agent review',
      updated_at: new Date().toISOString(),
    })
    .eq('id', ticketId)

  revalidatePath('/help')
  revalidatePath('/admin/support-desk')
  return { ok: true }
}

export async function submitTicketCsatAction(ticketId: string, rating: number) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { ok: false }

  const adminDb = getAdminDb()
  await adminDb
    .from('support_tickets')
    .update({
      csat_rating: Math.min(5, Math.max(1, rating)),
      updated_at: new Date().toISOString(),
    })
    .eq('id', ticketId)
    .eq('user_id', user.id)

  revalidatePath('/help')
  revalidatePath('/admin/support-desk')
  return { ok: true }
}

/* =========================================================================
   7. HUMAN SUPPORT DASHBOARD (STAFF / ADMIN) ACTIONS
   ========================================================================= */
export async function adminUpdateSupportTicketAction(input: {
  ticketId: string
  status: string
  priority: string
  queue: string
  assignedOwnerName: string
  nextAction: string
  resolutionNotes: string
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { ok: false, error: 'Unauthorized' }

  const adminDb = getAdminDb()
  const now = new Date().toISOString()

  await adminDb
    .from('support_tickets')
    .update({
      status: input.status,
      priority: input.priority,
      queue: input.queue,
      assigned_to: user.id,
      assigned_owner_name: input.assignedOwnerName || 'Support Desk',
      next_action: input.nextAction,
      resolution_notes: input.resolutionNotes || null,
      resolved_at:
        input.status === 'resolved' || input.status === 'closed' ? now : null,
      updated_at: now,
    })
    .eq('id', input.ticketId)

  await adminDb.from('audit_events').insert({
    actor_id: user.id,
    action: 'staff_updated_support_ticket',
    target_type: 'support_ticket',
    target_id: input.ticketId,
    result: input.status,
    metadata: {
      queue: input.queue,
      priority: input.priority,
      next_action: input.nextAction,
    },
  })

  revalidatePath('/admin/support-desk')
  revalidatePath('/help')
  return { ok: true }
}

export async function adminAddTicketMessageAction(input: {
  ticketId: string
  message: string
  isInternalNote: boolean
  nextStatus?: string
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { ok: false, error: 'Unauthorized' }

  const adminDb = getAdminDb()
  const { data: adminProfile } = await adminDb
    .from('profiles')
    .select('full_name, business_name')
    .eq('id', user.id)
    .maybeSingle()

  const staffName =
    adminProfile?.full_name || adminProfile?.business_name || 'BenchTech Support'

  await adminDb.from('support_ticket_messages').insert({
    ticket_id: input.ticketId,
    sender_id: user.id,
    sender_role: 'support_agent',
    sender_name: staffName,
    message: input.message.trim(),
    is_internal_note: input.isInternalNote,
  })

  if (!input.isInternalNote && input.nextStatus) {
    await adminDb
      .from('support_tickets')
      .update({
        status: input.nextStatus,
        assigned_to: user.id,
        assigned_owner_name: staffName,
        next_action:
          input.nextStatus === 'awaiting_info'
            ? 'Awaiting customer response'
            : input.nextStatus === 'resolved'
            ? 'Resolution confirmed with customer'
            : 'Assigned staff following up',
        resolved_at:
          input.nextStatus === 'resolved' ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', input.ticketId)
  }

  revalidatePath('/admin/support-desk')
  revalidatePath('/help')
  return { ok: true }
}