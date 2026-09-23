import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/(auth)/actions";
import { MobileSidebarDrawer } from "@/components/storefront/MobileSidebarDrawer";
import { Button } from "@/components/ui/button";
import { BenchTechLogo } from "@/components/BenchTechLogo";
//import { CartDrawer } from "@/components/cart/CartDrawer";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  Search,
  Bookmark,
  Store,
  LogOut,
  ShieldAlert,
} from "lucide-react";

export async function Navbar() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let profile: any = null;
  if (user) {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();
    profile = data;
  }

  const userRoles: string[] =
    profile?.roles || (profile?.role ? [profile.role] : ["buyer"]);

  const isAdmin = userRoles.includes("admin") || profile?.role === "admin";
  const isSeller =
    Boolean(profile?.business_name) || userRoles.includes("seller") || isAdmin;
  const sellerDestination = isSeller ? "/seller" : "/seller/onboarding";

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xs border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-[1700px] mx-auto px-3 sm:px-4 h-16 flex items-center justify-between gap-2 sm:gap-4">
        {/* Left: Mobile Drawer Trigger + Brand Logo */}
        <div className="flex items-center gap-2 shrink-0">
          <MobileSidebarDrawer profile={profile} />

          <Link href={user ? "/feed" : "/"} className="flex items-center gap-2 group">
            <BenchTechLogo size={32} />
            <div className="hidden min-[420px]:block">
              <span className="font-black text-base sm:text-lg text-slate-900 dark:text-slate-100 tracking-tight leading-none block group-hover:text-blue-600 transition">
                BenchTech
              </span>
              <span className="text-[9px] text-slate-400 dark:text-slate-500 font-semibold tracking-wider hidden sm:block">
                Buy Smart. Sell Easy.
              </span>
            </div>
          </Link>
        </div>

        {/* Center: Global Search Bar */}
        <form
          action="/products"
          method="GET"
          className="flex-1 min-w-0 max-w-xl mx-2 flex items-center relative"
        >
          <input
            type="text"
            name="q"
            placeholder="Search gadgets in Abuja..."
            className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 pl-3.5 pr-9 py-1.5 text-xs rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-800 transition font-medium text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
          />
          <button
            type="submit"
            aria-label="Search"
            className="absolute right-1 bg-blue-600 hover:bg-blue-700 text-white p-1.5 rounded-lg transition shrink-0"
          >
            <Search className="w-3.5 h-3.5" />
          </button>
        </form>

        {/* Right: Actions, Theme, Cart & Account Controls */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          {/* 1. Theme Toggle */}
          <ThemeToggle />

          {/* 2. Saved Items (Bookmark Icon) */}
          <Link
            href="/saved"
            className="p-2 text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
            title="Saved Items"
            aria-label="Saved Items"
          >
            <Bookmark className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
          </Link>

          {/* 3. Cart Drawer */}
          {/* <CartDrawer /> */}

          {/* 4. Authenticated Actions */}
          {user ? (
            <div className="flex items-center gap-1.5 sm:gap-2 pl-1.5 sm:pl-2 border-l border-slate-200 dark:border-slate-700">
              {isAdmin && (
                <Link href="/admin" className="hidden sm:block">
                  <Button
                    size="sm"
                    className="bg-slate-900 hover:bg-black text-white text-xs h-8 px-2.5 gap-1.5 font-bold shadow-xs rounded-xl"
                  >
                    <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
                    <span>Admin</span>
                  </Button>
                </Link>
              )}

              {/* Seller Hub Switch */}
              <Link href={sellerDestination}>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs h-8 px-2.5 gap-1.5 border-blue-200 text-blue-600 dark:border-blue-900/60 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 font-bold rounded-xl"
                  title={isSeller ? "Seller Hub" : "Become a Seller"}
                >
                  <Store className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">
                    {isSeller ? "Seller Hub" : "Become Seller"}
                  </span>
                </Button>
              </Link>

              {/* Sign Out */}
              <form action={signOut}>
                <button
                  type="submit"
                  title="Sign Out"
                  aria-label="Sign Out"
                  className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl transition"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </form>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 pl-1.5 sm:pl-2 border-l border-slate-200 dark:border-slate-700">
              <Link href="/login">
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-xs h-8 px-2.5 sm:px-3 rounded-xl font-bold"
                >
                  Sign In
                </Button>
              </Link>
              <Link href="/register">
                <Button
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs h-8 px-3 font-bold rounded-xl shadow-xs"
                >
                  Register
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}