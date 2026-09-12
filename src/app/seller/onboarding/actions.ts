'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function createSellerAccount(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login?next=/seller/onboarding')
  }

  const businessName = formData.get('businessName') as string
  const phone = formData.get('phone') as string
  const district = (formData.get('district') as string) || 'Central Business District'

  if (!businessName || !phone) {
    return { error: 'Please enter your business/store name and WhatsApp phone number.' }
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
  redirect('/seller/dashboard')
}