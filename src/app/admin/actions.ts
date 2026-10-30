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
    .select('full_name, business_name, role, roles, is_admin')
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

  return { user, profile, adminDb }
}

/* =========================================================================
   1. ORDERS, COURIER ATTRIBUTION & ESCROW SETTLEMENT ACTIONS
   ========================================================================= */
export async function adminVerifyOrderDelivery(
  orderId: string,
  deliveredByName?: string
): Promise<void> {
  const { user, profile, adminDb } = await requireAdmin()
  const now = new Date()
  const protectionEnds = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString()

  const { data: existingOrder } = await adminDb
    .from('orders')
    .select('courier_id, courier_name')
    .eq('id', orderId)
    .maybeSingle()

  const finalCourierName =
    deliveredByName?.trim() ||
    existingOrder?.courier_name ||
    profile?.full_name ||
    profile?.business_name ||
    'Admin Verified'

  await adminDb
    .from('orders')
    .update({
      delivery_status: 'verified',
      order_status: 'delivered',
      payout_status: 'on_hold',
      courier_id: existingOrder?.courier_id || user.id,
      courier_name: finalCourierName,
      delivered_at: now.toISOString(),
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
    metadata: { delivered_by: finalCourierName },
  })

  revalidatePath('/admin/orders')
  revalidatePath('/admin/deliveries')
  revalidatePath('/delivery')
  revalidatePath('/admin')
}

export async function adminUpdateOrderCourier(formData: FormData): Promise<void> {
  const { user, adminDb } = await requireAdmin()
  const orderId = ((formData.get('orderId') as string) || '').trim()
  const courierId = ((formData.get('courierId') as string) || '').trim()
  const customCourierName = ((formData.get('courierName') as string) || '').trim()

  if (!orderId) return

  let resolvedName = customCourierName
  let resolvedPhone: string | null = null

  if (courierId) {
    const { data: courierProfile } = await adminDb
      .from('profiles')
      .select('full_name, business_name, phone')
      .eq('id', courierId)
      .maybeSingle()

    if (courierProfile) {
      resolvedName =
        courierProfile.full_name || courierProfile.business_name || resolvedName
      resolvedPhone = courierProfile.phone || null
    }
  }

  await adminDb
    .from('orders')
    .update({
      courier_id: courierId || null,
      courier_name: resolvedName || null,
      ...(resolvedPhone ? { courier_phone: resolvedPhone } : {}),
      updated_at: new Date().toISOString(),
    })
    .eq('id', orderId)

  await adminDb.from('audit_events').insert({
    actor_id: user.id,
    action: 'admin_updated_order_deliverer',
    target_type: 'order',
    target_id: orderId,
    result: resolvedName || 'assigned',
    metadata: { courier_id: courierId, courier_name: resolvedName },
  })

  revalidatePath('/admin/orders')
  revalidatePath('/admin/deliveries')
  revalidatePath('/delivery')
}

export async function adminReleaseOrderPayout(orderId: string): Promise<void> {
  const { user, adminDb } = await requireAdmin()

  const { data: order } = await adminDb
    .from('orders')
    .select('*')
    .eq('id', orderId)
    .maybeSingle()

  if (!order || order.payout_status === 'paid') return

  const payoutAmount = Number(order.seller_payout || order.amount || 0)

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
  revalidatePath('/seller/wallet')
  revalidatePath('/admin')
}

