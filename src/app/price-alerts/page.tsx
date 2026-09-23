import { Navbar } from '@/components/Navbar'
import { BuyerSidebar } from '@/components/storefront/BuyerSidebar'
import { Phase2WIP } from '@/components/common/Phase2WIP'
import { Bell } from 'lucide-react'

export const metadata = { title: 'Price Drop Alerts | BenchTech' }

export default function PriceAlertsPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col">
      <Navbar />
      <div className="max-w-[1700px] w-full mx-auto flex flex-1">
        <BuyerSidebar />
        <main className="flex-1 min-w-0">
          <Phase2WIP
            title="Automated Price Drop Alerts"
            description="Set target Naira thresholds on high-demand gadgets in Banex and receive real-time WhatsApp or SMS alerts when prices drop."
            icon={Bell}
            backHref="/feed"
          />
        </main>
      </div>
    </div>
  )
}