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
  ExternalLink,
  LogOut,
  ShieldCheck,
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
        // Silently handle transient errors
      }
    }

    checkUnread()
    const interval = setInterval(checkUnread, 5000)
    return () => clearInterval(interval)
  }, [profile?.id, supabase])

  const NAV_ITEMS = [
    { label: 'Dashboard', href: '/seller', icon: LayoutDashboard },
    { label: 'My Store', href: '/seller/store', icon: Store },
    { label: 'Product Listings', href: '/seller/listings', icon: Boxes },
    { label: 'Bulk Upload', href: '/seller/bulk-upload', icon: Upload, pro: true },
    { label: 'Orders', href: '/seller/orders', icon: ClipboardList },
    { label: 'Messages', href: '/seller/enquiries', icon: MessageSquare },
    { label: 'Inventory', href: '/seller/inventory', icon: Boxes, pro: true },
    { label: 'Analytics', href: '/seller/analytics', icon: BarChart3, pro: true },
    { label: 'Promotions', href: '/seller/promotions', icon: Sparkles, pro: true },
    { label: 'Earnings', href: '/seller/reports', icon: FileText },
    { label: 'Reports', href: '/seller/reports', icon: FileText, pro: true },
    { label: 'Customers', href: '/seller/customers', icon: Users, pro: true },
    { label: 'Reviews', href: '/seller/reviews', icon: Star },
    { label: 'Store Settings', href: '/seller/settings', icon: Settings },
    { label: 'Subscription', href: '/seller/subscription', icon: CreditCard },
    { label: 'Help & Support', href: '/seller/support', icon: HelpCircle },
  ]

  const SidebarBody = ({ onLinkClick }: { onLinkClick?: () => void }) => (
    <div
      className={`flex flex-col h-full justify-between transition-colors duration-200 ${
        isPro ? 'bg-[#0c1322] text-slate-200' : 'bg-white text-slate-800'
      }`}
    >
      <div className="flex flex-col overflow-y-auto flex-1">
        {/* Brand Header */}
        <div className={`p-4 border-b flex items-center justify-between ${isPro ? 'border-slate-800' : 'border-slate-100'}`}>
          <Link href="/seller" onClick={onLinkClick} className="flex flex-col">
            <span className={`font-black text-base tracking-tight ${isPro ? 'text-white' : 'text-slate-900'}`}>
              ShopBenchTech[cite: 14]
            </span>
            <span className="text-[9px] text-slate-400 font-medium">Buy. Sell. Build Tech Together.[cite: 14]</span>
          </Link>

          {isPro && (
            <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-md bg-[#4f46e5] text-white">
              PRO[cite: 14]
            </span>
          )}
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-3 space-y-0.5 py-3">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href || (item.href === '/seller' && pathname === '/seller/dashboard')

            return (
              <Link
                key={item.label}
                href={item.href}
                onClick={onLinkClick}
                className={`flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-xl transition ${
                  isActive
                    ? isPro
                      ? 'bg-blue-600 text-white font-bold'
                      : 'bg-blue-600 text-white font-bold shadow-xs'
                    : isPro
                    ? 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : isPro ? 'text-slate-400' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>

                <div className="flex items-center gap-1.5">
                  {item.pro && (
                    <span
                      className={`text-[8px] font-black uppercase tracking-wider px-1.5 py-0.2 rounded-md ${
                        isPro ? 'bg-purple-900/60 text-purple-300 border border-purple-700/50' : 'bg-purple-100 text-purple-700'
                      }`}
                    >
                      Pro[cite: 14]
                    </span>
                  )}

                  {item.label === 'Messages' && unreadCount > 0 && (
                    <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[9px] font-bold text-white">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </div>
              </Link>
            )
          })}
        </nav>
      </div>

      {/* Footer Banner */}
      <div className={`p-3 border-t space-y-2 shrink-0 ${isPro ? 'border-slate-800' : 'border-slate-100'}`}>
        {isPro ? (
          <div className="bg-[#1e1b4b]/80 border border-indigo-900/80 rounded-2xl p-3 space-y-2 text-white">
            <div className="flex items-center gap-1.5 text-xs font-black text-amber-300">
              <Crown className="w-3.5 h-3.5 fill-amber-300 text-amber-300" /> Pro Seller[cite: 14]
            </div>
            <p className="text-[10px] text-indigo-200">You&apos;re on the Pro Plan[cite: 14]</p>
            <Link href="/seller/subscription" onClick={onLinkClick} className="block pt-0.5">
              <Button size="sm" className="w-full bg-[#4f46e5] hover:bg-[#4338ca] text-white font-bold text-[10px] h-7 rounded-xl shadow-xs">
                Manage Subscription[cite: 14]
              </Button>
            </Link>
          </div>
        ) : (
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-3 space-y-1.5">
            <div className="flex items-center gap-1 text-xs font-black text-blue-900">
              <Crown className="w-3.5 h-3.5 text-blue-600" /> Upgrade to Pro[cite: 14]
            </div>
            <p className="text-[10px] text-blue-800 leading-snug">
              Get more listings, lower commission and advanced tools.[cite: 14]
            </p>
            <Link href="/seller/subscription" onClick={onLinkClick} className="block pt-0.5">
              <Button size="sm" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black text-[10px] h-7 rounded-xl shadow-xs">
                Upgrade Now[cite: 14]
              </Button>
            </Link>
          </div>
        )}

        {isAdmin && (
          <Link
            href="/admin"
            onClick={onLinkClick}
            className={`flex items-center justify-between px-3 py-1.5 text-xs font-bold rounded-xl transition ${
              isPro ? 'bg-purple-950/60 text-purple-300 border border-purple-800/50' : 'bg-purple-50 text-purple-700 border border-purple-200'
            }`}
          >
            <span className="flex items-center gap-2">
              <ShieldAlert className="w-3.5 h-3.5 text-purple-400" /> Admin Console
            </span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        )}

        <form action={signOut}>
          <Button
            variant="ghost"
            size="sm"
            type="submit"
            className="w-full justify-start text-red-500 hover:text-red-400 hover:bg-red-500/10 gap-2 px-3 text-xs h-8 rounded-xl font-bold"
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
          <span className="font-black text-sm tracking-tight">ShopBenchTech[cite: 14]</span>
        </div>

        {isPro && (
          <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-[#4f46e5] text-white">
            PRO[cite: 14]
          </span>
        )}
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