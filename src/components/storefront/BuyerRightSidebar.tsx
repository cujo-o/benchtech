'use client'

import Link from 'next/link'
import { ShieldCheck, ArrowRight, Store, MessageSquare, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface BuyerRightSidebarProps {
  user: {
    id: string
    email?: string
    fullName?: string
    role?: string
    techTrustStatus?: string
  } | null
  activeListingsCount: number
}

export function BuyerRightSidebar({ user, activeListingsCount }: BuyerRightSidebarProps) {
  return (
    <aside className="w-72 shrink-0 hidden 2xl:flex flex-col gap-5 p-4 bg-white border-l border-slate-200 min-h-[calc(100vh-4rem)]">
      {/* User Account / Sign In State */}
      {user ? (
        <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-sm">
              {user.fullName ? user.fullName[0].toUpperCase() : 'U'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs text-slate-400 font-medium">Signed In</p>
              <p className="text-sm font-bold text-slate-800 truncate">{user.fullName || user.email}</p>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-200/60">
            {user.role === 'seller' ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-600">
                  <span>Store Status:</span>
                  <span className={`font-semibold capitalize ${
                    user.techTrustStatus === 'verified' ? 'text-emerald-600' : 'text-amber-600'
                  }`}>
                    {user.techTrustStatus === 'verified' ? 'Verified' : 'Unverified'}
                  </span>
                </div>
                <Link href="/seller/dashboard">
                  <Button size="sm" className="w-full bg-blue-600 hover:bg-blue-700 text-xs h-8">
                    Open Seller Hub
                  </Button>
                </Link>
              </div>
            ) : (
              <Link href="/seller/dashboard">
                <Button size="sm" variant="outline" className="w-full text-xs h-8 border-slate-300">
                  Switch to Seller Account
                </Button>
              </Link>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 space-y-3 text-center">
          <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mx-auto">
            <Store className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900">Welcome to TechMart</h4>
            <p className="text-xs text-slate-500 mt-1">
              Sign in to manage enquiries, list technology, and access seller tools.
            </p>
          </div>
          <div className="pt-1 flex gap-2">
            <Link href="/login" className="flex-1">
              <Button size="sm" variant="outline" className="w-full text-xs h-8">
                Sign In
              </Button>
            </Link>
            <Link href="/register" className="flex-1">
              <Button size="sm" className="w-full bg-blue-600 hover:bg-blue-700 text-xs h-8">
                Register
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* TechTrust Safety Information */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 space-y-3">
        <div className="flex items-center gap-2 text-slate-900">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <h4 className="text-xs font-bold uppercase tracking-wider">TechTrust Safety</h4>
        </div>
        <ul className="text-xs text-slate-600 space-y-2">
          <li className="flex items-start gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
            <span>Always verify hardware specs and condition before payment.</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
            <span>Arrange pickup in public spaces or verified business premises in Abuja.</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
            <span>Look for the TechTrust badge on verified vendor profiles.</span>
          </li>
        </ul>
      </div>

      {/* Seller CTA Card */}
      <div className="bg-slate-950 text-white rounded-2xl p-4 space-y-2 mt-auto">
        <h4 className="text-xs font-bold">Have Gadgets to Sell?</h4>
        <p className="text-[11px] text-slate-400 leading-snug">
          List your phones, laptops, and tech accessories directly to buyers across Abuja.
        </p>
        <Link href="/seller/listings/new">
          <Button size="sm" className="w-full bg-blue-600 hover:bg-blue-500 text-xs font-bold h-8 mt-1">
            Create Listing <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </Button>
        </Link>
      </div>
    </aside>
  )
}