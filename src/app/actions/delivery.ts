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

async function requireDeliverer() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) throw new Error('Please sign in to access the delivery dashboard.')

  const adminDb = getAdminDb()
  const { data: profile } = await adminDb
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle()

  const roles: string[] = Array.isArray(profile?.roles)
    ? profile.roles
    : profile?.role
    ? [profile.role]
    : []

  const isDeliverer =
    profile?.role === 'delivery' ||
    profile?.role === 'admin' ||
    profile?.is_delivery === true ||
    profile?.is_admin === true ||
    roles.includes('delivery') ||
    roles.includes('admin')

  if (!isDeliverer) {
    throw new Error('Deliverer authorization required.')
  }

  return { user, profile, adminDb }
}

export async function claimDeliveryOrderAction(orderId: string): Promise<void> {
  const { user, profile, adminDb } = await requireDeliverer()

  await adminDb
    .from('orders')
    .update({
      courier_id: user.id,
      courier_name: profile?.full_name || profile?.business_name || 'BenchTech Courier',
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

export async function verifyDeliveryHandoverAction(formData: FormData) {
  try {
    const { user, profile, adminDb } = await requireDeliverer()
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

    // Verify OTP if one is set on the order (admins can also verify with 'ADMIN' or matching OTP)
    if (
      expectedOtp &&
      enteredOtp !== expectedOtp &&
      !(isAdmin && enteredOtp.toUpperCase() === 'ADMIN')
    ) {
      return {
        error: 'Invalid handover OTP code. Please ask the buyer for their 6-digit code.',
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

export async function reportDeliveryExceptionAction(formData: FormData) {
  try {
    const { user, adminDb } = await requireDeliverer()
    const orderId = ((formData.get('orderId') as string) || '').trim()
    const reason = ((formData.get('reason') as string) || '').trim()
    const notes = ((formData.get('notes') as string) || '').trim()

    if (!orderId || !reason) {
      return { error: 'Please select an exception reason.' }
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

    return { success: true }
  } catch (err: any) {
    return { error: err?.message || 'Failed to report exception.' }
  }
}

export async function adminAssignCourierAction(formData: FormData): Promise<void> {
  const { user, adminDb } = await requireDeliverer()
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

// Compatibility aliases for existing imports
export const verifyDeliveryOTP = verifyDeliveryHandoverAction
export const reportDeliveryException = reportDeliveryExceptionAction