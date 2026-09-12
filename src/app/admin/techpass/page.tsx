import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Crown, Sparkles, CheckCircle2, TrendingUp, ShieldCheck } from 'lucide-react'

export default async function AdminTechPassPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login?next=/admin/techpass')

  // Fetch sample sellers on TechPass
  const { data: premiumSellers } = await supabase
    .from('profiles')
    .select('id, full_name, business_name, email, tech_trust_status, created_at')
    .eq('role', 'seller')
    .order('created_at', { ascending: false })
    .limit(10)

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Crown className="w-6 h-6 text-blue-600" />
            <h1 className="text-2xl font-bold text-slate-900">TechPass Membership Hub</h1>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Monitor buyer passes, seller visibility tiers, and Abuja platform commission overrides.
          </p>
        </div>

        <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-xs font-bold gap-1.5 h-9 rounded-xl">
          <Sparkles className="w-3.5 h-3.5" /> Configure Tier Benefits
        </Button>
      </div>

      {/* Plan Performance Matrix */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-white border-slate-200/80 shadow-sm rounded-2xl">
          <CardContent className="p-5 space-y-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase">TechPass Standard</span>
            <p className="text-xl font-black text-slate-900">₦2,500 <span className="text-xs font-normal text-slate-400">/ mo</span></p>
            <p className="text-[10px] text-emerald-600 font-bold flex items-center gap-0.5 mt-2">
              <TrendingUp className="w-3 h-3" /> Free Abuja gadget delivery up to 3 orders
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200/80 shadow-sm rounded-2xl">
          <CardContent className="p-5 space-y-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase">TechPass Pro (Sellers)</span>
            <p className="text-xl font-black text-blue-600">₦12,000 <span className="text-xs font-normal text-slate-400">/ mo</span></p>
            <p className="text-[10px] text-blue-600 font-bold flex items-center gap-0.5 mt-2">
              <ShieldCheck className="w-3 h-3" /> 0% transaction commission & priority feed rank
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200/80 shadow-sm rounded-2xl">
          <CardContent className="p-5 space-y-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase">Estimated MRR</span>
            <p className="text-xl font-black text-slate-900">₦450,000</p>
            <span className="text-[10px] text-slate-400 font-medium">Recurring pass revenue</span>
          </CardContent>
        </Card>
      </div>

      {/* Enrolled Vendors List */}
      <Card className="border-slate-200/80 shadow-sm rounded-2xl bg-white overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900">Enrolled Premium Merchants</h3>
          <Badge className="bg-blue-50 text-blue-700 border-blue-200 text-[10px]">Tier 1 Active</Badge>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-400 font-bold border-b border-slate-100 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-5 py-3.5">Store Details</th>
                <th className="px-5 py-3.5">Email</th>
                <th className="px-5 py-3.5">Verification</th>
                <th className="px-5 py-3.5">Pass Status</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {premiumSellers && premiumSellers.length > 0 ? (
                premiumSellers.map((seller) => (
                  <tr key={seller.id} className="hover:bg-slate-50/60 transition">
                    <td className="px-5 py-3.5 font-bold text-slate-900">
                      {seller.business_name || seller.full_name}
                    </td>
                    <td className="px-5 py-3.5 text-slate-500">{seller.email}</td>
                    <td className="px-5 py-3.5">
                      <Badge className={`text-[10px] capitalize ${
                        seller.tech_trust_status === 'verified'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}>
                        {seller.tech_trust_status || 'unverified'}
                      </Badge>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Active
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <Button size="sm" variant="outline" className="h-7 text-[10px] font-bold">
                        Manage Plan
                      </Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-400">No active subscribers yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}