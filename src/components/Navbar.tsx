import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/(auth)/actions";
import { MobileSidebarDrawer } from "@/components/storefront/MobileSidebarDrawer";
import { Button } from "@/components/ui/button";
import { BenchTechLogo } from "@/components/BenchTechLogo";
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
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-950/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 transition-colors">
      <div className="max-w-[1700px] mx-auto px-3 sm:px-5 h-16 flex items-center justify-between gap-2 sm:gap-4">
        
        {/* Left: Mobile Drawer Trigger + Brand Logo */}
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          <MobileSidebarDrawer profile={profile} />

          <Link href={user ? "/feed" : "/"} className="flex items-center gap-2 group">
            <BenchTechLogo size={30} />
            <div className="hidden min-[480px]:block">
              <span className="font-black text-base sm:text-lg text-slate-900 dark:text-slate-100 tracking-tight leading-none block group-hover:text-blue-600 dark:group-hover:text-blue-400 transition">
                BenchTech
              </span>
              <span className="text-[9px] text-slate-400 dark:text-slate-500 font-semibold tracking-wider hidden sm:block mt-0.5">
                Abuja Tech Hub
              </span>
            </div>
          </Link>
        </div>

        {/* Center: Search Bar (Ample width on both mobile and desktop) */}
        <form
          action="/products"
          method="GET"
          className="flex-1 min-w-0 max-w-xl mx-1 sm:mx-3 flex items-center relative"
        >
          <input
            type="text"
            name="q"
            placeholder="Search gadgets in Abuja..."
            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 pl-3 pr-8 sm:pr-9 py-1.5 sm:py-2 text-xs rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500"
          />
          <button
            type="submit"
            aria-label="Search"
            className="absolute right-1 sm:right-1.5 bg-blue-600 hover:bg-blue-700 text-white p-1 sm:p-1.5 rounded-lg transition shrink-0"
          >
            <Search className="w-3.5 h-3.5" />
          </button>
        </form>

        {/* Right: Desktop Action Hub (Hidden on mobile to preserve search space) */}
        <div className="hidden md:flex items-center gap-1.5 sm:gap-2 shrink-0">
          <ThemeToggle />

          <Link
            href="/saved"
            className="p-2 text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800/80 rounded-xl transition"
            title="Saved Items"
            aria-label="Saved Items"
          >
            <Bookmark className="w-4 h-4" />
          </Link>

          {user ? (
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-800">
              {isAdmin && (
                <Link href="/admin">
                  <Button
                    size="sm"
                    className="bg-slate-900 hover:bg-black text-white dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-100 dark:border dark:border-slate-700 text-xs h-8 px-2.5 gap-1.5 font-bold rounded-xl"
                  >
                    <ShieldAlert className="w-3.5 h-3.5 text-red-500 dark:text-red-400" />
                    <span>Admin</span>
                  </Button>
                </Link>
              )}

              <Link href={sellerDestination}>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs h-8 px-2.5 gap-1.5 border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-900 hover:bg-blue-50 dark:hover:bg-blue-950/40 font-bold rounded-xl"
                >
                  <Store className="w-3.5 h-3.5" />
                  <span>{isSeller ? "Seller Hub" : "Become Seller"}</span>
                </Button>
              </Link>

              <form action={signOut}>
                <button
                  type="submit"
                  title="Sign Out"
                  aria-label="Sign Out"
                  className="p-2 text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl transition"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </form>
            </div>
          ) : (
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-800">
              <Link href="/login">
                <Button size="sm" variant="ghost" className="text-xs h-8 px-3 rounded-xl font-bold">
                  Sign In
                </Button>
              </Link>
              <Link href="/register">
                <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white text-xs h-8 px-3 font-bold rounded-xl">
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