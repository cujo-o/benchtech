'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function updateProductStatus(productId: string, status: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { error } = await supabase
    .from('products')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', productId)
    .eq('seller_id', user.id)

  if (error) throw error
  revalidatePath('/seller/listings')
  revalidatePath('/seller/dashboard')
  revalidatePath('/products')
}

export async function deleteProduct(productId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', productId)
    .eq('seller_id', user.id)

  if (error) throw error
  revalidatePath('/seller/listings')
  revalidatePath('/seller/dashboard')
  revalidatePath('/products')
}