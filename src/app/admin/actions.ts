export type UserCapabilityFlag =
  | 'admin'
  | 'seller'
  | 'delivery'
  | 'buyer_only'
  | 'verified'
  | 'pro'
  | 'suspended'

export async function adminToggleUserCapability(
  targetUserId: string,
  capability: UserCapabilityFlag,
  enabled: boolean
): Promise<{ ok: boolean; error?: string }> {
  try {
    const { user, adminDb } = await requireAdmin()

    if (
      targetUserId === user.id &&
      ((capability === 'admin' && !enabled) ||
        capability === 'buyer_only' ||
        (capability === 'suspended' && enabled))
    ) {
      return {
        ok: false,
        error: 'You cannot revoke your own admin access or suspend your own account.',
      }
    }

    const { data: existing, error: fetchErr } = await adminDb
      .from('profiles')
      .select(
        'role, roles, is_admin, is_seller, is_delivery, tech_trust_status, verification_state, seller_plan, subscription_tier'
      )
      .eq('id', targetUserId)
      .maybeSingle()

    if (fetchErr || !existing) {
      return { ok: false, error: 'User profile not found.' }
    }

    const now = new Date().toISOString()

    const currentRoles: string[] = Array.isArray(existing.roles)
      ? existing.roles
      : existing.role
      ? [existing.role]
      : ['buyer']

    let isAdmin =
      existing.role === 'admin' ||
      existing.is_admin === true ||
      currentRoles.includes('admin')
    let isSeller =
      existing.role === 'seller' ||
      existing.is_seller === true ||
      currentRoles.includes('seller')
    let isDelivery =
      existing.role === 'delivery' ||
      existing.is_delivery === true ||
      currentRoles.includes('delivery')

    const updates: Record<string, any> = { updated_at: now }
    let auditAction = `admin_toggled_${capability}`
    let auditResult = enabled ? 'enabled' : 'disabled'

    const resolvePrimaryRole = (
      adm: boolean,
      sel: boolean,
      del: boolean
    ): 'admin' | 'seller' | 'delivery' | 'buyer' => {
      if (adm) return 'admin'
      if (sel) return 'seller'
      if (del) return 'delivery'
      return 'buyer'
    }

    const buildRolesArray = (adm: boolean, sel: boolean, del: boolean) => {
      const next = new Set<string>(['buyer'])
      if (adm) next.add('admin')
      if (sel) next.add('seller')
      if (del) next.add('delivery')
      return Array.from(next)
    }

    if (capability === 'admin') {
      isAdmin = enabled
      updates.is_admin = isAdmin
      updates.roles = buildRolesArray(isAdmin, isSeller, isDelivery)
      updates.role = resolvePrimaryRole(isAdmin, isSeller, isDelivery)
      auditAction = enabled ? 'admin_granted_admin_role' : 'admin_revoked_admin_role'
      auditResult = updates.role
    } else if (capability === 'seller') {
      isSeller = enabled
      updates.is_seller = isSeller
      updates.roles = buildRolesArray(isAdmin, isSeller, isDelivery)
      updates.role = resolvePrimaryRole(isAdmin, isSeller, isDelivery)
      auditAction = enabled ? 'admin_granted_seller_role' : 'admin_revoked_seller_role'
      auditResult = updates.role
    } else if (capability === 'delivery') {
      isDelivery = enabled
      updates.is_delivery = isDelivery
      updates.roles = buildRolesArray(isAdmin, isSeller, isDelivery)
      updates.role = resolvePrimaryRole(isAdmin, isSeller, isDelivery)
      auditAction = enabled
        ? 'admin_granted_deliverer_role'
        : 'admin_revoked_deliverer_role'
      auditResult = updates.role
    } else if (capability === 'buyer_only') {
      isAdmin = false
      isSeller = false
      isDelivery = false
      updates.role = 'buyer'
      updates.roles = ['buyer']
      updates.is_admin = false
      updates.is_seller = false
      updates.is_delivery = false
      auditAction = 'admin_reset_user_to_buyer'
      auditResult = 'buyer'
    } else if (capability === 'verified') {
      updates.tech_trust_status = enabled ? 'verified' : 'unverified'
      updates.verification_state = enabled ? 'verified' : 'action_required'
      if (enabled) {
        isSeller = true
        updates.is_seller = true
        updates.roles = buildRolesArray(isAdmin, isSeller, isDelivery)
        updates.role = resolvePrimaryRole(isAdmin, isSeller, isDelivery)
      }
      await adminDb
        .from('seller_verifications')
        .update({
          status: enabled ? 'verified' : 'action_required',
          reviewed_by: user.id,
          reviewed_at: now,
        })
        .eq('seller_id', targetUserId)
      auditAction = enabled ? 'admin_verified_store' : 'admin_unverified_store'
      auditResult = updates.tech_trust_status
    } else if (capability === 'pro') {
      updates.seller_plan = enabled ? 'pro' : 'free'
      updates.subscription_tier = enabled ? 'pro' : 'free'
      updates.subscription_plan = enabled ? 'professional' : 'free'
      auditAction = enabled ? 'admin_granted_pro_plan' : 'admin_revoked_pro_plan'
      auditResult = updates.seller_plan
    } else if (capability === 'suspended') {
      updates.verification_state = enabled ? 'suspended' : 'verified'
      if (enabled) {
        updates.tech_trust_status = 'unverified'
        await adminDb
          .from('products')
          .update({ status: 'hidden', updated_at: now })
          .eq('seller_id', targetUserId)
      }
      auditAction = enabled ? 'admin_suspended_account' : 'admin_restored_account'
      auditResult = updates.verification_state
    }

    const { error: updateErr } = await adminDb
      .from('profiles')
      .update(updates)
      .eq('id', targetUserId)

    if (updateErr) {
      return { ok: false, error: updateErr.message }
    }

    await adminDb.from('audit_events').insert({
      actor_id: user.id,
      action: auditAction,
      target_type: 'profile',
      target_id: targetUserId,
      result: auditResult,
    })

    revalidatePath('/admin/users')
    revalidatePath('/admin/deliveries')
    revalidatePath('/admin/verifications')
    revalidatePath('/admin/techpass')
    revalidatePath('/delivery')
    revalidatePath('/sellers')
    revalidatePath('/admin')

    return { ok: true }
  } catch (err: any) {
    return { ok: false, error: err?.message || 'Failed to update user.' }
  }
}