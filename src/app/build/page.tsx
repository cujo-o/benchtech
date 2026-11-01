import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/Navbar'
import { BuyerSidebar } from '@/components/storefront/BuyerSidebar'
import { BuildYourSetupMasterClient } from './BuildYourSetupMasterClient'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Build My Setup — Adaptive Computer & Setup Consultant | BenchTech Abuja',
  description:
    'Tell us what you need to do. Get a complete, compatible laptop, desktop, or workstation recommendation matched to live Abuja inventory within your budget.',
}

export default async function BuildMySetupPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login?next=/build')
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col">
      <Navbar />
      <div className="max-w-[1700px] w-full mx-auto flex flex-1">
        <BuyerSidebar />
        <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8">
          <BuildYourSetupMasterClient />
        </main>
      </div>
    </div>
  )
}