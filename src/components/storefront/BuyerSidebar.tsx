'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Home,
  ShoppingBag,
  LayoutGrid,
  ShieldCheck,
  Megaphone,
  Tag,
  Sparkles,
  Scale,
  Wrench,
  Disc,
  User,
  Package,
  Bookmark,
  Clock,
  Bell,
  Wallet,
  Settings,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'

export function BuyerSidebar() {
  const pathname = usePathname()
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [shopOpen, setShopOpen] = useState(true)
  const [compareOpen, setCompareOpen] = useState(true)
  const [accountOpen, setAccountOpen] = useState(
    pathname.startsWith('/orders') ||
      pathname.startsWith('/saved') ||
      pathname.startsWith('/recently-viewed') ||
      pathname.startsWith('/price-alerts') ||
      pathname.startsWith('/wallet') ||
      pathname.startsWith('/settings')
  )

  useEffect(() => {
    try {
      const saved = localStorage.getItem('benchtech_buyer_sidebar_collapsed')
      if (saved !== null) {
        setIsCollapsed(saved === 'true')
      } else if (window.innerWidth < 1280) {
        setIsCollapsed(true)
      }
    } catch {}
  }, [])

  const toggleCollapse = () => {
    const next = !isCollapsed
    setIsCollapsed(next)
    try {
      localStorage.setItem('benchtech_buyer_sidebar_collapsed', String(next))
    } catch {}
  }

  const isActive = (href: string) =>
    href === '/feed'
      ? pathname === '/feed'
      : pathname === href || pathname.startsWith(`${href}/`)

  const linkClass = (active: boolean) =>
    `flex items-center rounded-xl text-xs lg:text-[13.5px] font-bold transition ${
      isCollapsed ? 'justify-center p-2.5' : 'gap-3 px-3 py-2.5'
    } ${
      active
        ? 'bg-blue-600 text-white shadow-xs'
        : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/80'
    }`

  const subLinkClass = (active: boolean) =>
    `flex items-center gap-2.5 pl-9 pr-3 py-2 rounded-xl text-xs lg:text-[13px] font-semibold transition ${
      active
        ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-bold'
        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/70 hover:text-slate-900 dark:hover:text-white'
    }`

  return (
    <aside
      className={`hidden lg:flex flex-col shrink-0 sticky top-[68px] h-[calc(100vh-68px)] bg-white dark:bg-slate-900 border-r border-slate-200/80 dark:border-slate-800 transition-all duration-200 select-none ${
        isCollapsed ? 'w-[68px]' : 'w-60 xl:w-[260px]'
      }`}
    >
      {/* Top Collapse Header */}
      <div className="px-3.5 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
        {!isCollapsed && (
          <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">
            Navigation
          </span>
        )}
        <button
          type="button"
          onClick={toggleCollapse}
          title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          className={`p-1.5 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer ${
            isCollapsed ? 'mx-auto' : ''
          }`}
        >
          {isCollapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Scrollable Menu */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden p-2.5 space-y-4 [scrollbar-width:thin]">
        {/* MARKETPLACE */}
        <div className="space-y-1">
          {!isCollapsed && (
            <span className="px-3 text-[10px] lg:text-[11px] font-black uppercase tracking-wider text-slate-400 block mb-1.5">
              Marketplace
            </span>
          )}

          <Link
            href="/feed"
            title={isCollapsed ? 'Home' : undefined}
            className={linkClass(isActive('/feed'))}
          >
            <Home className="w-4 h-4 shrink-0" />
            {!isCollapsed && <span>Home</span>}
          </Link>

          {/* Shop Group */}
          {!isCollapsed ? (
            <div className="space-y-0.5">
              <button
                type="button"
                onClick={() => setShopOpen(!shopOpen)}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs lg:text-[13.5px] font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition cursor-pointer"
              >
                <span className="flex items-center gap-3">
                  <ShoppingBag className="w-4 h-4 shrink-0" />
                  <span>Shop</span>
                </span>
                {shopOpen ? (
                  <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                )}
              </button>

              {shopOpen && (
                <div className="space-y-0.5">
                  <Link
                    href="/products"
                    className={subLinkClass(isActive('/products'))}
                  >
                    <LayoutGrid className="w-3.5 h-3.5 shrink-0" />
                    <span>All Categories</span>
                  </Link>
                  <Link
                    href="/sellers"
                    className={subLinkClass(isActive('/sellers'))}
                  >
                    <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                    <span>Verified Sellers</span>
                  </Link>
                  <Link
                    href="/requests/new"
                    className={subLinkClass(isActive('/requests'))}
                  >
                    <Megaphone className="w-3.5 h-3.5 shrink-0" />
                    <span>Request a Device</span>
                  </Link>
                  <Link
                    href="/deals"
                    className={subLinkClass(isActive('/deals'))}
                  >
                    <Tag className="w-3.5 h-3.5 shrink-0" />
                    <span>Deals &amp; Offers</span>
                  </Link>
                </div>
              )}
            </div>
          ) : (
            <Link
              href="/products"
              title="All Categories"
              className={linkClass(isActive('/products'))}
            >
              <LayoutGrid className="w-4 h-4 shrink-0" />
            </Link>
          )}

          {/* Tech Advisor (BenchTech AI) */}
          <Link
            href="/assistant"
            title={isCollapsed ? 'BenchTech AI' : undefined}
            className={linkClass(isActive('/assistant'))}
          >
            <Sparkles className="w-4 h-4 shrink-0" />
            {!isCollapsed && <span>BenchTech AI</span>}
          </Link>

          {/* Compare & Build Group */}
          {!isCollapsed ? (
            <div className="space-y-0.5">
              <button
                type="button"
                onClick={() => setCompareOpen(!compareOpen)}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs lg:text-[13.5px] font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition cursor-pointer"
              >
                <span className="flex items-center gap-3">
                  <Scale className="w-4 h-4 shrink-0" />
                  <span>Compare &amp; Build</span>
                </span>
                {compareOpen ? (
                  <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                )}
              </button>

              {compareOpen && (
                <div className="space-y-0.5">
                  <Link
                    href="/compare"
                    className={subLinkClass(isActive('/compare'))}
                  >
                    <Scale className="w-3.5 h-3.5 shrink-0" />
                    <span>Compare Specs</span>
                  </Link>
                  <Link
                    href="/build"
                    className={subLinkClass(isActive('/build'))}
                  >
                    <Wrench className="w-3.5 h-3.5 shrink-0" />
                    <span>Build My Setup</span>
                  </Link>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link
                href="/compare"
                title="Compare Specs"
                className={linkClass(isActive('/compare'))}
              >
                <Scale className="w-4 h-4 shrink-0" />
              </Link>
              <Link
                href="/build"
                title="Build My Setup"
                className={linkClass(isActive('/build'))}
              >
                <Wrench className="w-4 h-4 shrink-0" />
              </Link>
            </>
          )}

          <Link
            href="/techspin"
            title={isCollapsed ? 'Daily Rewards' : undefined}
            className={linkClass(isActive('/techspin'))}
          >
            <Disc className="w-4 h-4 shrink-0" />
            {!isCollapsed && <span>Daily Rewards</span>}
          </Link>
        </div>

        {/* ACCOUNT */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-1">
          {!isCollapsed && (
            <span className="px-3 text-[10px] lg:text-[11px] font-black uppercase tracking-wider text-slate-400 block mb-1.5">
              Account
            </span>
          )}

          {!isCollapsed ? (
            <div className="space-y-0.5">
              <button
                type="button"
                onClick={() => setAccountOpen(!accountOpen)}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs lg:text-[13.5px] font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition cursor-pointer"
              >
                <span className="flex items-center gap-3">
                  <User className="w-4 h-4 shrink-0" />
                  <span>My Account</span>
                </span>
                {accountOpen ? (
                  <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                )}
              </button>

              {accountOpen && (
                <div className="space-y-0.5">
                  <Link
                    href="/orders"
                    className={subLinkClass(isActive('/orders'))}
                  >
                    <Package className="w-3.5 h-3.5 shrink-0" />
                    <span>My Orders</span>
                  </Link>
                  <Link
                    href="/saved"
                    className={subLinkClass(isActive('/saved'))}
                  >
                    <Bookmark className="w-3.5 h-3.5 shrink-0" />
                    <span>Saved Items</span>
                  </Link>
                  <Link
                    href="/recently-viewed"
                    className={subLinkClass(isActive('/recently-viewed'))}
                  >
                    <Clock className="w-3.5 h-3.5 shrink-0" />
                    <span>Recently Viewed</span>
                  </Link>
                  <Link
                    href="/price-alerts"
                    className={subLinkClass(isActive('/price-alerts'))}
                  >
                    <Bell className="w-3.5 h-3.5 shrink-0" />
                    <span>Price Alerts</span>
                  </Link>
                  <Link
                    href="/wallet"
                    className={subLinkClass(isActive('/wallet'))}
                  >
                    <Wallet className="w-3.5 h-3.5 shrink-0" />
                    <span>My Wallet</span>
                  </Link>
                  <Link
                    href="/settings"
                    className={subLinkClass(isActive('/settings'))}
                  >
                    <Settings className="w-3.5 h-3.5 shrink-0" />
                    <span>Account Settings</span>
                  </Link>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link
                href="/orders"
                title="My Orders"
                className={linkClass(isActive('/orders'))}
              >
                <Package className="w-4 h-4 shrink-0" />
              </Link>
              <Link
                href="/settings"
                title="Account Settings"
                className={linkClass(isActive('/settings'))}
              >
                <Settings className="w-4 h-4 shrink-0" />
              </Link>
            </>
          )}
        </div>

        {/* SUPPORT */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-1">
          {!isCollapsed && (
            <span className="px-3 text-[10px] lg:text-[11px] font-black uppercase tracking-wider text-slate-400 block mb-1.5">
              Support
            </span>
          )}

          <Link
            href="/help"
            title={isCollapsed ? 'Help & Support' : undefined}
            className={linkClass(isActive('/help'))}
          >
            <HelpCircle className="w-4 h-4 shrink-0" />
            {!isCollapsed && <span>Help &amp; Support</span>}
          </Link>
        </div>
      </div>
    </aside>
  )
}