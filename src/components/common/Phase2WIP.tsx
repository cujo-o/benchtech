import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Clock,
  ArrowLeft,
  Sparkles,
  Construction,
  type LucideIcon,
} from 'lucide-react'

interface Phase2WIPProps {
  title: string
  description?: string
  backHref?: string
  backLabel?: string
  icon?: LucideIcon
  expectedRelease?: string
}

export function Phase2WIP({
  title,
  description,
  backHref = '/feed',
  backLabel = 'Back to Marketplace',
  icon: Icon = Construction,
  expectedRelease = 'Phase 2 Release',
}: Phase2WIPProps) {
  return (
    <div className="min-h-[75vh] w-full flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <Card className="max-w-md w-full bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl p-6 sm:p-8 text-center space-y-5 shadow-xs mx-auto">
        <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-950/50 border border-blue-100 dark:border-blue-900/60 flex items-center justify-center mx-auto text-blue-600 dark:text-blue-400 shadow-2xs">
          <Icon className="w-6 h-6 animate-pulse" />
        </div>

        <div className="space-y-2">
          <Badge className="bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200/80 dark:border-blue-800 text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full">
            <Sparkles className="w-2.5 h-2.5 mr-1 text-amber-500" />
            {expectedRelease}
          </Badge>

          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            {title}
          </h1>

          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-sm mx-auto">
            {description ||
              `We are currently optimizing verified merchant verification and Banex inspection protocols for Phase 1. ${title} will go live in the upcoming Phase 2 platform update.`}
          </p>
        </div>

        <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-300 flex items-center justify-center gap-2">
          <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span>Under active development • Launching post-Abuja rollout</span>
        </div>

        <div className="pt-1">
          <Link href={backHref}>
            <Button
              variant="outline"
              size="sm"
              className="w-full text-xs font-bold rounded-xl h-10 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>{backLabel}</span>
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  )
}