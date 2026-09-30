export function rankSponsoredProducts(
  sponsoredItems: any[],
  searchQuery: string
) {
  const q = searchQuery.toLowerCase().trim()

  return sponsoredItems
    .map((item) => {
      let relevance = 1.0
      const title = item.title?.toLowerCase() || ''
      const brand = item.brand?.toLowerCase() || ''
      const keywords: string[] = item.ad_campaign_keywords?.map((k: any) => k.keyword.toLowerCase()) || []

      if (title.includes(q)) relevance += 2.0
      if (brand.includes(q)) relevance += 1.5
      if (keywords.some((kw) => q.includes(kw) || kw.includes(q))) relevance += 2.5

      // Seller reputation multiplier
      const isVerified = item.profiles?.tech_trust_status === 'verified'
      const trustScore = isVerified ? 1.4 : 1.0

      const maxCpc = Number(item.campaign?.max_cpc || 100)
      const rankScore = maxCpc * relevance * trustScore

      return { ...item, rankScore, isSponsored: true }
    })
    .sort((a, b) => b.rankScore - a.rankScore)
}