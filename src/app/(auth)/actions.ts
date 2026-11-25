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

async function findExistingAuthUserByEmail(email: string) {
  const cleanEmail = email.trim().toLowerCase()
  const adminDb = getAdminClient()

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

        const found = data.users.find(
          (u) => (u.email || '').trim().toLowerCase() === cleanEmail
        )
        if (found) return found
        if (data.users.length < perPage) break
        page += 1
      }
    } catch {}
  }

  const { data: existingProfile } = await adminDb
    .from('profiles')
    .select('id, email')
    .ilike('email', cleanEmail)
    .maybeSingle()

  if (existingProfile) {
    return {
      id: existingProfile.id,
      email: existingProfile.email,
      email_confirmed_at: 'existing_profile',
      app_metadata: {},
      identities: [],
    } as any
  }

  return null
}

function resolveUserDestination(profile: any, nextUrl?: string) {
  const roles: string[] = Array.isArray(profile?.roles)
    ? profile.roles
    : profile?.role
    ? [profile.role]
    : ['buyer']

  const isAdmin =
    profile?.role === 'admin' || profile?.is_admin === true || roles.includes('admin')
  const isDeliverer =
    profile?.role === 'delivery' ||
    profile?.is_delivery === true ||
    roles.includes('delivery')
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

  if (nextUrl && nextUrl.startsWith('/')) return nextUrl
  if (isAdmin) return '/admin'
  if (profile?.role === 'delivery' && isDeliverer) return '/delivery'
  if (isSeller) {
    return hasCompletedSellerOnboarding ? '/seller/dashboard' : '/seller/onboarding'
  }
  return '/feed'
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
    const msg = (error?.message || '').toLowerCase()

    if (msg.includes('email not confirmed')) {
      return {
        error:
          'Your email address has not been confirmed yet. Check your inbox or resend the verification link below.',
        unconfirmedEmail: true,
        email,
      }
    }

    // Check if this email belongs to a Google-only account
    const existingUser = await findExistingAuthUserByEmail(email)
    const providers: string[] = Array.isArray(existingUser?.app_metadata?.providers)
      ? existingUser.app_metadata.providers
      : existingUser?.app_metadata?.provider
      ? [existingUser.app_metadata.provider]
      : []

    if (existingUser && providers.includes('google') && !providers.includes('email')) {
      return {
        error:
          'This email is registered with Google. Click "Continue with Google" above to sign in.',
        googleOnlyAccount: true,
      }
    }

    return { error: 'Invalid email address or password.' }
  }

  // Enforce confirmed email even if Supabase settings ever drift
  if (!data.user.email_confirmed_at) {
    await supabase.auth.signOut()
    return {
      error:
        'Please confirm your email address before signing in. Check your inbox or resend the link below.',
      unconfirmedEmail: true,
      email,
    }
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
        email,
        role: 'buyer',
        tech_trust_status: 'unverified',
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'id' }
    )
  }

  const destination = resolveUserDestination(profile, nextUrl)

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

  // 1. Pre-check for duplicate emails with clear, context-aware feedback
  const existingUser = await findExistingAuthUserByEmail(email)
  if (existingUser) {
    const providers: string[] = Array.isArray(existingUser.app_metadata?.providers)
      ? existingUser.app_metadata.providers
      : existingUser.app_metadata?.provider
      ? [existingUser.app_metadata.provider]
      : []

    if (providers.includes('google') && !providers.includes('email')) {
      return {
        error:
          'An account with this email already exists via Google. Use "Continue with Google" to sign in.',
        duplicateType: 'google' as const,
        email,
      }
    }

    if (!existingUser.email_confirmed_at) {
      return {
        error:
          'An account with this email already exists, but your email has not been confirmed yet.',
        duplicateType: 'unconfirmed' as const,
        email,
      }
    }

    return {
      error:
        'An account with this email address already exists. Sign in or reset your password instead.',
      duplicateType: 'password' as const,
      email,
    }
  }

  const supabase = await createClient()
  const adminDb = getAdminClient()
  const origin = await getOrigin()

  const isSellerIntent = accountRole === 'seller'
  const postConfirmNext = isSellerIntent ? '/seller/onboarding' : '/feed'

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${origin}/auth/callback?next=${encodeURIComponent(postConfirmNext)}`,
      data: {
        full_name: fullName,
        role: isSellerIntent ? 'seller' : 'buyer',
      },
    },
  })

  if (error) {
    const lower = error.message.toLowerCase()
    if (lower.includes('already registered') || lower.includes('already exists')) {
      return {
        error:
          'An account with this email address already exists. Sign in or reset your password instead.',
        duplicateType: 'password' as const,
        email,
      }
    }
    return { error: error.message }
  }

  // 2. Fallback duplicate check (Supabase returns empty identities[] when email already exists)
  if (
    data.user &&
    Array.isArray(data.user.identities) &&
    data.user.identities.length === 0
  ) {
    return {
      error:
        'An account with this email address already exists. Sign in or reset your password instead.',
      duplicateType: 'password' as const,
      email,
    }
  }

  const userId = data.user?.id
  if (!userId) {
    return { error: 'Could not create account. Please try again.' }
  }

  // Pre-create profile record so role intent is preserved once they confirm their email
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

  // 3. Enforce email confirmation: NEVER allow an unconfirmed account straight into the app
  if (!data.session || !data.user?.email_confirmed_at) {
    if (data.session) {
      await supabase.auth.signOut()
    }
    revalidatePath('/', 'layout')
    return {
      success: true,
      requiresEmailConfirmation: true,
      email,
      redirectTo: `/verify-email?email=${encodeURIComponent(email)}&role=${
        isSellerIntent ? 'seller' : 'buyer'
      }`,
    }
  }

  revalidatePath('/', 'layout')
  return {
    success: true,
    requiresEmailConfirmation: false,
    redirectTo: postConfirmNext,
  }
}

export async function verifyEmailOtpAction(email: string, code: string) {
  const cleanEmail = (email || '').trim().toLowerCase()
  const cleanCode = (code || '').replace(/\D/g, '').trim()

  if (!cleanEmail || cleanCode.length < 6) {
    return { error: 'Please enter the 6-digit verification code from your email.' }
  }

  const supabase = await createClient()
  const { data, error } = await supabase.auth.verifyOtp({
    email: cleanEmail,
    token: cleanCode,
    type: 'signup',
  })

  if (error || !data.user) {
    return {
      error:
        error?.message ||
        'Invalid or expired verification code. Please check the code or request a new email.',
    }
  }

  const adminDb = getAdminClient()
  const { data: profile } = await adminDb
    .from('profiles')
    .select('*')
    .eq('id', data.user.id)
    .maybeSingle()

  const destination = resolveUserDestination(profile)
  revalidatePath('/', 'layout')
  return { success: true, redirectTo: destination }
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

  const existingUser = await findExistingAuthUserByEmail(email)
  if (!existingUser) {
    return {
      error: 'No BenchTech account was found with that email address.',
    }
  }

  const providers: string[] = Array.isArray(existingUser.app_metadata?.providers)
    ? existingUser.app_metadata.providers
    : existingUser.app_metadata?.provider
    ? [existingUser.app_metadata.provider]
    : []

  if (providers.includes('google') && !providers.includes('email')) {
    return {
      error:
        'This account uses Google Sign-In and does not have a separate password. Go back and click "Continue with Google".',
    }
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
      'Password recovery link sent. Check your inbox (and spam folder) for an email from admin@shopbenchtech.com.',
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