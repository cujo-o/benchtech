'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function updatePlatformSettings(formData: {
  marketplaceCommission: number
  promoteRate: number
  attributionDays: number
  cpcMin: number
  cpcSuggested: number
  cpcMax: number
  minDailyBudget: number
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { success: false, error: 'Unauthorized' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    return { success: false, error: 'Access denied: Admin only' }
  }

  const { error } = await supabase
    .from('platform_settings')
    .update({
      marketplace_commission_rate: formData.marketplaceCommission,
      promote_product_rate: formData.promoteRate,
      attribution_window_days: formData.attributionDays,
      cpc_min: formData.cpcMin,
      cpc_suggested: formData.cpcSuggested,
      cpc_max: formData.cpcMax,
      min_daily_budget: formData.minDailyBudget,
      updated_at: new Date().toISOString(),
    })
    .eq('id', 'global_config')

  if (error) return { success: false, error: error.message }

  revalidatePath('/admin/advertising')
  revalidatePath('/seller/promotions')
  return { success: true }
}

export async function toggleCampaignStatus(campaignId: string, newStatus: 'active' | 'paused' | 'suspended') {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user?.id)
    .single()

  if (profile?.role !== 'admin') {
    return { success: false, error: 'Unauthorized' }
  }

  const { error } = await supabase
    .from('ad_campaigns')
    .update({ status: newStatus })
    .eq('id', campaignId)

  if (error) return { success: false, error: error.message }

  revalidatePath('/admin/advertising')
  return { success: true }
}