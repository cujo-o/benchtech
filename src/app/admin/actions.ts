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
  const { data: { user } } = await supabase.auth.getUser()
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
export async function setSellerTrustStatus(sellerId: string, status: 'verified' | 'rejected' | 'unverified') {
  const supabase = await createClient()
  await checkAdmin(supabase)

  const adminClient = getAdminClient()
  const { error } = await adminClient
    .from('profiles')
    .update({ 
      tech_trust_status: status,
      verified_at: status === 'verified' ? new Date().toISOString() : null,
      updated_at: new Date().toISOString()
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
export async function updatePayoutStatus(payoutId: string, status: 'processed' | 'declined', reason?: string) {
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
      updated_at: new Date().toISOString()
    })
    .eq('id', payoutId)

  if (error) return { success: false, error: error.message }

  revalidatePath('/admin/payouts')
  revalidatePath('/admin/overview')
  return { success: true }
}

// 4. Resolve Escrow Dispute (Refund Buyer or Release to Seller)
export async function resolveEscrowDispute(orderId: string, resolution: 'refund_buyer' | 'release_seller', notes?: string) {
  const supabase = await createClient()
  await checkAdmin(supabase)

  const adminClient = getAdminClient()
  const newStatus = resolution === 'refund_buyer' ? 'refunded' : 'completed'

  const { data: order } = await adminClient
    .from('orders')
    .select('*, profiles!orders_seller_id_fkey(*)')
    .eq('id', orderId)
    .single()

  if (!order) return { success: false, error: 'Order not found' }

  // If released to seller, add net payout to seller's available_payout
  if (resolution === 'release_seller') {
    const netPayout = Number(order.seller_payout || (order.amount * 0.93))
    const currentAvailable = Number(order.profiles?.available_payout || 0)

    await adminClient
      .from('profiles')
      .update({ available_payout: currentAvailable + netPayout })
      .eq('id', order.seller_id)
  }

  const { error } = await adminClient
    .from('orders')
    .update({
      status: newStatus,
      dispute_resolution: resolution,
      dispute_notes: notes || null,
      updated_at: new Date().toISOString()
    })
    .eq('id', orderId)

  if (error) return { success: false, error: error.message }

  revalidatePath('/admin/disputes')
  revalidatePath('/admin/overview')
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