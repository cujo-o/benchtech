'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function sendEnquiryReply(enquiryId: string, message: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('Unauthorized')

  const { error } = await supabase.from('enquiry_replies').insert({
    enquiry_id: enquiryId,
    sender_id: user.id,
    message,
  })

  if (error) throw error

  // Update enquiry timestamp
  await supabase
    .from('enquiries')
    .update({ updated_at: new Date().toISOString(), status: 'replied' })
    .eq('id', enquiryId)

  revalidatePath('/messages')
  revalidatePath('/seller/enquiries')
}