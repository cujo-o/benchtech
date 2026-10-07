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
 * 1. Seller Marks Order Ready for Pickup -> Generates Linked Delivery Job (Spec §5)
 */
export async function createDeliveryJobFromOrder(orderId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Unauthorized' }

  const adminClient = getAdminClient()

  const { data: order } = await adminClient
    .from('orders')
    .select('*, product:products(*), seller:profiles!orders_seller_id_fkey(*), buyer:profiles!orders_buyer_id_fkey(*)')
    .eq('id', orderId)
    .single()

  if (!order) return { success: false, error: 'Order not found' }
  if (order.seller_id !== user.id) return { success: false, error: 'Only the seller can dispatch this order' }

  const jobNumber = `DL-${Math.floor(1000 + Math.random() * 9000)}`
  const deliveryOtp = String(Math.floor(100000 + Math.random() * 900000))

  const { data: job, error: jobErr } = await adminClient
    .from('delivery_jobs')
    .insert({
      job_number: jobNumber,
      order_id: order.id,
      seller_id: order.seller_id,
      buyer_id: order.buyer_id,
      status: 'new',
      pickup_address: order.seller?.business_name ? `${order.seller.business_name}, ${order.seller.district || 'Banex, Abuja'}` : 'Abuja Hub',
      pickup_district: order.seller?.district || 'Abuja',
      pickup_phone: order.seller?.phone || '08000000000',
      dropoff_address: order.delivery_area || order.buyer?.district || 'Wuse 2, Abuja',
      dropoff_district: order.buyer?.district || 'Abuja',
      dropoff_phone: order.buyer?.phone || '08000000000',
      package_description: order.product?.title || 'Gadget Item',
      delivery_otp: deliveryOtp,
      delivery_fee: 4000,
      delivery_partner_earning: 3500, // Configurable delivery driver earning
      payout_status: 'pending',
    })
    .select()
    .single()

  if (jobErr) return { success: false, error: jobErr.message }

  // Update order delivery state
  await adminClient
    .from('orders')
    .update({
      delivery_status: 'pickup_pending',
      updated_at: new Date().toISOString(),
    })
    .eq('id', order.id)

  revalidatePath('/seller/orders')
  revalidatePath(`/orders/${orderId}`)
  revalidatePath('/delivery')
  return { success: true, jobNumber }
}

/**
 * 2. Delivery Driver Toggle Online / Offline (Spec §7)
 */
export async function toggleDeliveryOnlineStatus(isOnline: boolean) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Unauthorized' }

  const adminClient = getAdminClient()
  await adminClient
    .from('profiles')
    .update({ is_online: isOnline, updated_at: new Date().toISOString() })
    .eq('id', user.id)

  revalidatePath('/delivery')
  return { success: true }
}

/**
 * 3. Driver Accepts Job (Spec §6, §8)
 */
export async function acceptDeliveryJob(jobId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Unauthorized' }

  const adminClient = getAdminClient()
  const { data: job } = await adminClient.from('delivery_jobs').select('*').eq('id', jobId).single()
  if (!job || job.status !== 'new') return { success: false, error: 'Job is no longer available' }

  await adminClient
    .from('delivery_jobs')
    .update({
      delivery_person_id: user.id,
      status: 'accepted',
      updated_at: new Date().toISOString(),
    })
    .eq('id', jobId)

  revalidatePath('/delivery')
  return { success: true }
}

/**
 * 4. Driver Confirms Pickup with Evidence (Spec §9, §10, §11)
 */
export async function confirmPickup(jobId: string, evidenceUrl?: string, notes?: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Unauthorized' }

  const adminClient = getAdminClient()
  const now = new Date().toISOString()

  const { data: job } = await adminClient.from('delivery_jobs').select('*').eq('id', jobId).single()
  if (!job || job.delivery_person_id !== user.id) return { success: false, error: 'Unauthorized' }

  await adminClient
    .from('delivery_jobs')
    .update({
      status: 'in_transit',
      pickup_evidence_url: evidenceUrl || null,
      pickup_notes: notes || null,
      picked_up_at: now,
      updated_at: now,
    })
    .eq('id', jobId)

  await adminClient
    .from('orders')
    .update({ delivery_status: 'dispatched', updated_at: now })
    .eq('id', job.order_id)

  revalidatePath('/delivery')
  revalidatePath(`/orders/${job.order_id}`)
  return { success: true }
}

/**
 * 5. Complete Delivery Proof & Instant Driver Earning Disbursement (Spec §13, §14, §23)
 * Rule: Delivery driver is credited immediately upon verified delivery.
 * Seller funds remain in escrow for the 7-day buyer protection period.
 */
