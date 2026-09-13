import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next')

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      // If user came from a password reset link, prioritize sending them to the reset-password page
      if (next === '/reset-password') {
        return NextResponse.redirect(`${origin}/reset-password`)
      }

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role, roles')
          .eq('id', user.id)
          .maybeSingle()

        const userRoles: string[] = profile?.roles || (profile?.role ? [profile.role] : ['buyer'])
        const isAdmin = userRoles.includes('admin')
        const isSeller = userRoles.includes('seller')

        // If explicit custom next parameter was provided (other than root), respect it
        if (next && next !== '/' && next !== '/feed') {
          return NextResponse.redirect(`${origin}${next}`)
        }

        if (isAdmin) {
          return NextResponse.redirect(`${origin}/admin/overview`)
        }
        if (isSeller) {
          return NextResponse.redirect(`${origin}/seller/dashboard`)
        }

        return NextResponse.redirect(`${origin}/feed`)
      }

      return NextResponse.redirect(`${origin}/feed`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=Invalid%20or%20expired%20authentication%20link`)
}