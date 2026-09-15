'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

const FEATURE_CREDIT_COST = 1000 // ₦1,000 credits per 7-day boost

export async function boostListingWithCredits(productId: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Authentication required.' }
  }

  // 1. Check seller credit balance
  const { data: profile } = await supabase
    .from('profiles')
    .select('promotional_credits')
    .eq('id', user.id)
    .single()

  const availableCredits = profile?.promotional_credits || 0

  if (availableCredits < FEATURE_CREDIT_COST) {
    return {
      error: `Insufficient promotional credits. You need ₦${FEATURE_CREDIT_COST.toLocaleString()} credits (Balance: ₦${availableCredits.toLocaleString()}).`,
    }
  }

  // 2. Set expiry 7 days in the future
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 7)

  // 3. Apply featured badge to product
  const { error: productError } = await supabase
    .from('products')
    .update({
      is_featured: true,
      featured_until: expiresAt.toISOString(),
    })
    .eq('id', productId)
    .eq('seller_id', user.id)

  if (productError) {
    return { error: productError.message }
  }

  // 4. Deduct promotional credits
  await supabase
    .from('profiles')
    .update({
      promotional_credits: availableCredits - FEATURE_CREDIT_COST,
    })
    .eq('id', user.id)

  revalidatePath('/seller/dashboard')
  revalidatePath('/seller/listings')
  revalidatePath('/feed')

  return { success: true, newBalance: availableCredits - FEATURE_CREDIT_COST }
}