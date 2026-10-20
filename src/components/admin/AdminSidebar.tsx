'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BenchTechLogo } from '@/components/BenchTechLogo'
import { signOut } from '@/app/(auth)/actions'
import {
  LayoutDashboard,
  ShieldCheck,
  Boxes,
  ClipboardList,
  Wallet,
  Megaphone,
  Users,
  ShieldAlert,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Menu,
  X,
  ExternalLink,
  LogOut,
  Store,
} from 'lucide-react'

interface AdminSidebarProps {
  counts: {
    pendingVerifications: number
    pendingOrders: number
    pendingPayouts: number
    openDisputes: number
  }
}

export function AdminSidebar({ counts }: AdminSidebarProps) {
  const pathname = usePathname()
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  // Collapsible Mini-Category Accordions
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    trust: true,
    commerce: true,
    directory: true,
  })

  useEffect(() => {
    try {
      const saved = localStorage.getItem('benchtech_admin_sidebar_collapsed')
      if (saved !== null) setIsCollapsed(saved === 'true')
    } catch {}
  }, [])

  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  const toggleCollapse = () => {
    const next = !isCollapsed
    setIsCollapsed(next)
    try {
      localStorage.setItem('benchtech_admin_sidebar_collapsed', String(next))
    } catch {}
  }

  const toggleGroup = (key: string) => {
    setOpenGroups((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const isActive = (href: string) => {
    if (href === '/admin') {
      return pathname === '/admin' || pathname === '/admin/overview'
    }
    return pathname.startsWith(href)
  }

  const NAV_GROUPS = [
    {
      key: 'trust',
      label: 'Trust & Moderation',
      items: [
        {
          label: 'Seller Verifications',
          href: '/admin/verifications',
          icon: ShieldCheck,
          badge: counts.pendingVerifications,
          badgeColor: 'bg-blue-600 text-white',
        },
        {
          label: 'Product Catalog',
          href: '/admin/listings',
          icon: Boxes,
        },
        {
          label: 'Disputes & Cases',
          href: '/admin/disputes',
          icon: ShieldAlert,
          badge: counts.openDisputes,
          badgeColor: 'bg-red-600 text-white',
        },
      ],
    },
    {
      key: 'commerce',
      label: 'Orders & Finance',
      items: [
        {
          label: 'Orders & Logistics',
          href: '/admin/orders',
          icon: ClipboardList,
          badge: counts.pendingOrders,
          badgeColor: 'bg-amber-500 text-slate-950',
        },
        {
          label: 'Seller Payouts',
          href: '/admin/payouts',
          icon: Wallet,
          badge: counts.pendingPayouts,
          badgeColor: 'bg-emerald-600 text-white',
        },
        {
          label: 'Promotions & Ads',
          href: '/admin/advertising',
          icon: Megaphone,
        },
      ],
    },
    {
      key: 'directory',
      label: 'Accounts',
      items: [
        {
          label: 'Users & Merchants',
          href: '/admin/users',
          icon: Users,
        },
      ],
    },
  ]

  const renderNavContent = (onNavigate?: () => void, forceExpanded = false) => {
    const collapsed = forceExpanded ? false : isCollapsed

    return (
      <div className="flex flex-col justify-between h-full bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 select-none">
        {/* Top Brand & Collapse Button */}
        <div className="p-3.5 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between shrink-0">
          {!collapsed ? (
            <Link
              href="/admin"
              onClick={onNavigate}
              className="flex items-center gap-2.5 min-w-0"
            >
              <BenchTechLogo className="w-8 h-8" />
              <div className="truncate">
                <span className="font-black text-sm text-slate-900 dark:text-white block leading-none">
                  BenchTech
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 block mt-0.5">
                  Admin Console
                </span>
              </div>
            </Link>
          ) : (
            <Link href="/admin" className="mx-auto">
              <BenchTechLogo className="w-8 h-8" />
            </Link>
          )}

          {!forceExpanded && (
            <button
              type="button"
              onClick={toggleCollapse}
              title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
              className={`hidden lg:flex p-1.5 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer ${
                collapsed ? 'mx-auto mt-2' : 'ml-auto'
              }`}
            >
              {collapsed ? (
                <ChevronRight className="w-4 h-4" />
              ) : (
                <ChevronLeft className="w-4 h-4" />
              )}
            </button>
          )}
        </div>

        {/* Scrollable Navigation Links */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-2.5 space-y-3 [scrollbar-width:thin]">
          {/* Overview Link */}
          <div>
            <Link
              href="/admin"
              onClick={onNavigate}
              title={collapsed ? 'Overview' : undefined}
              className={`flex items-center rounded-xl text-xs font-bold transition ${
                collapsed ? 'justify-center p-2.5' : 'gap-3 px-3 py-2.5'
              } ${
                isActive('/admin')
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/70'
              }`}
            >
              <LayoutDashboard className="w-4 h-4 shrink-0" />
              {!collapsed && <span>Overview</span>}
            </Link>
          </div>

          {/* Collapsible Category Groups */}
          {NAV_GROUPS.map((group) => {
            const isGroupOpen = openGroups[group.key]
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
                    <span>{group.label}</span>
                    {isGroupOpen ? (
                      <ChevronUp className="w-3.5 h-3.5" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5" />
                    )}
                  </button>
                )}

                {(collapsed || isGroupOpen) && (
                  <div className="space-y-0.5">
                    {group.items.map((item) => {
                      const Icon = item.icon
                      const active = isActive(item.href)
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={onNavigate}
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

                          {!collapsed && item.badge && item.badge > 0 ? (
                            <span
                              className={`text-[10px] font-black px-1.5 py-0.2 rounded-full ${item.badgeColor}`}
                            >
                              {item.badge}
                            </span>
                          ) : null}

                          {collapsed && item.badge && item.badge > 0 ? (
                            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-blue-600" />
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
          <Link
            href="/seller/dashboard"
            onClick={onNavigate}
            title={collapsed ? 'Seller Hub' : undefined}
            className={`flex items-center rounded-xl text-xs font-bold bg-slate-50 dark:bg-slate-800/70 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200/70 dark:border-slate-700 transition ${
              collapsed ? 'justify-center p-2.5' : 'justify-between px-3 py-2'
            }`}
          >
            <div className="flex items-center gap-2">
              <Store className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 shrink-0" />
              {!collapsed && <span>Seller Hub</span>}
            </div>
            {!collapsed && <ExternalLink className="w-3 h-3 text-slate-400" />}
          </Link>

          <Link
            href="/feed"
            onClick={onNavigate}
            title={collapsed ? 'Marketplace' : undefined}
            className={`flex items-center rounded-xl text-xs font-bold bg-slate-50 dark:bg-slate-800/70 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200/70 dark:border-slate-700 transition ${
              collapsed ? 'justify-center p-2.5' : 'justify-between px-3 py-2'
            }`}
          >
            <div className="flex items-center gap-2">
              <ExternalLink className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
              {!collapsed && <span>Buyer Storefront</span>}
            </div>
          </Link>

          <form action={signOut}>
            <button
              type="submit"
              title={collapsed ? 'Sign Out' : undefined}
              className={`w-full flex items-center rounded-xl text-xs font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition cursor-pointer ${
                collapsed ? 'justify-center p-2.5' : 'gap-2.5 px-3 py-2'
              }`}
            >
              <LogOut className="w-3.5 h-3.5 shrink-0" />
              {!collapsed && <span>Sign Out</span>}
            </button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Mobile Top Bar */}
      <div className="lg:hidden sticky top-0 z-40 h-14 px-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="p-2 -ml-1 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
            aria-label="Open Admin Menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <BenchTechLogo className="w-7 h-7" />
          <span className="font-black text-sm text-slate-900 dark:text-white">
            Admin Console
          </span>
        </div>

        <Link
          href="/feed"
          className="text-xs font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1"
        >
          <span>Storefront</span>
          <ExternalLink className="w-3 h-3" />
        </Link>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="relative w-72 max-w-[85vw] h-dvh z-10 shadow-2xl border-r border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="absolute top-3.5 right-3 p-1.5 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white z-20"
              aria-label="Close Admin Menu"
            >
              <X className="w-5 h-5" />
            </button>
            {renderNavContent(() => setMobileOpen(false), true)}
          </aside>
        </div>
      )}

      {/* Desktop Sticky Collapsible Sidebar */}
      <aside
        className={`hidden lg:flex flex-col shrink-0 sticky top-0 h-screen border-r border-slate-200/80 dark:border-slate-800 transition-all duration-200 ${
          isCollapsed ? 'w-16' : 'w-64'
        }`}
      >
        {renderNavContent()}
      </aside>
    </>
  )
}