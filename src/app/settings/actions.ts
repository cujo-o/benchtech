'use server'

import { revalidatePath } from 'next/cache'
import { headers } from 'next/headers'
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

async function getOrigin() {
  const headersList = await headers()
  const host = headersList.get('x-forwarded-host') || headersList.get('host')
  const proto = headersList.get('x-forwarded-proto') || 'https'
  if (host) return `${proto}://${host}`
  return process.env.NEXT_PUBLIC_SITE_URL || 'https://shopbenchtech.com'
}

export async function updateBuyerProfileAction(formData: FormData) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Please sign in to update your account settings.' }
  }

  const fullName = ((formData.get('fullName') as string) || '').trim()
  const phone = ((formData.get('phone') as string) || '').trim()
  const district = ((formData.get('district') as string) || 'Abuja').trim()
  const streetAddress = ((formData.get('streetAddress') as string) || '').trim()

  if (!fullName) {
    return { error: 'Full name cannot be empty.' }
  }

  const adminDb = getAdminDb()

  const { error } = await adminDb
    .from('profiles')
    .update({
      full_name: fullName,
      phone: phone || null,
      district,
      street_address: streetAddress || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/settings')
  revalidatePath('/feed')
  return { success: 'Account and delivery details saved.' }
}

export async function changeBuyerPasswordAction(formData: FormData) {
  const newPassword = (formData.get('newPassword') as string) || ''
  const confirmPassword = (formData.get('confirmPassword') as string) || ''

  if (!newPassword || newPassword.length < 6) {
    return { error: 'Password must be at least 6 characters long.' }
  }

  if (newPassword !== confirmPassword) {
    return { error: 'Passwords do not match.' }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'You must be signed in to update your password.' }
  }

  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  })

  if (error) {
    return { error: error.message }
  }

  try {
    const adminDb = getAdminDb()
    await adminDb.from('audit_events').insert({
      actor_id: user.id,
      action: 'buyer_password_updated',
      target_type: 'user',
      target_id: user.id,
      result: 'success',
    })
  } catch {}

  return { success: 'Your password has been updated.' }
}

export async function sendBuyerPasswordRecoveryEmailAction(emailInput?: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const targetEmail = (emailInput || user?.email || '').trim().toLowerCase()
  if (!targetEmail) {
    return { error: 'Please provide a valid email address.' }
  }

  const origin = await getOrigin()

  const { error } = await supabase.auth.resetPasswordForEmail(targetEmail, {
    redirectTo: `${origin}/auth/callback?next=/reset-password`,
  })

  if (error) {
    return { error: error.message }
  }

  return {
    success: `Password recovery link sent to ${targetEmail} from admin@shopbenchtech.com.`,
  }
}