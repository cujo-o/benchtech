"use client";

import Link from "next/link";
import {
  ShieldCheck,
  ArrowRight,
  Store,
  CheckCircle2,
  ShieldAlert,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface BuyerRightSidebarProps {
  user: {
    id: string;
    email?: string;
    fullName?: string;
    businessName?: string;
    role?: string;
    roles?: string[];
    techTrustStatus?: string;
  } | null;
  activeListingsCount: number;
}

export function BuyerRightSidebar({
  user,
  activeListingsCount,
}: BuyerRightSidebarProps) {
  const userRoles: string[] =
    user?.roles || (user?.role ? [user.role] : ["buyer"]);

  const isAdmin = userRoles.includes("admin") || user?.role === "admin";
  const isSeller =
    Boolean(user?.businessName) ||
    userRoles.includes("seller") ||
    user?.role === "seller" ||
    isAdmin;

  return (
    <aside className="w-72 shrink-0 hidden 2xl:flex flex-col gap-4 p-4 bg-white border-l border-slate-200 min-h-[calc(100vh-4rem)]">
      {/* User Account / Sign In State */}
      {user ? (
        <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-sm shadow-sm shadow-blue-500/20">
              {user.businessName
                ? user.businessName[0].toUpperCase()
                : user.fullName
                  ? user.fullName[0].toUpperCase()
                  : user.email
                    ? user.email[0].toUpperCase()
                    : "U"}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs text-slate-400 font-medium">Signed In</p>
              <p className="text-sm font-bold text-slate-800 truncate">
                {user.businessName || user.fullName || user.email}
              </p>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-200/60 space-y-2">
            {isSeller ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-600">
                  <span>Store Status:</span>
                  <span
                    className={`font-semibold capitalize ${
                      user.techTrustStatus === "verified"
                        ? "text-emerald-600"
                        : user.techTrustStatus === "pending"
                          ? "text-blue-600"
                          : "text-amber-600"
                    }`}
                  >
                    {user.techTrustStatus || "Unverified"}
                  </span>
                </div>
                <Link href="/seller" className="w-full block">
                  <Button
                    size="sm"
                    className="w-full bg-blue-600 hover:bg-blue-700 text-xs h-8 font-bold rounded-xl"
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
                  className="w-full text-xs h-8 border-slate-300 font-semibold hover:bg-slate-100 rounded-xl"
                >
                  Switch to Seller Account
                </Button>
              </Link>
            )}

            {/* Admin Console Shortcut */}
            {isAdmin && (
              <Link href="/admin" className="w-full block pt-1">
                <Button
                  size="sm"
                  className="w-full bg-slate-900 hover:bg-black text-white text-xs h-8 gap-1.5 font-bold shadow-sm rounded-xl"
                >
                  <ShieldAlert className="w-3.5 h-3.5 text-red-400" /> Admin
                  Console
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
            <h4 className="text-sm font-bold text-slate-900">
              Welcome to BenchTech
            </h4>
            <p className="text-xs text-slate-500 mt-1">
              Sign in to manage enquiries, list technology, and access seller
              tools.
            </p>
          </div>
          <div className="pt-1 flex gap-2">
            <Link href="/login" className="flex-1">
              <Button
                size="sm"
                variant="outline"
                className="w-full text-xs h-8 font-medium rounded-xl"
              >
                Sign In
              </Button>
            </Link>
            <Link href="/register" className="flex-1">
              <Button
                size="sm"
                className="w-full bg-blue-600 hover:bg-blue-700 text-xs h-8 font-bold rounded-xl"
              >
                Register
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* "Request a Gadget" Reverse Sourcing Banner */}
      <div className="bg-gradient-to-br from-blue-900 via-indigo-950 to-slate-950 text-white rounded-2xl p-4 border border-blue-800/40 shadow-xs space-y-2.5">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-blue-600 flex items-center justify-center shrink-0">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
          </div>
          <span className="text-xs font-black tracking-tight">Request a Gadget</span>
        </div>

        <p className="text-[11px] text-slate-300 leading-snug">
          Can&apos;t find your target specs? Broadcast your target device &amp; budget to verified Abuja dealers.
        </p>

        <Link href="/requests/new" className="block pt-0.5">
          <Button
            size="sm"
            className="w-full bg-white hover:bg-slate-100 text-slate-950 font-bold text-xs h-8 rounded-xl gap-1.5 shadow-xs"
          >
            Broadcast Request <ArrowRight className="w-3 h-3" />
          </Button>
        </Link>
      </div>

      {/* TechTrust Safety Information */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 space-y-3">
        <div className="flex items-center gap-2 text-slate-900">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <h4 className="text-xs font-bold uppercase tracking-wider">
            TechTrust Safety
          </h4>
        </div>
        <ul className="text-xs text-slate-600 space-y-2">
          <li className="flex items-start gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
            <span>
              Always verify hardware specs and condition before payment.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
            <span>
              Arrange pickup in public spaces or verified business premises in
              Abuja.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
            <span>
              Look for the TechTrust badge on verified vendor profiles.
            </span>
          </li>
        </ul>
      </div>

      {/* Seller CTA Card */}
      <div className="bg-slate-950 text-white rounded-2xl p-4 space-y-2 mt-auto">
        <h4 className="text-xs font-bold">Have Gadgets to Sell?</h4>
        <p className="text-[11px] text-slate-400 leading-snug">
          List your phones, laptops, and tech accessories directly to buyers
          across Abuja.
        </p>
        <Link href={isSeller ? "/seller/listings/new" : "/seller/onboarding"}>
          <Button
            size="sm"
            className="w-full bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold h-8 mt-1 gap-1 rounded-xl"
          >
            {isSeller ? "Create Listing" : "Start Selling"}{" "}
            <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        </Link>
      </div>
    </aside>
  );
}