import { MetadataRoute } from 'next'
import { createClient } from '@supabase/supabase-js'

export const revalidate = 3600 // Refresh sitemap every hour

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://shopbenchtech.com'

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  // 1. Fetch all live published gadgets
  const { data: products } = await supabase
    .from('products')
    .select('id, updated_at, created_at')
    .eq('status', 'published')

  const productUrls: MetadataRoute.Sitemap = (products || []).map((p) => ({
    url: `${baseUrl}/products/${p.id}`,
    lastModified: new Date(p.updated_at || p.created_at),
    changeFrequency: 'daily',
    priority: 0.8,
  }))

  // 2. Fetch all verified sellers
  const { data: sellers } = await supabase
    .from('profiles')
    .select('id, updated_at, created_at')
    .not('business_name', 'is', null)

  const sellerUrls: MetadataRoute.Sitemap = (sellers || []).map((s) => ({
    url: `${baseUrl}/sellers/${s.id}`,
    lastModified: new Date(s.updated_at || s.created_at || Date.now()),
    changeFrequency: 'weekly',
    priority: 0.7,
  }))

  // 3. Core Static Indexable Pages
  const staticUrls: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'always',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/feed`,
      lastModified: new Date(),
      changeFrequency: 'always',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/products`,
      lastModified: new Date(),
      changeFrequency: 'hourly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/sellers`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/requests/new`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/compare`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/help`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
  ]

  return [...staticUrls, ...productUrls, ...sellerUrls]
}