import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import {
  Sparkles,
  Megaphone,
  Flame,
  Crown,
  Lock,
  ArrowRight,
  TrendingUp,
  Tag,
  Zap,
  CheckCircle2,
  Clock,
} from 'lucide-react'

export const metadata = {
  title: 'Promotions Studio | BenchTech Seller',
}

export default async function PromotionsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login?next=/seller/promotions')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const isPro =
    profile?.seller_plan === 'pro' ||
    profile?.subscription_tier === 'pro' ||
    profile?.subscription_plan === 'professional'

  const promoBalance = profile?.promotional_balance ?? (isPro ? 2500 : 0)

  return (
    <div className="space-y-6 sm:space-y-8 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Promotions Studio
            </h1>
            <Badge className="bg-purple-100 text-purple-800 text-[10px] font-black uppercase">
              Pro Advantage
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Feature listings on the homepage, rank higher in search, and use included ad credits.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-[10px] uppercase font-bold text-slate-400">Promo Credit Balance</span>
            <p className="text-xl font-black text-purple-600">₦{Number(promoBalance).toLocaleString()}</p>
          </div>
          <Button className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs h-10 rounded-xl gap-1.5 shadow-xs">
            + Create Promotion
          </Button>
        </div>
      </div>

      <div className="relative">
        {/* Pro Lock Overlay */}
        {!isPro && (
          <div className="absolute inset-0 z-20 backdrop-blur-md bg-white/80 rounded-3xl flex flex-col items-center justify-center p-6 text-center">
            <div className="max-w-md bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mx-auto">
                <Lock className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900">Promotions Require BenchTech Pro</h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Pro members receive ₦2,500 monthly promotional credits automatically to feature flagships and clearance stocks.
                </p>
              </div>
              <Link href="/seller/subscription" className="block pt-2">
                <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black text-xs h-11 rounded-xl shadow-md gap-2">
                  Upgrade to Pro — ₦5,000/month <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </Link>
            </div>
          </div>
        )}

        <div className={`space-y-6 ${!isPro ? 'select-none pointer-events-none opacity-40' : ''}`}>
          {/* Promotion Options Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="rounded-3xl border-slate-200/80 bg-white p-5 shadow-xs space-y-3 hover:border-blue-500 transition">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Flame className="w-5 h-5 text-red-500 fill-red-500" />
              </div>
              <div>
                <h4 className="font-bold text-xs text-slate-900">Featured Listing Placement</h4>
                <p className="text-[11px] text-slate-500 mt-0.5">Pins your device at the top of category and search results across Abuja.</p>
              </div>
              <p className="text-xs font-black text-blue-600 pt-1">₦500 / 3 days</p>
            </Card>

            <Card className="rounded-3xl border-slate-200/80 bg-white p-5 shadow-xs space-y-3 hover:border-blue-500 transition">
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-xs text-slate-900">Deals &amp; Clearance Spotlight</h4>
                <p className="text-[11px] text-slate-500 mt-0.5">Highlights your discounted units on the dedicated /deals showcase.</p>
              </div>
              <p className="text-xs font-black text-purple-600 pt-1">₦1,000 / 7 days</p>
            </Card>

            <Card className="rounded-3xl border-slate-200/80 bg-white p-5 shadow-xs space-y-3 hover:border-blue-500 transition">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <Crown className="w-5 h-5 fill-amber-400" />
              </div>
              <div>
                <h4 className="font-bold text-xs text-slate-900">Homepage Hero Showcase</h4>
                <p className="text-[11px] text-slate-500 mt-0.5">Maximum platform visibility on the main buyer feed header banner.</p>
              </div>
              <p className="text-xs font-black text-amber-600 pt-1">₦2,500 / 7 days</p>
            </Card>
          </div>

          {/* Active Campaigns Table */}
          <Card className="rounded-3xl border-slate-200/80 bg-white p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-900">Active &amp; Scheduled Campaigns</h3>
              <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                <span className="text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full">3 Active</span>
                <span className="text-slate-400">1 Scheduled</span>
              </div>
            </div>

            <div className="divide-y divide-slate-100 text-xs">
              {[
                { title: 'iPhone 15 Pro Max 256GB', type: 'Featured Listing', spent: '₦500 / ₦1,000', views: 1240, clicks: 320, status: 'Active' },
                { title: 'MacBook Air M2 16GB RAM', type: 'Category Spotlight', spent: '₦600 / ₦1,000', views: 980, clicks: 210, status: 'Active' },
                { title: 'PlayStation 5 Disc Edition', type: 'Homepage Feature', spent: '₦2,500 / ₦2,500', views: 3420, clicks: 650, status: 'Completed' },
              ].map((c, idx) => (
                <div key={idx} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-0.5">
                    <p className="font-bold text-slate-900">{c.title}</p>
                    <p className="text-[11px] text-slate-400">{c.type} • {c.views} views • {c.clicks} clicks</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-bold text-slate-700">{c.spent}</span>
                    <Badge className={c.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border-none' : 'bg-slate-100 text-slate-600 border-none'}>
                      {c.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}