import { Suspense } from 'react'
import { Navbar } from '@/components/Navbar'
import { BuyerSidebar } from '@/components/storefront/BuyerSidebar'
import { CompareClient } from './CompareClient'
import { Loader2 } from 'lucide-react'

export const metadata = {
  title: 'Compare Tech Specs | BenchTech Abuja',
  description: 'Side-by-side technical hardware and price comparison.',
}

export default function ComparePage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col">
      <Navbar />

      <div className="max-w-[1700px] w-full mx-auto flex flex-1">
        <BuyerSidebar />

        <main className="flex-1 min-w-0">
          <Suspense
            fallback={
              <div className="min-h-[400px] flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              </div>
            }
          >
            <CompareClient />
          </Suspense>
        </main>
      </div>
    </div>
  )
}