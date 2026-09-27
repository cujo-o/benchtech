import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/Navbar'
import { BuyerSidebar } from '@/components/storefront/BuyerSidebar'
import { ProductsCatalogClient } from './ProductsCatalogClient'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Explore Gadgets & Electronics in Abuja | BenchTech',
  description:
    'Browse verified laptops, smartphones, gaming consoles, and accessories available for direct pickup or delivery in Abuja. Compare prices from Banex, Emab, and Wuse 2 dealers.',
  alternates: {
    canonical: 'https://shopbenchtech.com/products',
  },
  openGraph: {
    title: 'Buy Phones, Laptops & Tech in Abuja | BenchTech',
    description:
      'Browse inspected devices from verified Abuja tech merchants. Secure escrow protection and physical inspection available.',
    url: 'https://shopbenchtech.com/products',
    siteName: 'BenchTech',
    locale: 'en_NG',
    type: 'website',
  },
}

function CatalogSkeleton() {
  return (
    <div className="p-3 sm:p-5 lg:p-6 space-y-4 max-w-[1600px] mx-auto w-full animate-pulse">
      <div className="flex gap-2 overflow-hidden pb-1">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-8 w-24 bg-slate-200 dark:bg-slate-800 rounded-xl shrink-0" />
        ))}
      </div>
      <div className="h-14 bg-slate-200 dark:bg-slate-800 rounded-2xl w-full" />
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4.5 pt-2">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="h-72 bg-slate-200 dark:bg-slate-800 rounded-2xl w-full" />
        ))}
      </div>
    </div>
  )
}

export default async function ProductsPage() {
  const supabase = await createClient()

  const { data: products } = await supabase
    .from('products')
    .select('*, profiles!products_seller_id_fkey(business_name, district, tech_trust_status)')
    .eq('status', 'published')
    .order('is_featured', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false })

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col transition-colors">
      <Navbar />

      <div className="max-w-[1700px] w-full mx-auto flex flex-1 min-w-0">
        {/* Persistent App Navigation Sidebar (Desktop only) */}
        <aside className="hidden lg:block shrink-0 border-r border-slate-200/80 dark:border-slate-800/80">
          <BuyerSidebar />
        </aside>

        {/* Main Catalog View */}
        <main className="flex-1 min-w-0 w-full">
          <Suspense fallback={<CatalogSkeleton />}>
            <ProductsCatalogClient initialProducts={products || []} />
          </Suspense>
        </main>
      </div>
    </div>
  )
}