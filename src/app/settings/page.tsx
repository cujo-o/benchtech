import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/Navbar'
import { BuyerSidebar } from '@/components/storefront/BuyerSidebar'
import { BuyerSettingsClient } from './BuyerSettingsClient'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Account Settings & Security | BenchTech Abuja',
  description:
    'Manage your BenchTech profile, email address, password, two-factor authentication, sessions, and display theme.',
}

export default async function BuyerSettingsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login?next=/settings')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle()

  const providers: string[] = Array.isArray(user.app_metadata?.providers)
    ? user.app_metadata.providers
    : user.app_metadata?.provider
    ? [user.app_metadata.provider]
    : ['email']

  const authInfo = {
    emailConfirmedAt: user.email_confirmed_at || null,
    newEmail: user.new_email || null,
    lastSignInAt: user.last_sign_in_at || null,
    createdAt: user.created_at || null,
    providers,
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col">
      <Navbar />
      <div className="w-full flex flex-1">
        <BuyerSidebar />
        <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8">
          <div className="max-w-4xl mx-auto">
            <BuyerSettingsClient
              user={{ id: user.id, email: user.email || '' }}
              profile={profile}
              authInfo={authInfo}
            />
          </div>
        </main>
      </div>
    </div>
  )
}