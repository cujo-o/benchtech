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

export default async function ProductsPage() {
  const supabase = await createClient()

  // Fetch initial products cleanly on the server
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
        {/* Desktop Sidebar Navigation (Hidden on mobile, fixed width on PC) */}
        <div className="hidden lg:block shrink-0 border-r border-slate-200/80 dark:border-slate-800/80">
          <BuyerSidebar />
        </div>

        {/* Catalog Main Content Area (min-w-0 prevents all grid blowout) */}
        <div className="flex-1 min-w-0 w-full">
          <ProductsCatalogClient initialProducts={products || []} />
        </div>
      </div>
    </div>
  )
}