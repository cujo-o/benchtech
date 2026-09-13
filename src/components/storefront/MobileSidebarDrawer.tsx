'use client'

import { useState, useEffect } from 'react'
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
  ShoppingBag, 
  Heart, 
  MessageSquare, 
  Clock, 
  Bell, 
  Wallet, 
  Users2, 
  HelpCircle,
  Store,
  ShieldAlert,
  ChevronRight
} from 'lucide-react'

const NAV_ITEMS = [
  { label: 'Home', href: '/feed', icon: Home },
  { label: 'Shop by Category', href: '/products', icon: Grid },
  { label: 'Deals & Offers', href: '/products?filter=deals', icon: Flame, badge: 'Hot' },
  { label: 'TechSpin', href: '#', icon: Sparkles },
  { label: 'TechPass', href: '#', icon: Crown },
  { label: 'My Orders', href: '#', icon: ShoppingBag },
  { label: 'Saved Items', href: '/compare', icon: Heart },
  { label: 'Messages', href: '/messages', icon: MessageSquare },
  { label: 'Recently Viewed', href: '#', icon: Clock },
  { label: 'Price Alerts', href: '#', icon: Bell },
  { label: 'My Wallet', href: '#', icon: Wallet },
  { label: 'Referrals', href: '#', icon: Users2 },
  { label: 'Help & Support', href: '#', icon: HelpCircle },
]

export function MobileSidebarDrawer({ profile }: { profile: any }) {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()

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

  const isAdmin = profile?.role === 'admin'
  const isSeller = profile?.role === 'seller' || isAdmin

  return (
    <div className="lg:hidden">
      {/* Hamburger Toggle Button */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        aria-label="Open Navigation Menu"
        className="p-2 -ml-1 text-slate-700 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Backdrop */}
      {isOpen && (
        <div 
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 transition-opacity"
        />
      )}

      {/* Slide-out Sidebar */}
      <div 
        className={`fixed top-0 left-0 bottom-0 w-72 bg-white z-50 shadow-2xl flex flex-col justify-between transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Drawer Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 text-white w-7 h-7 rounded-lg flex items-center justify-center font-black text-sm">
              T
            </div>
            <div>
              <span className="font-black text-base text-slate-900 tracking-tight leading-none block">BenchTech</span>
              <span className="text-[9px] text-slate-400 font-semibold tracking-wider block">Abuja Tech Hub</span>
            </div>
          </div>
          <button 
            type="button" 
            onClick={() => setIsOpen(false)}
            aria-label="Close Navigation Menu"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Navigation List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          {/* Quick Workspace Switcher for Mobile */}
          <div className="p-2 mb-2 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-2">
            <Link 
              href="/seller/dashboard"
              className="flex items-center justify-between p-2 rounded-xl bg-blue-50 text-blue-700 text-xs font-bold"
            >
              <div className="flex items-center gap-2">
                <Store className="w-4 h-4" />
                <span>{isSeller ? 'Seller Dashboard' : 'Become a Seller'}</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>

            {isAdmin && (
              <Link 
                href="/admin/overview"
                className="flex items-center justify-between p-2 rounded-xl bg-slate-900 text-white text-xs font-bold"
              >
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-red-400" />
                  <span>Admin Control Centre</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
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
                className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition ${
                  isActive 
                    ? 'bg-blue-600 text-white font-bold' 
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="text-[9px] bg-red-500 text-white font-bold px-1.5 py-0.5 rounded-full">
                    {item.badge}
                  </span>
                )}
              </Link>
            )
          })}
        </div>

        {/* Footer info */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 text-[11px] text-slate-400 text-center">
          BenchTech Abuja • Buy Smart. Sell Easy.
        </div>
      </div>
    </div>
  )
}