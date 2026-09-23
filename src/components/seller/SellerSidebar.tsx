'use client'

import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Boxes,
  PackagePlus,
  MessageSquare,
  ClipboardList,
  Sparkles,
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
  X,
  Users,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { signOut } from '@/app/(auth)/actions'
import { Button } from '@/components/ui/button'
import { createBrowserClient } from '@supabase/ssr'
import { playNotificationTone } from '@/lib/notificationSound'

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

  const isPro =
    profile?.seller_plan === 'pro' ||
    profile?.subscription_tier === 'pro' ||
    profile?.subscription_plan === 'professional'

  const userRoles: string[] = profile?.roles || (profile?.role ? [profile.role] : [])
  const isAdmin = profile?.is_admin === true || profile?.role === 'admin' || userRoles.includes('admin')

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  useEffect(() => {
    if (!profile?.id) return

    const checkUnread = async () => {
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
      } catch {
        // Silently handle network errors
      }
    }

    checkUnread()
    const interval = setInterval(checkUnread, 5000)
    return () => clearInterval(interval)
  }, [profile?.id, supabase])

  // Core Store Management Links
  const CORE_NAV = [
    { label: 'Dashboard', href: '/seller', icon: LayoutDashboard },
    { label: 'My Storefront', href: '/seller/store', icon: Store },
    { label: 'Product Listings', href: '/seller/listings', icon: Boxes },
    { label: 'Add New Listing', href: '/seller/listings/new', icon: PackagePlus },
    { label: 'Orders', href: '/seller/orders', icon: ClipboardList },
    { label: 'Messages', href: '/seller/enquiries', icon: MessageSquare },
  ]

  // Pro Business Suite
  const PRO_NAV = [
    { label: 'Bulk Upload', href: '/seller/bulk-upload', icon: Upload, pro: true },
    { label: 'Inventory', href: '/seller/inventory', icon: Boxes, pro: true },
    { label: 'Analytics', href: '/seller/analytics', icon: BarChart3, pro: true },
    { label: 'Promotions', href: '/seller/promotions', icon: Sparkles, pro: true },
    { label: 'Sales Reports', href: '/seller/reports', icon: FileText, pro: true },
    { label: 'Customers', href: '/seller/customers', icon: Users, pro: true },
  ]

  // Settings & Verification
  const SETTINGS_NAV = [
    {
      label: 'Store Verification',
      href: '/seller/verify',
      icon: ShieldCheck,
      badge: profile?.tech_trust_status === 'verified' ? 'Verified' : 'Get Verified',
    },
    { label: 'Subscription & Plan', href: '/seller/subscription', icon: CreditCard },
    { label: 'Store Settings', href: '/seller/settings', icon: Settings },
    { label: 'Help & Support', href: '/help', icon: HelpCircle },
  ]

  const SidebarBody = ({ onLinkClick }: { onLinkClick?: () => void }) => (
    <div className="flex flex-col h-full justify-between bg-[#f8fafc] text-slate-700 transition-colors">
      {/* 1. Header with Collapse / Expand Trigger */}
      <div className="p-3.5 border-b border-slate-200/70 flex items-center justify-between shrink-0">
        {!isCollapsed ? (
          <Link href="/seller" onClick={onLinkClick} className="flex flex-col group min-w-0">
            <div className="flex items-center gap-1.5 truncate">
              <span className="font-black text-sm tracking-tight text-slate-900 group-hover:text-blue-600 transition">
                ShopBenchTech
              </span>
              {isPro && (
                <span className="text-[8px] font-black uppercase px-1.5 py-0.2 rounded-md bg-purple-100 text-purple-700 border border-purple-200">
                  PRO
                </span>
              )}
            </div>
            <span className="text-[10px] text-slate-400 font-medium">Seller Hub</span>
          </Link>
        ) : (
          <div className="w-8 h-8 rounded-xl bg-white border border-slate-200/80 shadow-2xs flex items-center justify-center text-xs font-bold text-slate-700 mx-auto">
            {(profile?.business_name || profile?.full_name || 'S')?.[0]?.toUpperCase()}
          </div>
        )}

        <button
          type="button"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={`hidden lg:flex p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-white hover:shadow-2xs transition ${
            isCollapsed ? 'mx-auto mt-2' : 'ml-auto'
          }`}
          title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          aria-label={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* 2. Scrollable Navigation with Visible Modern Scrollbar */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden px-2 sm:px-3 py-3 space-y-4 [scrollbar-width:thin] [scrollbar-color:#cbd5e1_transparent] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-slate-300 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-slate-400">
        {/* Core Store Essentials */}
        <div className="space-y-0.5">
          {!isCollapsed && (
            <span className="text-[9px] uppercase font-bold tracking-wider text-slate-400 px-2 block mb-1">
              Store Essentials
            </span>
          )}
          {CORE_NAV.map((item) => {
            const Icon = item.icon
            const isActive =
              pathname === item.href ||
              (item.href === '/seller' && pathname === '/seller/dashboard')

            return (
              <Link
                key={item.label}
                href={item.href}
                onClick={onLinkClick}
                title={isCollapsed ? item.label : undefined}
                className={`flex items-center rounded-xl text-xs font-semibold transition relative group ${
                  isCollapsed ? 'justify-center p-2.5' : 'justify-between px-2.5 py-1.5'
                } ${
                  isActive
                    ? 'bg-blue-600 text-white font-bold shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 hover:bg-white hover:shadow-2xs'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  {!isCollapsed && <span className="truncate">{item.label}</span>}
                </div>

                {!isCollapsed && item.label === 'Messages' && unreadCount > 0 && (
                  <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[9px] font-bold text-white">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}

                {isCollapsed && item.label === 'Messages' && unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-600" />
                )}
              </Link>
            )
          })}
        </div>

        {/* Pro Business Tools */}
        <div className="space-y-0.5">
          {!isCollapsed && (
            <span className="text-[9px] uppercase font-bold tracking-wider text-purple-700 px-2 flex items-center justify-between mb-1">
              <span>Pro Business Tools</span>
              {isPro && <Crown className="w-2.5 h-2.5 text-amber-500 fill-amber-400" />}
            </span>
          )}
          {PRO_NAV.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href

            return (
              <Link
                key={item.label}
                href={item.href}
                onClick={onLinkClick}
                title={isCollapsed ? item.label : undefined}
                className={`flex items-center rounded-xl text-xs font-semibold transition relative group ${
                  isCollapsed ? 'justify-center p-2.5' : 'justify-between px-2.5 py-1.5'
                } ${
                  isActive
                    ? 'bg-blue-600 text-white font-bold shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 hover:bg-white hover:shadow-2xs'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  {!isCollapsed && <span className="truncate">{item.label}</span>}
                </div>

                {!isCollapsed && !isPro && (
                  <span className="text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-purple-100 text-purple-700 border border-purple-200">
                    Pro
                  </span>
                )}
              </Link>
            )
          })}
        </div>

        {/* Settings, Verification & Support */}
        <div className="space-y-0.5">
          {!isCollapsed && (
            <span className="text-[9px] uppercase font-bold tracking-wider text-slate-400 px-2 block mb-1">
              Store &amp; Verification
            </span>
          )}
          {SETTINGS_NAV.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href

            return (
              <Link
                key={item.label}
                href={item.href}
                onClick={onLinkClick}
                title={isCollapsed ? item.label : undefined}
                className={`flex items-center rounded-xl text-xs font-semibold transition relative group ${
                  isCollapsed ? 'justify-center p-2.5' : 'justify-between px-2.5 py-1.5'
                } ${
                  isActive
                    ? 'bg-blue-600 text-white font-bold shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 hover:bg-white hover:shadow-2xs'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  {!isCollapsed && <span className="truncate">{item.label}</span>}
                </div>

                {!isCollapsed && item.badge && (
                  <span
                    className={`text-[8px] font-bold px-1.5 py-0.2 rounded-md ${
                      item.badge === 'Verified'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-blue-50 text-blue-700 border border-blue-200'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            )
          })}
        </div>
      </div>

      {/* 3. Bottom Footer */}
      <div className="p-2 sm:p-3 border-t border-slate-200/70 space-y-2 shrink-0 bg-[#f8fafc]">
        {/* Upgrade pill for Free tier */}
        {!isCollapsed && !isPro && (
          <div className="bg-white border border-blue-200 rounded-xl p-2.5 space-y-1 shadow-2xs">
            <span className="text-[11px] font-bold text-blue-900 flex items-center gap-1">
              <Crown className="w-3 h-3 text-blue-600" /> Upgrade to Pro
            </span>
            <Link href="/seller/subscription" onClick={onLinkClick} className="block">
              <Button size="sm" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-[10px] h-6 rounded-lg">
                Upgrade ₦5k/mo
              </Button>
            </Link>
          </div>
        )}

        {/* Switch to Buyer View */}
        <Link
          href="/feed"
          onClick={onLinkClick}
          title={isCollapsed ? 'Switch to Buyer View' : undefined}
          className={`flex items-center rounded-xl transition bg-white border border-slate-200 text-slate-700 hover:text-blue-600 hover:border-blue-300 shadow-2xs group ${
            isCollapsed ? 'justify-center p-2.5' : 'justify-between px-2.5 py-2 text-xs font-bold'
          }`}
        >
          <div className="flex items-center gap-2">
            <ExternalLink className="w-3.5 h-3.5 text-blue-600 group-hover:scale-105 transition shrink-0" />
            {!isCollapsed && <span>Switch to Buyer View</span>}
          </div>
          {!isCollapsed && <ArrowRight className="w-3 h-3 text-slate-400 group-hover:translate-x-0.5 transition shrink-0" />}
        </Link>

        {/* Admin Console Shortcut */}
        {isAdmin && (
          <Link
            href="/admin"
            onClick={onLinkClick}
            title={isCollapsed ? 'Admin Console' : undefined}
            className={`flex items-center rounded-xl transition bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100 ${
              isCollapsed ? 'justify-center p-2.5' : 'justify-between px-2.5 py-1.5 text-xs font-bold'
            }`}
          >
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-3.5 h-3.5 text-purple-600 shrink-0" />
              {!isCollapsed && <span>Admin Console</span>}
            </div>
            {!isCollapsed && <ArrowRight className="w-3 h-3 shrink-0" />}
          </Link>
        )}

        {/* Log Out */}
        <form action={signOut}>
          <Button
            variant="ghost"
            size="sm"
            type="submit"
            title={isCollapsed ? 'Log Out' : undefined}
            className={`w-full text-red-600 hover:text-red-700 hover:bg-red-50 gap-2 h-7 rounded-xl font-bold ${
              isCollapsed ? 'justify-center p-0' : 'justify-start px-2.5 text-xs'
            }`}
          >
            <LogOut className="w-3.5 h-3.5 shrink-0" />
            {!isCollapsed && <span>Log Out</span>}
          </Button>
        </form>
      </div>
    </div>
  )

  return (
    <>
      {/* Mobile Top Header */}
      <div className="lg:hidden sticky top-0 z-40 px-3.5 h-14 flex items-center justify-between w-full shadow-2xs border-b bg-[#f8fafc] border-slate-200">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="p-1.5 text-slate-600 hover:text-slate-900 rounded-xl focus:outline-none"
            aria-label="Open seller menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <span className="font-black text-sm tracking-tight text-slate-900">
            ShopBenchTech
          </span>
        </div>

        <Link
          href="/feed"
          className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1"
        >
          Buyer View <ExternalLink className="w-3 h-3" />
        </Link>
      </div>

      {/* Mobile Off-Canvas Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative w-72 max-w-[82vw] h-full z-10 shadow-2xl flex flex-col bg-[#f8fafc]">
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="absolute top-3.5 right-3 p-1 text-slate-400 hover:text-slate-900 rounded-lg"
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
            <SidebarBody onLinkClick={() => setMobileOpen(false)} />
          </div>
        </div>
      )}

      {/* Desktop Persistent Sidebar (Collapsible between w-16 and w-64) */}
      <aside
        className={`hidden lg:flex flex-col shrink-0 sticky top-0 h-screen overflow-hidden border-r border-slate-200/70 bg-[#f8fafc] transition-all duration-200 ${
          isCollapsed ? 'w-16' : 'w-60 xl:w-64'
        }`}
      >
        <SidebarBody />
      </aside>
    </>
  )
}