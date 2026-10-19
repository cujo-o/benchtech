import { NextResponse } from 'next/server'
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

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const requestedRole = searchParams.get('role')
  const nextParam = searchParams.get('next')

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data.user) {
      const user = data.user
      const adminDb = getAdminClient()

      const { data: existingProfile } = await adminDb
        .from('profiles')
        .select('id, role, roles, is_admin, is_seller, business_name, verification_state, tech_trust_status')
        .eq('id', user.id)
        .maybeSingle()

      const isSellerSignup = requestedRole === 'seller'

      if (!existingProfile) {
        const googleName =
          user.user_metadata?.full_name ||
          user.user_metadata?.name ||
          user.email?.split('@')[0] ||
          'BenchTech User'
        const googleAvatar =
          user.user_metadata?.avatar_url || user.user_metadata?.picture || null

        await adminDb.from('profiles').upsert(
          {
            id: user.id,
            email: user.email,
            full_name: googleName,
            avatar_url: googleAvatar,
            district: 'Abuja',
            role: isSellerSignup ? 'seller' : 'buyer',
            roles: isSellerSignup ? ['buyer', 'seller'] : ['buyer'],
            is_seller: isSellerSignup,
            verification_state: 'draft',
            tech_trust_status: 'unverified',
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'id' }
        )

        if (isSellerSignup) {
          return NextResponse.redirect(`${origin}/seller/onboarding`)
        }
        return NextResponse.redirect(`${origin}${nextParam || '/feed'}`)
      }

      // If existing user clicked "Sign up with Google" while on the Seller tab, enable seller role
      if (isSellerSignup && !existingProfile.is_seller && existingProfile.role !== 'seller') {
        await adminDb
          .from('profiles')
          .update({
            role: 'seller',
            is_seller: true,
            roles: Array.from(new Set([...(existingProfile.roles || ['buyer']), 'seller'])),
            updated_at: new Date().toISOString(),
          })
          .eq('id', user.id)

        return NextResponse.redirect(`${origin}/seller/onboarding`)
      }

      if (nextParam && nextParam.startsWith('/')) {
        return NextResponse.redirect(`${origin}${nextParam}`)
      }

      const roles: string[] = Array.isArray(existingProfile.roles)
        ? existingProfile.roles
        : existingProfile.role
        ? [existingProfile.role]
        : ['buyer']

      const isAdmin =
        existingProfile.role === 'admin' ||
        existingProfile.is_admin === true ||
        roles.includes('admin')
      const isSeller =
        existingProfile.role === 'seller' ||
        existingProfile.is_seller === true ||
        roles.includes('seller') ||
        Boolean(existingProfile.business_name)

      const hasCompletedOnboarding =
        Boolean(existingProfile.business_name) ||
        (existingProfile.verification_state &&
          existingProfile.verification_state !== 'draft') ||
        existingProfile.tech_trust_status === 'verified' ||
        existingProfile.tech_trust_status === 'pending'

      if (isAdmin) {
        return NextResponse.redirect(`${origin}/admin`)
      }
      if (isSeller) {
        return NextResponse.redirect(
          `${origin}${hasCompletedOnboarding ? '/seller/dashboard' : '/seller/onboarding'}`
        )
      }

      return NextResponse.redirect(`${origin}/feed`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=Authentication+failed.+Please+try+again.`)
}