import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { signOut } from '@/app/(auth)/actions'
import { Button } from '@/components/ui/button'
import { 
  Search, 
  MapPin, 
  Crown, 
  HelpCircle, 
  Heart, 
  ShoppingBag, 
  Store, 
  LogOut,
  Sparkles,
  ShieldAlert
} from 'lucide-react'

export async function Navbar() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let profile = null
  if (user) {
    const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    profile = data
  }

  const isAdmin = profile?.role === 'admin'
  const isSeller = profile?.role === 'seller' || isAdmin

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-slate-200">
      <div className="max-w-[1700px] mx-auto px-4 h-16 flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <div className="flex items-center gap-6">
          <Link href={user ? "/feed" : "/"} className="flex items-center gap-2">
            <div className="bg-blue-600 text-white w-8 h-8 rounded-xl flex items-center justify-center font-black text-base shadow-sm shadow-blue-500/30">
              T
            </div>
            <div>
              <span className="font-black text-lg text-slate-900 tracking-tight leading-none block">TechMart</span>
              <span className="text-[9px] text-slate-400 font-semibold tracking-wider block">Buy Smart. Sell Easy.</span>
            </div>
          </Link>

          {/* Location Delivery Selector */}
          <div className="hidden lg:flex items-center gap-1.5 text-xs text-slate-600 bg-slate-50 border border-slate-200/80 px-3 py-1.5 rounded-full">
            <MapPin className="w-3.5 h-3.5 text-blue-600" />
            <span>Deliver to:</span>
            <span className="font-bold text-slate-800">Abuja, Nigeria</span>
          </div>
        </div>

        {/* Global Search Bar */}
        <form action="/products" method="GET" className="flex-1 max-w-xl mx-2 flex items-center relative">
          <input
            type="text"
            name="q"
            placeholder="Search for phones, laptops, gaming, accessories..."
            className="w-full bg-slate-50 border border-slate-200 pl-4 pr-12 py-2 text-xs rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
          />
          <button type="submit" className="absolute right-1 bg-blue-600 hover:bg-blue-700 text-white p-1.5 rounded-lg transition">
            <Search className="w-3.5 h-3.5" />
          </button>
        </form>

        {/* Shortcuts & Actions */}
        <div className="flex items-center gap-3 text-xs font-semibold text-slate-600">
          <Link href="#" className="hidden md:flex items-center gap-1 hover:text-blue-600 transition">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>TechSpin</span>
            <span className="text-[9px] bg-red-500 text-white font-bold px-1 rounded">NEW</span>
          </Link>

          <Link href="#" className="hidden md:flex items-center gap-1 hover:text-blue-600 transition">
            <Crown className="w-3.5 h-3.5 text-blue-600" />
            <span>TechPass</span>
          </Link>

          <Link href="#" className="hidden sm:flex items-center gap-1 hover:text-blue-600 transition">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Help</span>
          </Link>

          <Link href="/compare" className="relative p-1 hover:text-blue-600 transition" title="Saved Items">
            <Heart className="w-4 h-4" />
          </Link>

          <div className="relative p-1 hover:text-blue-600 cursor-pointer transition">
            <ShoppingBag className="w-4 h-4" />
          </div>

          {/* User / Multi-Role Access */}
          {user ? (
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
              {/* Admin Button (Visible only to Admins) */}
              {isAdmin && (
                <Link href="/admin/overview">
                  <Button size="sm" className="bg-slate-900 hover:bg-black text-white text-xs h-8 gap-1.5 font-bold shadow-sm">
                    <ShieldAlert className="w-3.5 h-3.5 text-red-400" /> Admin
                  </Button>
                </Link>
              )}

              {/* Seller Hub Button (Visible to Sellers & Admins who sell) */}
              {isSeller ? (
                <Link href="/seller/dashboard">
                  <Button size="sm" variant="outline" className="text-xs h-8 gap-1.5 border-blue-200 text-blue-600 hover:bg-blue-50">
                    <Store className="w-3.5 h-3.5" /> Seller Hub
                  </Button>
                </Link>
              ) : (
                <Link href="/seller/dashboard">
                  <Button size="sm" variant="outline" className="text-xs h-8">
                    Become a Seller
                  </Button>
                </Link>
              )}

              {/* Logout */}
              <form action={signOut}>
                <button type="submit" title="Sign Out" className="p-1.5 text-slate-400 hover:text-red-600 transition">
                  <LogOut className="w-4 h-4" />
                </button>
              </form>
            </div>
          ) : (
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
              <Link href="/login">
                <Button size="sm" variant="ghost" className="text-xs h-8">Sign In</Button>
              </Link>
              <Link href="/register">
                <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-xs h-8">Register</Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}