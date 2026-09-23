import { unstable_cache } from 'next/cache'
import { createClient } from '@supabase/supabase-js'

// Use a standalone Supabase client for public cached reads (no auth cookies needed)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// 1. Cached Feed Products (cached for 60 seconds or until tag 'products' is purged)
export const getCachedFeedProducts = unstable_cache(
  async (limit = 20) => {
    const { data, error } = await supabase
      .from('products')
      .select('*, profiles!products_seller_id_fkey(business_name, district, tech_trust_status)')
      .eq('status', 'published')
      .order('is_featured', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw error
    return data || []
  },
  ['feed-products'],
  {
    revalidate: 60,
    tags: ['products', 'feed'],
  }
)

// 2. Cached Single Product Details
export const getCachedProductById = (id: string) =>
  unstable_cache(
    async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*, profiles!products_seller_id_fkey(business_name, district, tech_trust_status, phone)')
        .eq('id', id)
        .maybeSingle()

      if (error) throw error
      return data
    },
    [`product-detail-${id}`],
    {
      revalidate: 300, // 5 minutes
      tags: ['products', `product-${id}`],
    }
  )()