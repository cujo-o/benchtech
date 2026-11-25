import { createServerClient } from '@supabase/ssr'
import {
  createClient as createAdminClient,
  type EmailOtpType,
} from '@supabase/supabase-js'
import { NextResponse, type NextRequest } from 'next/server'

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  return createAdminClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const tokenHash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null
  const nextParam = searchParams.get('next') || ''

  if (!tokenHash || !type) {
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(
        'Invalid verification link. Please request a new email.'
      )}`
    )
  }

  const cookiesToAttach: { name: string; value: string; options: any }[] = []

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach((c) => cookiesToAttach.push(c))
        },
      },
    }
  )

  const { data, error } = await supabase.auth.verifyOtp({
    type,
    token_hash: tokenHash,
  })

  if (error || !data?.user) {
    if (type === 'recovery') {
      return NextResponse.redirect(
        `${origin}/forgot-password?error=${encodeURIComponent(
          'Your password reset link has expired or was already used. Request a fresh link below.'
        )}`
      )
    }

    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(
        'Your verification link has expired or was already used. Sign in or request a new verification email.'
      )}`
    )
  }

  const user = data.user
  const adminDb = getAdminClient()

  const { data: existingProfile } = await adminDb
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle()

  const metadataRole =
    user.user_metadata?.role === 'seller' ? 'seller' : 'buyer'
  const isSellerIntent =
    existingProfile?.role === 'seller' ||
    existingProfile?.is_seller === true ||
    metadataRole === 'seller'

  if (!existingProfile) {
    await adminDb.from('profiles').upsert(
      {
        id: user.id,
        full_name:
          user.user_metadata?.full_name ||
          user.email?.split('@')[0] ||
          'BenchTech User',
        email: user.email,
        role: isSellerIntent ? 'seller' : 'buyer',
        roles: isSellerIntent ? ['buyer', 'seller'] : ['buyer'],
        is_seller: isSellerIntent,
        district: 'Abuja',
        tech_trust_status: 'unverified',
        verification_state: 'draft',
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'id' }
    )
  }

  const hasCompletedSellerOnboarding =
    existingProfile?.verification_state === 'verified' ||
    existingProfile?.verification_state === 'under_review' ||
    existingProfile?.verification_state === 'action_required' ||
    existingProfile?.tech_trust_status === 'verified' ||
    existingProfile?.tech_trust_status === 'pending'

  const isAdmin =
    existingProfile?.role === 'admin' || existingProfile?.is_admin === true

  let targetPath = '/feed'

  if (type === 'recovery') {
    targetPath = '/reset-password'
  } else if (type === 'email_change') {
    targetPath = '/settings'
  } else if (nextParam && nextParam.startsWith('/')) {
    targetPath = nextParam
  } else if (isAdmin) {
    targetPath = '/admin'
  } else if (isSellerIntent) {
    targetPath = hasCompletedSellerOnboarding
      ? '/seller/dashboard'
      : '/seller/onboarding'
  }

  const response = NextResponse.redirect(`${origin}${targetPath}`)
  cookiesToAttach.forEach(({ name, value, options }) => {
    response.cookies.set(name, value, options)
  })

  return response
}