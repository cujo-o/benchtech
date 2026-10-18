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

async function assertAdmin() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) throw new Error('Unauthorized')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, is_admin, roles')
    .eq('id', user.id)
    .maybeSingle()

  const roles: string[] = Array.isArray(profile?.roles)
    ? profile.roles
    : profile?.role
    ? [profile.role]
    : []

  const isAdmin =
    profile?.role === 'admin' || profile?.is_admin === true || roles.includes('admin')

  if (!isAdmin) throw new Error('Forbidden: Admin access required.')

  return user
}

export async function approveSellerVerificationAction(sellerId: string) {
  const adminUser = await assertAdmin()
  const adminDb = getAdminClient()
  const now = new Date().toISOString()

  await adminDb
    .from('seller_verifications')
    .update({
      status: 'verified',
      action_required_note: null,
      rejection_reason: null,
      reviewed_by: adminUser.id,
      reviewed_at: now,
      updated_at: now,
    })
    .eq('seller_id', sellerId)

  await adminDb
    .from('profiles')
    .update({
      verification_state: 'verified',
      tech_trust_status: 'verified',
      role: 'seller',
      is_seller: true,
      verification_feedback: null,
      updated_at: now,
    })
    .eq('id', sellerId)

  await adminDb.from('audit_events').insert({
    actor_id: adminUser.id,
    action: 'admin_approved_seller',
    target_type: 'seller_verification',
    target_id: sellerId,
    result: 'verified',
  })

  revalidatePath('/admin/verifications')
  revalidatePath('/sellers')
  revalidatePath(`/sellers/${sellerId}`)
  return { ok: true }
}

export async function requestSellerActionAction(sellerId: string, note: string) {
  const adminUser = await assertAdmin()
  const adminDb = getAdminClient()
  const now = new Date().toISOString()

  await adminDb
    .from('seller_verifications')
    .update({
      status: 'action_required',
      action_required_note: note,
      reviewed_by: adminUser.id,
      reviewed_at: now,
      updated_at: now,
    })
    .eq('seller_id', sellerId)

  await adminDb
    .from('profiles')
    .update({
      verification_state: 'action_required',
      tech_trust_status: 'pending',
      verification_feedback: note,
      updated_at: now,
    })
    .eq('id', sellerId)

  await adminDb.from('audit_events').insert({
    actor_id: adminUser.id,
    action: 'admin_requested_verification_changes',
    target_type: 'seller_verification',
    target_id: sellerId,
    result: 'action_required',
    metadata: { note },
  })

  revalidatePath('/admin/verifications')
  return { ok: true }
}

export async function rejectSellerVerificationAction(sellerId: string, reason: string) {
  const adminUser = await assertAdmin()
  const adminDb = getAdminClient()
  const now = new Date().toISOString()

  await adminDb
    .from('seller_verifications')
    .update({
      status: 'rejected',
      rejection_reason: reason,
      reviewed_by: adminUser.id,
      reviewed_at: now,
      updated_at: now,
    })
    .eq('seller_id', sellerId)

  await adminDb
    .from('profiles')
    .update({
      verification_state: 'rejected',
      tech_trust_status: 'rejected',
      verification_feedback: reason,
      updated_at: now,
    })
    .eq('id', sellerId)

  await adminDb.from('audit_events').insert({
    actor_id: adminUser.id,
    action: 'admin_rejected_seller',
    target_type: 'seller_verification',
    target_id: sellerId,
    result: 'rejected',
    metadata: { reason },
  })

  revalidatePath('/admin/verifications')
  return { ok: true }
}