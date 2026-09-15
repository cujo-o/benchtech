import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { SubscriptionPlans } from './SubscriptionPlans'

export const metadata = {
  title: 'Seller Subscriptions | BenchTech Abuja',
  description: 'Manage listing limits and store visibility tiers.',
}

export default async function SubscriptionPage() {
  const supabase = await createClient()

  // Verify seller authentication
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login?redirectTo=/seller/subscription')
  }

  // Fetch current store profile and subscription limits
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, subscription_plan, subscription_expires_at, max_listings, max_images_per_listing, promotional_credits')
    .eq('id', user.id)
    .single()

  return (
    <div className="min-h-screen bg-slate-50/50 py-10 px-4 sm:px-6 lg:px-8">
      <SubscriptionPlans profile={profile} userEmail={user.email || ''} />
    </div>
  )
}