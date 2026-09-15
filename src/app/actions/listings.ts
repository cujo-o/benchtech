'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createListing(formData: FormData) {
  const supabase = await createClient()

  // 1. Authenticate user
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'You must be logged in as a seller to create a listing.' }
  }

  // 2. Check active listing quota against seller plan
  const { count: activeCount } = await supabase
    .from('products')
    .select('*', { count: 'exact', head: true })
    .eq('seller_id', user.id)
    .neq('status', 'archived')

  const { data: profile } = await supabase
    .from('profiles')
    .select('max_listings, subscription_plan')
    .eq('id', user.id)
    .single()

  const limit = profile?.max_listings || 5

  if ((activeCount || 0) >= limit) {
    return {
      error: `You have reached your limit of ${limit} active listings for the ${
        profile?.subscription_plan || 'free'
      } plan. Please upgrade to post more items.`,
    }
  }

  // 3. Extract form data and insert product
  const title = formData.get('title') as string
  const price = Number(formData.get('price'))
  const category = formData.get('category') as string
  const description = formData.get('description') as string

  const { data, error } = await supabase.from('products').insert({
    seller_id: user.id,
    title,
    price,
    category,
    description,
    status: 'published',
  })

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/products')
  revalidatePath('/seller/listings')

  return { success: true }
}