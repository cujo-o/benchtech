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

  // 1. Unauthenticated users trying to access protected dashboards
  if (!user && (pathname.startsWith('/seller') || pathname.startsWith('/admin'))) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('redirect', pathname)
    return NextResponse.redirect(url)
  }

  // 2. Multi-Role Route Protection
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, roles')
      .eq('id', user.id)
      .maybeSingle()

    // Extract all assigned roles (supporting both array and legacy string)
    const userRoles: string[] = profile?.roles || (profile?.role ? [profile.role] : ['buyer'])
    const isAdmin = userRoles.includes('admin') || profile?.role === 'admin'
    const isSeller = userRoles.includes('seller') || profile?.role === 'seller' || isAdmin

    // Protect SuperAdmin routes
    if (pathname.startsWith('/admin') && !isAdmin) {
      const url = request.nextUrl.clone()
      url.pathname = '/feed'
      return NextResponse.redirect(url)
    }

    // Protect Seller routes (allow onboarding through)
    if (
      pathname.startsWith('/seller') &&
      pathname !== '/seller/onboarding' &&
      !isSeller
    ) {
      const url = request.nextUrl.clone()
      url.pathname = '/seller/onboarding'
      return NextResponse.redirect(url)
    }

    // Redirect logged-in users away from auth routes
    if (pathname === '/login' || pathname === '/register') {
      const url = request.nextUrl.clone()
      // If admin, prioritize admin view; if seller, dashboard; otherwise feed
      url.pathname = isAdmin ? '/admin/overview' : isSeller ? '/seller/dashboard' : '/feed'
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}