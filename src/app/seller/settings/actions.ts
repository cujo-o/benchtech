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

export async function updateStoreProfile(formData: FormData) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Unauthorized' }
  }

  const businessName = ((formData.get('businessName') as string) || '').trim()
  const fullName = ((formData.get('fullName') as string) || businessName).trim()
  const phone = ((formData.get('phone') as string) || '').trim()
  const district = ((formData.get('district') as string) || 'Wuse 2').trim()
  const city = ((formData.get('city') as string) || 'Abuja').trim()
  const address = ((formData.get('address') as string) || '').trim()
  const bio = ((formData.get('bio') as string) || '').trim()
  const deliveryPolicy = ((formData.get('deliveryPolicy') as string) || '').trim()
  const pickupPolicy = ((formData.get('pickupPolicy') as string) || '').trim()
  const avatarUrl = ((formData.get('avatarUrl') as string) || '').trim()
  const storeBannerUrl = ((formData.get('storeBannerUrl') as string) || '').trim()

  if (!businessName) {
    return { error: 'Store name is required.' }
  }

  const adminDb = getAdminDb()

  const updateData: Record<string, any> = {
    business_name: businessName,
    full_name: fullName || businessName,
    phone,
    district,
    city,
    address,
    street_address: address,
    bio,
    description: bio,
    delivery_policy: deliveryPolicy || null,
    pickup_policy: pickupPolicy || null,
    updated_at: new Date().toISOString(),
  }

  if (avatarUrl) updateData.avatar_url = avatarUrl
  if (storeBannerUrl) updateData.store_banner_url = storeBannerUrl

  const { error } = await adminDb
    .from('profiles')
    .update(updateData)
    .eq('id', user.id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/seller/settings')
  revalidatePath('/seller/store')
  revalidatePath('/seller/dashboard')
  revalidatePath(`/sellers/${user.id}`)
  revalidatePath('/sellers')
  return { success: true }
}