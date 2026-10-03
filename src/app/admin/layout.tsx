import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/(auth)/actions";
import {
  LayoutDashboard,
  Users,
  Store,
  ShieldAlert,
  Package,
  Clock,
  AlertOctagon,
  ShieldCheck,
  Crown,
  Headphones,
  Settings,
  ExternalLink,
  LogOut,
  ChevronRight,
  Building2,
  Megaphone,
  CreditCard,
  type LucideIcon,
} from "lucide-react";

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  count?: number;
  danger?: boolean;
  highlight?: boolean;
}

interface NavSection {
  group: string | null;
  items: NavItem[];
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/admin/overview");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, is_admin, roles, full_name")
    .eq("id", user.id)
    .single();

  const userRoles: string[] =
    profile?.roles || (profile?.role ? [profile.role] : []);
  const isAdmin =
    profile?.is_admin === true ||
    profile?.role === "admin" ||
    userRoles.includes("admin");

  if (!isAdmin) {
    redirect("/feed");
  }

  // Fetch real-time count badges in parallel
  const [
    { count: buyersCount },
    { count: sellersCount },
    { count: productsCount },
    { count: pendingVerificationsCount },
    { count: pendingPayoutsCount },
    { count: activeDisputesCount },
    { count: reportedListingsCount },
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("role", "buyer"),
    supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .or("role.eq.seller,seller_plan.eq.pro"),
    supabase.from("products").select("*", { count: "exact", head: true }),
    supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("tech_trust_status", "pending"),
    supabase
      .from("payout_requests")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending"),
    supabase
      .from("orders")
      .select("*", { count: "exact", head: true })
      .eq("status", "disputed"),
    supabase
      .from("product_reports")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending"),
  ]);

  const SIDEBAR_NAV: NavSection[] = [
    {
      group: null,
      items: [
        { label: "Overview", href: "/admin/overview", icon: LayoutDashboard },
      ],
    },
    {
      group: "FINANCIALS & ESCROW",
      items: [
        {
          label: "Bank Payouts",
          href: "/admin/payouts",
          icon: Building2,
          count: pendingPayoutsCount ?? 0,
          highlight: (pendingPayoutsCount ?? 0) > 0,
        },
        {
          label: "Escrow Disputes",
          href: "/admin/disputes",
          icon: ShieldAlert,
          count: activeDisputesCount ?? 0,
          danger: (activeDisputesCount ?? 0) > 0,
        },
        {
          label: "Ad Engine & Rates",
          href: "/admin/advertising",
          icon: Megaphone,
        },
      ],
    },
    {
      group: "USERS",
      items: [
        {
          label: "Buyers",
          href: "/admin/users?role=buyer",
          icon: Users,
          count: buyersCount ?? 0,
        },
        {
          label: "Sellers",
          href: "/admin/users?role=seller",
          icon: Store,
          count: sellersCount ?? 0,
        },
        {
          label: "Admins",
          href: "/admin/users?role=admin",
          icon: ShieldCheck,
        },
      ],
    },
    {
      group: "MARKETPLACE",
      items: [
        {
          label: "All Products",
          href: "/admin/products",
          icon: Package,
          count: productsCount ?? 0,
        },
        {
          label: "Pending Approval",
          href: "/admin/products?status=hidden",
          icon: Clock,
        },
        {
          label: "Reported Listings",
          href: "/admin/reports",
          icon: AlertOctagon,
          count: reportedListingsCount ?? 0,
          danger: (reportedListingsCount ?? 0) > 0,
        },
      ],
    },
    {
      group: "SELLER MANAGEMENT",
      items: [
        {
          label: "Verifications",
          href: "/admin/verifications",
          icon: ShieldCheck,
          count: pendingVerificationsCount ?? 0,
          highlight: (pendingVerificationsCount ?? 0) > 0,
        },
        {
          label: "Subscriptions",
          href: "/admin/techpass",
          icon: Crown,
        },
      ],
    },
    {
      group: "SUPPORT & TRUST",
      items: [
        {
          label: "Support Tickets",
          href: "/admin/support",
          icon: Headphones,
        },
        {
          label: "Platform Settings",
          href: "/admin/settings",
          icon: Settings,
        },
      ],
    },
    {
      group: "FINANCIALS & ESCROW",
      items: [
        {
          label: "Bank Payouts",
          href: "/admin/payouts",
          icon: Building2,
          count: pendingPayoutsCount ?? 0,
          highlight: (pendingPayoutsCount ?? 0) > 0,
        },
        {
          label: "Escrow Disputes",
          href: "/admin/disputes",
          icon: ShieldAlert,
          count: activeDisputesCount ?? 0,
          danger: (activeDisputesCount ?? 0) > 0,
        },
        {
          label: "Support Operations",
          href: "/admin/support-desk",
          icon: Headphones,
        },
        {
          label: "Ad Engine & Rates",
          href: "/admin/advertising",
          icon: Megaphone,
        },
      ],
    },
  ];

  function getBadgeClass(item: NavItem) {
    if (item.danger) return "bg-rose-500 text-white font-bold";
    if (item.highlight) return "bg-amber-400 text-slate-950 font-black";
    return "bg-white/10 text-slate-300";
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 flex text-slate-900 dark:text-slate-100 font-sans transition-colors">
      {/* Deep Navy Left Sidebar */}
      <aside className="w-64 bg-[#0A1128] text-slate-300 hidden xl:flex flex-col justify-between shrink-0 border-r border-slate-800/80 select-none">
        <div className="flex flex-col h-full">
          {/* Logo Brand */}
          <div className="p-5 border-b border-white/10 flex items-center justify-between">
            <Link href="/admin/overview" className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-600 text-white font-black flex items-center justify-center text-sm shadow-md shadow-blue-500/20">
                T
              </div>
              <div>
                <h1 className="font-black text-white text-base leading-none tracking-tight">
                  BenchTech
                </h1>
                <span className="text-[9px] text-blue-400 font-bold uppercase tracking-wider block mt-1">
                  Admin Control Centre
                </span>
              </div>
            </Link>
          </div>

          {/* Navigation Items */}
          <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6 [scrollbar-width:thin] [scrollbar-color:#334155_transparent]">
            {SIDEBAR_NAV.map((section, idx) => (
              <div key={idx} className="space-y-1">
                {section.group && (
                  <p className="text-[10px] font-bold text-slate-500 px-3 tracking-wider uppercase mb-1.5">
                    {section.group}
                  </p>
                )}
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const badgeClass = getBadgeClass(item);

                  return (
                    <Link
                      key={item.label}
                      href={item.href}
                      className="group flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/[0.08] transition duration-150"
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className="w-4 h-4 text-slate-400 group-hover:text-blue-400 transition" />
                        <span>{item.label}</span>
                      </div>

                      {typeof item.count === "number" && item.count > 0 && (
                        <span
                          className={`text-[10px] px-2 py-0.2 rounded-full ${badgeClass}`}
                        >
                          {item.count}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Sidebar Footer */}
          <div className="p-3 border-t border-white/10 space-y-1">
            <Link
              href="/products"
              className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-white/[0.05] transition"
            >
              <span className="flex items-center gap-2">
                <ExternalLink className="w-3.5 h-3.5" /> Return to Storefront
              </span>
              <ChevronRight className="w-3 h-3 text-slate-600" />
            </Link>

            <form action={signOut}>
              <button
                type="submit"
                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" /> Sign Out
              </button>
            </form>
          </div>
        </div>
      </aside>

      {/* Main Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 flex items-center justify-between gap-4 sticky top-0 z-40 transition-colors">
          <div className="flex items-center gap-3">
            <form action="/admin/products" method="GET">
              <input
                type="text"
                name="q"
                placeholder="Search users, orders, hardware listings..."
                className="w-72 sm:w-96 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3.5 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
              />
            </form>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2.5 pl-3 border-l border-slate-200 dark:border-slate-800">
              <div className="w-8 h-8 rounded-full bg-slate-900 dark:bg-slate-800 text-white flex items-center justify-center font-bold text-xs shadow-xs border border-slate-200 dark:border-slate-700">
                {profile?.full_name?.[0] || "A"}
              </div>
              <div className="text-left hidden sm:block">
                <p className="text-xs font-bold text-slate-900 dark:text-slate-100 leading-tight">
                  {profile?.full_name || "Admin"}
                </p>
                <p className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold uppercase tracking-wider">
                  Super Admin
                </p>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
