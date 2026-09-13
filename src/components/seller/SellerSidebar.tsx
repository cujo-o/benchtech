'use client'

import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  LayoutDashboard, 
  Boxes, 
  PackagePlus, 
  MessageSquare, 
  BarChart3, 
  Settings, 
  HelpCircle, 
  ExternalLink, 
  LogOut,
  ShieldCheck
} from 'lucide-react'
import { signOut } from '@/app/(auth)/actions'
import { Button } from '@/components/ui/button'
import { createBrowserClient } from '@supabase/ssr'
import { playNotificationTone } from '@/lib/notificationSound'

const NAV_ITEMS = [
  { label: 'Overview', href: '/seller/dashboard', icon: LayoutDashboard },
  { label: 'Inventory & Listings', href: '/seller/listings', icon: Boxes },
  { label: 'Add New Listing', href: '/seller/listings/new', icon: PackagePlus },
  { label: 'Buyer Enquiries', href: '/seller/enquiries', icon: MessageSquare },
  { label: 'Store Verification', href: '/seller/verify', icon: ShieldCheck },
  { label: 'Analytics', href: '/seller/analytics', icon: BarChart3 },
  { label: 'Store Settings', href: '/seller/settings', icon: Settings },
  { label: 'Help & Support', href: '/seller/support', icon: HelpCircle },
]

export function SellerSidebar({ profile }: { profile: any }) {
  const pathname = usePathname()
  const [unreadCount, setUnreadCount] = useState<number>(0)
  const previousCountRef = useRef<number>(0)
  const isInitialLoad = useRef<boolean>(true)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

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
        // Silently handle temporary network hiccups
      }
    }

    checkUnread()
    const interval = setInterval(checkUnread, 5000)
    return () => clearInterval(interval)
  }, [profile?.id, supabase])

  return (
    <aside className="w-full lg:w-64 bg-white border-r border-slate-200/80 flex flex-col shrink-0 min-h-[calc(100vh-4rem)]">
      {/* Brand Header */}
      <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between">
        <Link href="/seller/dashboard" className="flex items-center gap-2 font-black text-xl text-blue-600">
          <span className="bg-blue-600 text-white w-7 h-7 rounded-lg flex items-center justify-center text-sm shadow-sm">
            T
          </span>
          TechMart <span className="text-[10px] font-bold tracking-wider px-2 py-0.5 bg-blue-50 text-blue-700 rounded-md">SELLER</span>
        </Link>
      </div>

      {/* Store Summary Badge */}
      <div className="p-4 mx-4 my-3 bg-slate-50 rounded-2xl border border-slate-100">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active Store</p>
        <p className="text-xs font-bold text-slate-800 truncate mt-0.5">
          {profile?.business_name || profile?.full_name || 'My Tech Hub'}
        </p>
        <div className="flex items-center gap-1.5 mt-2">
          <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
            profile?.tech_trust_status === 'verified'
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              : profile?.tech_trust_status === 'pending'
              ? 'bg-blue-50 text-blue-700 border border-blue-200'
              : 'bg-amber-50 text-amber-700 border border-amber-200'
          }`}>
            <ShieldCheck className="w-3 h-3" />
            {profile?.tech_trust_status === 'verified' 
              ? 'TechTrust Verified' 
              : profile?.tech_trust_status === 'pending' 
              ? 'Verification In Review' 
              : 'Unverified Seller'}
          </span>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-4 space-y-1">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href
          const isEnquiries = item.href === '/seller/enquiries'

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-xl transition ${
                isActive
                  ? 'bg-blue-50 text-blue-600 font-bold shadow-sm'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </div>

              {/* Integrated Unread Badge on Buyer Enquiries Tab */}
              {isEnquiries && unreadCount > 0 && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1.5 text-[10px] font-bold text-white shadow-sm">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Bottom Actions */}
      <div className="p-4 border-t border-slate-100 space-y-2 mt-auto">
        <Link
          href="/feed"
          className="flex items-center justify-between px-3 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 transition rounded-xl hover:bg-slate-50"
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
            className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 gap-2 px-3 text-xs h-9 rounded-xl font-bold"
          >
            <LogOut className="w-3.5 h-3.5" /> Log Out
          </Button>
        </form>
      </div>
    </aside>
  )
}