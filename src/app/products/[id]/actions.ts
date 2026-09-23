'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function submitEnquiry(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const productId = formData.get('productId') as string
  const sellerId = formData.get('sellerId') as string
  const buyerName = formData.get('buyerName') as string
  const buyerPhone = formData.get('buyerPhone') as string
  const buyerEmail = formData.get('buyerEmail') as string
  const message = formData.get('message') as string

  if (!productId || !sellerId || !buyerName?.trim() || !buyerPhone?.trim() || !message?.trim()) {
    return { error: 'Please provide your name, phone number, and enquiry message.' }
  }

  const { error } = await supabase.from('enquiries').insert({
    seller_id: sellerId,
    buyer_id: user?.id || null,
    product_id: productId,
    buyer_name: buyerName.trim(),
    buyer_phone: buyerPhone.trim(),
    message: message.trim(),
    status: 'new', // Triggers unread counter in Seller Hub
  })

  if (error) {
    console.error('Enquiry insertion error:', error)
    return { error: error.message }
  }

  revalidatePath(`/products/${productId}`)
  revalidatePath('/seller/enquiries')
  return { success: true }
}