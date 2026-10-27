'use client'

import Link from 'next/link'
import {
  ShieldCheck,
  ArrowRight,
  Store,
  CheckCircle2,
  ShieldAlert,
  Settings,
  Megaphone,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

interface BuyerRightSidebarProps {
  user: {
    id: string
    email?: string
    fullName?: string
    businessName?: string
    role?: string
    roles?: string[]
    techTrustStatus?: string
  } | null
  activeListingsCount: number
}

export function BuyerRightSidebar({
  user,
}: BuyerRightSidebarProps) {
  const userRoles: string[] =
    user?.roles || (user?.role ? [user.role] : ['buyer'])
  const isAdmin = userRoles.includes('admin') || user?.role === 'admin'
  const isSeller =
    Boolean(user?.businessName) ||
    userRoles.includes('seller') ||
    user?.role === 'seller' ||
    isAdmin

  return (
    <aside className="w-72 shrink-0 hidden 2xl:flex flex-col gap-4 p-4 bg-white dark:bg-slate-900 border-l border-slate-200/80 dark:border-slate-800/80 min-h-[calc(100vh-4rem)] text-slate-900 dark:text-slate-100 transition-colors">
      {/* User Account Card */}
      {user ? (
        <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white font-black flex items-center justify-center text-sm shrink-0 shadow-2xs">
                {(user.businessName || user.fullName || user.email || 'U')[0].toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] text-slate-400 font-semibold">Signed In</p>
                <p className="text-xs font-black text-slate-900 dark:text-white truncate">
                  {user.businessName || user.fullName || user.email}
                </p>
              </div>
            </div>

            <Link
              href="/settings"
              title="Account Settings"
              className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-700/60 transition shrink-0"
            >
              <Settings className="w-4 h-4" />
            </Link>
          </div>

          <div className="pt-2.5 border-t border-slate-200/70 dark:border-slate-700/70 space-y-2">
            {isSeller ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                  <span>Store Status</span>
                  <span
                    className={`font-bold capitalize ${
                      user.techTrustStatus === 'verified'
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : user.techTrustStatus === 'pending'
                        ? 'text-blue-600 dark:text-blue-400'
                        : 'text-amber-600 dark:text-amber-400'
                    }`}
                  >
                    {user.techTrustStatus || 'Unverified'}
                  </span>
                </div>
                <Link href="/seller" className="w-full block">
                  <Button
                    size="sm"
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs h-8 font-bold rounded-xl cursor-pointer"
                  >
                    Open Seller Hub
                  </Button>
                </Link>
              </div>
            ) : (
              <Link href="/seller/onboarding" className="w-full block">
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full text-xs h-8 border-slate-200 dark:border-slate-700 font-bold rounded-xl cursor-pointer"
                >
                  Become a Seller
                </Button>
              </Link>
            )}

            <Link href="/settings" className="w-full block">
              <Button
                size="sm"
                variant="outline"
                className="w-full text-xs h-8 border-slate-200 dark:border-slate-700 font-semibold rounded-xl gap-1.5 cursor-pointer"
              >
                <Settings className="w-3.5 h-3.5 text-slate-400" />
                <span>Settings &amp; Theme</span>
              </Button>
            </Link>

            {isAdmin && (
              <Link href="/admin" className="w-full block pt-0.5">
                <Button
                  size="sm"
                  className="w-full bg-slate-900 hover:bg-black dark:bg-slate-800 dark:hover:bg-slate-700 text-white text-xs h-8 gap-1.5 font-bold rounded-xl border border-slate-700 cursor-pointer"
                >
                  <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
                  <span>Admin Console</span>
                </Button>
              </Link>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 space-y-3 text-center">
          <div className="w-10 h-10 rounded-xl bg-blue-600/10 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto">
            <Store className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
              Welcome to BenchTech
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Sign in to track orders, save items, or sell hardware in Abuja.
            </p>
          </div>
          <div className="pt-1 flex gap-2">
            <Link href="/login" className="flex-1">
              <Button
                size="sm"
                variant="outline"
                className="w-full text-xs h-8 font-bold rounded-xl border-slate-200 dark:border-slate-700"
              >
                Sign In
              </Button>
            </Link>
            <Link href="/register" className="flex-1">
              <Button
                size="sm"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs h-8 font-bold rounded-xl"
              >
                Register
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* Request a Gadget Card */}
      <div className="bg-slate-900 text-white rounded-2xl p-4 border border-slate-800 space-y-2.5">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center shrink-0">
            <Megaphone className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="text-xs font-black tracking-tight">Request a Device</span>
        </div>
        <p className="text-[11px] text-slate-300 leading-relaxed">
          Looking for specific specs? Post your target device and budget for verified Abuja stores.
        </p>
        <Link href="/requests/new" className="block pt-0.5">
          <Button
            size="sm"
            className="w-full bg-white hover:bg-slate-100 text-slate-950 font-bold text-xs h-8 rounded-xl gap-1.5 cursor-pointer"
          >
            <span>Post Request</span>
            <ArrowRight className="w-3 h-3" />
          </Button>
        </Link>
      </div>

      {/* Buyer Protection Checklist */}
      <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 space-y-3">
        <div className="flex items-center gap-2 text-slate-900 dark:text-white">
          <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <h4 className="text-xs font-bold uppercase tracking-wider">
            Buyer Protection
          </h4>
        </div>
        <ul className="text-xs text-slate-600 dark:text-slate-300 space-y-2">
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
      </div>
    </aside>
  )
}