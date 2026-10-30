import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/Navbar'
import { CheckoutClient } from './CheckoutClient'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Checkout | BenchTech Abuja',
  description: 'Complete your protected hardware order on BenchTech Abuja.',
}

export default async function CheckoutPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let profile: any = null
  if (user) {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle()
    profile = data
  }

  const initialUser = {
    id: user?.id || null,
    email: user?.email || '',
    fullName: profile?.full_name || profile?.business_name || '',
    phone: profile?.phone || '',
    district: profile?.district || 'Wuse 2',
    streetAddress: profile?.street_address || profile?.address || '',
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col">
      <Navbar />
      <CheckoutClient initialUser={initialUser} />
    </div>
  )
}