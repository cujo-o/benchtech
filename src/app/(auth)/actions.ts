'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

function getAdminClient() {
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
  if (host) {
    return `${proto}://${host}`
  }
  return process.env.NEXT_PUBLIC_SITE_URL || 'https://shopbenchtech.com'
}

export async function signIn(formData: FormData) {
  const email = ((formData.get('email') as string) || '').trim().toLowerCase()
  const password = (formData.get('password') as string) || ''
  const nextUrl = (formData.get('next') as string) || ''

  if (!email || !password) {
    return { error: 'Please enter both your email address and password.' }
  }

  const supabase = await createClient()

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error || !data.user) {
    return { error: error?.message || 'Invalid email or password.' }
  }

  const adminDb = getAdminClient()
  const { data: profile } = await adminDb
    .from('profiles')
    .select('*')
    .eq('id', data.user.id)
    .maybeSingle()

  if (!profile) {
    await adminDb.from('profiles').upsert(
      {
        id: data.user.id,
        full_name: data.user.user_metadata?.full_name || email.split('@')[0],
        role: 'buyer',
        tech_trust_status: 'unverified',
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'id' }
    )
  }

  const roles: string[] = Array.isArray(profile?.roles)
    ? profile.roles
    : profile?.role
    ? [profile.role]
    : ['buyer']

  const isAdmin =
    profile?.role === 'admin' || profile?.is_admin === true || roles.includes('admin')
  const isSeller =
    profile?.role === 'seller' ||
    profile?.is_seller === true ||
    roles.includes('seller')

  const hasCompletedSellerOnboarding =
    profile?.verification_state === 'verified' ||
    profile?.verification_state === 'under_review' ||
    profile?.verification_state === 'action_required' ||
    profile?.tech_trust_status === 'verified' ||
    profile?.tech_trust_status === 'pending'

  let destination = '/feed'
  if (nextUrl && nextUrl.startsWith('/')) {
    destination = nextUrl
  } else if (isAdmin) {
    destination = '/admin'
  } else if (isSeller) {
    destination = hasCompletedSellerOnboarding ? '/seller/dashboard' : '/seller/onboarding'
  }

  revalidatePath('/', 'layout')
  return { success: true, redirectTo: destination }
}

export async function signUp(formData: FormData) {
  const fullName = ((formData.get('fullName') as string) || '').trim()
  const email = ((formData.get('email') as string) || '').trim().toLowerCase()
  const password = (formData.get('password') as string) || ''
  const accountRole = ((formData.get('role') as string) || 'buyer').trim().toLowerCase()

  if (!fullName || !email || !password) {
    return { error: 'Please fill in your name, email address, and password.' }
  }

  if (password.length < 6) {
    return { error: 'Password must be at least 6 characters long.' }
  }

  const supabase = await createClient()
  const adminDb = getAdminClient()
  const origin = await getOrigin()

  const isSellerIntent = accountRole === 'seller'

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${origin}/auth/callback`,
      data: {
        full_name: fullName,
        role: isSellerIntent ? 'seller' : 'buyer',
      },
    },
  })

  if (error) {
    return { error: error.message }
  }

  const userId = data.user?.id
  if (!userId) {
    return { error: 'Could not create account. Please try again.' }
  }

  if (!data.session && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    try {
      await adminDb.auth.admin.updateUserById(userId, { email_confirm: true })
      await supabase.auth.signInWithPassword({ email, password })
    } catch {}
  }

  // Upsert core profile fields without phone number
  await adminDb.from('profiles').upsert(
    {
      id: userId,
      full_name: fullName,
      role: isSellerIntent ? 'seller' : 'buyer',
      tech_trust_status: 'unverified',
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'id' }
  )

  try {
    await adminDb
      .from('profiles')
      .update({
        email,
        district: 'Abuja',
        roles: isSellerIntent ? ['buyer', 'seller'] : ['buyer'],
        is_seller: isSellerIntent,
        verification_state: 'draft',
      })
      .eq('id', userId)
  } catch {}

  const destination = isSellerIntent ? '/seller/onboarding' : '/feed'

  revalidatePath('/', 'layout')
  return {
    success: true,
    redirectTo: destination,
  }
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/login')
}

export async function resendVerificationEmail(email: string) {
  const cleanEmail = (email || '').trim().toLowerCase()
  if (!cleanEmail) return { error: 'Email is required.' }

  const supabase = await createClient()
  const origin = await getOrigin()

  const { error } = await supabase.auth.resend({
    type: 'signup',
    email: cleanEmail,
    options: {
      emailRedirectTo: `${origin}/auth/callback`,
    },
  })

  if (error) return { error: error.message }
  return { success: true }
}

export async function requestPasswordReset(formData: FormData) {
  const email = ((formData.get('email') as string) || '').trim().toLowerCase()
  if (!email) {
    return { error: 'Please enter your registered email address.' }
  }

  const supabase = await createClient()
  const origin = await getOrigin()

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback?next=/reset-password`,
  })

  if (error) {
    return { error: error.message }
  }

  return {
    success: true,
    message:
      'Password recovery link sent. Please check your inbox (and spam folder) for an email from admin@shopbenchtech.com.',
  }
}

export async function updateUserPassword(formData: FormData) {
  const password = (formData.get('password') as string) || ''
  const confirmPassword = (formData.get('confirmPassword') as string) || ''

  if (!password || password.length < 6) {
    return { error: 'New password must be at least 6 characters long.' }
  }

  if (password !== confirmPassword) {
    return { error: 'Passwords do not match.' }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return {
      error: 'Your password recovery session has expired. Please request a new reset link.',
    }
  }

  const { error } = await supabase.auth.updateUser({
    password,
  })

  if (error) {
    return { error: error.message }
  }

  try {
    const adminDb = getAdminClient()
    await adminDb.from('audit_events').insert({
      actor_id: user.id,
      action: 'password_changed',
      target_type: 'user',
      target_id: user.id,
      result: 'success',
      metadata: { recovery_sender: 'admin@shopbenchtech.com' },
    })
  } catch {}

  revalidatePath('/', 'layout')
  return { success: true, redirectTo: '/feed' }
}