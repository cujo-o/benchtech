'use server'

import { revalidatePath, revalidateTag } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

/**
 * Update product status (e.g. 'published', 'hidden', 'archived', 'sold')
 * and purge edge caches.
 */
export async function updateProductStatus(
  productId: string,
  status: string
): Promise<void> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) throw new Error('Unauthorized')

  const { error } = await supabase
    .from('products')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', productId)
    .eq('seller_id', user.id)

  if (error) throw new Error(error.message)

  // 1. Next.js 16 Data Cache Tag Invalidation
  try {
    revalidateTag('products', 'max')
    revalidateTag('feed', 'max')
    revalidateTag(`product-${productId}`, 'max')
  } catch {
    // Graceful fallback
  }

  // 2. Route path revalidation
  revalidatePath('/seller/listings')
  revalidatePath('/seller/dashboard')
  revalidatePath('/seller')
  revalidatePath('/products')
  revalidatePath('/feed')
  revalidatePath(`/products/${productId}`)
}

/**
 * Delete a product listing permanently and bust caches.
 */
export async function deleteProduct(productId: string): Promise<void> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) throw new Error('Unauthorized')

  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', productId)
    .eq('seller_id', user.id)

  if (error) throw new Error(error.message)

  // 1. Next.js 16 Data Cache Tag Invalidation
  try {
    revalidateTag('products', 'max')
    revalidateTag('feed', 'max')
    revalidateTag(`product-${productId}`, 'max')
  } catch {
    // Graceful fallback
  }

  // 2. Route path revalidation
  revalidatePath('/seller/listings')
  revalidatePath('/seller/dashboard')
  revalidatePath('/seller')
  revalidatePath('/products')
  revalidatePath('/feed')
  revalidatePath(`/products/${productId}`)
}

/**
 * Archive a product listing (convenience helper).
 */
export async function archiveProductAction(productId: string): Promise<void> {
  await updateProductStatus(productId, 'archived')
}