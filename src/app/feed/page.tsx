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
  Flame,
  ArrowRight,
  ArrowUpRight,
  Sparkles,
  Crown,
  Package,
  MapPin,
  Bot,
  Scale,
  Wrench,
  Tag,
  BookOpen,
  GraduationCap,
  Shield,
  Star,
  CheckCircle2,
  Clock,
  ExternalLink,
} from "lucide-react";

// Edge cache for 30s to keep TTFB fast under high concurrent traffic
export const revalidate = 30;

export const metadata: Metadata = {
  title: "BenchTech | Abuja’s Premier Tech & Gadget Marketplace",
  description:
    "Buy, sell, and compare authentic smartphones, laptops, gaming gear, and accessories across Abuja. Browse verified merchants in Banex Plaza, Emab, and Wuse 2 with physical inspection guarantees.",
  keywords: [
    "BenchTech Abuja",
    "Abuja tech marketplace",
    "buy iPhone Abuja",
    "laptops Banex plaza",
    "Emab plaza gadgets",
    "used laptops Abuja",
    "computer village Abuja",
    "verified phone dealers Wuse 2",
    "Samsung Abuja deals",
    "TechPass Abuja",
  ],
  openGraph: {
    title: "BenchTech | Abuja’s Verified Tech Marketplace",
    description:
      "Buy, sell, and compare authentic gadgets across Abuja. Safe physical inspection and verified dealers in Banex & Emab.",
    url: "https://shopbenchtech.com/feed",
    siteName: "BenchTech",
    locale: "en_NG",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "BenchTech | Abuja’s Verified Tech Marketplace",
    description:
      "Buy, sell, and compare authentic gadgets across Abuja with trusted merchant verification.",
  },
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
    desc: "Answer a few questions to get personalized recommendations.",
    cta: "Start Now",
    href: "/assistant",
    icon: Bot,
    color: "from-blue-600 to-indigo-700",
    iconBg: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
    btnBg: "bg-blue-600 hover:bg-blue-700 text-white",
  },
  {
    title: "Compare Tech",
    desc: "Compare specs, prices, and features side by side.",
    cta: "Compare Now",
    href: "/compare",
    icon: Scale,
    color: "from-purple-600 to-violet-700",
    iconBg:
      "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300",
    btnBg: "bg-purple-600 hover:bg-purple-700 text-white",
  },
  {
    title: "Build My Setup",
    desc: "Create your perfect setup (gaming, school, work, editing).",
    cta: "Start Building",
    href: "/requests/new",
    icon: Wrench,
    color: "from-emerald-600 to-teal-700",
    iconBg:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
    btnBg: "bg-emerald-600 hover:bg-emerald-700 text-white",
  },
  {
    title: "Sell Your Tech",
    desc: "Turn your old gadgets into cash. Fast, verified, and secure.",
    cta: "Start Selling",
    href: "/seller/listings/new",
    icon: Tag,
    color: "from-orange-600 to-rose-600",
    iconBg:
      "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300",
    btnBg: "bg-orange-600 hover:bg-orange-700 text-white",
  },
  {
    title: "Learn Tech",
    desc: "Device testing checklists, IMEI check guides & Abuja tips.",
    cta: "Explore Hub",
    href: "/help",
    icon: BookOpen,
    color: "from-amber-600 to-yellow-600",
    iconBg: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
    btnBg: "bg-amber-600 hover:bg-amber-700 text-white",
  },
];

const FEATURED_BRANDS = [
  "Apple",
  "Samsung",
  "Dell",
  "HP",
  "Lenovo",
  "ASUS",
  "Sony",
  "Canon",
  "Microsoft",
];