export async function adminRefundOrder(orderId: string): Promise<void> {
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
   2. SELLER BANK PAYOUTS & WITHDRAWAL REQUEST APPROVAL ACTIONS
   ========================================================================= */
export async function adminApproveWithdrawalRequest(
  withdrawalEventId: string
): Promise<void> {
  const { user, adminDb } = await requireAdmin()

  const { data: ev } = await adminDb
    .from('audit_events')
    .select('*')
    .eq('id', withdrawalEventId)
    .maybeSingle()

  if (!ev) return

  const updatedMetadata = {
    ...(ev.metadata || {}),
    settled_by: user.id,
    settled_at: new Date().toISOString(),
  }

  // Mark the seller's withdrawal request as 'paid' so /seller/wallet shows 'Settled'
  await adminDb
    .from('audit_events')
    .update({
      result: 'paid',
      metadata: updatedMetadata,
    })
    .eq('id', withdrawalEventId)

  await adminDb.from('audit_events').insert({
    actor_id: user.id,
    action: 'admin_approved_bank_withdrawal',
    target_type: 'payout',
    target_id: ev.target_id || ev.actor_id,
    result: 'paid',
    metadata: updatedMetadata,
  })

  revalidatePath('/admin/payouts')
  revalidatePath('/admin/finance')
  revalidatePath('/seller/wallet')
  revalidatePath('/seller/payouts')
  revalidatePath('/admin')
}

export async function adminSyncSellerWalletBalance(sellerId: string): Promise<void> {
  const { user, adminDb } = await requireAdmin()

  const [{ data: orders }, { data: withdrawals }, { data: ledgerEarly }] =
    await Promise.all([
      adminDb
        .from('orders')
        .select('id, seller_payout, status, order_status, payout_status')
        .eq('seller_id', sellerId),
      adminDb
        .from('audit_events')
        .select('metadata')
        .eq('actor_id', sellerId)
        .eq('action', 'seller_requested_bank_withdrawal'),
      adminDb
        .from('financial_ledger')
        .select('amount, reference')
        .eq('seller_id', sellerId)
        .eq('transaction_type', 'payout_disbursed'),
    ])

  // Sum early payouts or settled order credits minus bank withdrawals
  const earlyCredited = (ledgerEarly || []).reduce(
    (sum, e) => sum + Number(e.amount || 0),
    0
  )

  const settledOrdersSum = (orders || [])
    .filter((o) => o.payout_status === 'paid' || o.order_status === 'completed')
    .reduce((sum, o) => sum + Number(o.seller_payout || 0), 0)

  const baseCredited = Math.max(earlyCredited, settledOrdersSum)

  const totalWithdrawn = (withdrawals || []).reduce(
    (sum, w: any) => sum + Number(w.metadata?.amount || 0),
    0
  )

  const accurateAvailable = Math.max(0, baseCredited - totalWithdrawn)

  await adminDb
    .from('profiles')
    .update({
      available_payout: accurateAvailable,
      updated_at: new Date().toISOString(),
    })
    .eq('id', sellerId)

  await adminDb.from('audit_events').insert({
    actor_id: user.id,
    action: 'admin_synced_seller_wallet',
    target_type: 'profile',
    target_id: sellerId,
    result: 'synced',
    metadata: {
      baseCredited,
      totalWithdrawn,
      accurateAvailable,
    },
  })

  revalidatePath('/admin/payouts')
  revalidatePath('/seller/wallet')
  revalidatePath('/seller/payouts')
}

export async function adminSettleSellerBalance(sellerId: string): Promise<void> {
  const { user, adminDb } = await requireAdmin()

  const { data: seller } = await adminDb
    .from('profiles')
    .select('available_payout, business_name, full_name, bank_name, account_number, account_name')
    .eq('id', sellerId)
    .maybeSingle()

  const amountSettled = Number(seller?.available_payout || 0)
  if (amountSettled <= 0) return

  const settlementRef = `WD-ADM-${Date.now().toString().slice(-6)}`

  await adminDb
    .from('profiles')
    .update({
      available_payout: 0,
      updated_at: new Date().toISOString(),
    })
    .eq('id', sellerId)

  // Also mark any pending withdrawal requests for this seller as paid
  await adminDb
    .from('audit_events')
    .update({ result: 'paid' })
    .eq('actor_id', sellerId)
    .eq('action', 'seller_requested_bank_withdrawal')
    .eq('result', 'processing')

  await adminDb.from('audit_events').insert({
    actor_id: sellerId,
    action: 'seller_requested_bank_withdrawal',
    target_type: 'payout',
    target_id: sellerId,
    result: 'paid',
    metadata: {
      reference: settlementRef,
      amount: amountSettled,
      bank_name: seller?.bank_name || 'Bank Transfer',
      account_number: seller?.account_number || '',
      account_name: seller?.account_name || seller?.business_name || seller?.full_name,
      settled_by_admin: user.id,
    },
  })

  revalidatePath('/admin/payouts')
  revalidatePath('/seller/wallet')
  revalidatePath('/admin')
}

/* =========================================================================
   3. USERS, MERCHANTS & DELIVERERS MANAGEMENT ACTIONS
   ========================================================================= */
export async function adminUpdateUserRole(
  targetUserId: string,
  role: 'buyer' | 'seller' | 'delivery' | 'admin'
): Promise<void> {
  const { user, adminDb } = await requireAdmin()

  const { data: existing } = await adminDb
    .from('profiles')
    .select('roles, is_seller, is_delivery')
    .eq('id', targetUserId)
    .maybeSingle()

  const currentRoles: string[] = Array.isArray(existing?.roles)
    ? existing.roles
    : ['buyer']

  const updatedRoles = Array.from(new Set([...currentRoles, 'buyer', role]))

  const updates: Record<string, any> = {
    role,
    roles: updatedRoles,
    is_admin: role === 'admin',
    is_seller: role === 'seller' || role === 'admin' || Boolean(existing?.is_seller),
    is_delivery: role === 'delivery' || Boolean(existing?.is_delivery),
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
  revalidatePath('/admin/deliveries')
  revalidatePath('/delivery')
  revalidatePath('/admin')
}

export async function adminToggleDeliverer(
  targetUserId: string,
  makeDeliverer: boolean
): Promise<void> {
  const { user, adminDb } = await requireAdmin()

  const { data: existing } = await adminDb
    .from('profiles')
    .select('role, roles')
    .eq('id', targetUserId)
    .maybeSingle()

  const currentRoles: string[] = Array.isArray(existing?.roles)
    ? existing.roles
    : existing?.role
    ? [existing.role]
    : ['buyer']

  const nextRoles = makeDeliverer
    ? Array.from(new Set([...currentRoles, 'buyer', 'delivery']))
    : currentRoles.filter((r) => r !== 'delivery')

  const nextPrimaryRole = makeDeliverer
    ? existing?.role === 'admin'
      ? 'admin'
      : 'delivery'
    : existing?.role === 'delivery'
    ? nextRoles.includes('seller')
      ? 'seller'
      : 'buyer'
    : existing?.role || 'buyer'

  await adminDb
    .from('profiles')
    .update({
      role: nextPrimaryRole,
      roles: nextRoles,
      is_delivery: makeDeliverer,
      updated_at: new Date().toISOString(),
    })
    .eq('id', targetUserId)

  await adminDb.from('audit_events').insert({
    actor_id: user.id,
    action: makeDeliverer ? 'admin_granted_deliverer_role' : 'admin_revoked_deliverer_role',
    target_type: 'profile',
    target_id: targetUserId,
    result: makeDeliverer ? 'delivery' : nextPrimaryRole,
  })

  revalidatePath('/admin/users')
  revalidatePath('/admin/deliveries')
  revalidatePath('/delivery')
  revalidatePath('/admin')
}

export async function adminToggleSellerVerify(
  targetUserId: string,
  verify: boolean
): Promise<void> {
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

export async function adminToggleProPlan(
  targetUserId: string,
  makePro: boolean
): Promise<void> {
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
  revalidatePath('/admin/techpass')
}

/* =========================================================================
   4. PRODUCT CATALOG MODERATION ACTIONS
   ========================================================================= */
export async function adminUpdateProductStatus(
  productId: string,
  status: 'published' | 'hidden'
): Promise<void> {
  const { adminDb } = await requireAdmin()

  await adminDb
    .from('products')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', productId)

  revalidatePath('/admin/listings')
  revalidatePath('/admin/products')
  revalidatePath('/admin/reports')
  revalidatePath('/products')
  revalidatePath('/feed')
}

export async function adminToggleProductFeatured(
  productId: string,
  featured: boolean
): Promise<void> {
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
  revalidatePath('/admin/products')
  revalidatePath('/feed')
}

export async function adminDeleteProduct(productId: string): Promise<void> {
  const { adminDb } = await requireAdmin()
  await adminDb.from('products').delete().eq('id', productId)

  revalidatePath('/admin/listings')
  revalidatePath('/admin/products')
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
): Promise<void> {
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
): Promise<void> {
  const { adminDb } = await requireAdmin()

  await adminDb
    .from('ad_campaigns')
    .update({ status: nextStatus, updated_at: new Date().toISOString() })
    .eq('id', campaignId)

  revalidatePath('/admin/advertising')
  revalidatePath('/seller/promotions')
  revalidatePath('/feed')
  revalidatePath('/')
}

export async function adminCreditSellerAdWallet(formData: FormData): Promise<void> {
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
    metadata: { amount, new_balance: newBalance },
  })

  revalidatePath('/admin/advertising')
  revalidatePath('/seller/wallet')
  revalidatePath('/seller/promotions')
}

/* =========================================================================
   7. RISK, ANTI-FRAUD & RE-VERIFICATION ACTIONS
   ========================================================================= */
export async function adminTriggerSellerReverify(
  sellerId: string,
  reason: string
): Promise<void> {
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
): Promise<void> {
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
): Promise<void> {
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
export async function adminCreateTechSpinPrize(formData: FormData): Promise<void> {
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

export async function adminDeleteTechSpinPrize(prizeId: string): Promise<void> {
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
  const minWithdrawalAmount = Number(formData.get('minWithdrawalAmount') || 2000)
  const abujaDispatchFee = Number(formData.get('abujaDispatchFee') || 2500)

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
      minWithdrawalAmount,
      abujaDispatchFee,
    },
  })

  revalidatePath('/admin/settings')
  revalidatePath('/admin')
  return { success: true }
}

