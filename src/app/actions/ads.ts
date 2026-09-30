'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function createPromoteProductCampaign(formData: {
  productId: string
  durationDays?: number
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Unauthorized' }
  }

  // Fetch dynamic promotion rate from platform settings
  const { data: settings } = await supabase
    .from('platform_settings')
    .select('promote_product_rate')
    .eq('id', 'global_config')
    .single()

  const adRate = Number(settings?.promote_product_rate) || 2.5

  // Verify product ownership
  const { data: product } = await supabase
    .from('products')
    .select('id, title')
    .eq('id', formData.productId)
    .eq('seller_id', user.id)
    .single()

  if (!product) {
    return { success: false, error: 'Product not found or access denied' }
  }

  const duration = formData.durationDays || 30
  const endDate = new Date(Date.now() + duration * 24 * 60 * 60 * 1000).toISOString()

  // 1. Insert Campaign
  const { data: campaign, error: campaignError } = await supabase
    .from('ad_campaigns')
    .insert({
      seller_id: user.id,
      campaign_name: `Promote: ${product.title.slice(0, 40)}`,
      type: 'promote_product',
      status: 'active',
      ad_rate_percentage: adRate,
      duration_days: duration,
      end_date: endDate,
    })
    .select('id')
    .single()

  if (campaignError || !campaign) {
    return { success: false, error: campaignError?.message || 'Failed to create campaign' }
  }

  // 2. Link Product
  const { error: productLinkError } = await supabase
    .from('ad_campaign_products')
    .insert({
      campaign_id: campaign.id,
      product_id: product.id,
    })

  if (productLinkError) {
    return { success: false, error: productLinkError.message }
  }

  revalidatePath('/seller/promotions')
  return { success: true, campaignId: campaign.id }
}

export async function createSponsoredSearchCampaign(formData: {
  campaignName: string
  productIds: string[]
  keywords: string[]
  maxCpc: number
  dailyBudget: number
  durationDays?: number
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Unauthorized' }
  }

  // Fetch dynamic bounds
  const { data: settings } = await supabase
    .from('platform_settings')
    .select('cpc_min, cpc_max, min_daily_budget')
    .eq('id', 'global_config')
    .single()

  const minCpc = Number(settings?.cpc_min) || 50
  const maxCpcLimit = Number(settings?.cpc_max) || 500
  const minDailyBudget = Number(settings?.min_daily_budget) || 2000

  if (formData.dailyBudget < minDailyBudget) {
    return { success: false, error: `Daily budget must be at least ₦${minDailyBudget.toLocaleString()}` }
  }

  if (formData.maxCpc < minCpc || formData.maxCpc > maxCpcLimit) {
    return { success: false, error: `Maximum CPC must be between ₦${minCpc} and ₦${maxCpcLimit}` }
  }

  if (!formData.productIds.length) {
    return { success: false, error: 'Please select at least one product' }
  }

  const duration = formData.durationDays || 30
  const endDate = new Date(Date.now() + duration * 24 * 60 * 60 * 1000).toISOString()

  // 1. Create Campaign Record
  const { data: campaign, error: campaignError } = await supabase
    .from('ad_campaigns')
    .insert({
      seller_id: user.id,
      campaign_name: formData.campaignName,
      type: 'sponsored_search',
      status: 'active',
      daily_budget: formData.dailyBudget,
      max_cpc: formData.maxCpc,
      duration_days: duration,
      end_date: endDate,
    })
    .select('id')
    .single()

  if (campaignError || !campaign) {
    return { success: false, error: campaignError?.message || 'Failed to create campaign' }
  }

  // 2. Link Selected Products
  const productRows = formData.productIds.map((pid) => ({
    campaign_id: campaign.id,
    product_id: pid,
  }))
  await supabase.from('ad_campaign_products').insert(productRows)

  // 3. Link Keywords
  if (formData.keywords.length > 0) {
    const keywordRows = formData.keywords.map((kw) => ({
      campaign_id: campaign.id,
      keyword: kw.trim().toLowerCase(),
      match_type: 'broad',
    }))
    await supabase.from('ad_campaign_keywords').insert(keywordRows)
  }

  revalidatePath('/seller/promotions')
  return { success: true, campaignId: campaign.id }
}