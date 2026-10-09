'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState, useRef, useCallback } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { playNotificationTone } from '@/lib/notificationSound'
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
  MessageSquare,
  Bell,
  Wallet,
  Clock,
} from 'lucide-react'

export function BuyerSidebar() {
  const pathname = usePathname()
  const [unreadMessages, setUnreadMessages] = useState<number>(0)
  const [savedCount, setSavedCount] = useState<number>(0)

  // 1. Sidebar Horizontal Collapse State (w-60 vs w-16 icon rail)
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false)

  // 2. Accordion Group States (when expanded)
  const [isShopOpen, setIsShopOpen] = useState(true)
  const [isCompareBuildOpen, setIsCompareBuildOpen] = useState(true)

  // Auto-open My Account accordion if on any account subpage
  const isAccountRoute = [
    '/orders',
    '/saved',
    '/messages',
    '/wallet',
    '/price-alerts',
    '/recently-viewed',
  ].some((route) => pathname.startsWith(route))
  const [isAccountOpen, setIsAccountOpen] = useState(isAccountRoute)

  const previousUnreadRef = useRef<number>(0)
  const isInitialLoad = useRef<boolean>(true)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  // Sync Saved Items Count from localStorage
  const updateSavedCount = useCallback(() => {
    try {
      const savedRaw =
        localStorage.getItem('benchtech_saved') ||
        localStorage.getItem('techmart_saved_items') ||
        localStorage.getItem('techmart_saved')

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

  // Check unread messages from Supabase
  const checkUnreadMessages = useCallback(async () => {
    try {
      if (pathname === '/messages') {
        setUnreadMessages(0)
        previousUnreadRef.current = 0
        return
      }

      if (typeof document !== 'undefined' && document.visibilityState !== 'visible') {
        return
      }

      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      const { data: userEnquiries } = await supabase
        .from('enquiries')
        .select('id')
        .eq('buyer_id', user.id)

      const enquiryIds = userEnquiries?.map((e) => e.id) || []

      if (enquiryIds.length > 0) {
        const { count, error } = await supabase
          .from('enquiry_replies')
          .select('*', { count: 'exact', head: true })
          .in('enquiry_id', enquiryIds)
          .neq('sender_id', user.id)
          .eq('is_read', false)

        if (!error && count !== null) {
          if (!isInitialLoad.current && count > previousUnreadRef.current) {
            playNotificationTone()
          }
          previousUnreadRef.current = count
          setUnreadMessages(count)
        }
      } else {
        setUnreadMessages(0)
      }
      isInitialLoad.current = false
    } catch {
      // Ignore network drops
    }
  }, [pathname, supabase])

  // Sync listeners and restore collapsed preference
  useEffect(() => {
    updateSavedCount()
    checkUnreadMessages()

    try {
      const stored = localStorage.getItem('benchtech_sidebar_collapsed')
      if (stored !== null) {
        setIsCollapsed(stored === 'true')
      }
    } catch {}

    const handleCustomSync = () => updateSavedCount()
    window.addEventListener('storage', handleCustomSync)
    window.addEventListener('savedItemsUpdated', handleCustomSync)

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        checkUnreadMessages()
      }
    }
    document.addEventListener('visibilitychange', handleVisibility)

    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        checkUnreadMessages()
      }
    }, 60000)

    return () => {
      window.removeEventListener('storage', handleCustomSync)
      window.removeEventListener('savedItemsUpdated', handleCustomSync)
      document.removeEventListener('visibilitychange', handleVisibility)
      clearInterval(interval)
    }
  }, [checkUnreadMessages, updateSavedCount])

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
      className={`shrink-0 hidden md:flex flex-col justify-between bg-white dark:bg-slate-900 border-r border-slate-200/80 dark:border-slate-800/80 min-h-[calc(100vh-4rem)] sticky top-16 h-[calc(100vh-4rem)] select-none transition-all duration-300 z-30 ${
        isCollapsed ? 'w-16 p-2' : 'w-60 xl:w-64 p-3.5'
      }`}
    >
      {/* 1. Header with Collapse / Expand Toggle */}
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

      {/* 2. Scrollable Body: Expanded Accordions vs. Collapsed Icon Rail */}
      <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden space-y-4 pr-0.5 [scrollbar-width:thin] [scrollbar-color:#cbd5e1_transparent] dark:[scrollbar-color:#334155_transparent] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-slate-200 dark:[&::-webkit-scrollbar-thumb]:bg-slate-700 [&::-webkit-scrollbar-thumb]:rounded-full">
        {isCollapsed ? (
          /* =========================================================================
             COLLAPSED ICON RAIL MODE (w-16)
             ========================================================================= */
          <div className="space-y-2">
            {/* Home */}
            <Link
              href="/feed"
              title="Home"
              className={`w-full flex items-center justify-center p-2.5 rounded-xl transition ${
                isActive('/feed')
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              <Home className="w-4 h-4" />
            </Link>

            {/* Shop */}
            <Link
              href="/products"
              title="Shop by Category"
              className={`w-full flex items-center justify-center p-2.5 rounded-xl transition ${
                isActive('/products') || isActive('/categories')
                  ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60'
              }`}
            >
              <ShoppingBag className="w-4 h-4" />
            </Link>

            {/* Deals (Hot badge indicator) */}
            <Link
              href="/deals"
              title="Deals & Offers"
              className="w-full flex items-center justify-center p-2.5 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 relative transition"
            >
              <Tag className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500" />
            </Link>

            {/* Find My Tech (AI indicator) */}
            <Link
              href="/assistant"
              title="Find My Tech (AI)"
              className={`w-full flex items-center justify-center p-2.5 rounded-xl relative transition ${
                isActive('/assistant')
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60'
              }`}
            >
              <Sparkles className="w-4 h-4 text-purple-500" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-purple-500" />
            </Link>

            {/* Compare & Build */}
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

            {/* TechSpin */}
            <Link
              href="/techspin"
              title="TechSpin"
              className={`w-full flex items-center justify-center p-2.5 rounded-xl transition ${
                isActive('/techspin')
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60'
              }`}
            >
              <Disc className="w-4 h-4" />
            </Link>

            <div className="my-2 border-t border-slate-100 dark:border-slate-800/80" />

            {/* Account Quick Icon */}
            <Link
              href="/orders"
              title="My Account"
              className="w-full flex items-center justify-center p-2.5 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 relative transition"
            >
              <User className="w-4 h-4" />
              {unreadMessages > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500" />
              )}
            </Link>

            {/* Saved Items */}
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

            {/* Messages */}
            <Link
              href="/messages"
              title="Messages"
              className="w-full flex items-center justify-center p-2.5 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 relative transition"
            >
              <MessageSquare className="w-4 h-4" />
              {unreadMessages > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500" />
              )}
            </Link>

            <div className="my-2 border-t border-slate-100 dark:border-slate-800/80" />

            {/* Help */}
            <Link
              href="/help"
              title="Help & Support"
              className="w-full flex items-center justify-center p-2.5 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition"
            >
              <HelpCircle className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          /* =========================================================================
             EXPANDED FULL VIEW MODE (w-60 to w-64)
             ========================================================================= */
          <div className="space-y-4">
            {/* 1. PRIMARY SECTION */}
            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 px-3 block">
                Primary
              </span>

              {/* Home */}
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

              {/* Shop Collapsible Accordion */}
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
                  <div className="pl-3 space-y-0.5 animate-in fade-in">
                    <Link
                      href="/products"
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
                      <span>Request a Gadget</span>
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
                      <span className="bg-rose-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full uppercase leading-none">
                        Hot
                      </span>
                    </Link>
                  </div>
                )}
              </div>

              {/* Find My Tech (AI Badge) */}
              <Link
                href="/assistant"
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
                  <div className="pl-3 space-y-0.5 animate-in fade-in">
                    <Link
                      href="/compare"
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

            {/* 2. ACCOUNT SECTION */}
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
                <div className="pl-3 space-y-0.5 animate-in fade-in">
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
                    href="/messages"
                    className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition ${
                      isActive('/messages')
                        ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 font-bold'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <MessageSquare className="w-3.5 h-3.5 shrink-0" />
                      <span>Messages</span>
                    </div>
                    {unreadMessages > 0 && (
                      <span className="bg-rose-500 text-white text-[9px] font-black px-1.5 py-0.2 rounded-full">
                        {unreadMessages > 9 ? '9+' : unreadMessages}
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