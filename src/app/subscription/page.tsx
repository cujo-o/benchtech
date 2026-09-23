import { Navbar } from '@/components/Navbar'
import { BuyerSidebar } from '@/components/storefront/BuyerSidebar'
import { Phase2WIP } from '@/components/common/Phase2WIP'
import { Crown } from 'lucide-react'

export const metadata = {
  title: 'TechPass Buyer Membership | BenchTech Abuja',
  description: 'Exclusive buyer benefits, verified member discounts, and free delivery across Abuja.',
}

export default function TechPassSubscriptionPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col">
      <Navbar />

      <div className="max-w-[1700px] w-full mx-auto flex flex-1">
        <BuyerSidebar />

        <main className="flex-1 min-w-0">
          <Phase2WIP
            title="TechPass Buyer Membership"
            description="Unlimited free deliveries across Abuja, unlock direct vendor phone numbers, exclusive weekly flash deals, and purchase protection tokens are scheduled for Phase 2."
            icon={Crown}
            expectedRelease="Phase 2 Release"
            backHref="/feed"
            backLabel="Back to Marketplace"
          />
        </main>
      </div>
    </div>
  )
}