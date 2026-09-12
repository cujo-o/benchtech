'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { 
  Home, 
  Grid, 
  Flame, 
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
  ArrowRight
} from 'lucide-react'

export function BuyerSidebar() {
  const pathname = usePathname()
  const [unreadMessages, setUnreadMessages] = useState(0)
  const [savedCount, setSavedCount] = useState(0)
  const supabase = createClient()

  useEffect(() => {
    async function fetchCounts() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Fetch unread messages count
      const { count: msgCount } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('recipient_id', user.id)
        .eq('is_read', false)

      if (msgCount !== null) setUnreadMessages(msgCount)

      // Get saved items count from Zustand storage if available
      try {
        const stored = localStorage.getItem('techmart-compare-storage')
        if (stored) {
          const parsed = JSON.parse(stored)
          setSavedCount(parsed?.state?.items?.length || 0)
        }
      } catch {
        // Fallback
      }
    }

    fetchCounts()
  }, [supabase])

  const NAV_ITEMS = [
    { label: 'Home', href: '/', icon: Home },
    { label: 'Shop by Category', href: '/products', icon: Grid },
    { label: 'Deals & Offers', href: '/products?deals=true', icon: Flame, badge: 'Hot', badgeColor: 'bg-red-500' },
    { label: 'TechSpin', href: '#', icon: Disc },
    { label: 'TechPass', href: '#', icon: Crown },
    { label: 'My Orders', href: '#', icon: Package },
    { label: 'Saved Items', href: '/compare', icon: Heart, badge: savedCount > 0 ? String(savedCount) : undefined, badgeColor: 'bg-blue-600' },
    { label: 'Messages', href: '/messages', icon: MessageSquare, badge: unreadMessages > 0 ? String(unreadMessages) : undefined, badgeColor: 'bg-red-500' },
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
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className={`text-[10px] text-white font-bold px-2 py-0.5 rounded-full ${item.badgeColor}`}>
                  {item.badge}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* TechPass Banner Card */}
      <div className="bg-gradient-to-b from-slate-900 to-slate-950 text-white rounded-2xl p-4 space-y-3 relative overflow-hidden">
        <div className="w-8 h-8 rounded-lg bg-amber-400/20 border border-amber-400/30 flex items-center justify-center">
          <Crown className="w-4 h-4 text-amber-400" />
        </div>
        <div>
          <h4 className="text-sm font-bold text-white">Upgrade to TechPass</h4>
          <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
            Get exclusive deals, free delivery, unlock direct contacts & more.
          </p>
        </div>
        <button className="w-full bg-white/10 hover:bg-white/20 text-white text-xs font-semibold py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition">
          View Plans <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Need Help Box */}
      <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-2.5">
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