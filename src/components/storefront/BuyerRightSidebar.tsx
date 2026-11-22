'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
  ChevronLeft,
  ChevronRight,
  Settings,
  Store,
  ShieldAlert,
  Megaphone,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  User,
} from 'lucide-react'

interface BuyerRightSidebarProps {
  user: {
    id: string
    email?: string | null
    fullName?: string | null
    businessName?: string | null
    role?: string | null
    roles?: string[] | null
    techTrustStatus?: string | null
  } | null
  activeListingsCount?: number
}

export function BuyerRightSidebar({
  user,
  activeListingsCount,
}: BuyerRightSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)

  useEffect(() => {
    try {
      const saved = localStorage.getItem('benchtech_right_sidebar_collapsed')
      if (saved !== null) {
        setIsCollapsed(saved === 'true')
      } else {
        // Default expanded on wide PCs (>= 1440px), compact rail on 13-14 inch laptops
        setIsCollapsed(window.innerWidth < 1440)
      }
    } catch {}
  }, [])

  const toggleCollapse = () => {
    const next = !isCollapsed
    setIsCollapsed(next)
    try {
      localStorage.setItem('benchtech_right_sidebar_collapsed', String(next))
    } catch {}
  }

  if (!user) return null

  const roles = Array.isArray(user.roles)
    ? user.roles
    : user.role
    ? [user.role]
    : []
  const isAdmin = user.role === 'admin' || roles.includes('admin')
  const isSeller =
    Boolean(user.businessName) ||
    user.role === 'seller' ||
    roles.includes('seller') ||
    isAdmin
  const displayName =
    user.businessName || user.fullName || user.email?.split('@')[0] || 'Member'
  const isVerified = user.techTrustStatus === 'verified'

  return (
    <aside
      className={`hidden lg:flex flex-col shrink-0 sticky top-[68px] h-[calc(100vh-68px)] bg-white dark:bg-slate-900 border-l border-slate-200/80 dark:border-slate-800 transition-all duration-200 select-none ${
        isCollapsed ? 'w-[68px]' : 'w-[280px] xl:w-[304px]'
      }`}
    >
      {/* Top Collapse Toggle Bar */}
      <div className="px-3.5 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
        <button
          type="button"
          onClick={toggleCollapse}
          title={isCollapsed ? 'Expand Quick Panel' : 'Collapse Quick Panel'}
          className={`p-1.5 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer ${
            isCollapsed ? 'mx-auto' : ''
          }`}
        >
          {isCollapsed ? (
            <ChevronLeft className="w-4 h-4" />
          ) : (
            <ChevronRight className="w-4 h-4" />
          )}
        </button>

        {!isCollapsed && (
          <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">
            Quick Panel
          </span>
        )}
      </div>

      {/* Collapsed Vertical Icon Rail */}
      {isCollapsed ? (
        <div className="flex-1 flex flex-col items-center py-4 gap-3">
          <button
            type="button"
            onClick={toggleCollapse}
            title={`Signed in as ${displayName} — Click to expand`}
            className="w-10 h-10 rounded-xl bg-blue-600 text-white font-black text-sm flex items-center justify-center shadow-xs hover:bg-blue-700 transition cursor-pointer"
          >
            {displayName[0]?.toUpperCase() || <User className="w-4 h-4" />}
          </button>

          <Link
            href={isSeller ? '/seller/dashboard' : '/seller/onboarding'}
            title={isSeller ? 'Open Seller Hub' : 'Become a Seller'}
            className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 flex items-center justify-center transition"
          >
            <Store className="w-4 h-4" />
          </Link>

          <Link
            href="/settings"
            title="Settings & Theme"
            className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-blue-600 flex items-center justify-center transition"
          >
            <Settings className="w-4 h-4" />
          </Link>

          {isAdmin && (
            <Link
              href="/admin"
              title="Admin Console"
              className="w-10 h-10 rounded-xl bg-slate-900 dark:bg-slate-800 text-red-400 border border-slate-700 hover:bg-black flex items-center justify-center transition"
            >
              <ShieldAlert className="w-4 h-4" />
            </Link>
          )}

          <div className="w-8 h-px bg-slate-200 dark:bg-slate-800 my-1" />

          <Link
            href="/requests/new"
            title="Request a Device"
            className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 flex items-center justify-center transition"
          >
            <Megaphone className="w-4 h-4" />
          </Link>

          <Link
            href="/help"
            title="Buyer Protection & Support"
            className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 flex items-center justify-center transition"
          >
            <ShieldCheck className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        /* Expanded Right Sidebar Content */
        <div className="flex-1 overflow-y-auto p-4 space-y-4 [scrollbar-width:thin]">
          {/* 1. Account & Workspace Card */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 space-y-3.5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-blue-600 text-white font-black text-sm flex items-center justify-center shrink-0">
                  {displayName[0]?.toUpperCase() || 'U'}
                </div>
                <div className="min-w-0">
                  <span className="text-[11px] font-semibold text-slate-400 block leading-none">
                    Signed In
                  </span>
                  <span className="text-sm font-black text-slate-900 dark:text-white truncate block mt-0.5">
                    {displayName}
                  </span>
                </div>
              </div>

              <Link
                href="/settings"
                title="Account Settings"
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white transition"
              >
                <Settings className="w-4 h-4" />
              </Link>
            </div>

            <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-200/70 dark:border-slate-700/70">
              <span className="font-semibold text-slate-500 dark:text-slate-400">
                Store Status
              </span>
              <span
                className={`font-black ${
                  isVerified
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-amber-600 dark:text-amber-400'
                }`}
              >
                {isVerified ? 'Verified' : isSeller ? 'Pending' : 'Buyer Account'}
              </span>
            </div>

            <div className="space-y-2 pt-1">
              <Link
                href={isSeller ? '/seller/dashboard' : '/seller/onboarding'}
                className="block"
              >
                <Button className="w-full h-9.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-[13px] rounded-xl cursor-pointer">
                  {isSeller ? 'Open Seller Hub' : 'Become a Seller'}
                </Button>
              </Link>

              <Link href="/settings" className="block">
                <Button
                  variant="outline"
                  className="w-full h-9.5 text-[13px] font-bold rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 gap-1.5 cursor-pointer"
                >
                  <Settings className="w-3.5 h-3.5" />
                  <span>Settings &amp; Theme</span>
                </Button>
              </Link>

              {isAdmin && (
                <Link href="/admin" className="block">
                  <Button
                    variant="outline"
                    className="w-full h-9.5 text-[13px] font-bold rounded-xl border-slate-700 bg-slate-900 hover:bg-black text-white gap-1.5 cursor-pointer"
                  >
                    <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
                    <span>Admin Console</span>
                  </Button>
                </Link>
              )}
            </div>
          </div>

          {/* 2. Request a Device Card */}
          <div className="p-4 rounded-2xl bg-slate-900 dark:bg-slate-800/70 border border-slate-800 dark:border-slate-700 text-white space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center shrink-0">
                <Megaphone className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-black text-white">Request a Device</h3>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Looking for specific specs? Post your target device and budget for verified Abuja stores.
            </p>

            <Link href="/requests/new" className="block">
              <Button className="w-full h-9.5 bg-white hover:bg-slate-100 text-slate-900 font-black text-[13px] rounded-xl gap-1.5 cursor-pointer">
                <span>Post Request</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </div>

          {/* 3. Buyer Protection Card */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 space-y-3">
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <h3 className="text-xs font-black uppercase tracking-wider">
                Buyer Protection
              </h3>
            </div>

            <ul className="space-y-2.5 text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                <span>Inspect physical condition and specs upon delivery.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                <span>7-day inspection window on every verified order.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                <span>Identity and bank-verified Abuja merchants.</span>
              </li>
            </ul>

            {typeof activeListingsCount === 'number' && (
              <div className="pt-2.5 border-t border-slate-200/70 dark:border-slate-700/70 flex items-center justify-between text-[11px] text-slate-400 font-bold">
                <span>Live Abuja Catalog</span>
                <span className="text-slate-700 dark:text-slate-200">
                  {activeListingsCount} Listings
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </aside>
  )
}