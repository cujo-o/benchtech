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
  Heart,
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

  // 2. Fetch unread messages count
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

  const NAV_ITEMS = [
    { label: 'Home', href: '/feed', icon: Home },
    { label: 'Shop by Category', href: '/products', icon: Grid },
    {
      label: 'Deals & Offers',
      href: '/deals',
      icon: Flame,
      badge: 'Hot',
      badgeColor: 'bg-red-500 text-white',
    },
    {
      label: 'TechSpin',
      href: '/techspin',
      icon: Disc,
      badge: 'Daily',
      badgeColor: 'bg-amber-500 text-slate-950 font-black',
    },
    {
      label: 'Find My Tech',
      href: '/assistant',
      icon: Sparkles,
      badge: 'AI',
      badgeColor: 'bg-blue-600 text-white',
    },
    { label: 'Compare Tech', href: '/compare', icon: Scale },
    { label: 'TechPass', href: '/subscription', icon: Crown },
    { label: 'My Orders', href: '/orders', icon: Package },
    {
      label: 'Saved Items',
      href: '/saved',
      icon: Heart,
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
    { label: 'Recently Viewed', href: '#', icon: Clock },
    { label: 'Price Alerts', href: '#', icon: Bell },
    { label: 'My Wallet', href: '#', icon: Wallet },
    { label: 'Referrals', href: '#', icon: Users },
    { label: 'Help & Support', href: '#', icon: HelpCircle },
  ]

  return (
    <aside className="w-64 shrink-0 hidden xl:flex flex-col gap-6 p-4 bg-white border-r border-slate-200 min-h-[calc(100vh-4rem)]">
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
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`}
                />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm ${item.badgeColor}`}
                >
                  {item.badge}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* TechPass Banner */}
      <div className="bg-gradient-to-b from-slate-900 to-slate-950 text-white rounded-2xl p-4 space-y-3 relative overflow-hidden">
        <div className="w-8 h-8 rounded-lg bg-amber-400/20 border border-amber-400/30 flex items-center justify-center">
          <Crown className="w-4 h-4 text-amber-400" />
        </div>
        <div>
          <h4 className="text-sm font-bold text-white">Upgrade to TechPass</h4>
          <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
            Get exclusive deals, free delivery, unlock direct contacts &amp; more.
          </p>
        </div>
        <Link href="/subscription">
          <button className="w-full bg-white/10 hover:bg-white/20 text-white text-xs font-semibold py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition">
            View Plans <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </Link>
      </div>

      {/* Need Help Box */}
      <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-2.5 mt-auto">
        <p className="text-xs font-bold text-slate-800">Need Help?</p>
        <div className="space-y-1.5 text-xs text-slate-500">
          <Link href="#" className="flex items-center gap-2 hover:text-blue-600 transition">
            <MessageCircle className="w-3.5 h-3.5" /> Chat with us
          </Link>
          <Link href="#" className="flex items-center gap-2 hover:text-blue-600 transition">
            <PhoneCall className="w-3.5 h-3.5" /> Call support
          </Link>
          <Link href="#" className="flex items-center gap-2 hover:text-blue-600 transition">
            <HelpCircle className="w-3.5 h-3.5" /> Help Centre
          </Link>
          <Link href="#" className="flex items-center gap-2 hover:text-red-500 transition">
            <AlertTriangle className="w-3.5 h-3.5" /> Report a problem
          </Link>
        </div>
      </div>
    </aside>
  )
}