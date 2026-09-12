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

  // 2. Role-based Route Protection
  if (user) {
    // Fetch profile role from public.profiles
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const role = profile?.role || 'buyer'

    // Protect SuperAdmin routes
    if (pathname.startsWith('/admin') && role !== 'admin') {
      const url = request.nextUrl.clone()
      url.pathname = '/'
      return NextResponse.redirect(url)
    }

    // Protect Seller routes
    if (pathname.startsWith('/seller') && role !== 'seller' && role !== 'admin') {
      const url = request.nextUrl.clone()
      url.pathname = '/become-seller'
      return NextResponse.redirect(url)
    }

    // Redirect logged-in users away from auth pages
    if (pathname === '/login' || pathname === '/register') {
      const url = request.nextUrl.clone()
      url.pathname = role === 'admin' ? '/admin/overview' : role === 'seller' ? '/seller/dashboard' : '/'
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}