/* =========================================================================
   11. COMPATIBILITY EXPORTS FOR EXISTING ADMIN PAGES
   ========================================================================= */
export async function toggleProductStatus(
  productIdOrFormData: string | FormData,
  nextStatus?: string
): Promise<void> {
  const { adminDb } = await requireAdmin()

  let productId = ''
  let targetStatus = nextStatus

  if (typeof productIdOrFormData === 'string') {
    productId = productIdOrFormData
  } else if (productIdOrFormData instanceof FormData) {
    productId =
      (productIdOrFormData.get('productId') as string) ||
      (productIdOrFormData.get('id') as string) ||
      ''
    targetStatus =
      (productIdOrFormData.get('status') as string) ||
      (productIdOrFormData.get('nextStatus') as string) ||
      undefined
  }

  if (!productId) return

  if (!targetStatus) {
    const { data: current } = await adminDb
      .from('products')
      .select('status')
      .eq('id', productId)
      .maybeSingle()

    targetStatus = current?.status === 'published' ? 'hidden' : 'published'
  }

  await adminDb
    .from('products')
    .update({
      status: targetStatus,
      updated_at: new Date().toISOString(),
    })
    .eq('id', productId)

  revalidatePath('/admin/products')
  revalidatePath('/admin/listings')
  revalidatePath('/admin/reports')
  revalidatePath('/products')
  revalidatePath('/feed')
}

