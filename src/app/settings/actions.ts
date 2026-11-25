'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
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

async function isEmailTakenByAnotherUser(email: string, currentUserId: string) {
  const cleanEmail = email.trim().toLowerCase()
  const adminDb = getAdminDb()

  if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
    try {
      let page = 1
      const perPage = 200
      while (page <= 10) {
        const { data, error } = await adminDb.auth.admin.listUsers({
          page,
          perPage,
        })
        if (error || !data?.users?.length) break

        const match = data.users.find(
          (u) =>
            (u.email || '').trim().toLowerCase() === cleanEmail &&
            u.id !== currentUserId
        )
        if (match) return true
        if (data.users.length < perPage) break
        page += 1
      }
    } catch {}
  }

  const { data: existingProfile } = await adminDb
    .from('profiles')
    .select('id')
    .ilike('email', cleanEmail)
    .neq('id', currentUserId)
    .maybeSingle()

  return Boolean(existingProfile)
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

export async function requestEmailChangeAction(formData: FormData) {
  const newEmail = ((formData.get('newEmail') as string) || '').trim().toLowerCase()

  if (!newEmail || !newEmail.includes('@')) {
    return { error: 'Please enter a valid email address.' }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Please sign in to change your email address.' }
  }

  if ((user.email || '').trim().toLowerCase() === newEmail) {
    return { error: 'That is already your current email address.' }
  }

  const duplicate = await isEmailTakenByAnotherUser(newEmail, user.id)
  if (duplicate) {
    return { error: 'Another BenchTech account is already registered with that email address.' }
  }

  const origin = await getOrigin()
  const { error } = await supabase.auth.updateUser(
    { email: newEmail },
    { emailRedirectTo: `${origin}/auth/callback?next=/settings` }
  )

  if (error) {
    return { error: error.message }
  }

  try {
    const adminDb = getAdminDb()
    await adminDb.from('audit_events').insert({
      actor_id: user.id,
      action: 'user_requested_email_change',
      target_type: 'user',
      target_id: user.id,
      result: 'pending_confirmation',
      metadata: { new_email: newEmail },
    })
  } catch {}

  revalidatePath('/settings')
  return {
    success: `Confirmation sent to ${newEmail} (and your current email if secure change is active). Click the link to finalize the update.`,
    pendingEmail: newEmail,
  }
}

export async function requestReauthenticationCodeAction() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Please sign in to request a security code.' }
  }

  const { error } = await supabase.auth.reauthenticate()
  if (error) {
    return { error: error.message }
  }

  return {
    success: `A 6-digit security verification code has been sent to ${user.email} from admin@shopbenchtech.com.`,
  }
}

export async function changeBuyerPasswordAction(formData: FormData) {
  const newPassword = (formData.get('newPassword') as string) || ''
  const confirmPassword = (formData.get('confirmPassword') as string) || ''
  const nonce = ((formData.get('nonce') as string) || '').replace(/\D/g, '').trim()

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

  const updatePayload: { password: string; nonce?: string } = {
    password: newPassword,
  }
  if (nonce) {
    updatePayload.nonce = nonce
  }

  const { error } = await supabase.auth.updateUser(updatePayload)

  if (error) {
    const lower = error.message.toLowerCase()
    if (lower.includes('reauthentication') || lower.includes('nonce')) {
      return {
        error:
          'Security verification required before changing your password. Click "Send 6-Digit Security Code" below, enter the code from your email, and submit again.',
        requiresReauth: true,
      }
    }
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
      metadata: { used_reauth_code: Boolean(nonce) },
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

export async function sendMagicLoginLinkAction() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user?.email) {
    return { error: 'Sign in with a verified email address first.' }
  }

  const origin = await getOrigin()
  const { error } = await supabase.auth.signInWithOtp({
    email: user.email,
    options: {
      shouldCreateUser: false,
      emailRedirectTo: `${origin}/auth/callback?next=/feed`,
    },
  })

  if (error) {
    return { error: error.message }
  }

  return {
    success: `One-time sign-in link and code sent to ${user.email}. Open it on another device to sign in without typing your password.`,
  }
}

export async function signOutOtherDevicesAction() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Authentication required.' }
  }

  const { error } = await supabase.auth.signOut({ scope: 'others' })
  if (error) {
    return { error: error.message }
  }

  try {
    const adminDb = getAdminDb()
    await adminDb.from('audit_events').insert({
      actor_id: user.id,
      action: 'user_signed_out_other_devices',
      target_type: 'user',
      target_id: user.id,
      result: 'success',
    })
  } catch {}

  return { success: 'All other signed-in devices have been logged out.' }
}

export async function signOutAllDevicesAction() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    try {
      const adminDb = getAdminDb()
      await adminDb.from('audit_events').insert({
        actor_id: user.id,
        action: 'user_signed_out_all_devices',
        target_type: 'user',
        target_id: user.id,
        result: 'success',
      })
    } catch {}
  }

  await supabase.auth.signOut({ scope: 'global' })
  revalidatePath('/', 'layout')
  redirect('/login')
}