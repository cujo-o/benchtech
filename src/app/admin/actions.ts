'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

function getAdminDb() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  return createAdminClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

async function requireAdmin() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) throw new Error('Unauthorized')

  const adminDb = getAdminDb()
  const { data: profile } = await adminDb
    .from('profiles')
    .select('role, roles, is_admin')
    .eq('id', user.id)
    .maybeSingle()

  const roles: string[] = Array.isArray(profile?.roles)
    ? profile.roles
    : profile?.role
    ? [profile.role]
    : []

  if (profile?.role !== 'admin' && profile?.is_admin !== true && !roles.includes('admin')) {
    throw new Error('Forbidden')
  }

  return { user, adminDb }
}

/* =========================================================================
   1. ORDERS & ESCROW SETTLEMENT ACTIONS
   ========================================================================= */
export async function adminVerifyOrderDelivery(orderId: string) {
  const { user, adminDb } = await requireAdmin()
  const now = new Date()
  const protectionEnds = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString()

  await adminDb
    .from('orders')
    .update({
      delivery_status: 'verified',
      order_status: 'delivered',
      payout_status: 'on_hold',
      protection_ends_at: protectionEnds,
      updated_at: now.toISOString(),
    })
    .eq('id', orderId)

  await adminDb.from('audit_events').insert({
    actor_id: user.id,
    action: 'admin_verified_order_delivery',
    target_type: 'order',
    target_id: orderId,
    result: 'verified',
  })

  revalidatePath('/admin/orders')
  revalidatePath('/admin')
}

export async function adminReleaseOrderPayout(orderId: string) {
  const { user, adminDb } = await requireAdmin()

  const { data: order } = await adminDb
    .from('orders')
    .select('*')
    .eq('id', orderId)
    .maybeSingle()

  if (!order || order.payout_status === 'paid') return

  const payoutAmount = Number(order.seller_payout || order.amount || 0)

  // Credit Seller's available_payout balance
  const { data: sellerProfile } = await adminDb
    .from('profiles')
    .select('available_payout')
    .eq('id', order.seller_id)
    .maybeSingle()

  const updatedBalance = Number(sellerProfile?.available_payout || 0) + payoutAmount

  await adminDb
    .from('profiles')
    .update({
      available_payout: updatedBalance,
      updated_at: new Date().toISOString(),
    })
    .eq('id', order.seller_id)

  await adminDb
    .from('orders')
    .update({
      payout_status: 'paid',
      order_status: 'completed',
      status: 'completed',
      updated_at: new Date().toISOString(),
    })
    .eq('id', orderId)

  await adminDb.from('audit_events').insert({
    actor_id: user.id,
    action: 'admin_released_order_payout',
    target_type: 'order',
    target_id: orderId,
    result: 'paid',
    metadata: { amount: payoutAmount, seller_id: order.seller_id },
  })

  revalidatePath('/admin/orders')
  revalidatePath('/admin/payouts')
  revalidatePath('/admin')
}

export async function adminRefundOrder(orderId: string) {
  const { user, adminDb } = await requireAdmin()

  await adminDb
    .from('orders')
    .update({
      order_status: 'refunded',
      status: 'refunded',
      payout_status: 'cancelled',
      updated_at: new Date().toISOString(),
    })
    .eq('id', orderId)

  await adminDb.from('audit_events').insert({
    actor_id: user.id,
    action: 'admin_refunded_order',
    target_type: 'order',
    target_id: orderId,
    result: 'refunded',
  })

  revalidatePath('/admin/orders')
  revalidatePath('/admin/disputes')
  revalidatePath('/admin')
}

/* =========================================================================
   2. SELLER BANK PAYOUT SETTLEMENT ACTIONS
   ========================================================================= */
export async function adminSettleSellerBalance(sellerId: string) {
  const { user, adminDb } = await requireAdmin()

  const { data: seller } = await adminDb
    .from('profiles')
    .select('available_payout, business_name, full_name')
    .eq('id', sellerId)
    .maybeSingle()

  const amountSettled = Number(seller?.available_payout || 0)
  if (amountSettled <= 0) return

  await adminDb
    .from('profiles')
    .update({
      available_payout: 0,
      updated_at: new Date().toISOString(),
    })
    .eq('id', sellerId)

  await adminDb.from('audit_events').insert({
    actor_id: user.id,
    action: 'admin_settled_seller_bank_payout',
    target_type: 'profile',
    target_id: sellerId,
    result: 'paid',
    metadata: { amount: amountSettled },
  })

  revalidatePath('/admin/payouts')
  revalidatePath('/admin')
}

/* =========================================================================
   3. USERS & MERCHANTS MANAGEMENT ACTIONS
   ========================================================================= */
