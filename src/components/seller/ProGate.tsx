import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Crown, Lock, ArrowLeft, CheckCircle2 } from 'lucide-react'

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

  if (isPro) {
    return <>{children}</>
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <Card className="max-w-xl w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-xs p-6 sm:p-8 text-center space-y-6">
        <div className="relative mx-auto w-14 h-14 rounded-2xl bg-slate-900 dark:bg-slate-800 border border-slate-700 flex items-center justify-center">
          <Crown className="w-7 h-7 text-amber-400 fill-amber-400" />
          <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center">
            <Lock className="w-2.5 h-2.5" />
          </div>
        </div>

        <div className="space-y-1.5 max-w-md mx-auto">
          <span className="inline-block text-[10px] font-black uppercase tracking-wider text-purple-600 dark:text-purple-400">
            BenchTech Pro Feature
          </span>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
            Unlock {featureTitle}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            {featureDescription ||
              `${featureTitle} is included with the Pro Seller plan to help you manage high-volume inventory and sales in Abuja.`}
          </p>
        </div>

        <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 text-left space-y-3">
          <div className="flex items-center justify-between border-b border-slate-200/70 dark:border-slate-700 pb-2.5">
            <span className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
              <Crown className="w-3.5 h-3.5 text-amber-500 fill-amber-400" /> Pro Seller Plan
            </span>
            <span className="text-base font-black text-blue-600 dark:text-blue-400">
              ₦5,000 <span className="text-[11px] font-normal text-slate-400">/ month</span>
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-300">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span>25 active listing slots</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span>5% reduced commission</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span>₦2,500 monthly ad credit</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span>Bulk CSV upload &amp; analytics</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link href="/seller/dashboard" className="w-full sm:w-auto">
            <Button
              variant="outline"
              className="w-full sm:w-auto text-xs font-bold h-10 px-5 rounded-xl border-slate-200 dark:border-slate-700 gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
            </Button>
          </Link>
          <Link href="/seller/subscription" className="w-full sm:w-auto">
            <Button className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs h-10 px-6 rounded-xl">
              Upgrade to Pro &rarr;
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  )
}