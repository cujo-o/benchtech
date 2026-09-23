import { Navbar } from '@/components/Navbar'
import { BuyerSidebar } from '@/components/storefront/BuyerSidebar'
import { Phase2WIP } from '@/components/common/Phase2WIP'
import { Wallet } from 'lucide-react'

export const metadata = { title: 'BenchTech Wallet | BenchTech' }

export default function WalletPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col">
      <Navbar />
      <div className="max-w-[1700px] w-full mx-auto flex flex-1">
        <BuyerSidebar />
        <main className="flex-1 min-w-0">
          <Phase2WIP
            title="Digital Wallet & Instant Payouts"
            description="Automated wallet escrow, instant Paystack vendor disbursements, and tokenized hardware credits are arriving in Phase 2."
            icon={Wallet}
            backHref="/feed"
            backLabel="Back to Marketplace"
          />
        </main>
      </div>
    </div>
  )
}