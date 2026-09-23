import { Navbar } from '@/components/Navbar'
import { BuyerSidebar } from '@/components/storefront/BuyerSidebar'
import { RecentlyViewedClient } from './RecentlyViewedClient'

export const metadata = {
  title: 'Recently Viewed Gadgets | BenchTech Abuja',
  description: 'View your browsing history and revisit inspected electronics in Abuja.',
}

export default function RecentlyViewedPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col">
      <Navbar />

      <div className="max-w-[1700px] w-full mx-auto flex flex-1">
        <BuyerSidebar />

        <main className="flex-1 min-w-0">
          <RecentlyViewedClient />
        </main>
      </div>
    </div>
  )
}