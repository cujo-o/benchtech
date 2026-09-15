'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export type OrderStatus =
  | 'new_request'
  | 'confirmed'
  | 'ready_for_pickup'
  | 'dispatched'
  | 'completed'
  | 'cancelled'

export async function updateOrderStatus(orderId: string, nextStatus: OrderStatus) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Unauthorized.' }
  }

  const { error } = await supabase
    .from('buying_requests')
    .update({
      status: nextStatus,
      updated_at: new Date().toISOString(),
    })
    .eq('id', orderId)
    .or(`seller_id.eq.${user.id},buyer_id.eq.${user.id}`)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/seller/orders')
  revalidatePath('/account/orders')
  return { success: true }
}

export async function createBuyingRequest(formData: FormData) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Please log in to contact this seller or make a request.' }
  }

  const productId = formData.get('productId') as string
  const sellerId = formData.get('sellerId') as string
  const agreedPrice = Number(formData.get('price'))
  const deliveryMethod = formData.get('deliveryMethod') as string
  const deliveryArea = formData.get('deliveryArea') as string
  const buyerNotes = formData.get('buyerNotes') as string

  if (user.id === sellerId) {
    return { error: 'You cannot submit a buying request for your own listing.' }
  }

  const { error } = await supabase.from('buying_requests').insert({
    product_id: productId,
    seller_id: sellerId,
    buyer_id: user.id,
    agreed_price: agreedPrice,
    delivery_method: deliveryMethod,
    delivery_area: deliveryArea,
    buyer_notes: buyerNotes,
    status: 'new_request',
  })

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/products/${productId}`)
  return { success: true }
}