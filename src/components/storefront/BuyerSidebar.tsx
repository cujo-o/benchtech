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
} from 'lucide-react'

export function BuyerSidebar() {
  const pathname = usePathname()
  const [unreadMessages, setUnreadMessages] = useState<number>(0)
  const [savedCount, setSavedCount] = useState<number>(0)
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
    {
      label: 'Request a Gadget',
      href: '/requests/new',
      icon: Sparkles,
      badge: 'New',
      badgeColor: 'bg-blue-600 text-white font-black',
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
      icon: Sparkles,
      badge: 'AI',
      badgeColor: 'bg-indigo-600 text-white',
    },
    {
      label: 'TechSpin',
      href: '/techspin',
      icon: Disc,
      badge: 'Daily',
      badgeColor: 'bg-amber-400 text-slate-950 font-black',
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
    <aside className="w-64 shrink-0 hidden xl:flex flex-col gap-6 p-4 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 min-h-[calc(100vh-4rem)] transition-colors">
      <nav className="space-y-1">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href

          return (
            <Link
              key={item.label}
              href={item.href}
              className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition ${
                isActive
                  ? 'bg-blue-600 text-white shadow-xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={`w-4 h-4 ${
                    isActive ? 'text-white' : 'text-slate-400 dark:text-slate-500'
                  }`}
                />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span
                  className={`text-[9px] font-bold px-2 py-0.5 rounded-full shadow-2xs ${item.badgeColor}`}
                >
                  {item.badge}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* TechPass Upgrade Banner */}
      <div className="bg-gradient-to-b from-slate-900 to-slate-950 text-white rounded-2xl p-4 space-y-3 relative overflow-hidden shadow-xs border border-slate-800">
        <div className="w-8 h-8 rounded-lg bg-amber-400/20 border border-amber-400/30 flex items-center justify-center">
          <Crown className="w-4 h-4 text-amber-400" />
        </div>
        <div>
          <h4 className="text-sm font-bold text-white">Upgrade to TechPass</h4>
          <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
            Get exclusive deals, free delivery, unlock direct contacts &amp; more.
          </p>
        </div>
        <Link href="/subscription" className="block">
          <button className="w-full bg-white/10 hover:bg-white/20 text-white text-xs font-bold py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition">
            View Plans <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </Link>
      </div>

      {/* Support & Help Card */}
      <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 border border-slate-100 dark:border-slate-800 space-y-2.5 mt-auto transition-colors">
        <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Need Help?</p>
        <div className="space-y-1.5 text-xs text-slate-500 dark:text-slate-400">
          <Link
            href="/messages"
            className="flex items-center gap-2 hover:text-blue-600 dark:hover:text-blue-400 transition"
          >
            <MessageCircle className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
            <span>Chat with us</span>
          </Link>
          <a
            href="tel:+2348000000000"
            className="flex items-center gap-2 hover:text-blue-600 dark:hover:text-blue-400 transition"
          >
            <PhoneCall className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
            <span>Call support</span>
          </a>
          <Link
            href="/help"
            className="flex items-center gap-2 hover:text-blue-600 dark:hover:text-blue-400 transition"
          >
            <HelpCircle className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
            <span>Help Centre</span>
          </Link>
          <Link
            href="/help#report"
            className="flex items-center gap-2 hover:text-red-500 dark:hover:text-red-400 transition"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
            <span>Report a problem</span>
          </Link>
        </div>
      </div>
    </aside>
  )
}