import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/Navbar'
import { OnboardingWizard } from './OnboardingWizard'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Seller Verification & Onboarding | BenchTech',
  description: 'Complete your one-time seller identity, address, and bank verification on BenchTech.',
}

export default async function SellerOnboardingPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login?next=/seller/onboarding')
  }

  const [{ data: profile }, { data: verification }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).maybeSingle(),
    supabase.from('seller_verifications').select('*').eq('seller_id', user.id).maybeSingle(),
  ])

  // Determine normalized state
  let currentState =
    verification?.status ||
    profile?.verification_state ||
    (profile?.tech_trust_status === 'verified'
      ? 'verified'
      : profile?.tech_trust_status === 'pending'
      ? 'under_review'
      : profile?.tech_trust_status === 'rejected'
      ? 'rejected'
      : 'draft')

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-8">
        <OnboardingWizard
          user={{
            id: user.id,
            email: user.email || '',
          }}
          profile={profile}
          verification={verification}
          initialState={currentState}
        />
      </main>
    </div>
  )
}