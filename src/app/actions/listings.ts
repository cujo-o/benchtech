'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createListing(formData: FormData) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'You must be logged in as an active seller to post gadgets.' }
  }

  // 1. Fetch vendor plan limits
  const { data: profile } = await supabase
    .from('profiles')
    .select('max_listings, max_images_per_listing, subscription_plan')
    .eq('id', user.id)
    .single()

  const maxListings = profile?.max_listings || 5
  const maxImages = profile?.max_images_per_listing || 10
  const currentPlan = profile?.subscription_plan || 'free'

  // 2. Enforce active listing quota (Section 21)
  const { count: activeCount } = await supabase
    .from('products')
    .select('*', { count: 'exact', head: true })
    .eq('seller_id', user.id)
    .neq('status', 'archived')

  if ((activeCount || 0) >= maxListings) {
    return {
      error: `You have reached your limit of ${maxListings} active listings for the ${currentPlan} plan. Upgrade to Standard or Professional to publish more inventory.`,
      upgradeRequired: true,
    }
  }

  // 3. Extract and validate images
  const images = formData.getAll('images') as string[]
  if (images.length > maxImages) {
    return {
      error: `Your current plan allows up to ${maxImages} images per gadget. Please remove ${images.length - maxImages} image(s).`,
    }
  }

  const title = formData.get('title') as string
  const price = Number(formData.get('price'))
  const category = formData.get('category') as string
  const condition = formData.get('condition') as string
  const description = formData.get('description') as string
  const location = formData.get('location') as string || 'Abuja'

  const { data, error } = await supabase.from('products').insert({
    seller_id: user.id,
    title,
    price,
    category,
    condition,
    description,
    location,
    images,
    status: 'published',
  })

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/seller/listings')
  revalidatePath('/products')
  return { success: true }
}