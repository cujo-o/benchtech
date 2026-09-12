'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function updateEnquiryStatus(enquiryId: string, status: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { error } = await supabase
    .from('enquiries')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', enquiryId)
    .eq('seller_id', user.id)

  if (error) throw error

  revalidatePath('/seller/enquiries')
  revalidatePath('/seller/dashboard')
}