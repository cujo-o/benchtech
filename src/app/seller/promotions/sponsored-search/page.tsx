import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { SponsoredSearchClient } from './SponsoredSearchClient'

export const dynamic = 'force-dynamic'

export default async function CreateSponsoredSearchPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login?next=/seller/promotions/sponsored-search')

  // Fetch active products, platform CPC configurations, and current ad wallet balance
  const [{ data: products }, { data: settings }, { data: wallet }, { data: profile }] =
    await Promise.all([
      supabase
        .from('products')
        .select('*')
        .eq('seller_id', user.id)
        .neq('status', 'sold')
        .order('created_at', { ascending: false }),
      supabase
        .from('platform_settings')
        .select('cpc_min, cpc_max, min_daily_budget, cpc_suggested')
        .eq('id', 'global_config')
        .maybeSingle(),
      supabase
        .from('ad_wallets')
        .select('balance')
        .eq('seller_id', user.id)
        .maybeSingle(),
      supabase
        .from('profiles')
        .select('district, business_name')
        .eq('id', user.id)
        .maybeSingle(),
    ])

  return (
    <SponsoredSearchClient
      initialProducts={products || []}
      initialSettings={settings}
      walletBalance={Number(wallet?.balance || 0)}
      sellerDistrict={profile?.district || 'Abuja'}
    />
  )
}