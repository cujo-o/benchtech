import { Navbar } from '@/components/Navbar'
import { BuyerSidebar } from '@/components/storefront/BuyerSidebar'
import { Phase2WIP } from '@/components/common/Phase2WIP'
import { Disc } from 'lucide-react'

export const metadata = {
  title: 'TechSpin Daily Rewards | BenchTech Abuja',
  description: 'Gamified rewards, daily voucher tokens, and promo credits for buyers and vendors.',
}

export default function TechSpinPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col">
      <Navbar />

      <div className="max-w-[1700px] w-full mx-auto flex flex-1">
        <BuyerSidebar />

        <main className="flex-1 min-w-0">
          <Phase2WIP
            title="TechSpin Daily Rewards"
            description="Daily gamified reward wheels, buyer discount tokens, and listing boost prizes are scheduled to go live in the upcoming Phase 2 platform update."
            icon={Disc}
            expectedRelease="Phase 2 Feature"
            backHref="/feed"
            backLabel="Back to Marketplace"
          />
        </main>
      </div>
    </div>
  )
}