'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function createSellerAccount(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'You must be logged in to register a store.' }
  }

  const businessName = formData.get('businessName') as string
  const phone = formData.get('phone') as string
  const district = (formData.get('district') as string) || 'Wuse 2'

  if (!businessName?.trim() || !phone?.trim()) {
    return { error: 'Please provide both your business name and contact phone number.' }
  }

  // 1. Fetch existing profile roles
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, roles')
    .eq('id', user.id)
    .maybeSingle()

  // Retain existing roles and append 'seller'
  const currentRoles: string[] = profile?.roles || (profile?.role ? [profile.role] : ['buyer'])
  const updatedRoles = Array.from(new Set([...currentRoles, 'buyer', 'seller']))

  // Keep legacy role as 'admin' if the user was an admin, otherwise set to 'seller'
  const legacyRole = currentRoles.includes('admin') || profile?.role === 'admin' ? 'admin' : 'seller'

  // Upsert using confirmed schema columns only
  const { error } = await supabase
    .from('profiles')
    .upsert(
      {
        id: user.id,
        email: user.email,
        business_name: businessName.trim(),
        phone: phone.trim(),
        city: 'Abuja',
        district: district,
        role: legacyRole,
        roles: updatedRoles,
        tech_trust_status: 'unverified',
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'id' }
    )

  if (error) {
    console.error('Seller onboarding error:', error)
    return { error: error.message }
  }

  revalidatePath('/', 'layout')
  revalidatePath('/seller')
  revalidatePath('/seller/dashboard')
  revalidatePath('/feed')
  return { success: true }
}