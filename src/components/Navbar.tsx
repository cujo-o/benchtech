import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/(auth)/actions";
import { MobileSidebarDrawer } from "@/components/storefront/MobileSidebarDrawer";
import { Button } from "@/components/ui/button";
import { BenchTechLogo } from "@/components/BenchTechLogo";
import { CartDrawer } from "@/components/cart/CartDrawer";
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
    const { data } = await supabase
      .from("profiles")
      .select("id, role, roles, business_name, email")
      .eq("id", user.id)
      .maybeSingle();
    profile = data;
  }

  const userRoles: string[] =
    profile?.roles || (profile?.role ? [profile.role] : ["buyer"]);
  const isAdmin = userRoles.includes("admin");
  const isSeller = userRoles.includes("seller") || isAdmin;

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200">
      <div className="max-w-[1700px] mx-auto px-4 h-16 flex items-center justify-between gap-3">
        {/* Left Side: Mobile Drawer Toggle + Logo */}
        <div className="flex items-center gap-2">
          <MobileSidebarDrawer profile={profile} />

          <Link
            href={user ? "/feed" : "/"}
            className="flex items-center gap-2.5"
          >
            <BenchTechLogo size={34} />
            <div>
              <span className="font-black text-lg text-slate-900 tracking-tight leading-none block">
                BenchTech
              </span>
              <span className="text-[9px] text-slate-400 font-semibold tracking-wider hidden sm:block">
                Buy Smart. Sell Easy.
              </span>
            </div>
          </Link>

          <div className="hidden md:flex items-center gap-1.5 text-xs text-slate-600 bg-slate-50 border border-slate-200/80 px-3 py-1.5 rounded-full ml-4">
            <MapPin className="w-3.5 h-3.5 text-blue-600" />
            <span>Abuja, NG</span>
          </div>
        </div>

        {/* Global Search Bar */}
        <form
          action="/products"
          method="GET"
          className="flex-1 max-w-xl mx-2 flex items-center relative"
        >
          <input
            type="text"
            name="q"
            placeholder="Search gadgets in Abuja..."
            className="w-full bg-slate-50 border border-slate-200 pl-3 pr-9 py-1.5 text-xs rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
          />
          <button
            type="submit"
            aria-label="Search"
            className="absolute right-1 bg-blue-600 hover:bg-blue-700 text-white p-1.5 rounded-lg transition"
          >
            <Search className="w-3.5 h-3.5" />
          </button>
        </form>

        {/* Actions & Roles */}
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
          {/* Saved Items */}
          <Link
            href="/saved"
            className="p-2 text-slate-600 hover:text-blue-600 hover:bg-slate-100 rounded-xl transition"
            title="Saved Items"
          >
            <Heart className="w-5 h-5" />
          </Link>

          {/* Cart Drawer Trigger */}
          <CartDrawer />

          {user ? (
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
              {/* Admin Button */}
              {isAdmin && (
                <Link href="/admin/overview" className="hidden sm:block">
                  <Button
                    size="sm"
                    className="bg-slate-900 hover:bg-black text-white text-xs h-8 gap-1.5 font-bold shadow-sm rounded-xl"
                  >
                    <ShieldAlert className="w-3.5 h-3.5 text-red-400" /> Admin
                  </Button>
                </Link>
              )}

              {/* Seller / Onboarding Switch */}
              <Link
                href={isSeller ? "/seller/dashboard" : "/seller/onboarding"}
              >
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs h-8 gap-1.5 border-blue-200 text-blue-600 hover:bg-blue-50 font-bold rounded-xl"
                >
                  <Store className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">
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
                  className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </form>
            </div>
          ) : (
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
              <Link href="/login">
                <Button size="sm" variant="ghost" className="text-xs h-8 rounded-xl font-bold">
                  Sign In
                </Button>
              </Link>
              <Link href="/register">
                <Button
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs h-8 font-bold rounded-xl shadow-sm"
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