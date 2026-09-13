'use server'

import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function login(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return { error: error.message }
  }

  // Check multi-role array alongside fallback role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, roles')
    .eq('id', data.user.id)
    .maybeSingle()

  const userRoles: string[] = profile?.roles || (profile?.role ? [profile.role] : ['buyer'])
  const isAdmin = userRoles.includes('admin')
  const isSeller = userRoles.includes('seller')

  revalidatePath('/', 'layout')

  if (isAdmin) redirect('/admin/overview')
  if (isSeller) redirect('/seller/dashboard')
  redirect('/feed')
}

export async function registerBuyer(formData: FormData) {
  const supabase = await createClient()
  const headerList = await headers()
  const origin = headerList.get('origin') || 'https://benchtech.vercel.app'

  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const fullName = formData.get('fullName') as string
  const phone = formData.get('phone') as string

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${origin}/api/auth/callback?next=/feed`,
      data: {
        full_name: fullName,
        phone: phone,
        role: 'buyer',
        roles: ['buyer'],
      },
    },
  })

  if (error) {
    return { error: error.message }
  }

  // If email confirmation is enabled in Supabase, session will be null initially
  if (!data.session) {
    return {
      success: 'Account created! Please check your email to confirm your account before logging in.',
      requiresVerification: true,
    }
  }

  revalidatePath('/', 'layout')
  redirect('/feed')
}

export async function registerSeller(formData: FormData) {
  const supabase = await createClient()
  const headerList = await headers()
  const origin = headerList.get('origin') || 'https://benchtech.vercel.app'

  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const businessName = formData.get('businessName') as string
  const phone = formData.get('phone') as string

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${origin}/api/auth/callback?next=/seller/dashboard`,
      data: {
        full_name: businessName,
        business_name: businessName,
        phone: phone,
        role: 'seller',
        roles: ['buyer', 'seller'],
      },
    },
  })

  if (error) {
    return { error: error.message }
  }

  if (!data.session) {
    return {
      success: 'Store account created! Please verify your email via the link sent to your inbox.',
      requiresVerification: true,
    }
  }

  revalidatePath('/', 'layout')
  redirect('/seller/dashboard')
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/login')
}

// Request password reset email
export async function requestPasswordReset(formData: FormData) {
  const email = formData.get('email') as string
  const headerList = await headers()
  const origin = headerList.get('origin') || 'https://benchtech.vercel.app'

  if (!email?.trim()) {
    return { error: 'Please provide a valid email address.' }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
    redirectTo: `${origin}/api/auth/callback?next=/reset-password`,
  })

  if (error) {
    return { error: error.message }
  }

  return { success: 'Password reset link sent! Check your inbox.' }
}

// Update password with confirmation check
export async function updatePassword(formData: FormData) {
  const password = formData.get('password') as string
  const confirmPassword = formData.get('confirmPassword') as string

  if (!password || password.length < 6) {
    return { error: 'Password must be at least 6 characters long.' }
  }

  if (password !== confirmPassword) {
    return { error: 'Passwords do not match.' }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.updateUser({
    password: password,
  })

  if (error) {
    return { error: error.message }
  }

  return { success: 'Your password has been updated successfully.' }
}

// Resend verification confirmation link
export async function resendVerificationEmail(email: string) {
  const headerList = await headers()
  const origin = headerList.get('origin') || 'https://benchtech.vercel.app'
  const supabase = await createClient()

  const { error } = await supabase.auth.resend({
    type: 'signup',
    email: email.trim(),
    options: {
      emailRedirectTo: `${origin}/api/auth/callback?next=/feed`,
    },
  })

  if (error) {
    return { error: error.message }
  }

  return { success: 'Verification email resent! Please check your inbox.' }
}