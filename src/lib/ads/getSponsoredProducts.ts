import { createClient } from '@/lib/supabase/server'

export interface SponsoredProductResult {
  product: any
  campaignId: string
  sellerId: string
  adRank: number
  campaignType: 'promote_product' | 'sponsored_search'
}

export async function getSponsoredProducts({
  category,
  query,
  limit = 4,
}: {
  category?: string
  query?: string
  limit?: number
}): Promise<SponsoredProductResult[]> {
  const supabase = await createClient()
  const cleanQuery = query?.trim().toLowerCase() || ''

  const [{ data: campaigns }, { data: sellerProducts }] = await Promise.all([
    supabase
      .from('ad_campaigns')
      .select(
        `
        *,
        ad_campaign_products (
          product:products (
            *,
            profiles!products_seller_id_fkey (
              business_name,
              district,
              tech_trust_status
            )
          )
        ),
        ad_campaign_keywords (
          keyword,
          match_type
        )
      `
      )
      .eq('status', 'active'),
    supabase
      .from('products')
      .select(
        '*, profiles!products_seller_id_fkey(business_name, district, tech_trust_status)'
      )
      .eq('status', 'published'),
  ])

  if (!campaigns || campaigns.length === 0) return []

  const allPublished = sellerProducts || []
  const candidatePool: SponsoredProductResult[] = []
  const seenProductIds = new Set<string>()

  for (const campaign of campaigns) {
    if (
      campaign.type === 'sponsored_search' &&
      Number(campaign.daily_budget || 0) > 0 &&
      Number(campaign.spent_today || 0) >= Number(campaign.daily_budget)
    ) {
      continue
    }

    let linkedProducts = (
      campaign.ad_campaign_products?.map((cp: any) => cp.product) || []
    ).filter(Boolean)

    // Fallback: if ad_campaign_products is empty, match by campaign.product_id or seller's matching product title
    if (linkedProducts.length === 0) {
      const cleanedCampTitle = (campaign.campaign_name || '')
        .replace(/^(promote:|search ad:)/i, '')
        .replace(/search ad$/i, '')
        .trim()
        .toLowerCase()

      linkedProducts = allPublished.filter(
        (p) =>
          p.seller_id === campaign.seller_id &&
          (p.id === (campaign as any).product_id ||
            (cleanedCampTitle &&
              p.title?.toLowerCase().includes(cleanedCampTitle)))
      )
    }

    const keywords: string[] =
      campaign.ad_campaign_keywords?.map((k: any) => k.keyword.toLowerCase()) ||
      []

    for (const product of linkedProducts) {
      if (!product || product.status !== 'published') continue
      if (seenProductIds.has(product.id)) continue

      if (
        category &&
        category !== 'all' &&
        product.category?.toLowerCase() !== category.toLowerCase()
      ) {
        continue
      }

      let relevanceScore = 1.0
      const title = product.title?.toLowerCase() || ''
      const brand = product.brand?.toLowerCase() || ''

      if (cleanQuery) {
        if (title.includes(cleanQuery)) relevanceScore += 2.5
        if (brand.includes(cleanQuery)) relevanceScore += 1.5
        if (
          keywords.some(
            (kw) => cleanQuery.includes(kw) || kw.includes(cleanQuery)
          )
        ) {
          relevanceScore += 3.0
        }
        if (relevanceScore === 1.0 && keywords.length > 0) {
          continue
        }
      }

      const sellerObj = Array.isArray(product.profiles)
        ? product.profiles[0]
        : product.profiles
      const isVerified = sellerObj?.tech_trust_status === 'verified'
      const trustMultiplier = isVerified ? 1.35 : 1.0

      const bid =
        campaign.type === 'sponsored_search'
          ? Number(campaign.max_cpc || 100)
          : 120
      const adRank = bid * relevanceScore * trustMultiplier

      seenProductIds.add(product.id)
      candidatePool.push({
        product,
        campaignId: campaign.id,
        sellerId: campaign.seller_id,
        adRank,
        campaignType: campaign.type,
      })
    }
  }

  return candidatePool.sort((a, b) => b.adRank - a.adRank).slice(0, limit)
}