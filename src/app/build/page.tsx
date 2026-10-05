import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/Navbar'
import { BuildYourSetupMasterClient } from './BuildYourSetupMasterClient'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Build Your Setup | BenchTech Abuja',
  description:
    'Custom tech setups powered by AI. Assemble verified gaming battle stations, laptop rigs, coding setups, and studio desks with TechTrust escrow safety in Abuja.',
  alternates: {
    canonical: 'https://shopbenchtech.com/build',
  },
}

export default async function BuildSetupPage() {
  const supabase = await createClient()

  // Query live marketplace stock
  const { data: products } = await supabase
    .from('products')
    .select('id, title, price, category, brand, condition, images, specs, seller_id, profiles!products_seller_id_fkey(business_name, district, tech_trust_status)')
    .eq('status', 'published')
    .order('price', { ascending: true })
    .limit(100)

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col transition-colors">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 w-full flex-1">
        <BuildYourSetupMasterClient initialProducts={products || []} />
      </main>
    </div>
  )
}