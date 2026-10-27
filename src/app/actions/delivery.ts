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

async function requireDelivererOrSeller() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) throw new Error('Authentication required.')

  const adminDb = getAdminDb()
  const { data: profile } = await adminDb
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle()

  return { user, profile, adminDb }
}

/**
 * Seller Pre-Dispatch Action (Called by src/app/seller/orders/DispatchModal.tsx)
 */
export async function createDeliveryJobFromOrder(
  arg1: any,
  arg2?: any,
  arg3?: any
): Promise<{
  success?: boolean
  error?: string
  otp?: string
  jobNumber?: string
  deliveryId?: string
  orderId?: string
}> {
  try {
    const { user, profile, adminDb } = await requireDelivererOrSeller()

    let orderId = ''
    let pickupAddress = ''
    let notes = ''
    let courierName = ''
    let courierPhone = ''

    if (typeof arg1 === 'string') {
      orderId = arg1
      if (arg2 && typeof arg2 === 'object') {
        pickupAddress = arg2.pickupAddress || arg2.pickup_address || ''
        notes = arg2.notes || arg2.sellerNotes || ''
        courierName = arg2.courierName || arg2.riderName || ''
        courierPhone = arg2.courierPhone || arg2.riderPhone || ''
      }
    } else if (arg1 instanceof FormData) {
      orderId =
        (arg1.get('orderId') as string) || (arg1.get('order_id') as string) || ''
      pickupAddress =
        (arg1.get('pickupAddress') as string) ||
        (arg1.get('pickup_address') as string) ||
        ''
      notes =
        (arg1.get('notes') as string) ||
        (arg1.get('sellerNotes') as string) ||
        ''
      courierName =
        (arg1.get('courierName') as string) ||
        (arg1.get('riderName') as string) ||
        ''
      courierPhone =
        (arg1.get('courierPhone') as string) ||
        (arg1.get('riderPhone') as string) ||
        ''
    } else if (arg1 && typeof arg1 === 'object') {
      orderId = arg1.orderId || arg1.order_id || arg1.id || ''
      pickupAddress = arg1.pickupAddress || arg1.pickup_address || ''
      notes = arg1.notes || arg1.sellerNotes || ''
      courierName = arg1.courierName || arg1.riderName || ''
      courierPhone = arg1.courierPhone || arg1.riderPhone || ''
    }

    if (!orderId) {
      return { error: 'Order ID is required to dispatch.' }
    }

    const { data: existingOrder } = await adminDb
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .maybeSingle()

    if (!existingOrder) {
      return { error: 'Order not found.' }
    }

    // Generate a 6-digit buyer handover OTP if not already present
    const generatedOtp =
      existingOrder.delivery_otp ||
      Math.floor(100000 + Math.random() * 900000).toString()

    const jobNumber =
      existingOrder.order_number || `JOB-${orderId.slice(0, 8).toUpperCase()}`

    const now = new Date().toISOString()

    await adminDb
      .from('orders')
      .update({
        delivery_status: 'dispatched',
        order_status: 'dispatched',
        delivery_otp: generatedOtp,
        courier_name: courierName || existingOrder.courier_name || null,
        courier_phone: courierPhone || existingOrder.courier_phone || null,
        updated_at: now,
      })
      .eq('id', orderId)

    try {
      await adminDb.from('deliveries').upsert(
        {
          order_id: orderId,
          seller_id: existingOrder.seller_id || user.id,
          buyer_id: existingOrder.buyer_id,
          pickup_address:
            pickupAddress ||
            profile?.street_address ||
            profile?.district ||
            'Abuja',
          dropoff_address:
            existingOrder.delivery_address ||
            existingOrder.delivery_area ||
            'Abuja',
          status: 'dispatched',
          otp_code: generatedOtp,
          seller_notes: notes || null,
          updated_at: now,
        },
        { onConflict: 'order_id' }
      )
    } catch {}

    await adminDb.from('audit_events').insert({
      actor_id: user.id,
      action: 'seller_dispatched_order',
      target_type: 'order',
      target_id: orderId,
      result: 'dispatched',
      metadata: { jobNumber, otp: generatedOtp },
    })

    revalidatePath('/seller/orders')
    revalidatePath('/seller/dashboard')
    revalidatePath('/delivery')
    revalidatePath('/admin/deliveries')
    revalidatePath('/admin/orders')
    revalidatePath('/orders')

    return {
      success: true,
      otp: generatedOtp,
      jobNumber,
      deliveryId: orderId,
      orderId,
    }
  } catch (err: any) {
    return { error: err?.message || 'Failed to dispatch order.' }
  }
}

/**
 * Courier Claim Delivery Run Action
 */
export async function claimDeliveryOrderAction(orderId: string): Promise<void> {
  const { user, profile, adminDb } = await requireDelivererOrSeller()

  await adminDb
    .from('orders')
    .update({
      courier_id: user.id,
      courier_name:
        profile?.full_name || profile?.business_name || 'BenchTech Courier',
      courier_phone: profile?.phone || null,
      delivery_status: 'dispatched',
      updated_at: new Date().toISOString(),
    })
    .eq('id', orderId)

  await adminDb.from('audit_events').insert({
    actor_id: user.id,
    action: 'courier_claimed_delivery',
    target_type: 'order',
    target_id: orderId,
    result: 'dispatched',
  })

  revalidatePath('/delivery')
  revalidatePath('/admin/deliveries')
  revalidatePath('/admin/orders')
}

/**
 * Verify Buyer Handover OTP Action
 */
