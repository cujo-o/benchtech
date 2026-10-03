'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

function getAdminClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  )
}

/**
 * Executes Partial (50%) or Full (100%) early payout for an eligible verified order.
 * Discloses fees and credits the seller's available_payout instantly (Spec §4.2, §4.3).
 */
export async function requestEarlyPayout(orderId: string, percentage: 50 | 100) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { success: false, error: 'Authentication required' }

  const adminClient = getAdminClient()

  // 1. Fetch Order and Verify Seller & Protection Status
  const { data: order, error } = await adminClient
    .from('orders')
    .select('*, seller:profiles!orders_seller_id_fkey(*)')
    .eq('id', orderId)
    .single()

  if (error || !order) return { success: false, error: 'Order not found' }
  if (order.seller_id !== user.id) return { success: false, error: 'Unauthorized' }

  if (order.delivery_status !== 'verified') {
    return { success: false, error: 'Early payout requires verified delivery evidence' }
  }

  if (order.dispute_status !== 'none') {
    return { success: false, error: 'Cannot claim early payout on disputed orders' }
  }

  if (order.early_payout_claimed) {
    return { success: false, error: 'Early payout has already been drawn for this order' }
  }

  // 2. Compute Early Payout Portion and Fee (2% processing fee for early disbursement)
  const netSellerPayout = Number(order.seller_payout || 0)
  const portion = percentage === 100 ? netSellerPayout : Math.round(netSellerPayout * 0.5)
  const earlyDisbursementFee = Math.round(portion * 0.02) // 2% priority fee
  const disburseAmount = portion - earlyDisbursementFee

  // 3. Credit Seller Profile Available Payout
  const currentAvailable = Number(order.seller?.available_payout || 0)
  await adminClient
    .from('profiles')
    .update({
      available_payout: currentAvailable + disburseAmount,
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id)

  // 4. Update Order Early Payout Attributes
  await adminClient
    .from('orders')
    .update({
      early_payout_claimed: true,
      early_payout_percentage: percentage,
      payout_status: percentage === 100 ? 'paid' : 'on_hold',
      seller_payout: netSellerPayout - portion, // Remaining balance held until protection expires
      updated_at: new Date().toISOString(),
    })
    .eq('id', orderId)

  // 5. Immutable Ledger Audit
  await adminClient.from('financial_ledger').insert({
    order_id: order.id,
    seller_id: user.id,
    transaction_type: 'payout_disbursed',
    account: 'seller_payable',
    entry_type: 'debit',
    amount: disburseAmount,
    idempotency_key: `early_payout_${percentage}_${order.id}_${Date.now()}`,
    reference: `EARLY-${percentage}-${order.order_number}`,
  })

  revalidatePath('/seller/wallet')
  revalidatePath('/seller/payouts')
  return { success: true, disburseAmount }
}