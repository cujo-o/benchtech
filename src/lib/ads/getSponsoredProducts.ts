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
  limit = 2,
}: {
  category?: string
  query?: string
  limit?: number
}): Promise<SponsoredProductResult[]> {
  const supabase = await createClient()
  const cleanQuery = query?.trim().toLowerCase() || ''

  // 1. Fetch active campaigns that have not exhausted their budget
  const { data: campaigns } = await supabase
    .from('ad_campaigns')
    .select(`
      id,
      seller_id,
      type,
      max_cpc,
      daily_budget,
      spent_today,
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
    `)
    .eq('status', 'active')

  if (!campaigns || campaigns.length === 0) return []

  const candidatePool: SponsoredProductResult[] = []

  for (const campaign of campaigns) {
    // Safety check: skip if budget exhausted
    if (
      campaign.type === 'sponsored_search' &&
      Number(campaign.spent_today) >= Number(campaign.daily_budget)
    ) {
      continue
    }

    const linkedProducts = campaign.ad_campaign_products?.map((cp: any) => cp.product) || []
    const keywords: string[] = campaign.ad_campaign_keywords?.map((k: any) => k.keyword.toLowerCase()) || []

    for (const product of linkedProducts) {
      if (!product || product.status !== 'published') continue

      // Match category filter if specified
      if (category && category !== 'all' && product.category?.toLowerCase() !== category.toLowerCase()) {
        continue
      }

      // Quality & Relevance Scoring
      let relevanceScore = 1.0
      const title = product.title?.toLowerCase() || ''
      const brand = product.brand?.toLowerCase() || ''

      if (cleanQuery) {
        if (title.includes(cleanQuery)) relevanceScore += 2.5
        if (brand.includes(cleanQuery)) relevanceScore += 1.5
        if (keywords.some((kw) => cleanQuery.includes(kw) || kw.includes(cleanQuery))) {
          relevanceScore += 3.0
        }

        // If query was typed but no relevance matches, do not display
        if (relevanceScore === 1.0 && keywords.length > 0) {
          continue
        }
      }

      // Seller Trust Multiplier (Verified dealers get priority)
      const isVerified = product.profiles?.tech_trust_status === 'verified'
      const trustMultiplier = isVerified ? 1.35 : 1.0

      // Bid weight
      const bid = campaign.type === 'sponsored_search' ? Number(campaign.max_cpc || 100) : 100
      const adRank = bid * relevanceScore * trustMultiplier

      candidatePool.push({
        product,
        campaignId: campaign.id,
        sellerId: campaign.seller_id,
        adRank,
        campaignType: campaign.type,
      })
    }
  }

  // Sort by highest AdRank and return top designated slots
  return candidatePool.sort((a, b) => b.adRank - a.adRank).slice(0, limit)
}