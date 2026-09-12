'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function submitVerification(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'Unauthorized' }

  const idType = formData.get('idType') as string
  const idDocumentUrl = formData.get('idDocumentUrl') as string
  const cacDocumentUrl = (formData.get('cacDocumentUrl') as string) || null

  const { error } = await supabase
    .from('profiles')
    .update({
      id_type: idType,
      id_document_url: idDocumentUrl,
      cac_document_url: cacDocumentUrl,
      tech_trust_status: 'pending',
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id)

  if (error) return { error: error.message }

  revalidatePath('/seller/verify')
  revalidatePath('/seller/dashboard')
  return { success: true }
}

export async function updateSellerTrustStatus(sellerId: string, status: 'verified' | 'rejected' | 'unverified') {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'Unauthorized' }

  // Check admin role
  const { data: adminCheck } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (adminCheck?.role !== 'admin') return { error: 'Forbidden' }

  const { error } = await supabase
    .from('profiles')
    .update({
      tech_trust_status: status,
      updated_at: new Date().toISOString(),
    })
    .eq('id', sellerId)

  if (error) return { error: error.message }

  revalidatePath('/admin/overview')
  revalidatePath('/seller/dashboard')
  return { success: true }
}