export async function verifyDeliveryCompletion(
  jobId: string,
  enteredOtp?: string,
  proofPhotoUrl?: string
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Unauthorized' }

  const adminClient = getAdminClient()
  const now = new Date().toISOString()

  const { data: job } = await adminClient
    .from('delivery_jobs')
    .select('*, order:orders(*), driver:profiles!delivery_jobs_delivery_person_id_fkey(*)')
    .eq('id', jobId)
    .single()

  if (!job) return { success: false, error: 'Job not found' }
  if (job.delivery_person_id !== user.id) return { success: false, error: 'Unauthorized driver' }

  // Verify OTP if provided
  if (enteredOtp && job.delivery_otp && job.delivery_otp !== enteredOtp.trim()) {
    return { success: false, error: 'Invalid delivery confirmation OTP code' }
  }

  // 1. Mark Delivery Job Delivered & Payable
  await adminClient
    .from('delivery_jobs')
    .update({
      status: 'delivered',
      delivery_proof_url: proofPhotoUrl || null,
      delivered_at: now,
      delivery_verified_at: now,
      payout_status: 'payable',
      updated_at: now,
    })
    .eq('id', jobId)

  // 2. Start 7-Day Buyer Protection for Seller (Spec §15)
  const protectionEnd = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
  await adminClient
    .from('orders')
    .update({
      order_status: 'delivered',
      delivery_status: 'verified',
      delivery_verified_at: now,
      protection_ends_at: protectionEnd,
      payout_status: 'on_hold', // Seller funds stay on hold for protection window
      updated_at: now,
    })
    .eq('id', job.order_id)

  // 3. IMMEDIATELY CREDIT DELIVERY DRIVER EARNING (Spec §14 & §23)
  // Delivery earnings are released right away upon delivery confirmation
  const earningAmount = Number(job.delivery_partner_earning || 3500)
  const currentDriverEarnings = Number(job.driver?.delivery_earnings || 0)
  const totalDeliveries = Number(job.driver?.total_deliveries_completed || 0) + 1

  await adminClient
    .from('profiles')
    .update({
      delivery_earnings: currentDriverEarnings + earningAmount,
      total_deliveries_completed: totalDeliveries,
      updated_at: now,
    })
    .eq('id', user.id)

  // 4. Ledger Entry for Driver Payout
  await adminClient.from('financial_ledger').insert({
    order_id: job.order_id,
    transaction_type: 'payout_disbursed',
    account: 'delivery_partner_payable',
    entry_type: 'credit',
    amount: earningAmount,
    idempotency_key: `delivery_earning_${job.id}_${Date.now()}`,
    reference: `JOB-${job.job_number}`,
  })

  revalidatePath('/delivery')
  revalidatePath(`/orders/${job.order_id}`)
  revalidatePath('/seller/payouts')
  return { success: true, creditedAmount: earningAmount }
}

/**
 * 6. Record Delivery Exception (Spec §17)
 */
export async function recordDeliveryException(jobId: string, reason: string, notes?: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Unauthorized' }

  const adminClient = getAdminClient()
  const now = new Date().toISOString()

  await adminClient
    .from('delivery_jobs')
    .update({
      status: 'failed',
      exception_reason: reason,
      exception_notes: notes || null,
      updated_at: now,
    })
    .eq('id', jobId)

  revalidatePath('/delivery')
  return { success: true }
}


export async function requestDeliveryEarningsCashout(
  amount: number,
  bankDetails: {
    bankName: string
    accountNumber: string
    accountName: string
  }
) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Unauthorized' }

  const adminClient = getAdminClient()

  const { data: profile } = await adminClient
    .from('profiles')
    .select('delivery_earnings, full_name')
    .eq('id', user.id)
    .single()

  const currentEarnings = Number(profile?.delivery_earnings || 0)
  if (amount < 2000) {
    return { success: false, error: 'Minimum withdrawal amount is ₦2,000' }
  }
  if (amount > currentEarnings) {
    return { success: false, error: 'Insufficient delivery earnings balance' }
  }

  // 1. Deduct driver available balance
  const remainingEarnings = currentEarnings - amount
  await adminClient
    .from('profiles')
    .update({
      delivery_earnings: remainingEarnings,
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id)

  // 2. Insert into payout_requests table for automated Paystack bank disbursement
  const payoutRef = `DRV-${Date.now().toString().slice(-6)}`
  await adminClient.from('payout_requests').insert({
    seller_id: user.id, // Linked user profile
    amount,
    currency: 'NGN',
    bank_name: bankDetails.bankName,
    account_number: bankDetails.accountNumber,
    account_name: bankDetails.accountName,
    status: 'pending',
    reference: payoutRef,
    notes: `Delivery Fleet Instant Cashout: ₦${amount.toLocaleString()} to ${bankDetails.bankName}`,
  })

  // 3. Log into financial ledger
  await adminClient.from('financial_ledger').insert({
    transaction_type: 'payout_disbursed',
    account: 'delivery_partner_cashout',
    entry_type: 'debit',
    amount,
    idempotency_key: `cashout_${user.id}_${Date.now()}`,
    reference: payoutRef,
  })

  revalidatePath('/delivery')
  return { success: true, remainingEarnings }
}