export default async function FeedPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/feed");
  }

  const now = new Date().toISOString();

  // Parallel database telemetry
  const [
    { data: userProfile },
    { data: heroPromos },
    { data: dealsPromos },
    { data: products },
  ] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single(),

    supabase
      .from("promotions")
      .select(
        "*, products(*), profiles(business_name, district, tech_trust_status)",
      )
      .eq("package_type", "homepage_hero")
      .eq("status", "active")
      .gt("ends_at", now)
      .order("created_at", { ascending: false })
      .limit(1),

    supabase
      .from("promotions")
      .select(
        "*, products(*), profiles(business_name, district, tech_trust_status)",
      )
      .eq("package_type", "deals_spotlight")
      .eq("status", "active")
      .gt("ends_at", now)
      .order("created_at", { ascending: false })
      .limit(4),

    supabase
      .from("products")
      .select(
        "*, profiles!products_seller_id_fkey(business_name, district, tech_trust_status)",
      )
      .eq("status", "published")
      .order("is_featured", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false })
      .limit(16),
  ]);

  const activeHero = heroPromos?.[0] || null;

  return (
    <div className="min-h-screen bg-slate-100/60 dark:bg-slate-950 flex flex-col">
      <Navbar />

      <div className="max-w-[1700px] w-full mx-auto flex flex-1">
        <BuyerSidebar />

        <main className="flex-1 min-w-0 p-2.5 sm:p-4 md:p-6 space-y-6">
          {/* =========================================================
              1. HERO BANNER
          ========================================================= */}
          {activeHero?.products ? (
            <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-blue-950 text-white rounded-2xl sm:rounded-3xl p-5 sm:p-7 md:p-8 relative overflow-hidden shadow-xs flex flex-col md:flex-row items-center justify-between gap-5 border border-blue-900/40">
              <div className="space-y-3 max-w-lg z-10 w-full">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className="bg-amber-400 text-slate-950 font-black text-[10px] uppercase tracking-wider px-2 py-0.5 border-none flex items-center gap-1 shadow-xs">
                    <Crown className="w-2.5 h-2.5 fill-slate-950" /> Featured
                    Tech
                  </Badge>
                  <span className="text-xs text-blue-300 font-semibold truncate max-w-[200px]">
                    {activeHero.profiles?.business_name || "Verified Vendor"}
                  </span>
                </div>

                <h1 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight text-white leading-tight">
                  {activeHero.products.title}
                </h1>

                <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                  {activeHero.products.description ||
                    "Verified Abuja technology available for physical inspection and pickup or express dispatch."}
                </p>

                <div className="flex items-center gap-3 pt-1">
                  <span className="text-xl sm:text-2xl font-black text-amber-300">
                    ₦{Number(activeHero.products.price).toLocaleString()}
                  </span>
                  <Link href={`/products/${activeHero.products.id}`}>
                    <Button className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 sm:px-5 h-9 rounded-xl gap-1.5 shadow-xs">
                      View Gadget <ArrowRight className="w-3.5 h-3.5" />
                    </Button>
                  </Link>
                </div>
              </div>

              <div className="relative z-10 w-full md:w-64 aspect-[16/9] md:aspect-[4/3] bg-white/5 rounded-2xl border border-white/10 flex items-center justify-center p-3 backdrop-blur-xs">
                {activeHero.products.images?.[0] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={activeHero.products.images[0]}
                    alt={activeHero.products.title}
                    loading="lazy"
                    decoding="async"
                    className="max-h-full max-w-full object-contain drop-shadow-xl"
                  />
                ) : (
                  <Package className="w-10 h-10 text-slate-400" />
                )}
              </div>
            </div>
          ) : (
            <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-blue-950 text-white rounded-2xl sm:rounded-3xl p-5 sm:p-7 md:p-8 relative overflow-hidden shadow-xs flex flex-col md:flex-row justify-between items-center gap-6 border border-slate-800">
              <div className="space-y-3 max-w-lg z-10 w-full">
                <span className="text-[10px] sm:text-xs uppercase tracking-wider text-blue-400 font-bold block">
                  Your One-Stop Tech Marketplace
                </span>
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight leading-tight">
                  Find the Right Tech. <br />
                  <span className="text-blue-500">For Your Life.</span>
                </h1>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  Buy, Compare, Learn, Sell, Upgrade. Everything tech in Abuja,
                  made simple with physical inspection guarantees.
                </p>

                {/* Trust guarantee pill indicators */}
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/10 text-[10px] font-semibold text-slate-200">
                    <ShieldCheck className="w-3 h-3 text-emerald-400" />{" "}
                    Verified Sellers
                  </span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/10 text-[10px] font-semibold text-slate-200">
                    <Truck className="w-3 h-3 text-sky-400" /> Abuja Fast
                    Delivery
                  </span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/10 text-[10px] font-semibold text-slate-200">
                    <Lock className="w-3 h-3 text-purple-400" /> Escrow Safe
                  </span>
                </div>

                <div className="pt-2 flex items-center gap-3">
                  <Link href="/products">
                    <Button className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-5 h-9 rounded-xl gap-1.5 shadow-xs">
                      Shop Now <ArrowRight className="w-3.5 h-3.5" />
                    </Button>
                  </Link>
                  <Link href="/help#safety">
                    <Button
                      variant="ghost"
                      className="text-xs font-bold h-9 px-4 rounded-xl bg-white text-slate-900 hover:bg-slate-100 hover:text-slate-950 border-none transition shadow-xs"
                    >
                      Buyer Safety Guide
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Visual Banner Card */}
              <div className="hidden md:flex flex-col items-center justify-center p-5 bg-white/5 border border-white/10 rounded-2xl text-center w-64 shrink-0 backdrop-blur-xs">
                <Sparkles className="w-7 h-7 text-amber-400 mb-1.5 animate-pulse" />
                <p className="text-xs font-black text-slate-100">
                  Abuja Verified Tech
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Banex • Emab • Wuse 2
                </p>
                <div className="mt-3 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/30">
                  ● 100% Inspected Hardware
                </div>
              </div>
            </div>
          )}

          {/* =========================================================
              2. FIVE-TILE FEATURE ACTION GRID (Directly from Mockup)
          ========================================================= */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {FEATURE_TILES.map((tile) => {
              const Icon = tile.icon;
              return (
                <div
                  key={tile.title}
                  className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-3.5 flex flex-col justify-between space-y-3 hover:shadow-sm hover:border-slate-300 dark:hover:border-slate-700 transition group"
                >
                  <div className="space-y-2">
                    <div
                      className={`w-9 h-9 rounded-xl ${tile.iconBg} flex items-center justify-center shrink-0`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-black text-xs sm:text-sm text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition">
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
                      className={`w-full py-1.5 px-2.5 rounded-xl font-bold text-[11px] ${tile.btnBg} flex items-center justify-center gap-1 transition shadow-2xs`}
                    >
                      <span>{tile.cta}</span>
                      <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition" />
                    </button>
                  </Link>
                </div>
              );
            })}
          </div>

          {/* =========================================================
              3. CATEGORY CHIPS WITH "VIEW ALL"
          ========================================================= */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <h2 className="text-xs sm:text-sm font-black text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                Shop by Category
              </h2>
              <Link
                href="/products"
                className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
              >
                <span>View All Categories</span>{" "}
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
                    className="flex flex-col items-center gap-1 p-2 sm:p-2.5 rounded-xl sm:rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-blue-500 hover:shadow-2xs min-w-[62px] sm:min-w-[76px] transition group shrink-0"
                  >
                    <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 group-hover:bg-blue-50 group-hover:text-blue-600 transition">
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

          {/* =========================================================
              4. TODAY'S TOP DEALS (Deals Spotlight with Ratings & Verification)
          ========================================================= */}
          {dealsPromos && dealsPromos.length > 0 && (
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/60 dark:border-slate-800 pb-2">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-red-100 dark:bg-red-950 text-red-600 flex items-center justify-center">
                    <Flame className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-sm sm:text-base font-black text-slate-900 dark:text-slate-100">
                        Today’s Top Deals
                      </h2>
                      <Badge className="bg-red-500 text-white text-[9px] font-black uppercase px-1.5 py-0.2">
                        Limited Time
                      </Badge>
                    </div>
                    <p className="text-[10px] text-slate-400">
                      Exclusive discounted hardware in Abuja
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {/* Countdown Ticker Simulation */}
                  <div className="flex items-center gap-1 text-[10px] font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-lg">
                    <Clock className="w-3 h-3 text-red-500" />
                    <span>24h Deals Window</span>
                  </div>

                  <Link
                    href="/products?filter=deals"
                    className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    View All Deals &rarr;
                  </Link>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-3.5">
                {dealsPromos.map((deal, idx) => {
                  const item = deal.products;
                  if (!item) return null;

                  const discountPercent =
                    idx === 0
                      ? "-20%"
                      : idx === 1
                        ? "-15%"
                        : idx === 2
                          ? "-25%"
                          : "-10%";
                  const originalPrice = Math.round(Number(item.price) * 1.2);

                  return (
                    <div key={deal.id} className="relative group">
                      <SaveButton product={item} />
                      <Link href={`/products/${item.id}`}>
                        <Card className="h-full border border-red-200/90 dark:border-red-950/80 rounded-2xl overflow-hidden hover:shadow-md transition bg-white dark:bg-slate-900 flex flex-col justify-between">
                          <div className="aspect-square bg-slate-50 dark:bg-slate-800/40 relative overflow-hidden p-2 flex items-center justify-center">
                            <Badge className="absolute top-2.5 left-2.5 bg-red-600 text-white border-none text-[9px] font-black uppercase px-1.5 py-0.5 shadow-xs">
                              {discountPercent}
                            </Badge>

                            {item.images?.[0] ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={item.images[0]}
                                alt={item.title}
                                loading="lazy"
                                decoding="async"
                                className="max-h-full object-contain group-hover:scale-105 transition duration-300"
                              />
                            ) : (
                              <Package className="w-8 h-8 text-slate-300" />
                            )}
                          </div>

                          <CardContent className="p-3 flex-1 flex flex-col justify-between space-y-2">
                            <div>
                              <h3 className="font-bold text-xs text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition line-clamp-1">
                                {item.title}
                              </h3>

                              {/* Rating & Verified Vendor Badge */}
                              <div className="flex items-center gap-1 text-[10px] text-amber-500 font-bold mt-1">
                                <Star className="w-3 h-3 fill-amber-400 stroke-amber-400" />
                                <span>4.9</span>
                                <span className="text-slate-400 font-normal">
                                  ({idx * 14 + 18})
                                </span>
                              </div>

                              <div className="flex items-center gap-1 text-[10px] text-slate-400 truncate mt-0.5">
                                <span className="font-semibold text-slate-700 dark:text-slate-300 truncate">
                                  {deal.profiles?.business_name ||
                                    "Verified Vendor"}
                                </span>
                                <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                              </div>
                            </div>

                            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                              <div>
                                <p className="text-xs sm:text-sm font-black text-red-600">
                                  ₦{Number(item.price).toLocaleString()}
                                </p>
                                <p className="text-[9px] text-slate-400 line-through">
                                  ₦{originalPrice.toLocaleString()}
                                </p>
                              </div>

                              <span className="text-[10px] font-bold text-slate-400 group-hover:text-blue-600 flex items-center gap-0.5 transition">
                                Inspect <ArrowUpRight className="w-3 h-3" />
                              </span>
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* =========================================================
              5. "MORE FOR YOU" VALUE TILES (TechPass, Student Hub, Protection)
          ========================================================= */}
          <div className="space-y-2.5">
            <h2 className="text-xs sm:text-sm font-black text-slate-900 dark:text-slate-100 uppercase tracking-wider">
              More for You
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
              {/* Card 1: TechPass */}
              <div className="bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent border border-amber-300/60 dark:border-amber-900/60 rounded-2xl p-4 flex flex-col justify-between space-y-3">
                <div className="space-y-1.5">
                  <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-xs">
                    <Crown className="w-4 h-4" />
                  </div>
                  <h3 className="font-black text-sm text-slate-900 dark:text-slate-100">
                    TechPass Membership
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                    Zero delivery fees across Abuja districts, tracked warranty
                    cards, and direct vendor WhatsApp lines.
                  </p>
                </div>
                <Link href="/subscription">
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full text-xs font-bold rounded-xl h-8 border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-300 hover:bg-amber-100"
                  >
                    Create Your TechPass &rarr;
                  </Button>
                </Link>
              </div>

              {/* Card 2: Student Tech Hub */}
              <div className="bg-gradient-to-br from-blue-500/10 via-blue-500/5 to-transparent border border-blue-300/60 dark:border-blue-900/60 rounded-2xl p-4 flex flex-col justify-between space-y-3">
                <div className="space-y-1.5">
                  <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
                    <GraduationCap className="w-4 h-4" />
                  </div>
                  <h3 className="font-black text-sm text-slate-900 dark:text-slate-100">
                    Student Tech Hub
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                    Campus-verified discounts on programming laptops, iPads, and
                    accessories for Abuja tertiary students.
                  </p>
                </div>
                <Link href="/products?tag=student">
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full text-xs font-bold rounded-xl h-8 border-blue-300 dark:border-blue-800 text-blue-900 dark:text-blue-300 hover:bg-blue-100"
                  >
                    Get Student Discounts &rarr;
                  </Button>
                </Link>
              </div>

              {/* Card 3: Device Protection & Escrow */}
              <div className="bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent border border-emerald-300/60 dark:border-emerald-900/60 rounded-2xl p-4 flex flex-col justify-between space-y-3">
                <div className="space-y-1.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <h3 className="font-black text-sm text-slate-900 dark:text-slate-100">
                    TechTrust Guarantee
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                    Test battery health, screen touch, and IMEI at the seller’s
                    plaza booth before any payment release.
                  </p>
                </div>
                <Link href="/help#safety">
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full text-xs font-bold rounded-xl h-8 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-300 hover:bg-emerald-100"
                  >
                    Learn Safety Protocols &rarr;
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          {/* =========================================================
              6. AVAILABLE TECHNOLOGY (2-Column Mobile Feed)
          ========================================================= */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-red-500 fill-red-500" />
                <h2 className="text-xs sm:text-sm md:text-base font-black text-slate-900 dark:text-slate-100">
                  Available Technology
                </h2>
                <span className="text-[10px] text-slate-400 hidden sm:inline">
                  • Live verified listings
                </span>
              </div>
              <Link
                href="/products"
                className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline"
              >
                View All Catalog &rarr;
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-3.5">
              {products && products.length > 0 ? (
                products.map((item) => {
                  const isFeatured =
                    item.is_featured &&
                    item.featured_until &&
                    new Date(item.featured_until) > new Date();

                  return (
                    <div key={item.id} className="relative group">
                      <SaveButton product={item} />
                      <Link href={`/products/${item.id}`}>
                        <Card
                          className={`h-full rounded-2xl overflow-hidden hover:shadow-md transition bg-white dark:bg-slate-900 flex flex-col justify-between ${
                            isFeatured
                              ? "border-2 border-blue-400/80 ring-2 ring-blue-500/10 shadow-2xs"
                              : "border border-slate-200/80 dark:border-slate-800 shadow-2xs"
                          }`}
                        >
                          <div className="aspect-square bg-slate-50 dark:bg-slate-800/40 relative overflow-hidden p-2 flex items-center justify-center">
                            <div className="absolute top-2.5 left-2.5 flex flex-col gap-1 z-10">
                              {isFeatured && (
                                <Badge className="bg-blue-600 text-white border-none text-[8px] font-black uppercase tracking-wider flex items-center gap-0.5 shadow-xs px-1.5 py-0">
                                  <Sparkles className="w-2.5 h-2.5" /> Featured
                                </Badge>
                              )}
                              <Badge className="bg-slate-900/80 backdrop-blur-xs text-white border-none text-[8px] capitalize px-1.5 py-0">
                                {item.condition?.replace("_", " ") || "Good"}
                              </Badge>
                            </div>

                            {item.images?.[0] ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={item.images[0]}
                                alt={item.title}
                                loading="lazy"
                                decoding="async"
                                className="max-h-full object-contain group-hover:scale-105 transition duration-300"
                              />
                            ) : (
                              <div className="text-[10px] text-slate-400">
                                No Image
                              </div>
                            )}
                          </div>

                          <CardContent className="p-3 flex-1 flex flex-col justify-between space-y-2">
                            <div>
                              <h3 className="font-bold text-xs text-slate-900 dark:text-slate-100 group-hover:text-blue-600 transition line-clamp-1">
                                {item.title}
                              </h3>
                              <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1">
                                <span className="uppercase tracking-wider font-semibold truncate max-w-[60px] sm:max-w-none">
                                  {item.brand || "Device"}
                                </span>
                                {item.profiles?.district && (
                                  <span className="flex items-center gap-0.5 text-[9px] sm:text-[10px] shrink-0">
                                    <MapPin className="w-2.5 h-2.5 text-slate-400" />
                                    {item.profiles.district.split(" ")[0]}
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                              <p className="text-xs sm:text-sm font-black text-slate-900 dark:text-slate-100">
                                ₦{Number(item.price).toLocaleString()}
                              </p>
                              <span className="text-[10px] font-bold text-slate-400 group-hover:text-blue-600 flex items-center gap-0.5 transition">
                                Inspect <ArrowUpRight className="w-3 h-3" />
                              </span>
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    </div>
                  );
                })
              ) : (
                <div className="col-span-full p-8 text-center bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                  <p className="text-xs text-slate-500">
                    No items available yet.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* =========================================================
              7. "WHY SHOP AT BENCHTECH?" TRUST PILLARS
          ========================================================= */}
          <div className="space-y-3 pt-2">
            <h2 className="text-xs sm:text-sm font-black text-slate-900 dark:text-slate-100 uppercase tracking-wider">
              Why Shop at BenchTech?
            </h2>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs">
              <div className="flex items-start gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-xs text-slate-900 dark:text-slate-100">
                    Trusted Sellers
                  </h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    CAC &amp; ID verified Abuja plaza vendors
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center shrink-0">
                  <Lock className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-xs text-slate-900 dark:text-slate-100">
                    Secure Payments
                  </h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Escrow-backed buyer protection
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-sky-50 dark:bg-sky-950 text-sky-600 flex items-center justify-center shrink-0">
                  <Truck className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-xs text-slate-900 dark:text-slate-100">
                    Fast Delivery
                  </h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Prompt intra-city dispatch
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950 text-purple-600 flex items-center justify-center shrink-0">
                  <RotateCcw className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-xs text-slate-900 dark:text-slate-100">
                    Easy Returns
                  </h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Physical testing before release
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* =========================================================
              8. FEATURED BRANDS TICKER
          ========================================================= */}
          <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs flex flex-wrap items-center justify-between gap-3">
            <span className="text-xs font-black uppercase tracking-wider text-slate-400">
              Featured Brands
            </span>
            <div className="flex items-center gap-3 overflow-x-auto pb-1 sm:pb-0">
              {FEATURED_BRANDS.map((brand) => (
                <Link
                  key={brand}
                  href={`/products?q=${brand}`}
                  className="px-3 py-1 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition"
                >
                  {brand}
                </Link>
              ))}
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
