import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Navbar } from "@/components/Navbar";
import { BuyerSidebar } from "@/components/storefront/BuyerSidebar";
import { BuyerRightSidebar } from "@/components/storefront/BuyerRightSidebar";
import { SaveButton } from "@/components/SaveButton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Smartphone,
  Laptop,
  Gamepad2,
  Headphones,
  Camera,
  Network,
  Home as HomeIcon,
  Watch,
  Tablet,
  Monitor,
  Grid,
  ShieldCheck,
  Lock,
  Truck,
  RotateCcw,
  ArrowRight,
  Package,
  MapPin,
  Scale,
  Wrench,
  Tag,
  BookOpen,
  GraduationCap,
  Sparkles,
} from "lucide-react";

export const revalidate = 30;

export const metadata: Metadata = {
  title: "BenchTech | Abuja Tech & Hardware Marketplace",
  description:
    "Buy, sell, and inspect laptops, smartphones, gaming gear, and computer accessories across Abuja.",
};

const CATEGORY_CHIPS = [
  { id: "phones", label: "Phones", icon: Smartphone },
  { id: "laptops", label: "Laptops", icon: Laptop },
  { id: "gaming", label: "Gaming", icon: Gamepad2 },
  { id: "accessories", label: "Accessories", icon: Headphones },
  { id: "cameras", label: "Cameras", icon: Camera },
  { id: "networking", label: "Networking", icon: Network },
  { id: "smarthome", label: "Smart Home", icon: HomeIcon },
  { id: "wearables", label: "Wearables", icon: Watch },
  { id: "tablets", label: "Tablets", icon: Tablet },
  { id: "monitors", label: "Monitors", icon: Monitor },
  { id: "all", label: "View All", icon: Grid },
];

const FEATURE_TILES = [
  {
    title: "Find My Tech",
    desc: "Filter devices by budget, workload, and performance specifications.",
    cta: "Start",
    href: "/assistant",
    icon: Sparkles,
    iconBg: "bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-300",
    btnBg: "bg-blue-600 hover:bg-blue-700 text-white",
  },
  {
    title: "Compare Tech",
    desc: "Compare hardware specifications and prices side by side.",
    cta: "Compare",
    href: "/compare",
    icon: Scale,
    iconBg: "bg-purple-50 text-purple-600 dark:bg-purple-950 dark:text-purple-300",
    btnBg: "bg-purple-600 hover:bg-purple-700 text-white",
  },
  {
    title: "Build My Setup",
    desc: "Assemble custom workstation and gaming hardware bundles.",
    cta: "Build Setup",
    href: "/build",
    icon: Wrench,
    iconBg: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-300",
    btnBg: "bg-emerald-600 hover:bg-emerald-700 text-white",
  },
  {
    title: "Sell Your Tech",
    desc: "List laptops, phones, and hardware for verified buyers in Abuja.",
    cta: "Start Selling",
    href: "/seller/listings/new",
    icon: Tag,
    iconBg: "bg-orange-50 text-orange-600 dark:bg-orange-950 dark:text-orange-300",
    btnBg: "bg-orange-600 hover:bg-orange-700 text-white",
  },
  {
    title: "Learn Tech",
    desc: "Inspection checklists, serial number verification, and safety guides.",
    cta: "Safety Guide",
    href: "/help",
    icon: BookOpen,
    iconBg: "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
    btnBg: "bg-amber-600 hover:bg-amber-700 text-white",
  },
];

function resolveFirstImage(images: any): string | null {
  if (!images) return null;
  if (Array.isArray(images)) return images[0] || null;
  if (typeof images === "string") {
    try {
      const parsed = JSON.parse(images);
      if (Array.isArray(parsed)) return parsed[0] || null;
    } catch {
      return images.startsWith("http") ? images : null;
    }
  }
  return null;
}

