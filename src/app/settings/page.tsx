import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/Navbar'
import { BuyerSidebar } from '@/components/storefront/BuyerSidebar'
import { BuyerSettingsClient } from './BuyerSettingsClient'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Account Settings & Theme | BenchTech',
  description: 'Manage your display theme, Abuja delivery address, and password settings.',
}

export default async function BuyerSettingsPage() {
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

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col transition-colors">
      <Navbar />
      <div className="max-w-[1700px] w-full mx-auto flex flex-1">
        <BuyerSidebar />
        <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8">
          <BuyerSettingsClient
            user={user ? { id: user.id, email: user.email || '' } : null}
            profile={profile}
          />
        </main>
      </div>
    </div>
  )
}