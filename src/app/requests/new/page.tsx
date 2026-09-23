import { Navbar } from '@/components/Navbar'
import { BuyerSidebar } from '@/components/storefront/BuyerSidebar'
import { NewRequestForm } from './NewRequestForm'

export const metadata = {
  title: 'Request a Gadget | BenchTech Abuja',
  description: 'Broadcast your target device specifications and budget to verified Abuja tech vendors[cite: 9].',
}

export default function NewProductRequestPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      <div className="max-w-[1700px] w-full mx-auto flex flex-1">
        <BuyerSidebar />

        <main className="flex-1 min-w-0 p-3 sm:p-6 lg:p-8 flex items-center justify-center">
          <NewRequestForm />
        </main>
      </div>
    </div>
  )
}