import { Navbar } from '@/components/Navbar'
import { BuyerSidebar } from '@/components/storefront/BuyerSidebar'
import { HelpCenterClient } from './HelpCenterClient'

export const metadata = {
  title: 'Help Centre & Safety Guide | BenchTech Abuja',
  description: 'Verified inspection guidelines, merchant support, and customer care in Abuja.',
}

export default function HelpPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col">
      <Navbar />

      <div className="max-w-[1700px] w-full mx-auto flex flex-1">
        <BuyerSidebar />

        <main className="flex-1 min-w-0">
          <HelpCenterClient />
        </main>
      </div>
    </div>
  )
}