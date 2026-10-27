import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  if (pathname.startsWith('/auth/callback')) {
    return NextResponse.next({ request })
  }

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

  if (
    pathname.startsWith('/reset-password') ||
    pathname.startsWith('/forgot-password')
  ) {
    return supabaseResponse
  }

  // Unauthenticated users trying to access protected dashboards
  if (
    !user &&
    (pathname.startsWith('/seller') ||
      pathname.startsWith('/admin') ||
      pathname.startsWith('/delivery'))
  ) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('next', pathname)
    return NextResponse.redirect(url)
  }

  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle()

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
      roles.includes('delivery') ||
      isAdmin

    const hasCompletedSellerOnboarding =
      profile?.verification_state === 'verified' ||
      profile?.verification_state === 'under_review' ||
      profile?.verification_state === 'action_required' ||
      profile?.tech_trust_status === 'verified' ||
      profile?.tech_trust_status === 'pending' ||
      isAdmin

    // Protect Admin routes
    if (pathname.startsWith('/admin') && !isAdmin) {
      const url = request.nextUrl.clone()
      url.pathname = '/feed'
      return NextResponse.redirect(url)
    }

    // Protect Delivery Dashboard
    if (pathname.startsWith('/delivery') && !isDeliverer) {
      const url = request.nextUrl.clone()
      url.pathname = '/feed'
      return NextResponse.redirect(url)
    }

    if (pathname.startsWith('/seller/verify')) {
      const url = request.nextUrl.clone()
      url.pathname = '/seller/onboarding'
      return NextResponse.redirect(url)
    }

    if (
      pathname.startsWith('/seller') &&
      !pathname.startsWith('/seller/onboarding') &&
      !pathname.startsWith('/sellers') &&
      !hasCompletedSellerOnboarding
    ) {
      const url = request.nextUrl.clone()
      url.pathname = '/seller/onboarding'
      return NextResponse.redirect(url)
    }

    if (pathname === '/login' || pathname === '/register') {
      const nextParam =
        request.nextUrl.searchParams.get('next') ||
        request.nextUrl.searchParams.get('redirect')
      const roleParam = request.nextUrl.searchParams.get('role')

      const url = request.nextUrl.clone()
      url.search = ''

      if (roleParam === 'seller') {
        url.pathname = hasCompletedSellerOnboarding ? '/seller/dashboard' : '/seller/onboarding'
      } else if (nextParam && nextParam.startsWith('/')) {
        url.pathname = nextParam
      } else if (isAdmin) {
        url.pathname = '/admin'
      } else if (profile?.role === 'delivery') {
        url.pathname = '/delivery'
      } else if (hasCompletedSellerOnboarding) {
        url.pathname = '/seller/dashboard'
      } else {
        url.pathname = '/feed'
      }
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}