export async function adminUpdateUserRole(
  targetUserId: string,
  role: 'buyer' | 'seller' | 'admin'
) {
  const { user, adminDb } = await requireAdmin()

  const updates: Record<string, any> = {
    role,
    is_admin: role === 'admin',
    is_seller: role === 'seller' || role === 'admin',
    roles:
      role === 'admin'
        ? ['buyer', 'seller', 'admin']
        : role === 'seller'
        ? ['buyer', 'seller']
        : ['buyer'],
    updated_at: new Date().toISOString(),
  }

  await adminDb.from('profiles').update(updates).eq('id', targetUserId)

  await adminDb.from('audit_events').insert({
    actor_id: user.id,
    action: 'admin_changed_user_role',
    target_type: 'profile',
    target_id: targetUserId,
    result: role,
  })

  revalidatePath('/admin/users')
  revalidatePath('/admin')
}

export async function adminToggleSellerVerify(
  targetUserId: string,
  verify: boolean
) {
  const { user, adminDb } = await requireAdmin()

  await adminDb
    .from('profiles')
    .update({
      tech_trust_status: verify ? 'verified' : 'unverified',
      verification_state: verify ? 'verified' : 'action_required',
      is_seller: true,
      role: 'seller',
      updated_at: new Date().toISOString(),
    })
    .eq('id', targetUserId)

  await adminDb
    .from('seller_verifications')
    .update({
      status: verify ? 'verified' : 'action_required',
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq('seller_id', targetUserId)

  revalidatePath('/admin/users')
  revalidatePath('/admin/verifications')
  revalidatePath('/sellers')
}

export async function adminToggleProPlan(targetUserId: string, makePro: boolean) {
  const { adminDb } = await requireAdmin()

  await adminDb
    .from('profiles')
    .update({
      seller_plan: makePro ? 'pro' : 'free',
      subscription_tier: makePro ? 'pro' : 'free',
      updated_at: new Date().toISOString(),
    })
    .eq('id', targetUserId)

  revalidatePath('/admin/users')
}

/* =========================================================================
   4. PRODUCT CATALOG MODERATION ACTIONS
   ========================================================================= */
export async function adminUpdateProductStatus(
  productId: string,
  status: 'published' | 'hidden'
) {
  const { adminDb } = await requireAdmin()

  await adminDb
    .from('products')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', productId)

  revalidatePath('/admin/listings')
  revalidatePath('/products')
  revalidatePath('/feed')
}

export async function adminToggleProductFeatured(
  productId: string,
  featured: boolean
) {
  const { adminDb } = await requireAdmin()
  const featuredUntil = featured
    ? new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
    : null

  await adminDb
    .from('products')
    .update({
      is_featured: featured,
      featured_until: featuredUntil,
      updated_at: new Date().toISOString(),
    })
    .eq('id', productId)

  revalidatePath('/admin/listings')
  revalidatePath('/feed')
}

export async function adminDeleteProduct(productId: string) {
  const { adminDb } = await requireAdmin()
  await adminDb.from('products').delete().eq('id', productId)

  revalidatePath('/admin/listings')
  revalidatePath('/products')
  revalidatePath('/feed')
}

/* =========================================================================
   5. DISPUTE ARBITRATION ACTIONS
   ========================================================================= */
export async function adminResolveDispute(
  disputeId: string,
  orderId: string,
  resolution: 'release_to_seller' | 'refund_buyer'
) {
  const { user, adminDb } = await requireAdmin()

  await adminDb
    .from('disputes')
    .update({
      status: 'resolved',
      resolution,
      resolved_at: new Date().toISOString(),
    })
    .eq('id', disputeId)

  if (resolution === 'release_to_seller') {
    await adminReleaseOrderPayout(orderId)
  } else {
    await adminRefundOrder(orderId)
  }

  await adminDb
    .from('orders')
    .update({ dispute_status: 'resolved' })
    .eq('id', orderId)

  await adminDb.from('audit_events').insert({
    actor_id: user.id,
    action: 'admin_resolved_dispute',
    target_type: 'dispute',
    target_id: disputeId,
    result: resolution,
  })

  revalidatePath('/admin/disputes')
  revalidatePath('/admin/orders')
}

/* =========================================================================
   6. ADVERTISING & PROMOTIONS ACTIONS
   ========================================================================= */
export async function adminToggleAdCampaign(
  campaignId: string,
  nextStatus: 'active' | 'paused'
) {
  const { adminDb } = await requireAdmin()

  await adminDb
    .from('ad_campaigns')
    .update({ status: nextStatus, updated_at: new Date().toISOString() })
    .eq('id', campaignId)

  revalidatePath('/admin/advertising')
}

export async function adminCreditSellerAdWallet(formData: FormData) {
  const { user, adminDb } = await requireAdmin()

  const sellerId = (formData.get('sellerId') as string) || ''
  const amount = Number(formData.get('amount') || 0)

  if (!sellerId || amount <= 0) return

  const { data: current } = await adminDb
    .from('ad_wallets')
    .select('balance')
    .eq('seller_id', sellerId)
    .maybeSingle()

  const newBalance = Number(current?.balance || 0) + amount

  await adminDb.from('ad_wallets').upsert(
    {
      seller_id: sellerId,
      balance: newBalance,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'seller_id' }
  )

  await adminDb.from('audit_events').insert({
    actor_id: user.id,
    action: 'admin_credited_ad_wallet',
    target_type: 'ad_wallet',
    target_id: sellerId,
    result: 'credited',
    metadata: { amount },
  })

  revalidatePath('/admin/advertising')
}

/* =========================================================================
   7. RISK, ANTI-FRAUD & RE-VERIFICATION ACTIONS
   ========================================================================= */
export async function adminTriggerSellerReverify(sellerId: string, reason: string) {
  const { user, adminDb } = await requireAdmin()
  const now = new Date().toISOString()

  await adminDb
    .from('profiles')
    .update({
      verification_state: 'reverify',
      tech_trust_status: 'pending',
      verification_feedback: reason,
      updated_at: now,
    })
    .eq('id', sellerId)

  await adminDb
    .from('seller_verifications')
    .update({
      status: 'reverify',
      action_required_note: reason,
      updated_at: now,
    })
    .eq('seller_id', sellerId)

  await adminDb.from('audit_events').insert({
    actor_id: user.id,
    action: 'admin_triggered_seller_reverify',
    target_type: 'seller_verification',
    target_id: sellerId,
    result: 'reverify',
    metadata: { reason },
  })

  revalidatePath('/admin/risk')
  revalidatePath('/admin/verifications')
  revalidatePath('/admin/users')
}

export async function adminSetSellerRestriction(
  sellerId: string,
  state: 'restricted' | 'suspended' | 'verified'
) {
  const { user, adminDb } = await requireAdmin()
  const now = new Date().toISOString()

  await adminDb
    .from('profiles')
    .update({
      verification_state: state,
      tech_trust_status: state === 'verified' ? 'verified' : 'unverified',
      updated_at: now,
    })
    .eq('id', sellerId)

  // If suspended, unpublish active listings
  if (state === 'suspended') {
    await adminDb
      .from('products')
      .update({ status: 'hidden', updated_at: now })
      .eq('seller_id', sellerId)
  }

  await adminDb.from('audit_events').insert({
    actor_id: user.id,
    action: `admin_set_seller_${state}`,
    target_type: 'profile',
    target_id: sellerId,
    result: state,
  })

  revalidatePath('/admin/risk')
  revalidatePath('/admin/users')
  revalidatePath('/admin/listings')
}

/* =========================================================================
   8. BUYER SOURCING & REQUESTS ACTIONS
   ========================================================================= */
export async function adminUpdateBuyingRequestStatus(
  requestId: string,
  status: 'confirmed' | 'completed' | 'cancelled'
) {
  const { adminDb } = await requireAdmin()

  await adminDb
    .from('buying_requests')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', requestId)

  revalidatePath('/admin/requests')
}

/* =========================================================================
   9. TECHSPIN REWARDS CONFIGURATION ACTIONS
   ========================================================================= */
export async function adminCreateTechSpinPrize(formData: FormData) {
  const { user, adminDb } = await requireAdmin()

  const label = ((formData.get('label') as string) || '').trim()
  const code = ((formData.get('code') as string) || '').trim().toUpperCase() || null
  const color = ((formData.get('color') as string) || '#2563EB').trim()
  const discountAmount = Number(formData.get('discountAmount') || 0)

  if (!label) return

  try {
    await adminDb.from('techspin_prizes').insert({
      label,
      code,
      color,
      discount_amount: discountAmount,
      is_active: true,
    })
  } catch {}

  await adminDb.from('audit_events').insert({
    actor_id: user.id,
    action: 'admin_created_techspin_prize',
    target_type: 'techspin',
    target_id: code || label,
    result: 'created',
    metadata: { label, code, color, discountAmount },
  })

  revalidatePath('/admin/techspin')
}

export async function adminDeleteTechSpinPrize(prizeId: string) {
  const { adminDb } = await requireAdmin()
  try {
    await adminDb.from('techspin_prizes').delete().eq('id', prizeId)
  } catch {}
  revalidatePath('/admin/techspin')
}

/* =========================================================================
   10. PLATFORM ECONOMICS & TRUST SETTINGS ACTIONS
   ========================================================================= */
export async function adminSavePlatformSettings(formData: FormData) {
  const { user, adminDb } = await requireAdmin()

  const standardCommission = Number(formData.get('standardCommission') || 7.0)
  const proCommission = Number(formData.get('proCommission') || 5.0)
  const adSaleFee = Number(formData.get('adSaleFee') || 2.5)
  const inspectionDays = Number(formData.get('inspectionDays') || 7)
  const highValueThreshold = Number(formData.get('highValueThreshold') || 800000)

  await adminDb.from('audit_events').insert({
    actor_id: user.id,
    action: 'admin_updated_platform_settings',
    target_type: 'platform_settings',
    target_id: 'global',
    result: 'updated',
    metadata: {
      standardCommission,
      proCommission,
      adSaleFee,
      inspectionDays,
      highValueThreshold,
    },
  })

  revalidatePath('/admin/settings')
  revalidatePath('/admin')
}