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

export async function updateUserRole(userId: string, newRole: 'buyer' | 'seller' | 'admin') {
  const supabase = await createClient()
  await checkAdmin(supabase)

  const { error } = await supabase
    .from('profiles')
    .update({ role: newRole, updated_at: new Date().toISOString() })
    .eq('id', userId)

  if (error) throw error

  revalidatePath('/admin/users')
  revalidatePath('/admin/overview')
}

export async function toggleUserSuspension(userId: string, currentStatus: string | null) {
  const supabase = await createClient()
  await checkAdmin(supabase)

  const newStatus = currentStatus === 'suspended' ? 'active' : 'suspended'

  const { error } = await supabase
    .from('profiles')
    .update({ status: newStatus, updated_at: new Date().toISOString() })
    .eq('id', userId)

  if (error) throw error

  revalidatePath('/admin/users')
  revalidatePath('/admin/overview')
}