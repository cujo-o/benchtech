import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/Navbar'
import { BuyerSidebar } from '@/components/storefront/BuyerSidebar'
import { ProductsCatalogClient } from './ProductsCatalogClient'
import { ArrowLeft } from 'lucide-react'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Explore Hardware Catalog | BenchTech Abuja',
  description:
    'Search and filter verified laptops, smartphones, gaming consoles, and accessories in Abuja.',
}

export default async function ProductsCatalogPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; q?: string; condition?: string }>
}) {
  const params = await searchParams
  const supabase = await createClient()

  const [
    {
      data: { user },
    },
    { data: products },
  ] = await Promise.all([
    supabase.auth.getUser(),
    supabase
      .from('products')
      .select(
        '*, profiles!products_seller_id_fkey(business_name, full_name, district, tech_trust_status)'
      )
      .eq('status', 'published')
      .order('is_featured', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false }),
  ])

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col">
      <Navbar />

      <div className="max-w-[1700px] w-full mx-auto flex flex-1">
        {/* Only render BuyerSidebar when the user is signed in */}
        {user && <BuyerSidebar />}

        <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 space-y-4">
          {!user && (
            <div>
              <Link
                href="/"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 transition"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Home</span>
              </Link>
            </div>
          )}

          <ProductsCatalogClient
            initialProducts={products || []}
            initialCategory={params?.category || 'all'}
            initialQuery={params?.q || ''}
          />
        </main>
      </div>
    </div>
  )
}