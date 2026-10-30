import Link from 'next/link'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { AddFundsModal } from '@/components/ads/AddFundsModal'
import { HelpTooltip, HowItWorksCorner } from '@/components/ui/HelpTooltip'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Sparkles,
  Search,
  Layers,
  Wallet,
  ArrowRight,
} from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function SellerPromotionsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login?next=/seller/promotions')

  const [{ data: adWallet }, { data: campaigns }, { data: attributions }] =
    await Promise.all([
      supabase
        .from('ad_wallets')
        .select('*')
        .eq('seller_id', user.id)
        .maybeSingle(),
      supabase
        .from('ad_campaigns')
        .select('*')
        .eq('seller_id', user.id)
        .order('created_at', { ascending: false }),
      supabase
        .from('ad_attributions')
        .select('*')
        .eq('seller_id', user.id),
    ])

  const promoBalance = Number(adWallet?.balance || 0).toLocaleString()
  const allCampaigns = campaigns || []
  const allAttributions = attributions || []

  async function toggleSellerCampaignAction(
    campaignId: string,
    nextStatus: 'active' | 'paused'
  ): Promise<void> {
    'use server'
    const serverSupabase = await createClient()
    const {
      data: { user: authUser },
    } = await serverSupabase.auth.getUser()
    if (!authUser) return

    await serverSupabase
      .from('ad_campaigns')
      .update({ status: nextStatus, updated_at: new Date().toISOString() })
      .eq('id', campaignId)
      .eq('seller_id', authUser.id)

    revalidatePath('/seller/promotions')
    revalidatePath('/feed')
    revalidatePath('/')
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Top Header */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white">
              Product Promotions &amp; Ads
            </h1>
            <HowItWorksCorner
              title="How BenchTech Promotions & Ads Work"
              steps={[
                {
                  heading: 'Promote on Sale (2.5% Pay-When-Sold)',
                  body: 'Your product gets a Featured badge and priority placement on the Homepage and Marketplace Feed. You pay ₦0 upfront—a 2.5% fee is only deducted if an attributed buyer purchases the item within 7 days.',
                },
                {
                  heading: 'Sponsored Search (Keyword Bidding)',
                  body: 'Target high-intent search terms (e.g., "iPhone 13", "MacBook Pro"). Uses your prepaid Promo Balance only when a shopper clicks your ad, capped at your daily budget.',
                },
                {
                  heading: 'Managing Active Campaigns',
                  body: 'You can pause or resume any campaign anytime in the Campaign Performance table below.',
                },
              ]}
            />
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Increase listing visibility across search results and catalog feeds.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-4 py-2 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center gap-2.5">
            <Wallet className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <div>
              <span className="text-[9px] font-bold uppercase text-slate-400 flex items-center">
                <span>Promo Balance</span>
                <HelpTooltip text="Your prepaid balance for Sponsored Search click campaigns. Top up instantly via Paystack." />
              </span>
              <span className="text-sm font-black text-slate-900 dark:text-white">
                ₦{promoBalance}
              </span>
            </div>
          </div>
          <AddFundsModal currentBalance={promoBalance} />
        </div>
      </div>

      {/* 3 Ad Placement Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Card 1: Promote on Sale */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xs flex flex-col justify-between space-y-5">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <Sparkles className="w-5 h-5" />
              </div>
              <Badge className="bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-[10px] font-bold">
                Performance Based
              </Badge>
            </div>

            <div>
              <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center">
                <span>Promote on Sale</span>
                <HelpTooltip text="Risk-free promotion: Your listing is boosted in the feed immediately, and the 2.5% fee only applies if the item sells." />
              </h2>
              <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400">
                Pay When Sold
              </span>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mt-2">
                Featured placement in category feeds. A 2.5% fee applies only when an attributed sale completes.
              </p>
            </div>

            <ul className="space-y-1.5 text-[11px] text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800 pt-3">
              <li>• 2.5% fee on completed orders</li>
              <li>• 7-day buyer attribution window</li>
              <li className="font-bold text-slate-900 dark:text-white">
                • No charge if item does not sell
              </li>
            </ul>
          </div>

          <Link href="/seller/promotions/promote-product" className="block">
            <Button className="w-full h-10 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl gap-1.5 cursor-pointer">
              <span>Promote Listing</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </Link>
        </div>

        {/* Card 2: Sponsored Search */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xs flex flex-col justify-between space-y-5">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <Search className="w-5 h-5" />
              </div>
              <Badge className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-[10px] font-bold">
                Cost Per Click
              </Badge>
            </div>

            <div>
              <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center">
                <span>Sponsored Search</span>
                <HelpTooltip text="Pin your hardware at the top of search results for specific keywords. Deducts from your Promo Balance only when clicked." />
              </h2>
              <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                Keyword Bidding
              </span>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mt-2">
                Place listings at the top of relevant search results when buyers search for specific device models.
              </p>
            </div>

            <ul className="space-y-1.5 text-[11px] text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800 pt-3">
              <li>• ₦50 to ₦500 per valid click</li>
              <li>• Custom daily spending limits</li>
              <li className="font-bold text-slate-900 dark:text-white">
                • Deducted from promotion wallet
              </li>
            </ul>
          </div>

          <Link href="/seller/promotions/sponsored-search" className="block">
            <Button
              variant="outline"
              className="w-full h-10 border-slate-200 dark:border-slate-700 font-bold text-xs rounded-xl gap-1.5 cursor-pointer"
            >
              <span>Create Search Ad</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </Link>
        </div>

        {/* Card 3: Homepage Spotlight */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xs flex flex-col justify-between space-y-5 opacity-80">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-2xl bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                <Layers className="w-5 h-5" />
              </div>
              <Badge variant="outline" className="text-[10px] font-bold">
                Fixed Placement
              </Badge>
            </div>

            <div>
              <h2 className="text-base font-black text-slate-900 dark:text-white">
                Homepage Spotlight
              </h2>
              <span className="text-[11px] font-bold text-purple-600 dark:text-purple-400">
                Storefront Carousel
              </span>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mt-2">
                Direct display on the main marketplace banner. Placement reservations for 7 to 30 days.
              </p>
            </div>
          </div>

          <div className="text-center py-2.5 text-xs font-bold text-slate-400">
            Available Soon
          </div>
        </div>
      </div>

      {/* Campaign Performance Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
        <div>
          <h2 className="text-sm font-black text-slate-900 dark:text-white flex items-center">
            <span>Campaign Performance</span>
            <HelpTooltip text="All active campaigns below are currently prioritized in the buyer Marketplace Feed and Catalog search results." />
          </h2>
          <p className="text-xs text-slate-400">
            Overview of active placements, impressions, and sales.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs whitespace-nowrap">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-bold uppercase text-[10px]">
                <th className="pb-3 pr-4">Campaign</th>
                <th className="pb-3 px-4">Type</th>
                <th className="pb-3 px-4">Status</th>
                <th className="pb-3 px-4">Budget / Rate</th>
                <th className="pb-3 px-4">Spend</th>
                <th className="pb-3 px-4">Attributed Sales</th>
                <th className="pb-3 pl-4 text-right">Control</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {allCampaigns.length > 0 ? (
                allCampaigns.map((c) => {
                  const isActive = c.status === 'active'
                  const campSales = allAttributions
                    .filter((a) => a.campaign_id === c.id)
                    .reduce((sum, a) => sum + Number(a.gmv_amount || 0), 0)

                  return (
                    <tr
                      key={c.id}
                      className="text-slate-700 dark:text-slate-300"
                    >
                      <td className="py-3.5 pr-4 font-bold text-slate-900 dark:text-white">
                        {c.campaign_name}
                      </td>
                      <td className="py-3.5 px-4">
                        {c.type === 'promote_product'
                          ? 'Pay On Sale'
                          : 'Sponsored Search'}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            isActive
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                              : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                          }`}
                        >
                          {c.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        {c.type === 'promote_product'
                          ? `${c.ad_rate_percentage || 2.5}% per sale`
                          : `₦${Number(c.daily_budget || 2000).toLocaleString()}/day`}
                      </td>
                      <td className="py-3.5 px-4 font-bold">
                        ₦{Number(c.spent_today || 0).toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-blue-600 dark:text-blue-400">
                        ₦{campSales.toLocaleString()}
                      </td>
                      <td className="py-3.5 pl-4 text-right">
                        <form
                          action={async () => {
                            'use server'
                            await toggleSellerCampaignAction(
                              c.id,
                              isActive ? 'paused' : 'active'
                            )
                          }}
                        >
                          <Button
                            type="submit"
                            size="xs"
                            variant="outline"
                            className="rounded-lg text-[11px] font-bold cursor-pointer"
                          >
                            {isActive ? 'Pause' : 'Activate'}
                          </Button>
                        </form>
                      </td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No active promotion campaigns yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}