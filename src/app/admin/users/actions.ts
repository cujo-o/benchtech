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
  const isAdmin =
    profile?.is_admin === true ||
    profile?.role === 'admin' ||
    userRoles.includes('admin')

  if (!isAdmin) throw new Error('Forbidden: Administrative privileges required')
  return user
}

/**
 * Updates a user's role across 'buyer', 'seller', 'delivery', or 'admin'
 */
export async function updateUserRole(
  userId: string,
  newRole: 'buyer' | 'seller' | 'admin' | 'delivery'
) {
  const supabase = await createClient()
  await checkAdmin(supabase)
  const adminClient = getAdminClient()

  const { data: profile } = await adminClient
    .from('profiles')
    .select('roles, role')
    .eq('id', userId)
    .single()

  const currentRoles: string[] = profile?.roles || (profile?.role ? [profile.role] : [])
  const updatedRoles = Array.from(new Set([...currentRoles, newRole]))

  const updatePayload: Record<string, any> = {
    role: newRole,
    roles: updatedRoles,
    updated_at: new Date().toISOString(),
  }

  if (newRole === 'admin') {
    updatePayload.is_admin = true
  } else if (newRole === 'delivery') {
    updatePayload.is_delivery = true
    updatePayload.is_online = true
  } else {
    // If resetting to basic buyer or seller, clear elevated flags
    updatePayload.is_admin = false
    updatePayload.is_delivery = false
  }

  const { error } = await adminClient
    .from('profiles')
    .update(updatePayload)
    .eq('id', userId)

  if (error) throw error

  revalidatePath('/admin/users')
  revalidatePath('/admin/overview')
}

/**
 * Toggle administrative status directly without wiping existing merchant/buyer data
 */
export async function toggleAdminStatus(userId: string, makeAdmin: boolean) {
  const supabase = await createClient()
  await checkAdmin(supabase)
  const adminClient = getAdminClient()

  const { data: profile } = await adminClient
    .from('profiles')
    .select('roles, role')
    .eq('id', userId)
    .single()

  let roles: string[] = profile?.roles || [profile?.role || 'buyer']
  if (makeAdmin) {
    roles = Array.from(new Set([...roles, 'admin']))
  } else {
    roles = roles.filter((r) => r !== 'admin')
  }

  const { error } = await adminClient
    .from('profiles')
    .update({
      is_admin: makeAdmin,
      role: makeAdmin ? 'admin' : (roles[0] || 'buyer'),
      roles,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId)

  if (error) throw error

  revalidatePath('/admin/users')
  revalidatePath('/admin/overview')
}

/**
 * Toggle delivery partner status directly
 */
export async function toggleDeliveryStatus(userId: string, makeDelivery: boolean) {
  const supabase = await createClient()
  await checkAdmin(supabase)
  const adminClient = getAdminClient()

  const { data: profile } = await adminClient
    .from('profiles')
    .select('roles, role')
    .eq('id', userId)
    .single()

  let roles: string[] = profile?.roles || [profile?.role || 'buyer']
  if (makeDelivery) {
    roles = Array.from(new Set([...roles, 'delivery']))
  } else {
    roles = roles.filter((r) => r !== 'delivery')
  }

  const { error } = await adminClient
    .from('profiles')
    .update({
      is_delivery: makeDelivery,
      is_online: makeDelivery,
      role: makeDelivery ? 'delivery' : (roles[0] || 'buyer'),
      roles,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId)

  if (error) throw error

  revalidatePath('/admin/users')
  revalidatePath('/admin/overview')
}

/**
 * Account Suspension / Reactivation
 */
export async function toggleUserSuspension(userId: string, currentStatus: string | null) {
  const supabase = await createClient()
  await checkAdmin(supabase)
  const adminClient = getAdminClient()

  const newStatus = currentStatus === 'suspended' ? 'active' : 'suspended'

  const { error } = await adminClient
    .from('profiles')
    .update({ status: newStatus, updated_at: new Date().toISOString() })
    .eq('id', userId)

  if (error) throw error

  revalidatePath('/admin/users')
  revalidatePath('/admin/overview')
}