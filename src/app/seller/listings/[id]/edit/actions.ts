'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function updateProduct(productId: string, formData: FormData, specs: Record<string, string>) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('Unauthorized')

  const title = formData.get('title') as string
  const brand = formData.get('brand') as string
  const model = formData.get('model') as string
  const price = parseFloat(formData.get('price') as string)
  const condition = formData.get('condition') as string
  const location = (formData.get('location') as string) || 'Abuja'

  const { error } = await supabase
    .from('products')
    .update({
      title,
      brand,
      model,
      price,
      condition,
      location,
      specs,
      updated_at: new Date().toISOString(),
    })
    .eq('id', productId)
    .eq('seller_id', user.id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/seller/listings')
  revalidatePath('/seller/dashboard')
  revalidatePath(`/products/${productId}`)
  redirect('/seller/listings')
}