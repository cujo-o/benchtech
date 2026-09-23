import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/Navbar'
import { BuyerSidebar } from '@/components/storefront/BuyerSidebar'
import { ProductsCatalogClient } from './ProductsCatalogClient'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Shop Technology by Category | BenchTech Abuja',
  description: 'Browse verified smartphones, computers, and electronics in Abuja.',
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
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      <div className="max-w-[1700px] w-full mx-auto flex flex-1">
        <BuyerSidebar />
        <ProductsCatalogClient initialProducts={products || []} />
      </div>
    </div>
  )
}