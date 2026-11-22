import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/Navbar'
import { BuyerSidebar } from '@/components/storefront/BuyerSidebar'
import { FindMyTechChat } from '@/components/assistant/FindMyTechChat'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'BenchTech AI — Hardware Advisor | BenchTech Abuja',
  description:
    'Ask BenchTech AI about laptops, smartphones, cameras, consoles, specifications, and verified Abuja store pricing.',
}

export default async function AssistantPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login?next=/assistant')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, business_name')
    .eq('id', user.id)
    .maybeSingle()

  const userName =
    profile?.full_name ||
    profile?.business_name ||
    user.email?.split('@')[0] ||
    null

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col">
      <Navbar />
      <div className="w-full flex flex-1">
        <BuyerSidebar />
        <main className="flex-1 min-w-0">
          <FindMyTechChat userName={userName} />
        </main>
      </div>
    </div>
  )
}