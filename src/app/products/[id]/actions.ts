'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function submitEnquiry(formData: FormData) {
  const supabase = await createClient()

  const productId = formData.get('productId') as string
  const sellerId = formData.get('sellerId') as string
  const buyerName = formData.get('buyerName') as string
  const buyerPhone = formData.get('buyerPhone') as string
  const buyerEmail = (formData.get('buyerEmail') as string) || null
  const message = formData.get('message') as string

  const { data: { user } } = await supabase.auth.getUser()

  const { error } = await supabase.from('enquiries').insert({
    product_id: productId,
    seller_id: sellerId,
    buyer_id: user?.id || null,
    buyer_name: buyerName,
    buyer_phone: buyerPhone,
    buyer_email: buyerEmail,
    message,
    status: 'new',
  })

  if (error) {
    console.error('Enquiry insert error:', error.message)
    return { error: error.message }
  }

  revalidatePath('/seller/enquiries')
  revalidatePath('/messages')
  return { success: true }
}