'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

async function checkAdmin(supabase: any) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') throw new Error('Forbidden')
  return user
}

export async function setSellerTrustStatus(sellerId: string, status: 'verified' | 'rejected' | 'unverified') {
  const supabase = await createClient()
  await checkAdmin(supabase)

  const { error } = await supabase
    .from('profiles')
    .update({ 
      tech_trust_status: status,
      updated_at: new Date().toISOString()
    })
    .eq('id', sellerId)

  if (error) throw error

  revalidatePath('/admin/overview')
  revalidatePath('/admin/verifications')
  revalidatePath('/seller/dashboard')
  revalidatePath('/seller/verify')
}

export async function toggleProductStatus(productId: string, newStatus: 'published' | 'hidden') {
  const supabase = await createClient()
  await checkAdmin(supabase)

  const { error } = await supabase
    .from('products')
    .update({ status: newStatus })
    .eq('id', productId)

  if (error) throw error

  revalidatePath('/admin/overview')
  revalidatePath('/products')
  revalidatePath('/feed')
}