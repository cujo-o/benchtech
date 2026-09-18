import { Navbar } from '@/components/Navbar'
import { BuyerSidebar } from '@/components/storefront/BuyerSidebar'
import { FindMyTechChat } from '@/components/assistant/FindMyTechChat'

export default function FindMyTechPage() {
  return (
    <div className="min-h-screen bg-slate-100/60 flex flex-col">
      <Navbar />
      <div className="max-w-[1700px] w-full mx-auto flex flex-1">
        <BuyerSidebar />
        <main className="flex-1 min-w-0 p-4 md:p-6 flex flex-col">
          <FindMyTechChat />
        </main>
      </div>
    </div>
  )
}