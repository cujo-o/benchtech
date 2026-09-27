'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  Menu, 
  X, 
  Home, 
  Grid, 
  Flame, 
  Sparkles, 
  Crown, 
  Package, 
  Heart, 
  MessageSquare, 
  Clock, 
  Bell, 
  Wallet, 
  Users2, 
  HelpCircle,
  Store,
  ShieldAlert,
  ChevronRight,
  Disc,
  Scale
} from 'lucide-react'

const NAV_ITEMS = [
  { label: 'Home', href: '/feed', icon: Home },
  { label: 'Shop by Category', href: '/products', icon: Grid },
  { label: 'Deals & Offers', href: '/deals', icon: Flame, badge: 'Hot', badgeColor: 'bg-red-500 text-white' },
  { label: 'TechSpin', href: '/techspin', icon: Disc, badge: 'Daily', badgeColor: 'bg-amber-500 text-slate-950' },
  { label: 'Find My Tech', href: '/assistant', icon: Sparkles, badge: 'AI', badgeColor: 'bg-blue-600 text-white' },
  { label: 'Compare Tech', href: '/compare', icon: Scale },
  { label: 'TechPass', href: '/subscription', icon: Crown },
  { label: 'My Orders', href: '/orders', icon: Package },
  { label: 'Saved Items', href: '/saved', icon: Heart },
  { label: 'Messages', href: '/messages', icon: MessageSquare },
  { label: 'Recently Viewed', href: '/recently-viewed', icon: Clock },
  { label: 'Price Alerts', href: '/price-alerts', icon: Bell },
  { label: 'My Wallet', href: '/wallet', icon: Wallet },
  { label: 'Referrals', href: '/referrals', icon: Users2 },
  { label: 'Help & Support', href: '/help', icon: HelpCircle },
]

export function MobileSidebarDrawer({ profile }: { profile: any }) {
  const [isOpen, setIsOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const pathname = usePathname()

  // Ensure portal only mounts on the client to avoid SSR hydration mismatches
  useEffect(() => {
    setMounted(true)
  }, [])

  // Close drawer on route change
  useEffect(() => {
    setIsOpen(false)
  }, [pathname])

  // Prevent background body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  // Seller and Admin Detection
  const userRoles: string[] = profile?.roles || (profile?.role ? [profile.role] : [])
  const isAdmin = profile?.role === 'admin' || profile?.is_admin === true || userRoles.includes('admin')
  const isSeller = Boolean(profile?.business_name) || profile?.is_seller === true || userRoles.includes('seller') || isAdmin
  const sellerHref = isSeller ? '/seller' : '/seller/onboarding'

  const drawerContent = (
    <div className="fixed inset-0 z-[9999] lg:hidden">
      {/* Full-Screen Dark Backdrop */}
      <div 
        onClick={() => setIsOpen(false)}
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
      />

      {/* Slide-out Full Height Sidebar */}
      <aside 
        className="fixed inset-y-0 left-0 w-72 max-w-[85vw] h-dvh bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 z-[10000] shadow-2xl flex flex-col justify-between animate-in slide-in-from-left duration-200"
      >
        {/* Drawer Header */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 text-white w-7 h-7 rounded-lg flex items-center justify-center font-black text-sm shadow-xs">
              B
            </div>
            <div>
              <span className="font-black text-base text-slate-900 dark:text-slate-100 tracking-tight leading-none block">
                BenchTech
              </span>
              <span className="text-[9px] text-slate-400 dark:text-slate-500 font-semibold tracking-wider block mt-0.5">
                Abuja Tech Hub
              </span>
            </div>
          </div>
          <button 
            type="button" 
            onClick={() => setIsOpen(false)}
            aria-label="Close Navigation Menu"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Navigation List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1 [scrollbar-width:thin]">
          {/* Quick Workspace Switcher for Mobile */}
          <div className="p-2 mb-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60 rounded-2xl space-y-2">
            <Link 
              href={sellerHref}
              onClick={() => setIsOpen(false)}
              className="flex items-center justify-between p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 text-xs font-bold hover:bg-blue-100 dark:hover:bg-blue-900/40 transition"
            >
              <div className="flex items-center gap-2 truncate">
                <Store className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                <span className="truncate">
                  {isSeller ? (profile?.business_name || 'Seller Dashboard') : 'Become a Seller'}
                </span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
            </Link>

            {isAdmin && (
              <Link 
                href="/admin"
                onClick={() => setIsOpen(false)}
                className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900 text-white dark:bg-slate-800 dark:border dark:border-slate-700 text-xs font-bold hover:bg-black dark:hover:bg-slate-700 transition"
              >
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-red-400 shrink-0" />
                  <span>Admin Console</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              </Link>
            )}
          </div>

          {/* Core Sidebar Links */}
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            return (
              <Link
                key={item.label}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition ${
                  isActive 
                    ? 'bg-blue-600 text-white font-bold shadow-xs' 
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400 dark:text-slate-500'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full shadow-2xs ${item.badgeColor || 'bg-red-500 text-white'}`}>
                    {item.badge}
                  </span>
                )}
              </Link>
            )
          })}
        </div>

        {/* Drawer Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 text-[11px] text-slate-400 dark:text-slate-500 text-center font-medium shrink-0">
          BenchTech Abuja • Buy Smart. Sell Easy.
        </div>
      </aside>
    </div>
  )

  return (
    <div className="lg:hidden">
      {/* Hamburger Toggle Button */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        aria-label="Open Navigation Menu"
        className="p-2 -ml-1 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Render directly to body to avoid header overflow/blur clipping */}
      {isOpen && mounted ? createPortal(drawerContent, document.body) : null}
    </div>
  )
}