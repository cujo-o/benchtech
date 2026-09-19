import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { SellerOnboardingClient } from './SellerOnboardingClient'

export default async function SellerOnboardingPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login?next=/seller/onboarding')
  }

  // Fetch full profile safely with select('*')
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle()

  // If store is already registered, redirect immediately
  if (profile?.business_name) {
    redirect('/seller')
  }

  return <SellerOnboardingClient />
}