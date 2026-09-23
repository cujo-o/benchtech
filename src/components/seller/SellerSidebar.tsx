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
  ArrowRight,
  Menu,
  X,
  Star,
  Users,
  ExternalLink,
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

  // Core Management Links
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

  // Account & Support
  const ACCOUNT_NAV = [
    { label: 'Subscription & Plan', href: '/seller/subscription', icon: CreditCard },
    { label: 'Store Settings', href: '/seller/settings', icon: Settings },
    { label: 'Help & Support', href: '/seller/support', icon: HelpCircle },
  ]

  const SidebarBody = ({ onLinkClick }: { onLinkClick?: () => void }) => (
    <div
      className={`flex flex-col h-full justify-between transition-colors duration-200 ${
        isPro ? 'bg-[#0c1322] text-slate-200' : 'bg-white text-slate-800'
      }`}
    >
      {/* 1. Header with Direct Buyer Mode Switcher */}
      <div
        className={`p-3.5 border-b flex items-center justify-between shrink-0 ${
          isPro ? 'border-slate-800' : 'border-slate-100'
        }`}
      >
        <Link href="/seller" onClick={onLinkClick} className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <span className={`font-black text-sm tracking-tight ${isPro ? 'text-white' : 'text-slate-900'}`}>
              ShopBenchTech
            </span>
            {isPro && (
              <span className="text-[8px] font-black uppercase px-1.5 py-0.2 rounded bg-[#4f46e5] text-white">
                PRO
              </span>
            )}
          </div>
          <span className="text-[9px] text-slate-400 font-medium">Seller Hub</span>
        </Link>

        {/* Quick Buyer View Link at Top */}
        <Link
          href="/feed"
          onClick={onLinkClick}
          title="Switch to Buyer Marketplace"
          className={`flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-lg transition border ${
            isPro
              ? 'border-slate-800 bg-slate-900/80 text-blue-400 hover:text-white hover:bg-slate-800'
              : 'border-slate-200 bg-slate-50 text-blue-600 hover:bg-blue-50'
          }`}
        >
          <span>Buyer View</span>
          <ExternalLink className="w-3 h-3" />
        </Link>
      </div>

      {/* 2. Scrollable Navigation List (Clean smooth scrollbar) */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-4">
        {/* Core Tools */}
        <div className="space-y-0.5">
          <span className="text-[9px] uppercase font-bold tracking-wider text-slate-500 px-2 block mb-1">
            Store Essentials
          </span>
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
                className={`flex items-center justify-between px-2.5 py-1.5 text-xs font-semibold rounded-xl transition ${
                  isActive
                    ? 'bg-blue-600 text-white font-bold shadow-xs'
                    : isPro
                    ? 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  <span>{item.label}</span>
                </div>

                {item.label === 'Messages' && unreadCount > 0 && (
                  <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[9px] font-bold text-white">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Link>
            )
          })}
        </div>

        {/* Pro Suite */}
        <div className="space-y-0.5">
          <span className="text-[9px] uppercase font-bold tracking-wider text-purple-400 px-2 flex items-center justify-between mb-1">
            <span>Pro Business Tools</span>
            <Crown className="w-2.5 h-2.5 text-amber-400 fill-amber-400" />
          </span>
          {PRO_NAV.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href

            return (
              <Link
                key={item.label}
                href={item.href}
                onClick={onLinkClick}
                className={`flex items-center justify-between px-2.5 py-1.5 text-xs font-semibold rounded-xl transition ${
                  isActive
                    ? 'bg-blue-600 text-white font-bold shadow-xs'
                    : isPro
                    ? 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  <span>{item.label}</span>
                </div>

                <span
                  className={`text-[8px] font-black uppercase tracking-wider px-1 rounded ${
                    isPro
                      ? 'bg-purple-900/60 text-purple-300 border border-purple-700/50'
                      : 'bg-purple-100 text-purple-700'
                  }`}
                >
                  Pro
                </span>
              </Link>
            )
          })}
        </div>

        {/* Account / Support */}
        <div className="space-y-0.5">
          <span className="text-[9px] uppercase font-bold tracking-wider text-slate-500 px-2 block mb-1">
            Settings &amp; Support
          </span>
          {ACCOUNT_NAV.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href

            return (
              <Link
                key={item.label}
                href={item.href}
                onClick={onLinkClick}
                className={`flex items-center gap-2.5 px-2.5 py-1.5 text-xs font-semibold rounded-xl transition ${
                  isActive
                    ? 'bg-blue-600 text-white font-bold shadow-xs'
                    : isPro
                    ? 'text-slate-400 hover:bg-slate-800/70 hover:text-white'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </div>
      </div>

      {/* 3. Compact Footer with Persistent Buyer View & Log Out */}
      <div
        className={`p-3 border-t space-y-2 shrink-0 ${
          isPro ? 'border-slate-800' : 'border-slate-100'
        }`}
      >
        {/* Compact Pro Status Banner */}
        {isPro ? (
          <div className="bg-[#1e1b4b]/70 border border-indigo-900/60 rounded-xl p-2.5 flex items-center justify-between text-white">
            <div>
              <span className="text-[11px] font-black text-amber-300 flex items-center gap-1">
                <Crown className="w-3 h-3 fill-amber-300" /> Pro Active
              </span>
              <p className="text-[9px] text-indigo-200">5% commission active</p>
            </div>
            <Link href="/seller/subscription" onClick={onLinkClick}>
              <span className="text-[10px] font-bold text-blue-400 hover:underline">
                Manage
              </span>
            </Link>
          </div>
        ) : (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-2.5 space-y-1">
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

        {/* Primary Buyer View Link */}
        <Link
          href="/feed"
          onClick={onLinkClick}
          className={`flex items-center justify-between px-2.5 py-1.5 text-xs font-bold rounded-xl transition ${
            isPro
              ? 'text-slate-300 hover:text-white hover:bg-slate-800/80 bg-slate-900/50 border border-slate-800'
              : 'text-slate-700 hover:text-blue-600 hover:bg-blue-50 bg-slate-50 border border-slate-200'
          }`}
        >
          <span className="flex items-center gap-2">
            <ExternalLink className="w-3.5 h-3.5 text-blue-500" />
            Switch to Buyer View
          </span>
          <span className="text-[10px] text-slate-400 font-normal">&rarr;</span>
        </Link>

        {/* Admin Console (If Admin) */}
        {isAdmin && (
          <Link
            href="/admin"
            onClick={onLinkClick}
            className={`flex items-center justify-between px-2.5 py-1.5 text-xs font-bold rounded-xl transition ${
              isPro
                ? 'bg-purple-950/60 text-purple-300 border border-purple-800/50'
                : 'bg-purple-50 text-purple-700 border border-purple-200'
            }`}
          >
            <span className="flex items-center gap-2">
              <ShieldAlert className="w-3.5 h-3.5 text-purple-400" /> Admin Console
            </span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        )}

        {/* Log Out */}
        <form action={signOut}>
          <Button
            variant="ghost"
            size="sm"
            type="submit"
            className="w-full justify-start text-red-500 hover:text-red-400 hover:bg-red-500/10 gap-2 px-2.5 text-xs h-7 rounded-xl font-bold"
          >
            <LogOut className="w-3.5 h-3.5" /> Log Out
          </Button>
        </form>
      </div>
    </div>
  )

  return (
    <>
      {/* Mobile Top Header */}
      <div
        className={`lg:hidden sticky top-0 z-40 px-3.5 h-14 flex items-center justify-between w-full shadow-2xs border-b ${
          isPro ? 'bg-[#0c1322] border-slate-800 text-white' : 'bg-white border-slate-200'
        }`}
      >
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="p-1.5 text-slate-400 hover:text-white rounded-xl focus:outline-none"
            aria-label="Open seller menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <span className="font-black text-sm tracking-tight">ShopBenchTech</span>
        </div>

        <Link
          href="/feed"
          className="text-xs font-bold text-blue-400 hover:underline flex items-center gap-1"
        >
          Buyer View <ExternalLink className="w-3 h-3" />
        </Link>
      </div>

      {/* Mobile Off-Canvas Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative w-72 max-w-[82vw] h-full z-10 shadow-2xl flex flex-col">
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="absolute top-3.5 right-3 p-1 text-slate-400 hover:text-white rounded-lg"
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
            <SidebarBody onLinkClick={() => setMobileOpen(false)} />
          </div>
        </div>
      )}

      {/* Desktop Persistent Sidebar */}
      <aside
        className={`hidden lg:flex w-64 border-r flex-col shrink-0 sticky top-0 h-screen overflow-hidden ${
          isPro ? 'border-slate-800' : 'border-slate-200/80'
        }`}
      >
        <SidebarBody />
      </aside>
    </>
  )
}