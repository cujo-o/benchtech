'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { Button } from '@/components/ui/button'
import {
  Search,
  ShoppingCart,
  Heart,
  Store,
  ShieldAlert,
  Menu,
  X,
  MapPin,
  LogOut,
  User,
  Package,
  Home,
  Grid,
  Flame,
  ArrowRight,
} from 'lucide-react'
import { signOut } from '@/app/(auth)/actions'

export function Navbar() {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [cartCount, setCartCount] = useState(0)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    async function loadUser() {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser()

      if (authUser) {
        setUser(authUser)
        const { data: prof } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', authUser.id)
          .maybeSingle()

        setProfile(prof)
      }
    }
    loadUser()

    // Sync cart count from localStorage
    const syncCart = () => {
      try {
        const raw = localStorage.getItem('benchtech_cart') || localStorage.getItem('cart')
        if (raw) {
          const parsed = JSON.parse(raw)
          setCartCount(Array.isArray(parsed) ? parsed.length : 0)
          return
        }
      } catch {
        // ignore
      }
      setCartCount(0)
    }

    syncCart()
    window.addEventListener('storage', syncCart)
    window.addEventListener('cartUpdated', syncCart)

    return () => {
      window.removeEventListener('storage', syncCart)
      window.removeEventListener('cartUpdated', syncCart)
    }
  }, [supabase])

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileMenuOpen(false)
  }, [pathname])

  // A user is recognized as a seller if business_name exists (even if pending verification)
  const isSeller = Boolean(profile?.business_name || profile?.is_seller)
  const isAdmin = profile?.is_admin === true || profile?.role === 'admin'
  const sellerDestination = isSeller ? '/seller' : '/seller/onboarding'

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-xs">
      <div className="max-w-[1700px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Logo & Abuja Pill */}
        <div className="flex items-center gap-3 shrink-0">
          <Link href="/feed" className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-blue-600 text-white font-black flex items-center justify-center text-base shadow-sm">
              B
            </span>
            <div className="hidden sm:block">
              <span className="font-black text-lg text-slate-900 tracking-tight">BenchTech</span>
              <span className="text-[10px] text-slate-400 block -mt-1">Abuja Tech Hub</span>
            </div>
          </Link>

          <div className="hidden md:flex items-center gap-1.5 bg-slate-50 border border-slate-200/80 px-2.5 py-1 rounded-full text-[11px] font-bold text-slate-600">
            <MapPin className="w-3 h-3 text-blue-600" />
            <span>Abuja, NG</span>
          </div>
        </div>

        {/* Global Search Bar (Desktop) */}
        <div className="hidden md:flex flex-1 max-w-xl mx-4">
          <form action="/products" method="GET" className="w-full relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              name="q"
              placeholder="Search gadgets in Abuja (e.g. iPhone 13, MacBook M1, PS5)..."
              className="w-full h-10 pl-10 pr-12 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-600 focus:bg-white transition font-medium"
            />
            <Button
              type="submit"
              size="sm"
              className="absolute right-1 top-1 h-8 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold"
            >
              Search
            </Button>
          </form>
        </div>

        {/* Right Action Cluster (Desktop) */}
        <div className="hidden lg:flex items-center gap-2.5">
          <Link href="/saved">
            <Button variant="ghost" size="icon" className="h-9 w-9 text-slate-600 rounded-xl hover:bg-slate-50" title="Saved Gadgets">
              <Heart className="w-4 h-4" />
            </Button>
          </Link>

          <Link href="/cart">
            <Button variant="ghost" size="icon" className="h-9 w-9 text-slate-600 rounded-xl hover:bg-slate-50 relative" title="Cart">
              <ShoppingCart className="w-4 h-4" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center shadow-xs">
                  {cartCount}
                </span>
              )}
            </Button>
          </Link>

          {/* Admin Switch */}
          {isAdmin && (
            <Link href="/admin">
              <Button size="sm" variant="outline" className="h-9 text-xs font-bold rounded-xl border-purple-200 text-purple-700 bg-purple-50 hover:bg-purple-100 gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5 text-purple-600" /> Admin
              </Button>
            </Link>
          )}

          {/* Desktop Seller Hub Button */}
          <Link href={sellerDestination}>
            <Button size="sm" className="h-9 text-xs font-bold rounded-xl bg-slate-900 hover:bg-slate-800 text-white gap-1.5 shadow-xs">
              <Store className="w-3.5 h-3.5" />
              {isSeller ? 'Seller Hub' : 'Become a Seller'}
            </Button>
          </Link>
        </div>

        {/* Mobile Header Actions */}
        <div className="flex lg:hidden items-center gap-1.5">
          <Link href="/cart">
            <Button variant="ghost" size="icon" className="h-9 w-9 text-slate-700 relative">
              <ShoppingCart className="w-4 h-4" />
              {cartCount > 0 && (
                <span className="absolute top-1 right-1 bg-blue-600 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </Button>
          </Link>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-xl text-slate-700 hover:bg-slate-100 focus:outline-none"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* =========================================================
          MOBILE DRAWER / MENU
      ========================================================= */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-200 bg-white px-4 py-5 space-y-4 shadow-xl">
          {/* Mobile Search Input */}
          <form action="/products" method="GET" className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              name="q"
              placeholder="Search gadgets in Abuja..."
              className="w-full h-10 pl-9 pr-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-600 font-medium"
            />
          </form>

          {/* Mobile Seller Hub Button */}
          <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-2xl flex items-center justify-between">
            <div className="space-y-0.5">
              <p className="text-xs font-black text-slate-900">
                {isSeller ? (profile?.business_name || 'My Tech Hub') : 'Sell on BenchTech'}
              </p>
              <p className="text-[11px] text-slate-400">
                {isSeller ? 'Manage stock, orders, and sales' : 'List your phones, laptops & gadgets'}
              </p>
            </div>

            {/* This dynamically routes sellers to /seller and new users to /seller/onboarding */}
            <Link href={sellerDestination}>
              <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs h-9 rounded-xl gap-1">
                {isSeller ? 'Open Hub' : 'Register Store'} <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </div>

          {/* Nav Links */}
          <nav className="space-y-1 text-xs font-semibold text-slate-700 pt-1">
            <Link href="/feed" className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50">
              <Home className="w-4 h-4 text-slate-400" /> Home Feed
            </Link>
            <Link href="/products" className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50">
              <Grid className="w-4 h-4 text-slate-400" /> Shop by Category
            </Link>
            <Link href="/deals" className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 text-red-600">
              <Flame className="w-4 h-4" /> Deals &amp; Offers
            </Link>
            <Link href="/orders" className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50">
              <Package className="w-4 h-4 text-slate-400" /> My Orders
            </Link>
            <Link href="/saved" className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50">
              <Heart className="w-4 h-4 text-slate-400" /> Saved Items
            </Link>

            {/* Mobile Admin Link */}
            {isAdmin && (
              <Link href="/admin" className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-purple-50 text-purple-700 font-bold">
                <ShieldAlert className="w-4 h-4 text-purple-600" /> Admin Console
              </Link>
            )}
          </nav>

          {/* User Sign In / Logout */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
            {user ? (
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center">
                    {(profile?.business_name || profile?.full_name || user.email)?.[0]?.toUpperCase()}
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-bold text-slate-900 truncate max-w-[150px]">
                      {profile?.business_name || profile?.full_name || user.email}
                    </p>
                    <p className="text-[10px] text-slate-400">
                      {isSeller ? 'Seller Account' : 'Buyer'}
                    </p>
                  </div>
                </div>

                <form action={signOut}>
                  <Button type="submit" variant="ghost" size="sm" className="text-xs text-red-600 font-bold h-8">
                    <LogOut className="w-3.5 h-3.5 mr-1" /> Log Out
                  </Button>
                </form>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 w-full">
                <Link href="/login" className="block">
                  <Button variant="outline" className="w-full text-xs font-bold h-9 rounded-xl">
                    Log In
                  </Button>
                </Link>
                <Link href="/register" className="block">
                  <Button className="w-full bg-blue-600 text-white text-xs font-bold h-9 rounded-xl">
                    Sign Up
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  )
}