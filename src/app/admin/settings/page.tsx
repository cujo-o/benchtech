import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Settings,
  Percent,
  Truck,
  ShieldCheck,
  Save,
  Crown,
  MapPin,
  AlertTriangle,
  Building2,
  CheckCircle2,
} from 'lucide-react'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Platform Control & Settings | BenchTech Admin',
}

export default async function AdminSettingsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login?next=/admin/settings')

  return (
    <div className="space-y-6 sm:space-y-8 max-w-5xl mx-auto p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
              Platform Settings &amp; Economics
            </h1>
            <Badge className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 text-[10px] font-black uppercase">
              Phase 1 Live
            </Badge>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Configure marketplace commission rates, Abuja plaza logistics dispatch fees, and TechTrust verification policies.
          </p>
        </div>
      </div>

      <form className="space-y-6">
        {/* Marketplace Economics & Fees */}
        <Card className="border border-slate-200/90 dark:border-slate-800 shadow-2xs rounded-3xl bg-white dark:bg-slate-900 overflow-hidden">
          <CardHeader className="border-b border-slate-100 dark:border-slate-800 pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 flex items-center justify-center">
                  <Percent className="w-4 h-4" />
                </div>
                <div>
                  <CardTitle className="text-sm font-black text-slate-900 dark:text-slate-100">
                    Marketplace Commission &amp; Subscription Pricing
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-400">
                    Platform fees applied to completed hardware sales and vendor tiers.
                  </CardDescription>
                </div>
              </div>
              <Badge className="bg-blue-50 text-blue-700 text-[10px] font-bold">Economics</Badge>
            </div>
          </CardHeader>
          <CardContent className="p-5 sm:p-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Standard Seller Fee (%)
                </Label>
                <Input defaultValue="10" className="h-10 text-xs mt-1.5 rounded-xl" />
                <span className="text-[10px] text-slate-400 mt-1 block">Free plan default commission</span>
              </div>
              <div>
                <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Pro Seller Rate (%)
                </Label>
                <Input defaultValue="5" className="h-10 text-xs mt-1.5 rounded-xl" />
                <span className="text-[10px] text-slate-400 mt-1 block">Discounted tier for Pro members</span>
              </div>
              <div>
                <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Pro Monthly Fee (₦)
                </Label>
                <Input defaultValue="5000" className="h-10 text-xs mt-1.5 rounded-xl" />
                <span className="text-[10px] text-slate-400 mt-1 block">Includes 25 listing credits</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Local Logistics Defaults (Abuja City-Wide) */}
        <Card className="border border-slate-200/90 dark:border-slate-800 shadow-2xs rounded-3xl bg-white dark:bg-slate-900 overflow-hidden">
          <CardHeader className="border-b border-slate-100 dark:border-slate-800 pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center">
                  <Truck className="w-4 h-4" />
                </div>
                <div>
                  <CardTitle className="text-sm font-black text-slate-900 dark:text-slate-100">
                    Abuja Intra-City Dispatch Benchmarks
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-400">
                    Benchmark delivery cost guidelines for vendors fulfilling orders from Banex and Emab.
                  </CardDescription>
                </div>
              </div>
              <Badge className="bg-emerald-50 text-emerald-700 text-[10px] font-bold">Logistics</Badge>
            </div>
          </CardHeader>
          <CardContent className="p-5 sm:p-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Central District Delivery Base (₦)
                </Label>
                <Input defaultValue="1500" className="h-10 text-xs mt-1.5 rounded-xl" />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Applicable to Wuse 2, Maitama, Central Business District, Garki
                </span>
              </div>
              <div>
                <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Outer Abuja Hub Delivery (₦)
                </Label>
                <Input defaultValue="2500" className="h-10 text-xs mt-1.5 rounded-xl" />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Applicable to Gwarinpa, Kubwa, Apo, Lugbe, Lokogoma
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Physical Inspection & Verification Policy */}
        <Card className="border border-slate-200/90 dark:border-slate-800 shadow-2xs rounded-3xl bg-white dark:bg-slate-900 overflow-hidden">
          <CardHeader className="border-b border-slate-100 dark:border-slate-800 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950 text-purple-600 flex items-center justify-center">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <CardTitle className="text-sm font-black text-slate-900 dark:text-slate-100">
                  Trust &amp; Safe Inspection Protocols
                </CardTitle>
                <CardDescription className="text-xs text-slate-400">
                  Buyer protection guarantees for physical pickup at electronics plazas.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-5 sm:p-6 space-y-4 text-xs text-slate-600 dark:text-slate-300">
            <div className="space-y-3">
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                <div>
                  <p className="font-bold text-slate-900 dark:text-slate-100">
                    Mandatory Physical Testing Protocol
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Vendors are informed that buyers have the right to test batteries, screen touch points, and verify device IMEI before any cash or transfer is finalized.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                <div>
                  <p className="font-bold text-slate-900 dark:text-slate-100">
                    Anti-Advance Deposit Policy
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Unverified vendors requesting booking or reservation deposits before meeting are subject to immediate listing takedown and platform suspension.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Submit Actions */}
        <div className="flex items-center justify-between pt-2">
          <span className="text-[11px] text-slate-400">
            Configuration changes sync immediately across active sessions.
          </span>
          <Button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs h-10 px-6 rounded-xl gap-2 shadow-xs cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" /> Save Configuration
          </Button>
        </div>
      </form>
    </div>
  )
}