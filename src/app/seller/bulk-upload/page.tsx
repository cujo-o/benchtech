import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ProGate } from '@/components/seller/ProGate'
import { BulkUploadClient } from './BulkUploadClient'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Bulk Product Upload | BenchTech Seller',
}

export default async function BulkUploadPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/seller/bulk-upload')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return (
    <ProGate
      profile={profile}
      featureTitle="Bulk Product Upload"
      featureDescription="Upload dozens of laptops, phones, and accessories at once via CSV without manual entry."
    >
      <BulkUploadClient />
    </ProGate>
  )
}