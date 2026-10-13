'use client'

import { useState, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Menu,
  X,
  Home,
  ShoppingBag,
  LayoutGrid,
  ShieldCheck,
  Megaphone,
  Tag,
  Sparkles,
  Layers,
  Scale,
  SlidersHorizontal,
  Disc,
  User,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  Package,
  Bookmark,
  Bell,
  Wallet,
  Clock,
  Store,
  ShieldAlert,
} from 'lucide-react'

export function MobileSidebarDrawer({ profile }: { profile: any }) {
  const [isOpen, setIsOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [savedCount, setSavedCount] = useState<number>(0)
  const pathname = usePathname()

  // Accordion Group States
  const [isShopOpen, setIsShopOpen] = useState(true)
  const [isCompareBuildOpen, setIsCompareBuildOpen] = useState(true)

  const isAccountRoute = [
    '/orders',
    '/saved',
    '/wallet',
    '/price-alerts',
    '/recently-viewed',
  ].some((route) => pathname.startsWith(route))
  const [isAccountOpen, setIsAccountOpen] = useState(isAccountRoute)

  // Sync Saved Items Count from localStorage (Zero DB latency)
  const updateSavedCount = useCallback(() => {
    try {
      const savedRaw =
        localStorage.getItem('benchtech_saved') ||
        localStorage.getItem('techmart_saved_items')
      if (savedRaw) {
        const parsed = JSON.parse(savedRaw)
        if (Array.isArray(parsed)) {
          setSavedCount(parsed.length)
          return
        }
      }
      setSavedCount(0)
    } catch {
      setSavedCount(0)
    }
  }, [])

  useEffect(() => {
    setMounted(true)
    updateSavedCount()

    const handleSync = () => updateSavedCount()
    window.addEventListener('storage', handleSync)
    window.addEventListener('savedItemsUpdated', handleSync)

    return () => {
      window.removeEventListener('storage', handleSync)
      window.removeEventListener('savedItemsUpdated', handleSync)
    }
  }, [updateSavedCount])

  // Close drawer on route change
  useEffect(() => {
    setIsOpen(false)
  }, [pathname])

  // Prevent background scroll when drawer is open
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

  const isActive = (href: string) => {
    if (href === '/feed') {
      return pathname === '/feed' || pathname === '/'
    }
    return pathname.startsWith(href)
  }

  // Seller and Admin permissions
  const userRoles: string[] = profile?.roles || (profile?.role ? [profile.role] : [])
  const isAdmin = profile?.role === 'admin' || profile?.is_admin === true || userRoles.includes('admin')
  const isSeller = Boolean(profile?.business_name) || profile?.is_seller === true || userRoles.includes('seller') || isAdmin
  const sellerHref = isSeller ? '/seller' : '/seller/onboarding'

  const drawerContent = (
    <div className="fixed inset-0 z-[9999] lg:hidden">
      {/* Backdrop */}
      <div
        onClick={() => setIsOpen(false)}
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
      />

      {/* Slide-out Drawer */}
      <aside className="fixed inset-y-0 left-0 w-72 max-w-[85vw] h-dvh bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 z-[10000] shadow-2xl flex flex-col justify-between animate-in slide-in-from-left duration-200 select-none">
        {/* Header */}
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

        {/* Scrollable Navigation Body */}
        <div className="flex-1 overflow-y-auto p-3 space-y-4 [scrollbar-width:thin]">
          {/* Quick Workspace Switcher */}
          <div className="p-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60 rounded-2xl space-y-1.5">
            <Link
              href={sellerHref}
              onClick={() => setIsOpen(false)}
              className="flex items-center justify-between p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 text-xs font-bold hover:bg-blue-100 dark:hover:bg-blue-900/40 transition"
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
                className="flex items-center justify-between p-2 rounded-xl bg-slate-900 text-white dark:bg-slate-800 dark:border dark:border-slate-700 text-xs font-bold hover:bg-black dark:hover:bg-slate-700 transition"
              >
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-red-400 shrink-0" />
                  <span>Admin Console</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              </Link>
            )}
          </div>

          {/* 1. PRIMARY SECTION */}
          <div className="space-y-1">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 px-3 block">
              Primary
            </span>

            {/* Home */}
            <Link
              href="/feed"
              onClick={() => setIsOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                isActive('/feed')
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60'
              }`}
            >
              <Home className="w-4 h-4 shrink-0" />
              <span>Home</span>
            </Link>

            {/* Shop Accordion */}
            <div className="space-y-0.5">
              <button
                type="button"
                onClick={() => setIsShopOpen(!isShopOpen)}
                className="w-full flex items-center justify-between px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-xl transition cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <ShoppingBag className="w-4 h-4 text-slate-500 shrink-0" />
                  <span>Shop</span>
                </div>
                {isShopOpen ? (
                  <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                )}
              </button>

              {isShopOpen && (
                <div className="pl-3 space-y-0.5">
                  <Link
                    href="/products"
                    onClick={() => setIsOpen(false)}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition ${
                      isActive('/products')
                        ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 font-bold'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                    }`}
                  >
                    <LayoutGrid className="w-3.5 h-3.5 shrink-0" />
                    <span>Shop by Category</span>
                  </Link>

                  <Link
                    href="/sellers"
                    onClick={() => setIsOpen(false)}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition ${
                      isActive('/sellers')
                        ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 font-bold'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                    }`}
                  >
                    <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                    <span>Verified Sellers</span>
                  </Link>

                  <Link
                    href="/requests/new"
                    onClick={() => setIsOpen(false)}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition ${
                      isActive('/requests')
                        ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 font-bold'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                    }`}
                  >
                    <Megaphone className="w-3.5 h-3.5 shrink-0" />
                    <span>Request a Gadget</span>
                  </Link>

                  <Link
                    href="/deals"
                    onClick={() => setIsOpen(false)}
                    className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition ${
                      isActive('/deals')
                        ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 font-bold'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Tag className="w-3.5 h-3.5 shrink-0" />
                      <span>Deals &amp; Offers</span>
                    </div>
                    <span className="bg-rose-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full uppercase leading-none">
                      Hot
                    </span>
                  </Link>
                </div>
              )}
            </div>

            {/* Find My Tech (AI) */}
            <Link
              href="/assistant"
              onClick={() => setIsOpen(false)}
              className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition ${
                isActive('/assistant')
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-3">
                <Sparkles className="w-4 h-4 text-purple-500 shrink-0" />
                <span>Find My Tech</span>
              </div>
              <span className="bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 text-[9px] font-black px-1.5 py-0.5 rounded-full uppercase leading-none">
                AI
              </span>
            </Link>

            {/* Compare & Build Accordion */}
            <div className="space-y-0.5">
              <button
                type="button"
                onClick={() => setIsCompareBuildOpen(!isCompareBuildOpen)}
                className="w-full flex items-center justify-between px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-xl transition cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <Layers className="w-4 h-4 text-slate-500 shrink-0" />
                  <span>Compare &amp; Build</span>
                </div>
                {isCompareBuildOpen ? (
                  <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                )}
              </button>

              {isCompareBuildOpen && (
                <div className="pl-3 space-y-0.5">
                  <Link
                    href="/compare"
                    onClick={() => setIsOpen(false)}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition ${
                      isActive('/compare')
                        ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 font-bold'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                    }`}
                  >
                    <Scale className="w-3.5 h-3.5 shrink-0" />
                    <span>Compare Tech</span>
                  </Link>

                  <Link
                    href="/build"
                    onClick={() => setIsOpen(false)}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition ${
                      isActive('/build')
                        ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 font-bold'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                    }`}
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5 shrink-0" />
                    <span>Build My Setup</span>
                  </Link>
                </div>
              )}
            </div>

            {/* TechSpin */}
            <Link
              href="/techspin"
              onClick={() => setIsOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition ${
                isActive('/techspin')
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60'
              }`}
            >
              <Disc className="w-4 h-4 text-slate-500 shrink-0" />
              <span>TechSpin</span>
            </Link>
          </div>

          {/* 2. ACCOUNT SECTION (No Direct Messaging) */}
          <div className="space-y-1 pt-2 border-t border-slate-100 dark:border-slate-800/80">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 px-3 block">
              Account
            </span>

            <button
              type="button"
              onClick={() => setIsAccountOpen(!isAccountOpen)}
              className="w-full flex items-center justify-between px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-xl transition cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <User className="w-4 h-4 text-slate-500 shrink-0" />
                <span>My Account</span>
              </div>
              {isAccountOpen ? (
                <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              )}
            </button>

            {isAccountOpen && (
              <div className="pl-3 space-y-0.5">
                <Link
                  href="/orders"
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition ${
                    isActive('/orders')
                      ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 font-bold'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                  }`}
                >
                  <Package className="w-3.5 h-3.5 shrink-0" />
                  <span>My Orders</span>
                </Link>

                <Link
                  href="/saved"
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition ${
                    isActive('/saved')
                      ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 font-bold'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Bookmark className="w-3.5 h-3.5 shrink-0" />
                    <span>Saved Items</span>
                  </div>
                  {savedCount > 0 && (
                    <span className="bg-blue-600 text-white text-[9px] font-black px-1.5 py-0.2 rounded-full">
                      {savedCount}
                    </span>
                  )}
                </Link>

                <Link
                  href="/recently-viewed"
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition ${
                    isActive('/recently-viewed')
                      ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 font-bold'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5 shrink-0" />
                  <span>Recently Viewed</span>
                </Link>

                <Link
                  href="/price-alerts"
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition ${
                    isActive('/price-alerts')
                      ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 font-bold'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                  }`}
                >
                  <Bell className="w-3.5 h-3.5 shrink-0" />
                  <span>Price Alerts</span>
                </Link>

                <Link
                  href="/wallet"
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition ${
                    isActive('/wallet')
                      ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 font-bold'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                  }`}
                >
                  <Wallet className="w-3.5 h-3.5 shrink-0" />
                  <span>My Wallet</span>
                </Link>
              </div>
            )}
          </div>

          {/* 3. SUPPORT SECTION */}
          <div className="space-y-1 pt-2 border-t border-slate-100 dark:border-slate-800/80">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 px-3 block">
              Support
            </span>

            <Link
              href="/help"
              onClick={() => setIsOpen(false)}
              className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold transition ${
                isActive('/help')
                  ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 font-bold'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50'
              }`}
            >
              <HelpCircle className="w-4 h-4 text-slate-500 shrink-0" />
              <span>Help &amp; Support</span>
            </Link>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 text-[10px] text-slate-400 text-center font-medium shrink-0">
          BenchTech Abuja • Buy Smart. Sell Easy.
        </div>
      </aside>
    </div>
  )

  return (
    <div className="lg:hidden">
      {/* Mobile Hamburger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        aria-label="Open Navigation Menu"
        className="p-2 -ml-1 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Portal Mount */}
      {isOpen && mounted ? createPortal(drawerContent, document.body) : null}
    </div>
  )
}