export async function updateSellerSubscription(
  sellerIdOrData:
    | string
    | FormData
    | {
        sellerId?: string
        userId?: string
        plan?: string
        tier?: string
        promoCredits?: number
      },
  planArg?: string,
  creditsArg?: number
) {
  const { user, adminDb } = await requireAdmin()

  let sellerId = ''
  let plan = planArg || 'pro'
  let promoCredits = creditsArg

  if (typeof sellerIdOrData === 'string') {
    sellerId = sellerIdOrData
  } else if (sellerIdOrData instanceof FormData) {
    sellerId =
      (sellerIdOrData.get('sellerId') as string) ||
      (sellerIdOrData.get('userId') as string) ||
      ''
    plan =
      (sellerIdOrData.get('plan') as string) ||
      (sellerIdOrData.get('tier') as string) ||
      'pro'
    if (sellerIdOrData.get('promoCredits')) {
      promoCredits = Number(sellerIdOrData.get('promoCredits'))
    }
  } else if (sellerIdOrData && typeof sellerIdOrData === 'object') {
    sellerId = sellerIdOrData.sellerId || sellerIdOrData.userId || ''
    plan = sellerIdOrData.plan || sellerIdOrData.tier || 'pro'
    promoCredits = sellerIdOrData.promoCredits
  }

  if (!sellerId) return { error: 'Seller ID required' }

  const normalizedTier =
    plan === 'professional' || plan === 'pro' || plan === 'standard'
      ? 'pro'
      : 'free'

  await adminDb
    .from('profiles')
    .update({
      seller_plan: normalizedTier,
      subscription_tier: normalizedTier,
      subscription_plan: plan,
      updated_at: new Date().toISOString(),
    })
    .eq('id', sellerId)

  if (typeof promoCredits === 'number' && promoCredits > 0) {
    const { data: wallet } = await adminDb
      .from('ad_wallets')
      .select('balance')
      .eq('seller_id', sellerId)
      .maybeSingle()

    await adminDb.from('ad_wallets').upsert(
      {
        seller_id: sellerId,
        balance: Number(wallet?.balance || 0) + promoCredits,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'seller_id' }
    )
  }

  await adminDb.from('audit_events').insert({
    actor_id: user.id,
    action: 'admin_updated_seller_subscription',
    target_type: 'profile',
    target_id: sellerId,
    result: normalizedTier,
    metadata: { plan, promoCredits },
  })

  revalidatePath('/admin/techpass')
  revalidatePath('/admin/users')
  revalidatePath('/admin')
  return { success: true }
}