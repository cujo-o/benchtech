import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PromoteProductClient } from './PromoteProductClient'

export const dynamic = 'force-dynamic'

export default async function PromoteProductPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login?next=/seller/promotions/promote-product')

  // Fetch all active/available products for this seller
  const [{ data: products }, { data: settings }] = await Promise.all([
    supabase
      .from('products')
      .select('*')
      .eq('seller_id', user.id)
      .neq('status', 'sold')
      .order('created_at', { ascending: false }),
    supabase
      .from('platform_settings')
      .select('promote_product_rate, attribution_window_days')
      .eq('id', 'global_config')
      .maybeSingle(),
  ])

  return (
    <PromoteProductClient
      initialProducts={products || []}
      initialSettings={settings}
    />
  )
}