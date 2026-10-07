'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  return createAdminClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

async function checkAdmin(supabase: any) {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, is_admin, roles')
    .eq('id', user.id)
    .single()

  const userRoles: string[] = profile?.roles || (profile?.role ? [profile.role] : [])
  const isAdmin = profile?.is_admin === true || profile?.role === 'admin' || userRoles.includes('admin')

  if (!isAdmin) throw new Error('Forbidden: Administrative access required')
  return user
}

// 1. Seller Trust Status
export async function setSellerTrustStatus(
  sellerId: string,
  status: 'verified' | 'rejected' | 'unverified'
) {
  const supabase = await createClient()
  await checkAdmin(supabase)

  const adminClient = getAdminClient()
  const { error } = await adminClient
    .from('profiles')
    .update({
      tech_trust_status: status,
      verified_at: status === 'verified' ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', sellerId)

  if (error) throw error

  revalidatePath('/admin/overview')
  revalidatePath('/admin/verifications')
  revalidatePath('/seller/dashboard')
  revalidatePath('/seller/verify')
}

// 2. Listing Moderation (Take Down / Restore)
export async function toggleProductStatus(productId: string, newStatus: 'published' | 'hidden') {
  const supabase = await createClient()
  await checkAdmin(supabase)

  const adminClient = getAdminClient()
  const { error } = await adminClient
    .from('products')
    .update({ status: newStatus, updated_at: new Date().toISOString() })
    .eq('id', productId)

  if (error) throw error

  revalidatePath('/admin/overview')
  revalidatePath('/admin/products')
  revalidatePath('/products')
  revalidatePath('/feed')
}

// 3. Process or Decline Seller Bank Payout
export async function updatePayoutStatus(
  payoutId: string,
  status: 'processed' | 'declined',
  reason?: string
) {
  const supabase = await createClient()
  await checkAdmin(supabase)

  const adminClient = getAdminClient()

  // If declined, refund amount back to seller's available balance
  if (status === 'declined') {
    const { data: payout } = await adminClient
      .from('payout_requests')
      .select('seller_id, amount')
      .eq('id', payoutId)
      .single()

    if (payout) {
      const { data: profile } = await adminClient
        .from('profiles')
        .select('available_payout')
        .eq('id', payout.seller_id)
        .single()

      const restored = Number(profile?.available_payout || 0) + Number(payout.amount)
      await adminClient
        .from('profiles')
        .update({ available_payout: restored })
        .eq('id', payout.seller_id)
    }
  }

  const { error } = await adminClient
    .from('payout_requests')
    .update({
      status,
      admin_notes: reason || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', payoutId)

  if (error) return { success: false, error: error.message }

  revalidatePath('/admin/payouts')
  revalidatePath('/admin/overview')
  return { success: true }
}

// 4. Resolve Escrow Dispute (Refund Buyer or Release to Seller)
export async function resolveEscrowDispute(
  orderId: string,
  resolution: 'refund_buyer' | 'release_seller',
  notes?: string
) {
  const supabase = await createClient()
  await checkAdmin(supabase)

  const adminClient = getAdminClient()
  const newOrderStatus = resolution === 'refund_buyer' ? 'refunded' : 'completed'
  const newDisputeStatus = 'resolved'

  const { data: order } = await adminClient
    .from('orders')
    .select('*, profiles!orders_seller_id_fkey(*)')
    .eq('id', orderId)
    .single()

  if (!order) return { success: false, error: 'Order not found' }

  // A. If released to seller: transfer net payout into seller available balance
  if (resolution === 'release_seller') {
    const netPayout = Number(order.seller_payout || order.amount * 0.93)
    const currentAvailable = Number(order.profiles?.available_payout || 0)

    await adminClient
      .from('profiles')
      .update({ available_payout: currentAvailable + netPayout })
      .eq('id', order.seller_id)

    await adminClient
      .from('orders')
      .update({
        order_status: 'completed',
        payout_status: 'eligible',
        dispute_status: newDisputeStatus,
        dispute_resolution: resolution,
        dispute_notes: notes || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId)
  }

  // B. If refund approved: write to refunds pipeline and post compensating ledger entries
  if (resolution === 'refund_buyer') {
    const refundNumber = `RF-${Math.floor(1000 + Math.random() * 9000)}`
    const refundAmount = Number(order.total_amount || order.amount)

    // Log to refunds pipeline
    await adminClient.from('refunds').insert({
      refund_number: refundNumber,
      order_id: order.id,
      buyer_id: order.buyer_id,
      seller_id: order.seller_id,
      amount: refundAmount,
      reason: notes || 'Failed device physical inspection',
      status: 'approved',
      approved_at: new Date().toISOString(),
    })

    // Update order status
    await adminClient
      .from('orders')
      .update({
        order_status: 'refunded',
        refund_status: 'approved',
        payout_status: 'cancelled',
        dispute_status: newDisputeStatus,
        dispute_resolution: resolution,
        dispute_notes: notes || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId)

    // Post compensating ledger journal entries
    await adminClient.from('financial_ledger').insert([
      {
        order_id: order.id,
        buyer_id: order.buyer_id,
        seller_id: order.seller_id,
        transaction_type: 'refund_buyer',
        account: 'escrow_holding',
        entry_type: 'credit',
        amount: refundAmount,
        idempotency_key: `refund_escrow_credit_${order.id}_${Date.now()}`,
        reference: refundNumber,
      },
      {
        order_id: order.id,
        buyer_id: order.buyer_id,
        seller_id: order.seller_id,
        transaction_type: 'refund_buyer',
        account: 'buyer_refund_pool',
        entry_type: 'debit',
        amount: refundAmount,
        idempotency_key: `refund_buyer_pool_debit_${order.id}_${Date.now()}`,
        reference: refundNumber,
      },
    ])
  }

  // Update dispute record
  await adminClient
    .from('disputes')
    .update({
      status: 'resolved',
      resolution: resolution === 'refund_buyer' ? 'refund_buyer_full' : 'release_seller',
      resolution_notes: notes || null,
      resolved_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('order_id', orderId)

  revalidatePath('/admin/disputes')
  revalidatePath('/admin/overview')
  revalidatePath(`/orders/${orderId}`)
  return { success: true }
}

// 5. Upgrade or Downgrade Merchant Subscription Plan
export async function updateSellerSubscription(
  sellerId: string,
  plan: 'free' | 'pro',
  customCredits?: number
) {
  const supabase = await createClient()
  await checkAdmin(supabase)
  const adminClient = getAdminClient()

  const defaultCredits = plan === 'pro' ? 25 : 5
  const listingCredits = typeof customCredits === 'number' ? customCredits : defaultCredits

  const { error } = await adminClient
    .from('profiles')
    .update({
      seller_plan: plan,
      subscription_tier: plan,
      listing_credits: listingCredits,
      updated_at: new Date().toISOString(),
    })
    .eq('id', sellerId)

  if (error) return { success: false, error: error.message }

  revalidatePath('/admin/techpass')
  revalidatePath('/admin/overview')
  revalidatePath('/seller')
  revalidatePath('/seller/subscription')
  return { success: true }
}

// Append to src/app/admin/actions.ts

/**
 * Assigns or switches a user's role (Admin, Delivery Partner, Seller, Buyer)
 */
export async function setUserRole(
  userId: string,
  targetRole: 'admin' | 'delivery' | 'seller' | 'buyer'
) {
  const supabase = await createClient()
  await checkAdmin(supabase)
  const adminClient = getAdminClient()

  const { data: profile, error: fetchErr } = await adminClient
    .from('profiles')
    .select('id, roles, role, is_admin, is_delivery')
    .eq('id', userId)
    .single()

  if (fetchErr || !profile) {
    return { success: false, error: 'User profile not found' }
  }

  const currentRoles: string[] = profile.roles || [profile.role || 'buyer']
  const updatedRoles = Array.from(new Set([...currentRoles, targetRole]))

  const updatePayload: Record<string, any> = {
    role: targetRole,
    roles: updatedRoles,
    updated_at: new Date().toISOString(),
  }

  if (targetRole === 'admin') {
    updatePayload.is_admin = true
  } else if (targetRole === 'delivery') {
    updatePayload.is_delivery = true
    updatePayload.is_online = true
  }

  const { error: updateErr } = await adminClient
    .from('profiles')
    .update(updatePayload)
    .eq('id', userId)

  if (updateErr) {
    return { success: false, error: updateErr.message }
  }

  revalidatePath('/admin/users')
  revalidatePath('/admin/overview')
  return { success: true }
}

/**
 * Revokes elevated roles and sets the user back to standard buyer
 */
export async function revokeUserRole(userId: string) {
  const supabase = await createClient()
  await checkAdmin(supabase)
  const adminClient = getAdminClient()

  const { error } = await adminClient
    .from('profiles')
    .update({
      role: 'buyer',
      is_admin: false,
      is_delivery: false,
      roles: ['buyer'],
      is_online: false,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId)

  if (error) return { success: false, error: error.message }

  revalidatePath('/admin/users')
  return { success: true }
}