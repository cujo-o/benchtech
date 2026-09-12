import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { signOut } from '@/app/(auth)/actions'
import { 
  LayoutDashboard, 
  PackagePlus, 
  Boxes, 
  CreditCard, 
  Store, 
  LogOut, 
  ShieldCheck,
  ExternalLink,
  MessageSquare,
  Settings,
  BarChart3,
  HelpCircle
} from 'lucide-react'
import { Button } from '@/components/ui/button'

export default async function SellerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-white border-r border-slate-200/80 flex flex-col shrink-0">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <Link href="/seller/dashboard" className="flex items-center gap-2 font-black text-xl text-blue-600">
            <span className="bg-blue-600 text-white w-7 h-7 rounded-lg flex items-center justify-center text-sm shadow-sm">T</span>
            TechMart <span className="text-[10px] font-bold tracking-wider px-2 py-0.5 bg-blue-50 text-blue-700 rounded-md">SELLER</span>
          </Link>
        </div>

        {/* Store Summary Chip */}
        <div className="p-4 mx-4 my-3 bg-slate-50 rounded-2xl border border-slate-100">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active Store</p>
          <p className="text-xs font-bold text-slate-800 truncate mt-0.5">{profile?.business_name || profile?.full_name || 'My Store'}</p>
          <div className="flex items-center gap-1.5 mt-2">
            <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
              profile?.tech_trust_status === 'verified'
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-amber-50 text-amber-700 border border-amber-200'
            }`}>
              <ShieldCheck className="w-3 h-3" />
              {profile?.tech_trust_status === 'verified' ? 'TechTrust Verified' : 'Unverified Seller'}
            </span>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-4 space-y-1">
          <Link
            href="/seller/dashboard"
            className="flex items-center gap-3 px-3 py-2 text-xs font-semibold rounded-xl text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition"
          >
            <LayoutDashboard className="w-4 h-4 text-slate-400" />
            Overview
          </Link>
          <Link
            href="/seller/listings"
            className="flex items-center gap-3 px-3 py-2 text-xs font-semibold rounded-xl text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition"
          >
            <Boxes className="w-4 h-4 text-slate-400" />
            Inventory & Listings
          </Link>
          <Link
            href="/seller/listings/new"
            className="flex items-center gap-3 px-3 py-2 text-xs font-semibold rounded-xl text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition"
          >
            <PackagePlus className="w-4 h-4 text-blue-600" />
            Add New Listing
          </Link>
          <Link
            href="/seller/enquiries"
            className="flex items-center gap-3 px-3 py-2 text-xs font-semibold rounded-xl text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition"
          >
            <MessageSquare className="w-4 h-4 text-slate-400" />
            Buyer Enquiries
          </Link>
          <Link
            href="/seller/analytics"
            className="flex items-center gap-3 px-3 py-2 text-xs font-semibold rounded-xl text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition"
          >
            <BarChart3 className="w-4 h-4 text-slate-400" />
            Analytics
          </Link>
          <Link
            href="/seller/settings"
            className="flex items-center gap-3 px-3 py-2 text-xs font-semibold rounded-xl text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition"
          >
            <Settings className="w-4 h-4 text-slate-400" />
            Store Settings
          </Link>
          <Link
            href="/seller/support"
            className="flex items-center gap-3 px-3 py-2 text-xs font-semibold rounded-xl text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition"
          >
            <HelpCircle className="w-4 h-4 text-slate-400" />
            Help & Support
          </Link>
        </nav>

        {/* Bottom Actions */}
        <div className="p-4 border-t border-slate-100 space-y-2">
          <Link
            href="/"
            target="_blank"
            className="flex items-center justify-between px-3 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 transition rounded-xl hover:bg-slate-50"
          >
            <span className="flex items-center gap-2">
              <Store className="w-3.5 h-3.5" /> Buyer View
            </span>
            <ExternalLink className="w-3 h-3" />
          </Link>
          <form action={signOut}>
            <Button
              variant="ghost"
              size="sm"
              type="submit"
              className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 gap-2 px-3 text-xs h-9 rounded-xl"
            >
              <LogOut className="w-3.5 h-3.5" /> Log Out
            </Button>
          </form>
        </div>
      </aside>

      {/* Main Workspace */}
      <main className="flex-1 min-w-0 p-6 md:p-10 overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  )
}