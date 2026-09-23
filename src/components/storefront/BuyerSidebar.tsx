'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState, useRef, useCallback } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { playNotificationTone } from '@/lib/notificationSound'
import {
  Home,
  Grid,
  Flame,
  Scale,
  Disc,
  Crown,
  Package,
  Bookmark,
  MessageSquare,
  Clock,
  Bell,
  Wallet,
  Users,
  HelpCircle,
  MessageCircle,
  PhoneCall,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  Store,
  ChevronLeft,
  ChevronRight,
  Bot,
} from 'lucide-react'

export function BuyerSidebar() {
  const pathname = usePathname()
  const [unreadMessages, setUnreadMessages] = useState<number>(0)
  const [savedCount, setSavedCount] = useState<number>(0)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const previousUnreadRef = useRef<number>(0)
  const isInitialLoad = useRef<boolean>(true)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  // 1. Sync Saved Items Count from localStorage
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

  // 2. Poll for unread buyer messages / vendor replies
  const checkUnreadMessages = useCallback(async () => {
    try {
      if (pathname === '/messages') {
        setUnreadMessages(0)
        previousUnreadRef.current = 0
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
      // Ignore transient network errors
    }
  }, [pathname, supabase])

  useEffect(() => {
    updateSavedCount()
    checkUnreadMessages()

    const handleCustomSync = () => {
      updateSavedCount()
    }

    window.addEventListener('storage', handleCustomSync)
    window.addEventListener('savedItemsUpdated', handleCustomSync)

    const interval = setInterval(checkUnreadMessages, 5000)

    return () => {
      window.removeEventListener('storage', handleCustomSync)
      window.removeEventListener('savedItemsUpdated', handleCustomSync)
      clearInterval(interval)
    }
  }, [checkUnreadMessages, updateSavedCount])

  // Discovery & Buyer Account Navigation Items
  const NAV_ITEMS = [
    { label: 'Home', href: '/feed', icon: Home },
    { label: 'Shop by Category', href: '/products', icon: Grid },
    { label: 'Verified Sellers', href: '/sellers', icon: Store },
    {
      label: 'Request a Gadget',
      href: '/requests/new',
      icon: Sparkles,
    },
    {
      label: 'Deals & Offers',
      href: '/deals',
      icon: Flame,
      badge: 'Hot',
      badgeColor: 'bg-red-500 text-white',
    },
    { label: 'Compare Tech', href: '/compare', icon: Scale },
    {
      label: 'Find My Tech',
      href: '/assistant',
      icon: Bot,
      badge: 'AI',
      badgeColor: 'bg-indigo-600 text-white',
    },
    {
      label: 'TechSpin',
      href: '/techspin',
      icon: Disc,
    },
    { label: 'TechPass', href: '/subscription', icon: Crown },
    { label: 'My Orders', href: '/orders', icon: Package },
    {
      label: 'Saved Items',
      href: '/saved',
      icon: Bookmark,
      badge: savedCount > 0 ? String(savedCount) : undefined,
      badgeColor:
        pathname === '/saved'
          ? 'bg-white text-blue-600 font-black'
          : 'bg-blue-600 text-white',
    },
    {
      label: 'Messages',
      href: '/messages',
      icon: MessageSquare,
      badge:
        unreadMessages > 0
          ? unreadMessages > 9
            ? '9+'
            : String(unreadMessages)
          : undefined,
      badgeColor:
        pathname === '/messages'
          ? 'bg-white text-red-600 font-black'
          : 'bg-red-500 text-white',
    },
    { label: 'Recently Viewed', href: '/recently-viewed', icon: Clock },
    { label: 'Price Alerts', href: '/price-alerts', icon: Bell },
    { label: 'My Wallet', href: '/wallet', icon: Wallet },
    { label: 'Referrals', href: '/referrals', icon: Users },
    { label: 'Help & Support', href: '/help', icon: HelpCircle },
  ]

  return (
    <aside
      className={`shrink-0 hidden md:flex flex-col justify-between bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 min-h-[calc(100vh-4rem)] transition-all duration-200 sticky top-16 h-[calc(100vh-4rem)] ${
        isCollapsed ? 'w-16 p-2' : 'w-60 xl:w-64 p-3.5'
      }`}
    >
      {/* 1. Header with Collapse / Expand Trigger */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800/80 mb-2">
        {!isCollapsed && (
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 px-2">
            Navigation
          </span>
        )}
        <button
          type="button"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={`p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition ${
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

      {/* 2. Scrollable Navigation List */}
      <nav className="flex-1 overflow-y-auto space-y-1 pr-0.5 scrollbar-none">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href

          return (
            <Link
              key={item.label}
              href={item.href}
              title={isCollapsed ? item.label : undefined}
              className={`flex items-center rounded-xl text-xs font-semibold transition relative group ${
                isCollapsed
                  ? 'justify-center p-2.5'
                  : 'justify-between px-3 py-2'
              } ${
                isActive
                  ? 'bg-blue-600 text-white shadow-xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/70 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Icon
                  className={`w-4 h-4 shrink-0 ${
                    isActive ? 'text-white' : 'text-slate-400 dark:text-slate-500'
                  }`}
                />
                {!isCollapsed && (
                  <span className="truncate">{item.label}</span>
                )}
              </div>

              {/* Badges in Full Mode */}
              {!isCollapsed && item.badge && (
                <span
                  className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full shadow-2xs shrink-0 ${item.badgeColor}`}
                >
                  {item.badge}
                </span>
              )}

              {/* Indicator Dot in Collapsed Mode */}
              {isCollapsed && item.badge && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-blue-600 dark:bg-blue-400" />
              )}
            </Link>
          )
        })}
      </nav>

      {/* 3. Footer Banners (Hidden in Mini-Sidebar Mode) */}
      {!isCollapsed && (
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2 shrink-0">
          {/* TechPass Card */}
          <div className="bg-gradient-to-b from-slate-900 to-slate-950 text-white rounded-2xl p-3 space-y-2 border border-slate-800 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-amber-300 flex items-center gap-1">
                <Crown className="w-3.5 h-3.5 fill-amber-300" /> TechPass
              </span>
              <span className="text-[9px] text-slate-400 font-medium">Phase 2</span>
            </div>
            <p className="text-[10px] text-slate-300 leading-snug">
              Unlock free delivery &amp; vendor contacts across Abuja.
            </p>
            <Link href="/subscription" className="block pt-0.5">
              <button className="w-full bg-white/10 hover:bg-white/20 text-white text-[10px] font-bold py-1.5 px-2 rounded-lg flex items-center justify-center gap-1 transition">
                View Membership <ArrowRight className="w-3 h-3" />
              </button>
            </Link>
          </div>

          {/* Quick Support Links */}
          <div className="p-2 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
            <Link
              href="/help"
              className="hover:text-blue-600 dark:hover:text-blue-400 font-semibold flex items-center gap-1"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Help Centre</span>
            </Link>
            <a
              href="https://wa.me/2348000000000"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-emerald-600 font-semibold flex items-center gap-1"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>Support</span>
            </a>
          </div>
        </div>
      )}
    </aside>
  )
}