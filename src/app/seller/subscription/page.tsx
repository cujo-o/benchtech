import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { SubscriptionPlans } from './SubscriptionPlans'
import { Loader2 } from 'lucide-react'

export const metadata = {
  title: 'Seller Subscriptions | BenchTech Abuja',
  description: 'Manage listing limits and store visibility tiers.',
}

export default async function SubscriptionPage() {
  const supabase = await createClient()

  // 1. Verify seller authentication
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login?redirectTo=/seller/subscription')
  }

  // 2. Fetch current store profile and subscription limits
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, subscription_plan, subscription_tier, subscription_expires_at, max_listings, max_images_per_listing, promotional_credits')
    .eq('id', user.id)
    .maybeSingle()

  return (
    <div className="min-h-screen bg-slate-50/50 py-10 px-4 sm:px-6 lg:px-8">
      <Suspense
        fallback={
          <div className="min-h-[400px] flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
          </div>
        }
      >
        <SubscriptionPlans profile={profile} userEmail={user.email || ''} />
      </Suspense>
    </div>
  )
}