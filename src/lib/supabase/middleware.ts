import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname

  // Allow auth callback and password reset routes without interference
  if (
    pathname.startsWith('/auth/callback') ||
    pathname.startsWith('/reset-password') ||
    pathname.startsWith('/forgot-password')
  ) {
    return supabaseResponse
  }

  // 1. Unauthenticated users trying to access protected dashboards
  if (!user && (pathname.startsWith('/seller') || pathname.startsWith('/admin'))) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('next', pathname)
    return NextResponse.redirect(url)
  }

  // 2. Role-based Route Protection
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, roles, is_admin, is_seller, business_name, verification_state, tech_trust_status')
      .eq('id', user.id)
      .maybeSingle()

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
      roles.includes('seller') ||
      Boolean(profile?.business_name)

    // Protect Admin routes
    if (pathname.startsWith('/admin') && !isAdmin) {
      const url = request.nextUrl.clone()
      url.pathname = '/feed'
      return NextResponse.redirect(url)
    }

    // Protect Seller routes: if user is not yet a seller or has not submitted one-time onboarding, send to /seller/onboarding
    const hasCompletedOnboarding =
      Boolean(profile?.business_name) ||
      (profile?.verification_state && profile.verification_state !== 'draft') ||
      profile?.tech_trust_status === 'verified' ||
      profile?.tech_trust_status === 'pending'

    if (
      pathname.startsWith('/seller') &&
      !pathname.startsWith('/seller/onboarding') &&
      !pathname.startsWith('/sellers') &&
      !isAdmin &&
      (!isSeller || !hasCompletedOnboarding)
    ) {
      const url = request.nextUrl.clone()
      url.pathname = '/seller/onboarding'
      return NextResponse.redirect(url)
    }

    // Redirect logged-in users away from /login and /register
    if (pathname === '/login' || pathname === '/register') {
      const nextParam =
        request.nextUrl.searchParams.get('next') ||
        request.nextUrl.searchParams.get('redirect')

      const url = request.nextUrl.clone()
      url.search = ''

      if (nextParam && nextParam.startsWith('/')) {
        url.pathname = nextParam
      } else if (isAdmin) {
        url.pathname = '/admin'
      } else if (isSeller) {
        url.pathname = hasCompletedOnboarding ? '/seller/dashboard' : '/seller/onboarding'
      } else {
        url.pathname = '/feed'
      }
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}