import { Navbar } from '@/components/Navbar'
import { BuyerSidebar } from '@/components/storefront/BuyerSidebar'
import { Phase2WIP } from '@/components/common/Phase2WIP'
import { Users } from 'lucide-react'

export const metadata = { title: 'Referral Rewards | BenchTech' }

export default function ReferralsPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col">
      <Navbar />
      <div className="max-w-[1700px] w-full mx-auto flex flex-1">
        <BuyerSidebar />
        <main className="flex-1 min-w-0">
          <Phase2WIP
            title="Community Referral Rewards"
            description="Earn TechPass discounts and listing promo credits by referring verified Abuja merchants and tech buyers to BenchTech."
            icon={Users}
            backHref="/feed"
          />
        </main>
      </div>
    </div>
  )
}