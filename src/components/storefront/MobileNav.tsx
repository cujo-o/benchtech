'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Grid, Heart, MessageSquare, Store, ShieldAlert } from 'lucide-react'

export function MobileNav({ profile }: { profile: any }) {
  const pathname = usePathname()
  const isAdmin = profile?.role === 'admin'
  const isSeller = profile?.role === 'seller' || isAdmin

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-200 px-4 py-2 flex items-center justify-around shadow-lg">
      <Link
        href="/feed"
        className={`flex flex-col items-center gap-1 text-[10px] font-bold ${
          pathname === '/feed' ? 'text-blue-600' : 'text-slate-500'
        }`}
      >
        <Home className="w-5 h-5" />
        <span>Feed</span>
      </Link>

      <Link
        href="/products"
        className={`flex flex-col items-center gap-1 text-[10px] font-bold ${
          pathname === '/products' ? 'text-blue-600' : 'text-slate-500'
        }`}
      >
        <Grid className="w-5 h-5" />
        <span>Browse</span>
      </Link>

      <Link
        href="/compare"
        className={`flex flex-col items-center gap-1 text-[10px] font-bold ${
          pathname === '/compare' ? 'text-blue-600' : 'text-slate-500'
        }`}
      >
        <Heart className="w-5 h-5" />
        <span>Saved</span>
      </Link>

      {/* Seller Hub / Switch Button */}
      <Link
        href="/seller/dashboard"
        className={`flex flex-col items-center gap-1 text-[10px] font-bold ${
          pathname.startsWith('/seller') ? 'text-blue-600' : 'text-slate-500'
        }`}
      >
        <Store className="w-5 h-5" />
        <span>Seller Hub</span>
      </Link>

      {/* Admin Button (if admin) */}
      {isAdmin && (
        <Link
          href="/admin/overview"
          className="flex flex-col items-center gap-1 text-[10px] font-bold text-slate-900"
        >
          <ShieldAlert className="w-5 h-5 text-red-500" />
          <span>Admin</span>
        </Link>
      )}
    </div>
  )
}