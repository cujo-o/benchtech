'use client'

import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import { MessageSquare } from 'lucide-react'
import { createBrowserClient } from '@supabase/ssr'
import { playNotificationTone } from '@/lib/notificationSound'

interface UnreadMessagesBadgeProps {
  userId: string
  isSeller?: boolean
}

export function UnreadMessagesBadge({ userId, isSeller }: UnreadMessagesBadgeProps) {
  const [unreadCount, setUnreadCount] = useState<number>(0)
  const previousCountRef = useRef<number>(0)
  const isInitialLoad = useRef<boolean>(true)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const checkUnread = async () => {
    try {
      if (isSeller) {
        // Sellers receive alerts for enquiries marked 'new'
        const { count, error } = await supabase
          .from('enquiries')
          .select('*', { count: 'exact', head: true })
          .eq('seller_id', userId)
          .eq('status', 'new')

        if (!error && count !== null) {
          if (!isInitialLoad.current && count > previousCountRef.current) {
            playNotificationTone()
          }
          previousCountRef.current = count
          setUnreadCount(count)
        }
      } else {
        // Buyers receive alerts when there are active replies on their threads
        const { data: userEnquiries } = await supabase
          .from('enquiries')
          .select('id')
          .eq('buyer_id', userId)

        const enquiryIds = userEnquiries?.map((e) => e.id) || []

        if (enquiryIds.length > 0) {
          const { count, error } = await supabase
            .from('enquiry_replies')
            .select('*', { count: 'exact', head: true })
            .in('enquiry_id', enquiryIds)
            .neq('sender_id', userId)

          if (!error && count !== null) {
            // Compare against active threads
            if (!isInitialLoad.current && count > previousCountRef.current) {
              playNotificationTone()
            }
            previousCountRef.current = count
            setUnreadCount(count > 0 ? 1 : 0)
          }
        }
      }
      isInitialLoad.current = false
    } catch {
      // Quiet fail on network hiccup
    }
  }

  useEffect(() => {
    checkUnread()
    const interval = setInterval(checkUnread, 6000)
    return () => clearInterval(interval)
  }, [userId, isSeller])

  const targetHref = isSeller ? '/seller/enquiries' : '/messages'

  return (
    <Link
      href={targetHref}
      aria-label="Messages"
      title="Messages"
      className="relative p-2 rounded-xl text-slate-600 hover:text-blue-600 hover:bg-slate-50 transition"
    >
      <MessageSquare className="w-4 h-4" />
      {unreadCount > 0 && (
        <span className="absolute top-1 right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[9px] font-bold text-white ring-2 ring-white animate-pulse">
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}
    </Link>
  )
}