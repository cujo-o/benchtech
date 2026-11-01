import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { BenchTechLogo } from '@/components/BenchTechLogo'
import { OnboardingWizard } from './OnboardingWizard'
import { ArrowLeft } from 'lucide-react'

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

  const currentState =
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
    <div className="w-full max-w-4xl mx-auto py-2 space-y-6">
      <div className="flex items-center justify-between bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-3 shadow-2xs">
        <div className="flex items-center gap-2.5">
          <BenchTechLogo className="w-8 h-8" />
          <div>
            <span className="font-black text-sm text-slate-900 dark:text-white block leading-none">
              BenchTech
            </span>
            <span className="text-[10px] text-slate-400 font-semibold block mt-0.5">
              One-Time Seller Verification
            </span>
          </div>
        </div>

        <Link
          href="/feed"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Marketplace</span>
        </Link>
      </div>

      <OnboardingWizard
        user={{
          id: user.id,
          email: user.email || '',
        }}
        profile={profile}
        verification={verification}
        initialState={currentState}
      />
    </div>
  )
}