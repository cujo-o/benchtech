'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

function getAdminDb() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  return createAdminClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

export async function updateSellerListingAction(formData: FormData) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: 'Unauthorized' }

  const productId = (formData.get('productId') as string) || ''
  const title = ((formData.get('title') as string) || '').trim()
  const brand = ((formData.get('brand') as string) || '').trim()
  const model = ((formData.get('model') as string) || '').trim()
  const category = ((formData.get('category') as string) || 'phones').toLowerCase()
  const condition = (formData.get('condition') as string) || 'uk_used'
  const price = Number(formData.get('price') || 0)
  const quantity = Math.max(1, Number(formData.get('quantity') || 1))
  const description = ((formData.get('description') as string) || '').trim()
  const serialOrImei = ((formData.get('serialOrImei') as string) || '').trim().toUpperCase()
  const storage = ((formData.get('storage') as string) || '').trim()
  const ram = ((formData.get('ram') as string) || '').trim()
  const processor = ((formData.get('processor') as string) || '').trim()
  const batteryHealth = ((formData.get('batteryHealth') as string) || '').trim()

  if (!productId || !title || price <= 0) {
    return { error: 'Title and valid price are required.' }
  }

  const adminDb = getAdminDb()
  const { data: existing } = await adminDb
    .from('products')
    .select('specs, seller_id')
    .eq('id', productId)
    .maybeSingle()

  if (!existing || existing.seller_id !== user.id) {
    return { error: 'Listing not found or unauthorized.' }
  }

  const updatedSpecs: Record<string, any> = {
    ...(existing.specs || {}),
  }
  if (storage) updatedSpecs.storage = storage
  if (ram) updatedSpecs.ram = ram
  if (processor) updatedSpecs.processor = processor
  if (batteryHealth) updatedSpecs.battery_health = batteryHealth
  if (serialOrImei) {
    updatedSpecs.serial_number = serialOrImei
    updatedSpecs.serial_masked =
      serialOrImei.length > 4
        ? `${'*'.repeat(serialOrImei.length - 4)}${serialOrImei.slice(-4)}`
        : serialOrImei
  }

  const { error } = await adminDb
    .from('products')
    .update({
      title,
      brand,
      model: model || null,
      category,
      condition,
      price,
      stock_quantity: quantity,
      description,
      specs: updatedSpecs,
      updated_at: new Date().toISOString(),
    })
    .eq('id', productId)
    .eq('seller_id', user.id)

  if (error) return { error: error.message }

  revalidatePath('/seller/listings')
  revalidatePath(`/products/${productId}`)
  revalidatePath('/products')
  revalidatePath('/feed')

  return { success: true }
}

export const updateListing = updateSellerListingAction