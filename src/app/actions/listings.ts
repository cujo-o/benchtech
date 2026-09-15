'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createListing(formData: FormData) {
  const supabase = await createClient()

  // 1. Verify seller authentication
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'You must be logged in as an active seller to post gadgets.' }
  }

  // 2. Fetch active seller limits from profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('max_listings, max_images_per_listing, subscription_plan, subscription_tier')
    .eq('id', user.id)
    .single()

  const currentPlan = profile?.subscription_plan || profile?.subscription_tier || 'free'
  const maxListings = profile?.max_listings || 5
  const maxImages = profile?.max_images_per_listing || 10

  // 3. Count currently active listings (Section 21)
  const { count: activeCount } = await supabase
    .from('products')
    .select('*', { count: 'exact', head: true })
    .eq('seller_id', user.id)
    .neq('status', 'archived')

  if ((activeCount || 0) >= maxListings) {
    return {
      error: `You have reached your limit of ${maxListings} active listings on the ${currentPlan} plan. Please upgrade your store plan to publish more items.`,
      upgradeRequired: true,
    }
  }

  // 4. Validate image uploads against tier limit
  const images = formData.getAll('images') as string[]
  if (images.length > maxImages) {
    return {
      error: `Your current plan allows a maximum of ${maxImages} images per gadget. Please remove ${images.length - maxImages} image(s).`,
    }
  }

  // 5. Extract form fields
  const title = formData.get('title') as string
  const price = Number(formData.get('price'))
  const category = formData.get('category') as string
  const condition = formData.get('condition') as string
  const description = formData.get('description') as string
  const location = (formData.get('location') as string) || 'Abuja'

  if (!title || !price || !category) {
    return { error: 'Please provide all required product details (title, price, category).' }
  }

  // 6. Insert new listing
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
  revalidatePath('/seller/dashboard')
  revalidatePath('/products')

  return { success: true }
}