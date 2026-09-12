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

  const { error } = await supabase
    .from('profiles')
    .update({
      business_name: businessName.trim(),
      phone: phone.trim(),
      city: 'Abuja',
      district: district,
      role: 'seller',
      tech_trust_status: 'unverified',
      updated_at: new Date().toISOString()
    })
    .eq('id', user.id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/seller/dashboard')
  revalidatePath('/feed')
  return { success: true }
}