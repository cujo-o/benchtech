import { createServerClient } from '@supabase/ssr'
import { createClient as createAdminClient } from '@supabase/supabase-js'
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

  // Forward token_hash confirmation links cleanly to /auth/confirm
  const tokenHash = searchParams.get('token_hash')
  const type = searchParams.get('type')
  if (tokenHash && type) {
    const confirmUrl = new URL('/auth/confirm', origin)
    confirmUrl.searchParams.set('token_hash', tokenHash)
    confirmUrl.searchParams.set('type', type)
    const next = searchParams.get('next')
    if (next) confirmUrl.searchParams.set('next', next)
    return NextResponse.redirect(confirmUrl)
  }

  const code = searchParams.get('code')
  const oauthError =
    searchParams.get('error_description') || searchParams.get('error')

  if (oauthError) {
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(oauthError)}`
    )
  }

  const requestedRole =
    request.cookies.get('bt_oauth_role')?.value ||
    searchParams.get('role') ||
    'buyer'
  const nextParam =
    request.cookies.get('bt_oauth_next')?.value ||
    searchParams.get('next') ||
    ''

  if (code) {
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

    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (error || !data?.user) {
      const msg = error?.message || 'Sign-in link expired or could not be completed.'
      return NextResponse.redirect(
        `${origin}/login?error=${encodeURIComponent(msg)}`
      )
    }

    const user = data.user
    const adminDb = getAdminClient()
    const isSellerIntent =
      requestedRole === 'seller' || user.user_metadata?.role === 'seller'

    const { data: existingProfile } = await adminDb
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle()

    const displayName =
      user.user_metadata?.full_name ||
      user.user_metadata?.name ||
      user.email?.split('@')[0] ||
      'BenchTech User'
    const avatarUrl =
      user.user_metadata?.avatar_url || user.user_metadata?.picture || null

    if (!existingProfile) {
      await adminDb.from('profiles').upsert(
        {
          id: user.id,
          full_name: displayName,
          avatar_url: avatarUrl,
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
            email: user.email,
            district: 'Abuja',
            is_seller: isSellerIntent,
            roles: isSellerIntent ? ['buyer', 'seller'] : ['buyer'],
            verification_state: 'draft',
          })
          .eq('id', user.id)
      } catch {}
    } else if (isSellerIntent && existingProfile.role !== 'admin') {
      try {
        await adminDb
          .from('profiles')
          .update({
            role: 'seller',
            is_seller: true,
          })
          .eq('id', user.id)
      } catch {}
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
    if (nextParam && nextParam.startsWith('/')) {
      targetPath = nextParam
    } else if (isSellerIntent) {
      targetPath = hasCompletedSellerOnboarding
        ? '/seller/dashboard'
        : '/seller/onboarding'
    } else if (isAdmin) {
      targetPath = '/admin'
    } else if (hasCompletedSellerOnboarding) {
      targetPath = '/seller/dashboard'
    }

    const response = NextResponse.redirect(`${origin}${targetPath}`)

    cookiesToAttach.forEach(({ name, value, options }) => {
      response.cookies.set(name, value, options)
    })

    response.cookies.set('bt_oauth_role', '', { path: '/', maxAge: 0 })
    response.cookies.set('bt_oauth_next', '', { path: '/', maxAge: 0 })

    return response
  }

  return NextResponse.redirect(
    `${origin}/login?error=${encodeURIComponent(
      'Unable to complete sign-in. Please ensure https://shopbenchtech.com/auth/callback is added to Supabase Redirect URLs.'
    )}`
  )
}