export default async function FeedPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/feed");
  }

  const [
    { data: userProfile },
    { data: products },
  ] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single(),
    supabase
      .from("products")
      .select(
        "*, profiles!products_seller_id_fkey(business_name, district, tech_trust_status)"
      )
      .eq("status", "published")
      .order("created_at", { ascending: false })
      .limit(16),
  ]);

  return (
    <div className="min-h-screen bg-slate-100/60 dark:bg-slate-950 flex flex-col">
      <Navbar />

      <div className="max-w-[1700px] w-full mx-auto flex flex-1">
        <BuyerSidebar />

        <main className="flex-1 min-w-0 p-3 sm:p-5 md:p-6 space-y-6">
          {/* Hero Banner */}
          <div className="bg-slate-950 text-white rounded-3xl p-6 sm:p-8 md:p-10 relative overflow-hidden shadow-xs flex flex-col lg:flex-row items-center justify-between gap-8 border border-slate-800">
            <div className="space-y-4 max-w-xl z-10 w-full">
              <span className="text-[11px] uppercase tracking-wider text-blue-400 font-bold block">
                Your One-Stop Tech Marketplace
              </span>

              <h1 className="text-2xl sm:text-4xl md:text-5xl font-black tracking-tight leading-tight">
                Find the Right Tech. <br />
                <span className="text-blue-500">For Your Life.</span>
              </h1>

              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-lg">
                Buy, compare, and sell authentic hardware in Abuja. Every order includes physical inspection before funds are released.
              </p>

              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-[11px] font-semibold text-slate-200">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  Verified Sellers
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-[11px] font-semibold text-slate-200">
                  <Truck className="w-3.5 h-3.5 text-sky-400" />
                  Abuja Fast Delivery
                </span>
              </div>

              <div className="pt-2 flex items-center gap-3">
                <Link href="/products">
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-5 h-10 rounded-xl gap-1.5 shadow-xs">
                    Shop Now <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                </Link>
                <Link href="/help">
                  <Button
                    variant="outline"
                    className="text-xs font-bold h-10 px-5 rounded-xl bg-white text-slate-900 hover:bg-slate-100 hover:text-slate-950 border-none transition"
                  >
                    Buyer Safety Guide
                  </Button>
                </Link>
              </div>
            </div>

            {/* Showcase Image Cluster */}
            <div className="relative z-10 w-full lg:w-[420px] aspect-[16/10] bg-slate-900/60 rounded-2xl border border-slate-800 flex items-center justify-center p-4 overflow-hidden shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://images.unsplash.com/photo-1550009158-9ebf69173e03?auto=format&fit=crop&w=900&q=80"
                alt="Hardware and Gadgets"
                className="w-full h-full object-cover rounded-xl opacity-90"
                loading="eager"
              />
              
            </div>
          </div>

          {/* Feature Action Grid (5 Cards) */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {FEATURE_TILES.map((tile) => {
              const Icon = tile.icon;
              return (
                <div
                  key={tile.title}
                  className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-3.5 flex flex-col justify-between space-y-3 hover:border-slate-300 dark:hover:border-slate-700 transition group"
                >
                  <div className="space-y-2">
                    <div
                      className={`w-9 h-9 rounded-xl ${tile.iconBg} flex items-center justify-center shrink-0`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition">
                        {tile.title}
                      </h3>
                      <p className="text-[10px] text-slate-400 leading-snug mt-1 line-clamp-2">
                        {tile.desc}
                      </p>
                    </div>
                  </div>

                  <Link href={tile.href} className="block pt-1">
                    <button
                      type="button"
                      className={`w-full py-1.5 px-2.5 rounded-xl font-bold text-[11px] ${tile.btnBg} flex items-center justify-center gap-1 transition`}
                    >
                      <span>{tile.cta}</span>
                      <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition" />
                    </button>
                  </Link>
                </div>
              );
            })}
          </div>

          {/* Categories Horizontal Rail */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <h2 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                Shop by Category
              </h2>
              <Link
                href="/products"
                className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
              >
                <span>View All Categories</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none -mx-1 px-1">
              {CATEGORY_CHIPS.map((cat) => {
                const Icon = cat.icon;
                return (
                  <Link
                    key={cat.id}
                    href={
                      cat.id === "all"
                        ? "/products"
                        : `/products?category=${cat.id}`
                    }
                    className="flex flex-col items-center gap-1.5 p-2.5 sm:p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-blue-500 min-w-[70px] sm:min-w-[80px] transition group shrink-0"
                  >
                    <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 group-hover:bg-blue-50 group-hover:text-blue-600 transition">
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] sm:text-[11px] font-semibold text-slate-700 dark:text-slate-300 group-hover:text-blue-600 text-center whitespace-nowrap">
                      {cat.label}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Value Banners */}
          <div className="space-y-2.5">
            <h2 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
              Services &amp; Programs
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
              <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-4 flex flex-col justify-between space-y-3">
                <div className="space-y-1.5">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                    TechPass Membership
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                    Zero delivery charges and direct store verification records across Abuja plazas.
                  </p>
                </div>
                <Link href="/subscription">
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full text-xs font-bold rounded-xl h-8 border-slate-200 dark:border-slate-700"
                  >
                    View Membership
                  </Button>
                </Link>
              </div>

              <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-4 flex flex-col justify-between space-y-3">
                <div className="space-y-1.5">
                  <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center">
                    <GraduationCap className="w-4 h-4" />
                  </div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                    Student Tech Program
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                    Student pricing on laptops, tablets, and peripherals for Abuja tertiary campuses.
                  </p>
                </div>
                <Link href="/products?tag=student">
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full text-xs font-bold rounded-xl h-8 border-slate-200 dark:border-slate-700"
                  >
                    View Student Pricing
                  </Button>
                </Link>
              </div>

              <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-4 flex flex-col justify-between space-y-3">
                <div className="space-y-1.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                    <Lock className="w-4 h-4" />
                  </div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                    TechTrust Protection
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                    Inspect screen condition, hardware, and battery health in person before payment releases.
                  </p>
                </div>
                <Link href="/help">
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full text-xs font-bold rounded-xl h-8 border-slate-200 dark:border-slate-700"
                  >
                    Inspection Protocols
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          {/* Available Technology (Responsive 2-column mobile, 4-column desktop) */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xs sm:text-sm md:text-base font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                  Available Technology
                </h2>
                <p className="text-[11px] text-slate-400">
                  Recent listings from verified merchants in Abuja
                </p>
              </div>
              <Link
                href="/products"
                className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline"
              >
                View Catalog &rarr;
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {products && products.length > 0 ? (
                products.map((item) => {
                  const firstImg = resolveFirstImage(item.images);
                  return (
                    <div key={item.id} className="relative group">
                      <SaveButton product={item} />
                      <Link href={`/products/${item.id}`}>
                        <Card className="h-full rounded-2xl overflow-hidden hover:border-slate-300 dark:hover:border-slate-700 transition bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 flex flex-col justify-between">
                          <div className="aspect-square bg-slate-50 dark:bg-slate-800/40 relative overflow-hidden p-2 flex items-center justify-center">
                            <Badge className="absolute top-2.5 left-2.5 bg-slate-900/80 text-white text-[9px] font-bold capitalize px-2 py-0.5">
                              {item.condition?.replace("_", " ") || "Inspected"}
                            </Badge>

                            {firstImg ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={firstImg}
                                alt={item.title}
                                loading="lazy"
                                className="max-h-full object-contain group-hover:scale-105 transition duration-300"
                              />
                            ) : (
                              <Package className="w-8 h-8 text-slate-300" />
                            )}
                          </div>

                          <CardContent className="p-3 flex-1 flex flex-col justify-between space-y-2">
                            <div>
                              <h3 className="font-bold text-xs text-slate-900 dark:text-slate-100 group-hover:text-blue-600 transition truncate">
                                {item.title}
                              </h3>

                              <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1">
                                <span className="uppercase font-semibold truncate max-w-[80px]">
                                  {item.brand || "Device"}
                                </span>
                                {item.profiles?.district && (
                                  <span className="flex items-center gap-0.5 shrink-0">
                                    <MapPin className="w-2.5 h-2.5" />
                                    {item.profiles.district.split(" ")[0]}
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                              <p className="text-xs sm:text-sm font-black text-slate-900 dark:text-slate-100">
                                ₦{Number(item.price).toLocaleString()}
                              </p>
                              <span className="text-[10px] font-semibold text-slate-400 group-hover:text-blue-600 transition">
                                Inspect &rarr;
                              </span>
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    </div>
                  );
                })
              ) : (
                <div className="col-span-full p-8 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
                  <p className="text-xs text-slate-400">
                    No hardware listings currently published.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Operational Trust Pillars */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/90 dark:border-slate-800">
            <div className="flex items-start gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-4 h-4" />
              </div>
              
            </div>

            <div className="flex items-start gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center shrink-0">
                <Lock className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-bold text-xs text-slate-900 dark:text-slate-100">
                  Buyer Protection
                </h4>
               
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-sky-50 dark:bg-sky-950 text-sky-600 flex items-center justify-center shrink-0">
                <Truck className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-bold text-xs text-slate-900 dark:text-slate-100">
                  Intra-City Logistics
                </h4>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Direct dispatch across all Abuja districts
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950 text-purple-600 flex items-center justify-center shrink-0">
                <RotateCcw className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-bold text-xs text-slate-900 dark:text-slate-100">
                  Hardware Inspection
                </h4>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Test screen, battery, and condition before release
                </p>
              </div>
            </div>
          </div>
        </main>

        <BuyerRightSidebar
          user={{
            id: user.id,
            email: user.email,
            fullName: userProfile?.full_name,
            role: userProfile?.role,
            techTrustStatus: userProfile?.tech_trust_status,
          }}
          activeListingsCount={products?.length || 0}
        />
      </div>
    </div>
  );
}