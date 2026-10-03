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
 * Buyer confirms physical receipt of the device upon in-person meetup or delivery.
 * This starts the official buyer protection countdown (Spec §7, Visual 8 Screen 4 & 5).
 */
export async function confirmOrderDelivery(orderId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Authentication required' }

  const adminClient = getAdminClient()

  const { data: order } = await adminClient
    .from('orders')
    .select('id, buyer_id, seller_id, delivery_status, protection_days, seller_payout')
    .eq('id', orderId)
    .single()

  if (!order) return { success: false, error: 'Order not found' }
  if (order.buyer_id !== user.id) return { success: false, error: 'Only the buyer can confirm physical receipt' }

  const verifiedAt = new Date()
  const protectionDays = order.protection_days || 7
  const protectionEndsAt = new Date(verifiedAt.getTime() + protectionDays * 24 * 60 * 60 * 1000)

  // Transition order: delivery verified -> protection timer active -> payout status on_hold
  const { error } = await adminClient
    .from('orders')
    .update({
      order_status: 'delivered',
      delivery_status: 'verified',
      delivery_verified_at: verifiedAt.toISOString(),
      protection_ends_at: protectionEndsAt.toISOString(),
      payout_status: 'on_hold', // Held until protection period concludes or early payout approved
      updated_at: verifiedAt.toISOString(),
    })
    .eq('id', orderId)

  if (error) return { success: false, error: error.message }

  revalidatePath(`/orders/${orderId}`)
  revalidatePath('/orders')
  revalidatePath('/seller/wallet')
  return { success: true }
}