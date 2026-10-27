'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState, useCallback } from 'react'
import {
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
  ChevronLeft,
  ChevronRight,
  Package,
  Bookmark,
  Bell,
  Wallet,
  Clock,
  Settings,
} from 'lucide-react'

export function BuyerSidebar() {
  const pathname = usePathname()
  const [savedCount, setSavedCount] = useState<number>(0)
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false)

  const [isShopOpen, setIsShopOpen] = useState(true)
  const [isCompareBuildOpen, setIsCompareBuildOpen] = useState(true)

  const isAccountRoute = [
    '/orders',
    '/saved',
    '/wallet',
    '/price-alerts',
    '/recently-viewed',
    '/settings',
  ].some((route) => pathname.startsWith(route))

  const [isAccountOpen, setIsAccountOpen] = useState(isAccountRoute || true)

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
    updateSavedCount()
    try {
      const stored = localStorage.getItem('benchtech_sidebar_collapsed')
      if (stored !== null) {
        setIsCollapsed(stored === 'true')
      }
    } catch {}

    const handleSync = () => updateSavedCount()
    window.addEventListener('storage', handleSync)
    window.addEventListener('savedItemsUpdated', handleSync)
    return () => {
      window.removeEventListener('storage', handleSync)
      window.removeEventListener('savedItemsUpdated', handleSync)
    }
  }, [updateSavedCount])

  const toggleSidebarCollapse = () => {
    const next = !isCollapsed
    setIsCollapsed(next)
    try {
      localStorage.setItem('benchtech_sidebar_collapsed', String(next))
    } catch {}
  }

  const isActive = (href: string) => {
    if (href === '/feed') {
      return pathname === '/feed' || pathname === '/'
    }
    return pathname.startsWith(href)
  }

  return (
    <aside
      className={`shrink-0 hidden md:flex flex-col justify-between bg-white dark:bg-slate-900 border-r border-slate-200/80 dark:border-slate-800/80 min-h-[calc(100vh-4rem)] sticky top-16 h-[calc(100vh-4rem)] select-none transition-all duration-200 z-30 ${
        isCollapsed ? 'w-16 p-2' : 'w-60 xl:w-64 p-3.5'
      }`}
    >
      <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800/80 mb-2">
        {!isCollapsed && (
          <span className="text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 px-1">
            Navigation
          </span>
        )}
        <button
          type="button"
          onClick={toggleSidebarCollapse}
          className={`p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer ${
            isCollapsed ? 'mx-auto' : 'ml-auto'
          }`}
          title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          aria-label={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {isCollapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </button>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden space-y-4 pr-0.5 [scrollbar-width:thin]">
        {isCollapsed ? (
          <div className="space-y-2">
            <Link
              href="/feed"
              title="Home"
              className={`w-full flex items-center justify-center p-2.5 rounded-xl transition ${
                isActive('/feed')
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60'
              }`}
            >
              <Home className="w-4 h-4" />
            </Link>

            <Link
              href="/products"
              title="Catalog"
              className={`w-full flex items-center justify-center p-2.5 rounded-xl transition ${
                isActive('/products')
                  ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60'
              }`}
            >
              <ShoppingBag className="w-4 h-4" />
            </Link>

            <Link
              href="/deals"
              title="Deals"
              className="w-full flex items-center justify-center p-2.5 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 relative transition"
            >
              <Tag className="w-4 h-4" />
            </Link>

            <Link
              href="/assistant"
              title="Find My Tech"
              className={`w-full flex items-center justify-center p-2.5 rounded-xl relative transition ${
                isActive('/assistant')
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60'
              }`}
            >
              <Sparkles className="w-4 h-4" />
            </Link>

            <Link
              href="/compare"
              title="Compare Tech"
              className={`w-full flex items-center justify-center p-2.5 rounded-xl transition ${
                isActive('/compare') || isActive('/build')
                  ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60'
              }`}
            >
              <Layers className="w-4 h-4" />
            </Link>

            <div className="my-2 border-t border-slate-100 dark:border-slate-800/80" />

            <Link
              href="/orders"
              title="My Orders"
              className="w-full flex items-center justify-center p-2.5 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition"
            >
              <Package className="w-4 h-4" />
            </Link>

            <Link
              href="/saved"
              title="Saved Items"
              className="w-full flex items-center justify-center p-2.5 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 relative transition"
            >
              <Bookmark className="w-4 h-4" />
              {savedCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-blue-600" />
              )}
            </Link>

            <Link
              href="/settings"
              title="Account Settings"
              className={`w-full flex items-center justify-center p-2.5 rounded-xl transition ${
                isActive('/settings')
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60'
              }`}
            >
              <Settings className="w-4 h-4" />
            </Link>

            <Link
              href="/help"
              title="Help & Support"
              className="w-full flex items-center justify-center p-2.5 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition"
            >
              <HelpCircle className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {/* PRIMARY */}
            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 px-3 block">
                Marketplace
              </span>

              <Link
                href="/feed"
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
                      className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition ${
                        isActive('/products')
                          ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 font-bold'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                      }`}
                    >
                      <LayoutGrid className="w-3.5 h-3.5 shrink-0" />
                      <span>All Categories</span>
                    </Link>

                    <Link
                      href="/sellers"
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
                      className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition ${
                        isActive('/requests')
                          ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 font-bold'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                      }`}
                    >
                      <Megaphone className="w-3.5 h-3.5 shrink-0" />
                      <span>Request a Device</span>
                    </Link>

                    <Link
                      href="/deals"
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
                    </Link>
                  </div>
                )}
              </div>

              <Link
                href="/assistant"
                className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition ${
                  isActive('/assistant')
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Sparkles className="w-4 h-4 text-blue-500 shrink-0" />
                  <span>Tech Advisor</span>
                </div>
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
                      className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition ${
                        isActive('/compare')
                          ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 font-bold'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                      }`}
                    >
                      <Scale className="w-3.5 h-3.5 shrink-0" />
                      <span>Compare Specs</span>
                    </Link>

                    <Link
                      href="/build"
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

              <Link
                href="/techspin"
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition ${
                  isActive('/techspin')
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                }`}
              >
                <Disc className="w-4 h-4 text-slate-500 shrink-0" />
                <span>Daily Rewards</span>
              </Link>
            </div>

            {/* ACCOUNT */}
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
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition ${
                      isActive('/wallet')
                        ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 font-bold'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                    }`}
                  >
                    <Wallet className="w-3.5 h-3.5 shrink-0" />
                    <span>My Wallet</span>
                  </Link>

                  <Link
                    href="/settings"
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition ${
                      isActive('/settings')
                        ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 font-bold'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                    }`}
                  >
                    <Settings className="w-3.5 h-3.5 shrink-0" />
                    <span>Account Settings</span>
                  </Link>
                </div>
              )}
            </div>

            {/* SUPPORT */}
            <div className="space-y-1 pt-2 border-t border-slate-100 dark:border-slate-800/80">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 px-3 block">
                Support
              </span>

              <Link
                href="/help"
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
        )}
      </div>
    </aside>
  )
}