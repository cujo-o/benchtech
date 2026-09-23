import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  Crown,
  Lock,
  Boxes,
  Percent,
  Megaphone,
  Upload,
  BarChart3,
  ShieldCheck,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  CheckCircle2,
} from 'lucide-react'

interface ProGateProps {
  profile: any
  featureTitle: string
  featureDescription?: string
  children: React.ReactNode
}

export function ProGate({
  profile,
  featureTitle,
  featureDescription,
  children,
}: ProGateProps) {
  const isPro =
    profile?.seller_plan === 'pro' ||
    profile?.subscription_tier === 'pro' ||
    profile?.subscription_plan === 'professional'

  // If verified Pro subscriber, render the actual tool
  if (isPro) {
    return <>{children}</>
  }

  // Paywall Screen for Free Sellers
  return (
    <div className="min-h-[75vh] flex items-center justify-center p-4 sm:p-6 w-full">
      <Card className="max-w-2xl w-full bg-white border border-slate-200/90 rounded-3xl shadow-sm overflow-hidden text-center p-6 sm:p-10 space-y-6">
        {/* Lock / Crown Badge */}
        <div className="relative mx-auto w-16 h-16 rounded-3xl bg-[#1e1b4b] border border-indigo-900 flex items-center justify-center shadow-md shadow-indigo-950/10">
          <Crown className="w-8 h-8 text-amber-400 fill-amber-400" />
          <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center border-2 border-white shadow-xs">
            <Lock className="w-3 h-3" />
          </div>
        </div>

        {/* Headlines */}
        <div className="space-y-2 max-w-lg mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-50 text-purple-700 border border-purple-200">
            <Sparkles className="w-3 h-3 text-purple-600" /> Pro Member Feature
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Unlock {featureTitle}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
            {featureDescription ||
              `The ${featureTitle} tool is reserved exclusively for verified BenchTech Pro merchants to scale inventory and sales across Abuja.`}
          </p>
        </div>

        {/* Pro Plan Value Card */}
        <div className="bg-[#0c1322] text-white rounded-2xl p-5 sm:p-6 text-left border border-slate-800 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
            <div>
              <span className="text-xs font-bold text-amber-400 flex items-center gap-1">
                <Crown className="w-3.5 h-3.5 fill-amber-400" /> BenchTech Pro
              </span>
              <p className="text-sm font-black text-white">Full Business Suite</p>
            </div>
            <div className="text-left sm:text-right">
              <span className="text-2xl font-black text-white">₦5,000</span>
              <span className="text-xs text-slate-400 font-medium"> / month</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs text-slate-300">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>25 active listing slots</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>5% commission (vs 10% standard)</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>₦2,500 promotional ad credits</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Bulk CSV upload &amp; editor</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Inventory stock alerts</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Priority search indexing &amp; Pro badge</span>
            </div>
          </div>
        </div>

        {/* Call to Actions */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link href="/seller" className="w-full sm:w-auto">
            <Button
              variant="outline"
              className="w-full sm:w-auto text-xs font-bold h-11 px-5 rounded-xl border-slate-200 text-slate-600 gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
            </Button>
          </Link>

          <Link href="/seller/subscription" className="w-full sm:w-auto">
            <Button className="w-full sm:w-auto bg-[#4f46e5] hover:bg-[#4338ca] text-white font-bold text-xs h-11 px-7 rounded-xl gap-2 shadow-sm">
              Become a Pro Member &rarr;
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  )
}