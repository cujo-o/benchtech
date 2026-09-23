import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/(auth)/actions";
import { MobileSidebarDrawer } from "@/components/storefront/MobileSidebarDrawer";
import { Button } from "@/components/ui/button";
import { BenchTechLogo } from "@/components/BenchTechLogo";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  Search,
  MapPin,
  Heart,
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
    // Use select('*') to prevent schema cache failures on unmigrated columns
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

  // A user is a seller if they have a registered store name or seller/admin role
  const isSeller =
    Boolean(profile?.business_name) || userRoles.includes("seller") || isAdmin;
  const sellerDestination = isSeller ? "/seller" : "/seller/onboarding";

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200">
      <div className="max-w-[1700px] mx-auto px-2.5 sm:px-4 h-16 flex items-center justify-between gap-1.5 sm:gap-3">
        {/* Left Side: Mobile Drawer Toggle + Logo */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <MobileSidebarDrawer profile={profile} />

          <Link href={user ? "/feed" : "/"} className="flex items-center gap-2">
            <BenchTechLogo size={32} />
            <div className="hidden min-[400px]:block">
              <span className="font-black text-base sm:text-lg text-slate-900 tracking-tight leading-none block">
                BenchTech
              </span>
              <span className="text-[9px] text-slate-400 font-semibold tracking-wider hidden sm:block">
                Buy Smart. Sell Easy.
              </span>
            </div>
          </Link>

          <div className="hidden lg:flex items-center gap-1.5 text-xs text-slate-600 bg-slate-50 border border-slate-200/80 px-2.5 py-1 rounded-full ml-2">
            <MapPin className="w-3.5 h-3.5 text-blue-600" />
            <span>Abuja, NG</span>
          </div>
        </div>

        {/* Global Search Bar */}
        <form
          action="/products"
          method="GET"
          className="flex-1 min-w-0 max-w-xl mx-1 sm:mx-3 flex items-center relative"
        >
          <input
            type="text"
            name="q"
            placeholder="Search gadgets in Abuja..."
            className="w-full bg-slate-50 border border-slate-200 pl-3 pr-8 sm:pr-9 py-1.5 text-xs rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition font-medium"
          />
          <button
            type="submit"
            aria-label="Search"
            className="absolute right-1 bg-blue-600 hover:bg-blue-700 text-white p-1 sm:p-1.5 rounded-lg transition shrink-0"
          >
            <Search className="w-3.5 h-3.5" />
          </button>
        </form>

        {/* Actions & Roles */}
        <div className="flex items-center gap-1 sm:gap-2 text-xs font-semibold text-slate-600 shrink-0">
          <Link
            href="/saved"
            className="hidden sm:flex p-2 text-slate-600 hover:text-blue-600 hover:bg-slate-100 rounded-xl transition"
            title="Saved Items"
          >
            <Heart className="w-4 h-4 sm:w-5 sm:h-5" />
          </Link>

          <CartDrawer />

          {user ? (
            <div className="flex items-center gap-1 sm:gap-1.5 pl-1.5 sm:pl-2 border-l border-slate-200">
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
                  className="text-xs h-8 px-2.5 gap-1.5 border-blue-200 text-blue-600 hover:bg-blue-50 font-bold rounded-xl"
                  title={isSeller ? "Seller Hub" : "Become a Seller"}
                >
                  <Store className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">
                    {isSeller ? "Seller Hub" : "Become Seller"}
                  </span>
                </Button>
              </Link>
              <div className="flex items-center gap-1 sm:gap-2 text-xs font-semibold text-slate-600 shrink-0">
                <ThemeToggle />
                <Link href="/saved" className="hidden sm:flex ...">
                  <Heart className="w-4 h-4 sm:w-5 sm:h-5" />
                </Link>
                <CartDrawer />
                ...
              </div>

              {/* Sign Out */}
              <form action={signOut}>
                <button
                  type="submit"
                  title="Sign Out"
                  aria-label="Sign Out"
                  className="p-1.5 sm:p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </form>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 sm:gap-2 pl-1 sm:pl-2 border-l border-slate-200">
              <Link href="/login">
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-xs h-8 px-2 sm:px-3 rounded-xl font-bold"
                >
                  Sign In
                </Button>
              </Link>
              <Link href="/register">
                <Button
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs h-8 px-2.5 sm:px-3 font-bold rounded-xl shadow-xs"
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
