import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { StorefrontEditorClient } from './StorefrontEditorClient'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'My Storefront & Branding | BenchTech Seller',
}

export default async function SellerStorePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login?next=/seller/store')
  }

  const [{ data: profile }, { data: products }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).maybeSingle(),
    supabase
      .from('products')
      .select('*')
      .eq('seller_id', user.id)
      .eq('status', 'published')
      .order('created_at', { ascending: false }),
  ])

  return (
    <StorefrontEditorClient
      profile={profile}
      products={products || []}
    />
  )
}