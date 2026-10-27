'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BenchTechLogo } from '@/components/BenchTechLogo'
import { signOut } from '@/app/(auth)/actions'
import { Button } from '@/components/ui/button'
import { createBrowserClient } from '@supabase/ssr'
import { playNotificationTone } from '@/lib/notificationSound'
import {
  LayoutDashboard,
  Boxes,
  PackagePlus,
  MessageSquare,
  ClipboardList,
  Megaphone,
  BarChart3,
  Settings,
  HelpCircle,
  LogOut,
  CreditCard,
  Upload,
  FileText,
  Store,
  Crown,
  ShieldAlert,
  ShieldCheck,
  ArrowRight,
  Menu,
  Wallet,
  X,
  Users,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  CalendarClock,
} from 'lucide-react'

interface SellerSidebarProps {
  profile: any
}

export function SellerSidebar({ profile }: SellerSidebarProps) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [unreadCount, setUnreadCount] = useState<number>(0)
  const previousCountRef = useRef<number>(0)
  const isInitialLoad = useRef<boolean>(true)

  // Collapsible Category Accordions
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    catalog: true,
    finance: true,
    pro: true,
    account: true,
  })

  const isPro =
    profile?.seller_plan === 'pro' ||
    profile?.subscription_tier === 'pro' ||
    profile?.subscription_plan === 'professional'

  const userRoles: string[] =
    profile?.roles || (profile?.role ? [profile.role] : [])
  const isAdmin =
    profile?.is_admin === true ||
    profile?.role === 'admin' ||
    userRoles.includes('admin')

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    try {
      const saved = localStorage.getItem('benchtech_seller_sidebar_collapsed')
      if (saved !== null) setIsCollapsed(saved === 'true')
    } catch {}
  }, [])

  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  const toggleSidebarCollapse = () => {
    const next = !isCollapsed
    setIsCollapsed(next)
    try {
      localStorage.setItem('benchtech_seller_sidebar_collapsed', String(next))
    } catch {}
  }

  const toggleGroup = (key: string) => {
    setOpenGroups((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const checkUnread = useCallback(async () => {
    if (!profile?.id) return
    if (
      typeof document !== 'undefined' &&
      document.visibilityState !== 'visible'
    )
      return

    try {
      const { count, error } = await supabase
        .from('enquiries')
        .select('*', { count: 'exact', head: true })
        .eq('seller_id', profile.id)
        .eq('status', 'new')

      if (!error && count !== null) {
        if (!isInitialLoad.current && count > previousCountRef.current) {
          playNotificationTone()
        }
        previousCountRef.current = count
        setUnreadCount(count)
      }
      isInitialLoad.current = false
    } catch {}
  }, [profile?.id, supabase])

  useEffect(() => {
    checkUnread()
    const interval = setInterval(checkUnread, 60000)
    return () => clearInterval(interval)
  }, [checkUnread])

  const NAV_GROUPS = [
    {
      key: 'catalog',
      label: 'Store & Catalog',
      items: [
        { label: 'My Storefront', href: '/seller/store', icon: Store },
        { label: 'Product Listings', href: '/seller/listings', icon: Boxes },
        {
          label: 'Add New Listing',
          href: '/seller/listings/new',
          icon: PackagePlus,
        },
        {
          label: 'Promotions & Ads',
          href: '/seller/promotions',
          icon: Megaphone,
          badge: 'Ads',
          badgeColor: 'bg-blue-600 text-white',
        },
      ],
    },
    {
      key: 'finance',
      label: 'Orders & Finance',
      items: [
        { label: 'Orders', href: '/seller/orders', icon: ClipboardList },
        {
          label: 'Buyer Enquiries',
          href: '/seller/enquiries',
          icon: MessageSquare,
          unread: unreadCount,
        },
        { label: 'Wallet & Payouts', href: '/seller/wallet', icon: Wallet },
        {
          label: 'Payout Schedule',
          href: '/seller/payouts',
          icon: CalendarClock,
        },
      ],
    },
    {
      key: 'pro',
      label: 'Pro Business Suite',
      isProGroup: true,
      items: [
        {
          label: 'Inventory Manager',
          href: '/seller/inventory',
          icon: Boxes,
          pro: true,
        },
        {
          label: 'Bulk CSV Upload',
          href: '/seller/bulk-upload',
          icon: Upload,
          pro: true,
        },
        {
          label: 'Store Analytics',
          href: '/seller/analytics',
          icon: BarChart3,
          pro: true,
        },
        {
          label: 'Sales Reports',
          href: '/seller/reports',
          icon: FileText,
          pro: true,
        },
        {
          label: 'Customer Directory',
          href: '/seller/customers',
          icon: Users,
          pro: true,
        },
      ],
    },
    {
      key: 'account',
      label: 'Account & Settings',
      items: [
        {
          label: 'Verification Status',
          href: '/seller/onboarding',
          icon: ShieldCheck,
          badge:
            profile?.tech_trust_status === 'verified' ? 'Verified' : 'Verify',
          badgeColor:
            profile?.tech_trust_status === 'verified'
              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
              : 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
        },
        {
          label: 'Plan & Billing',
          href: '/seller/subscription',
          icon: CreditCard,
        },
        {
          label: 'Store Settings & Theme',
          href: '/seller/settings',
          icon: Settings,
        },
        { label: 'Seller Support', href: '/seller/support', icon: HelpCircle },
      ],
    },
  ]

  const renderSidebarContent = (
    onLinkClick?: () => void,
    forceExpanded = false
  ) => {
    const collapsed = forceExpanded ? false : isCollapsed
    const isDashboardActive =
      pathname === '/seller' || pathname === '/seller/dashboard'

    return (
      <div className="flex flex-col h-full justify-between bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 select-none transition-colors">
        {/* Top Brand Header */}
        <div className="p-3.5 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between shrink-0">
          {!collapsed ? (
            <Link
              href="/seller/dashboard"
              onClick={onLinkClick}
              className="flex items-center gap-2.5 min-w-0"
            >
              <BenchTechLogo className="w-8 h-8" />
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-black text-sm tracking-tight text-slate-900 dark:text-white truncate">
                    {profile?.business_name || 'Seller Hub'}
                  </span>
                  {isPro && (
                    <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded-md bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300 border border-purple-200 dark:border-purple-800 shrink-0">
                      PRO
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-slate-400 font-semibold block">
                  Merchant Workspace
                </span>
              </div>
            </Link>
          ) : (
            <Link href="/seller/dashboard" className="mx-auto">
              <BenchTechLogo className="w-8 h-8" />
            </Link>
          )}

          {!forceExpanded && (
            <button
              type="button"
              onClick={toggleSidebarCollapse}
              className={`hidden lg:flex p-1.5 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer ${
                collapsed ? 'mx-auto mt-2' : 'ml-auto'
              }`}
              title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
            >
              {collapsed ? (
                <ChevronRight className="w-4 h-4" />
              ) : (
                <ChevronLeft className="w-4 h-4" />
              )}
            </button>
          )}
        </div>

        {/* Scrollable Navigation Body */}
        <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-2.5 space-y-3 [scrollbar-width:thin]">
          {/* Overview Link */}
          <div>
            <Link
              href="/seller/dashboard"
              onClick={onLinkClick}
              title={collapsed ? 'Dashboard' : undefined}
              className={`flex items-center rounded-xl text-xs font-bold transition ${
                collapsed ? 'justify-center p-2.5' : 'gap-2.5 px-3 py-2.5'
              } ${
                isDashboardActive
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/70'
              }`}
            >
              <LayoutDashboard className="w-4 h-4 shrink-0" />
              {!collapsed && <span>Dashboard</span>}
            </Link>
          </div>

          {/* Collapsible Category Groups */}
          {NAV_GROUPS.map((group) => {
            const isOpen = openGroups[group.key]
            return (
              <div
                key={group.key}
                className="pt-2 border-t border-slate-100 dark:border-slate-800/80 space-y-1"
              >
                {!collapsed && (
                  <button
                    type="button"
                    onClick={() => toggleGroup(group.key)}
                    className="w-full flex items-center justify-between px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition cursor-pointer"
                  >
                    <span className="flex items-center gap-1.5">
                      <span>{group.label}</span>
                      {group.isProGroup && (
                        <Crown className="w-3 h-3 text-amber-500 fill-amber-400" />
                      )}
                    </span>
                    {isOpen ? (
                      <ChevronUp className="w-3.5 h-3.5" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5" />
                    )}
                  </button>
                )}

                {(collapsed || isOpen) && (
                  <div className="space-y-0.5">
                    {group.items.map((item) => {
                      const Icon = item.icon
                      const active = pathname === item.href
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={onLinkClick}
                          title={collapsed ? item.label : undefined}
                          className={`relative flex items-center rounded-xl text-xs font-semibold transition ${
                            collapsed
                              ? 'justify-center p-2.5'
                              : 'justify-between px-3 py-2'
                          } ${
                            active
                              ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-bold'
                              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <Icon className="w-4 h-4 shrink-0" />
                            {!collapsed && (
                              <span className="truncate">{item.label}</span>
                            )}
                          </div>

                          {!collapsed &&
                          'unread' in item &&
                          item.unread &&
                          item.unread > 0 ? (
                            <span className="bg-red-600 text-white text-[9px] font-black px-1.5 py-0.2 rounded-full">
                              {item.unread > 9 ? '9+' : item.unread}
                            </span>
                          ) : null}

                          {!collapsed && 'badge' in item && item.badge ? (
                            <span
                              className={`text-[9px] font-bold px-1.5 py-0.2 rounded-md ${
                                item.badgeColor ||
                                'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                              }`}
                            >
                              {item.badge}
                            </span>
                          ) : null}

                          {!collapsed && 'pro' in item && item.pro && !isPro ? (
                            <span className="text-[8px] font-black uppercase px-1.5 py-0.2 rounded-md bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300">
                              Pro
                            </span>
                          ) : null}
                        </Link>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Bottom Workspace Switcher & Sign Out */}
        <div className="p-2.5 border-t border-slate-200/80 dark:border-slate-800 space-y-1.5 shrink-0">
          {!collapsed && !isPro && (
            <Link
              href="/seller/subscription"
              onClick={onLinkClick}
              className="flex items-center justify-between p-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-bold shadow-2xs hover:opacity-95 transition"
            >
              <span className="flex items-center gap-1.5">
                <Crown className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
                <span>Upgrade to Pro</span>
              </span>
              <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded-md">
                ₦5k/mo
              </span>
            </Link>
          )}

          <Link
            href="/feed"
            onClick={onLinkClick}
            title={collapsed ? 'Switch to Buyer View' : undefined}
            className={`flex items-center rounded-xl text-xs font-bold bg-slate-50 dark:bg-slate-800/70 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200/70 dark:border-slate-700 transition ${
              collapsed ? 'justify-center p-2.5' : 'justify-between px-3 py-2'
            }`}
          >
            <div className="flex items-center gap-2">
              <ExternalLink className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
              {!collapsed && <span>Switch to Buyer View</span>}
            </div>
            {!collapsed && <ArrowRight className="w-3 h-3 text-slate-400" />}
          </Link>

          {isAdmin && (
            <Link
              href="/admin"
              onClick={onLinkClick}
              title={collapsed ? 'Admin Console' : undefined}
              className={`flex items-center rounded-xl text-xs font-bold bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 hover:bg-purple-100 dark:hover:bg-purple-900/50 transition ${
                collapsed ? 'justify-center p-2.5' : 'justify-between px-3 py-2'
              }`}
            >
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 shrink-0" />
                {!collapsed && <span>Admin Console</span>}
              </div>
              {!collapsed && <ArrowRight className="w-3 h-3 shrink-0" />}
            </Link>
          )}

          <form action={signOut}>
            <Button
              variant="ghost"
              size="sm"
              type="submit"
              title={collapsed ? 'Log Out' : undefined}
              className={`w-full text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 gap-2 h-8 rounded-xl font-bold cursor-pointer ${
                collapsed ? 'justify-center p-0' : 'justify-start px-3 text-xs'
              }`}
            >
              <LogOut className="w-3.5 h-3.5 shrink-0" />
              {!collapsed && <span>Log Out</span>}
            </Button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Mobile Sticky Top Header */}
      <div className="lg:hidden sticky top-0 z-40 px-4 h-14 flex items-center justify-between w-full border-b bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="p-2 -ml-1 text-slate-700 dark:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
            aria-label="Open seller menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <BenchTechLogo className="w-7 h-7" />
          <span className="font-black text-sm tracking-tight text-slate-900 dark:text-white truncate max-w-[160px]">
            {profile?.business_name || 'Seller Hub'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/seller/settings"
            className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
            title="Store Settings & Theme"
          >
            <Settings className="w-4 h-4" />
          </Link>
          <Link
            href="/feed"
            className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
          >
            <span>Storefront</span>
            <ExternalLink className="w-3 h-3" />
          </Link>
        </div>
      </div>

      {/* Mobile Slide-Out Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs animate-in fade-in"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="relative w-72 max-w-[85vw] h-dvh z-10 shadow-2xl border-r border-slate-200 dark:border-slate-800 animate-in slide-in-from-left duration-200">
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="absolute top-3.5 right-3 p-1.5 text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg z-20"
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
            {renderSidebarContent(() => setMobileOpen(false), true)}
          </aside>
        </div>
      )}

      {/* Desktop Collapsible Sidebar */}
      <aside
        className={`hidden lg:flex flex-col shrink-0 sticky top-0 h-screen overflow-hidden border-r border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 transition-all duration-200 ${
          isCollapsed ? 'w-16' : 'w-64'
        }`}
      >
        {renderSidebarContent()}
      </aside>
    </>
  )
}