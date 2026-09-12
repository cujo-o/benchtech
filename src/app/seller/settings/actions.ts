'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function updateStoreProfile(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Unauthorized' }
  }

  const businessName = formData.get('businessName') as string
  const phone = formData.get('phone') as string
  const city = (formData.get('city') as string) || 'Abuja'
  const address = formData.get('address') as string
  const bio = formData.get('bio') as string
  const avatarUrl = formData.get('avatarUrl') as string

  const updateData: Record<string, any> = {
    business_name: businessName,
    full_name: businessName,
    phone: phone,
    city: city,
    address: address,
    bio: bio,
    updated_at: new Date().toISOString(),
  }

  if (avatarUrl) {
    updateData.avatar_url = avatarUrl
  }

  const { error } = await supabase
    .from('profiles')
    .update(updateData)
    .eq('id', user.id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/seller/settings')
  revalidatePath('/seller/dashboard')
  revalidatePath('/products')
  return { success: true }
}