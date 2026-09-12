import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Settings, Percent, Truck, ShieldAlert, Save } from 'lucide-react'

export default async function AdminSettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login?next=/admin/settings')

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <div className="flex items-center gap-2">
          <Settings className="w-6 h-6 text-slate-900" />
          <h1 className="text-2xl font-bold text-slate-900">Platform Settings & Control</h1>
        </div>
        <p className="text-xs text-slate-500 mt-0.5">
          Configure marketplace commission, Abuja intra-city dispatch parameters, and security policies.
        </p>
      </div>

      <form className="space-y-6">
        {/* Marketplace Commission Rates */}
        <Card className="border-slate-200/80 shadow-sm rounded-2xl bg-white">
          <CardHeader className="border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2">
              <Percent className="w-4 h-4 text-blue-600" />
              <CardTitle className="text-sm font-bold">Transaction Fees & Commission</CardTitle>
            </div>
            <CardDescription className="text-xs">
              Fee deducted on direct checkout and escrow-backed gadget purchases.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-xs font-semibold">Standard Seller Commission (%)</Label>
                <Input defaultValue="1.5" className="h-10 text-xs mt-1.5" />
                <span className="text-[10px] text-slate-400">Current platform default: 1.5%</span>
              </div>
              <div>
                <Label className="text-xs font-semibold">TechPass Pro Commission (%)</Label>
                <Input defaultValue="0.0" className="h-10 text-xs mt-1.5" />
                <span className="text-[10px] text-slate-400">Tier benefit for verified monthly subscribers</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Local Logistics Defaults */}
        <Card className="border-slate-200/80 shadow-sm rounded-2xl bg-white">
          <CardHeader className="border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-emerald-600" />
              <CardTitle className="text-sm font-bold">Abuja Delivery Base Rates</CardTitle>
            </div>
            <CardDescription className="text-xs">
              Standard rates applied to dispatch logistics across Abuja districts.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-xs font-semibold">Central Phase 1 (Wuse 2, Garki, Maitama) (₦)</Label>
                <Input defaultValue="1500" className="h-10 text-xs mt-1.5" />
              </div>
              <div>
                <Label className="text-xs font-semibold">Phase 2/3 (Gwarinpa, Kubwa, Apo, Lugbe) (₦)</Label>
                <Input defaultValue="2500" className="h-10 text-xs mt-1.5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="button" className="bg-blue-600 hover:bg-blue-700 text-xs font-bold h-10 px-6 rounded-xl gap-2 shadow-sm">
            <Save className="w-3.5 h-3.5" /> Save Configuration
          </Button>
        </div>
      </form>
    </div>
  )
}