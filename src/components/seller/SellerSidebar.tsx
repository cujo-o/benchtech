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
  X
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
    if (mobileOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [mobileOpen])

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
    { label: 'My Storefront', href: '/seller/store', icon: Store },
    { label: 'Product Listings', href: '/seller/listings', icon: Boxes },
    { label: 'Add New Listing', href: '/seller/listings/new', icon: PackagePlus },
    { label: 'Bulk Upload', href: '/seller/bulk-upload', icon: Upload, pro: true },
    { label: 'Orders & Requests', href: '/seller/orders', icon: ClipboardList },
    { label: 'Buyer Enquiries', href: '/seller/enquiries', icon: MessageSquare },
    { label: 'Inventory Manager', href: '/seller/inventory', icon: Boxes, pro: true },
    { label: 'Analytics & Insights', href: '/seller/analytics', icon: BarChart3, pro: true },
    { label: 'Promotions', href: '/seller/promotions', icon: Sparkles, pro: true },
    { label: 'Sales Reports', href: '/seller/reports', icon: FileText, pro: true },
    { label: 'Store Verification', href: '/seller/verify', icon: ShieldCheck },
    { label: 'Subscription & Plan', href: '/seller/subscription', icon: CreditCard },
    { label: 'Store Settings', href: '/seller/settings', icon: Settings },
    { label: 'Help & Support', href: '/seller/support', icon: HelpCircle },
  ]

  const SidebarBody = ({ onLinkClick }: { onLinkClick?: () => void }) => (
    <div className="flex flex-col h-full justify-between bg-white text-slate-800">
      <div className="flex flex-col overflow-y-auto flex-1">
        {/* Brand Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <Link href="/seller" onClick={onLinkClick} className="flex items-center gap-2">
            <span className="bg-blue-600 text-white w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black shadow-xs">
              B
            </span>
            <div className="leading-tight">
              <span className="font-black text-base text-slate-900 tracking-tight block">BenchTech</span>
              <span className="text-[9px] text-slate-400 font-semibold tracking-wider block">Seller Hub</span>
            </div>
          </Link>

          {isPro && (
            <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full tracking-wider bg-[#f3e8ff] text-[#9333ea]">
              PRO
            </span>
          )}
        </div>

        {/* Active Store Card */}
        <div className="p-3.5 mx-3 my-2.5 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">ACTIVE STORE</p>
            <p className="text-xs font-black text-slate-900 truncate mt-0.5">
              {profile?.business_name || profile?.full_name || 'My Tech Hub'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-slate-200/50">
            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
              <ShieldCheck className="w-3 h-3" />
              {profile?.tech_trust_status === 'verified'
                ? 'Verified'
                : profile?.tech_trust_status === 'pending'
                ? 'In Review'
                : 'Unverified'}
            </span>

            {isPro && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-50 text-[#9333ea] border border-purple-200">
                <Crown className="w-3 h-3" /> Pro Badge
              </span>
            )}
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-3 space-y-0.5 py-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            const isEnquiries = item.href === '/seller/enquiries'

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onLinkClick}
                className={`flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-xl transition ${
                  isActive
                    ? 'bg-blue-600 text-white font-bold shadow-xs'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>

                <div className="flex items-center gap-1.5">
                  {item.pro && !isPro && (
                    <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-purple-100 text-purple-700">
                      Pro
                    </span>
                  )}

                  {isEnquiries && unreadCount > 0 && (
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

      {/* Footer / Status / Actions */}
      <div className="p-3 border-t border-slate-100 space-y-2 shrink-0">
        {isPro ? (
          <div className="bg-[#0f172a] text-white rounded-2xl p-3 space-y-1 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-400 flex items-center gap-1">
                <Crown className="w-3.5 h-3.5 fill-amber-400 text-amber-400" /> Pro Member
              </span>
              <span className="text-[9px] text-slate-400 font-medium">5% comm.</span>
            </div>
            <p className="text-[10px] text-slate-400">25 credits &amp; pro business tools active.</p>
          </div>
        ) : (
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-3 space-y-1.5">
            <div className="flex items-center gap-1 text-xs font-black text-blue-900">
              <Crown className="w-3.5 h-3.5 text-blue-600" /> Upgrade to Pro
            </div>
            <p className="text-[10px] text-blue-800 leading-snug">
              25 listings, 5% commission, bulk tools &amp; ₦2,500 ads.
            </p>
            <Link href="/seller/subscription" onClick={onLinkClick} className="block pt-0.5">
              <Button size="sm" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black text-[10px] h-7 rounded-lg">
                Upgrade ₦5k/mo
              </Button>
            </Link>
          </div>
        )}

        {/* Admin Console Link (Styled purple as shown in screenshot) */}
        {isAdmin && (
          <Link
            href="/admin"
            onClick={onLinkClick}
            className="flex items-center justify-between px-3 py-2 text-xs font-bold text-[#9333ea] bg-[#faf5ff] hover:bg-[#f3e8ff] transition rounded-2xl border border-purple-200"
          >
            <span className="flex items-center gap-2">
              <ShieldAlert className="w-3.5 h-3.5 text-[#9333ea]" /> Admin Console
            </span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        )}

        <Link
          href="/feed"
          onClick={onLinkClick}
          className="flex items-center justify-between px-3 py-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition rounded-xl hover:bg-slate-50"
        >
          <span className="flex items-center gap-2">
            <ExternalLink className="w-3.5 h-3.5" /> Buyer View
          </span>
        </Link>

        <form action={signOut}>
          <Button
            variant="ghost"
            size="sm"
            type="submit"
            className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 gap-2 px-3 text-xs h-8 rounded-xl font-bold"
          >
            <LogOut className="w-3.5 h-3.5" /> Log Out
          </Button>
        </form>
      </div>
    </div>
  )

  return (
    <>
      {/* Mobile Top Header Bar */}
      <div className="lg:hidden sticky top-0 z-40 bg-white border-b border-slate-200 px-3.5 h-14 flex items-center justify-between w-full shadow-2xs">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="p-1.5 text-slate-700 hover:bg-slate-100 rounded-xl focus:outline-none"
            aria-label="Open seller menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <Link href="/seller" className="flex items-center gap-2">
            <span className="bg-blue-600 text-white w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black shadow-2xs">
              B
            </span>
            <span className="font-black text-sm text-slate-900 tracking-tight">
              Seller Hub
            </span>
          </Link>
        </div>

        <div className="flex items-center gap-2">
          {isPro && (
            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-[#f3e8ff] text-[#9333ea]">
              PRO
            </span>
          )}

          <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center border border-blue-200">
            {(profile?.business_name || profile?.full_name || 'S')?.[0]?.toUpperCase()}
          </div>
        </div>
      </div>

      {/* Mobile Slide-Out Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative w-72 max-w-[82vw] h-full bg-white z-10 shadow-2xl flex flex-col">
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

      {/* Desktop Persistent Sidebar */}
      <aside className="hidden lg:flex w-64 bg-white border-r border-slate-200/80 flex-col shrink-0 sticky top-0 h-screen overflow-hidden">
        <SidebarBody />
      </aside>
    </>
  )
}