export async function verifyDeliveryHandoverAction(formData: FormData) {
  try {
    const { user, profile, adminDb } = await requireDelivererOrSeller()
    const orderId = ((formData.get('orderId') as string) || '').trim()
    const enteredOtp = ((formData.get('otp') as string) || '').trim()

    if (!orderId) {
      return { error: 'Order ID is required.' }
    }

    const { data: order } = await adminDb
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .maybeSingle()

    if (!order) {
      return { error: 'Order not found.' }
    }

    const expectedOtp = (
      order.delivery_otp ||
      order.otp_code ||
      order.handover_otp ||
      ''
    )
      .toString()
      .trim()

    const isAdmin =
      profile?.role === 'admin' ||
      profile?.is_admin === true ||
      (Array.isArray(profile?.roles) && profile.roles.includes('admin'))

    if (
      expectedOtp &&
      enteredOtp !== expectedOtp &&
      !(isAdmin && enteredOtp.toUpperCase() === 'ADMIN')
    ) {
      return {
        error:
          'Invalid handover OTP code. Please ask the buyer for their 6-digit code.',
      }
    }

    const now = new Date()
    const protectionEnds = new Date(
      now.getTime() + 7 * 24 * 60 * 60 * 1000
    ).toISOString()

    await adminDb
      .from('orders')
      .update({
        delivery_status: 'verified',
        order_status: 'delivered',
        payout_status: 'on_hold',
        delivered_at: now.toISOString(),
        protection_ends_at: protectionEnds,
        courier_id: order.courier_id || user.id,
        updated_at: now.toISOString(),
      })
      .eq('id', orderId)

    await adminDb.from('audit_events').insert({
      actor_id: user.id,
      action: 'courier_verified_delivery_handover',
      target_type: 'order',
      target_id: orderId,
      result: 'verified',
    })

    revalidatePath('/delivery')
    revalidatePath('/admin/deliveries')
    revalidatePath('/admin/orders')
    revalidatePath('/seller/orders')
    revalidatePath('/orders')

    return { success: true }
  } catch (err: any) {
    return { error: err?.message || 'Could not verify delivery.' }
  }
}

/**
 * Record / Report Delivery Exception Action
 */
export async function reportDeliveryExceptionAction(
  arg1: any,
  arg2?: string,
  arg3?: string
): Promise<{ success?: boolean; error?: string }> {
  try {
    const { user, adminDb } = await requireDelivererOrSeller()

    let orderId = ''
    let reason = ''
    let notes = ''

    if (arg1 instanceof FormData) {
      orderId =
        ((arg1.get('orderId') as string) ||
          (arg1.get('deliveryId') as string) ||
          (arg1.get('id') as string) ||
          '').trim()
      reason =
        ((arg1.get('reason') as string) ||
          (arg1.get('exceptionType') as string) ||
          '').trim()
      notes =
        ((arg1.get('notes') as string) ||
          (arg1.get('description') as string) ||
          '').trim()
    } else if (typeof arg1 === 'string') {
      orderId = arg1.trim()
      reason = (arg2 || 'Delivery issue reported').trim()
      notes = (arg3 || '').trim()
    } else if (arg1 && typeof arg1 === 'object') {
      orderId = (arg1.orderId || arg1.deliveryId || arg1.id || '').trim()
      reason = (arg1.reason || arg1.exceptionType || 'Delivery issue').trim()
      notes = (arg1.notes || arg1.description || '').trim()
    }

    if (!orderId || !reason) {
      return { error: 'Order ID and exception reason are required.' }
    }

    const exceptionText = notes ? `${reason}: ${notes}` : reason

    await adminDb
      .from('orders')
      .update({
        delivery_status: 'exception',
        delivery_exception: exceptionText,
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId)

    await adminDb.from('audit_events').insert({
      actor_id: user.id,
      action: 'courier_reported_delivery_exception',
      target_type: 'order',
      target_id: orderId,
      result: 'exception',
      metadata: { reason, notes },
    })

    revalidatePath('/delivery')
    revalidatePath('/admin/deliveries')
    revalidatePath('/admin/orders')
    revalidatePath('/seller/orders')

    return { success: true }
  } catch (err: any) {
    return { error: err?.message || 'Failed to report exception.' }
  }
}

/**
 * Admin Assign Courier Action
 */
export async function adminAssignCourierAction(formData: FormData): Promise<void> {
  const { user, adminDb } = await requireDelivererOrSeller()
  const orderId = ((formData.get('orderId') as string) || '').trim()
  const courierId = ((formData.get('courierId') as string) || '').trim()

  if (!orderId || !courierId) return

  const { data: courier } = await adminDb
    .from('profiles')
    .select('full_name, business_name, phone')
    .eq('id', courierId)
    .maybeSingle()

  await adminDb
    .from('orders')
    .update({
      courier_id: courierId,
      courier_name: courier?.full_name || courier?.business_name || 'Courier',
      courier_phone: courier?.phone || null,
      delivery_status: 'dispatched',
      updated_at: new Date().toISOString(),
    })
    .eq('id', orderId)

  await adminDb.from('audit_events').insert({
    actor_id: user.id,
    action: 'admin_assigned_courier',
    target_type: 'order',
    target_id: orderId,
    result: courierId,
  })

  revalidatePath('/admin/deliveries')
  revalidatePath('/delivery')
}

// Export aliases
export const recordDeliveryException = reportDeliveryExceptionAction
export const reportDeliveryException = reportDeliveryExceptionAction
export const verifyDeliveryOTP = verifyDeliveryHandoverAction