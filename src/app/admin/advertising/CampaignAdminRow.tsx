'use client'

import { useState } from 'react'
import { toggleCampaignStatus } from '@/app/actions/adminAds'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export function CampaignAdminRow({ campaign }: { campaign: any }) {
  const [status, setStatus] = useState(campaign.status)
  const [loading, setLoading] = useState(false)

  async function handleToggle(newStatus: 'active' | 'paused' | 'suspended') {
    setLoading(true)
    const res = await toggleCampaignStatus(campaign.id, newStatus)
    setLoading(false)
    if (res.success) {
      setStatus(newStatus)
    } else {
      alert(res.error || 'Failed to update campaign')
    }
  }

  const sellerName =
    campaign.profiles?.business_name ||
    campaign.profiles?.full_name ||
    campaign.profiles?.email ||
    'Seller'

  return (
    <tr className="text-slate-700 dark:text-slate-300 text-xs">
      <td className="py-3 font-semibold text-slate-900 dark:text-slate-100">
        {sellerName}
      </td>
      <td className="py-3 truncate max-w-[180px]">{campaign.campaign_name}</td>
      <td className="py-3 capitalize">
        {campaign.type === 'promote_product' ? 'Pay When Sold' : 'Sponsored Search'}
      </td>
      <td className="py-3 font-bold">
        {campaign.type === 'promote_product'
          ? `${campaign.ad_rate_percentage}%`
          : `₦${Number(campaign.daily_budget).toLocaleString()}/d`}
      </td>
      <td className="py-3">
        <Badge
          className={
            status === 'active'
              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
              : status === 'paused'
              ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
              : 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300'
          }
        >
          {status}
        </Badge>
      </td>
      <td className="py-3 text-right space-x-1.5">
        {status === 'active' ? (
          <Button
            size="sm"
            variant="outline"
            disabled={loading}
            onClick={() => handleToggle('paused')}
            className="text-[10px] h-7 px-2 font-bold"
          >
            Pause
          </Button>
        ) : (
          <Button
            size="sm"
            variant="outline"
            disabled={loading}
            onClick={() => handleToggle('active')}
            className="text-[10px] h-7 px-2 font-bold text-emerald-600"
          >
            Resume
          </Button>
        )}
        <Button
          size="sm"
          variant="outline"
          disabled={loading || status === 'suspended'}
          onClick={() => handleToggle('suspended')}
          className="text-[10px] h-7 px-2 font-bold text-red-600 border-red-200 dark:border-red-900"
        >
          Kill
        </Button>
      </td>
    </tr>
  )
}