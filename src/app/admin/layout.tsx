import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { signOut } from '@/app/(auth)/actions'
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
  FileBarChart,
  Settings,
  ExternalLink,
  LogOut,
  ChevronRight,
  type LucideIcon,
} from 'lucide-react'

interface NavItem {
  label: string
  href: string
  icon: LucideIcon
  count?: number
  danger?: boolean
  highlight?: boolean
}

interface NavSection {
  group: string | null
  items: NavItem[]
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login?next=/admin/overview')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    redirect('/feed')
  }

  // Fetch counts safely
  const { count: buyersCount } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('role', 'buyer')

  const { count: sellersCount } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('role', 'seller')

  const { count: productsCount } = await supabase
    .from('products')
    .select('*', { count: 'exact', head: true })

  const { count: pendingVerificationsCount } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('tech_trust_status', 'pending')

  let reportedCount = 0
  const { count: reports } = await supabase
    .from('product_reports')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending')
  if (reports) reportedCount = reports

  const SIDEBAR_NAV: NavSection[] = [
    {
      group: null,
      items: [
        { label: 'Overview', href: '/admin/overview', icon: LayoutDashboard },
      ],
    },
    {
      group: 'USERS',
      items: [
        {
          label: 'Buyers',
          href: '/admin/users?role=buyer',
          icon: Users,
          count: buyersCount ?? 0,
        },
        {
          label: 'Sellers',
          href: '/admin/users?role=seller',
          icon: Store,
          count: sellersCount ?? 0,
        },
        {
          label: 'Admins',
          href: '/admin/users?role=admin',
          icon: ShieldAlert,
        },
      ],
    },
    {
      group: 'MARKETPLACE',
      items: [
        {
          label: 'All Products',
          href: '/admin/products',
          icon: Package,
          count: productsCount ?? 0,
        },
        {
          label: 'Pending Approval',
          href: '/admin/products?status=hidden',
          icon: Clock,
        },
        {
          label: 'Reported Listings',
          href: '/admin/reports',
          icon: AlertOctagon,
          count: reportedCount,
          danger: reportedCount > 0,
        },
      ],
    },
    {
      group: 'SELLER MANAGEMENT',
      items: [
        {
          label: 'Verifications',
          href: '/admin/verifications',
          icon: ShieldCheck,
          count: pendingVerificationsCount ?? 0,
          highlight: (pendingVerificationsCount ?? 0) > 0,
        },
        {
          label: 'Subscriptions',
          href: '/admin/techpass',
          icon: Crown,
        },
      ],
    },
    {
      group: 'REPORTS & ANALYTICS',
      items: [
        {
          label: 'Sales & Inquiries',
          href: '/admin/overview',
          icon: FileBarChart,
        },
      ],
    },
    {
      group: 'SUPPORT & TRUST',
      items: [
        {
          label: 'Support Tickets',
          href: '/admin/support',
          icon: Headphones,
        },
        {
          label: 'Settings',
          href: '/admin/settings',
          icon: Settings,
        },
      ],
    },
  ]

  function getBadgeClass(item: NavItem) {
    if (item.danger) return 'bg-rose-500 text-white'
    if (item.highlight) return 'bg-amber-500 text-slate-950 font-black'
    return 'bg-white/10 text-slate-300'
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex text-slate-900 font-sans">
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
                  TechMart
                </h1>
                <span className="text-[9px] text-blue-400 font-bold uppercase tracking-wider block mt-1">
                  Admin Control Centre
                </span>
              </div>
            </Link>
          </div>

          {/* Navigation Items */}
          <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6 scrollbar-thin scrollbar-thumb-slate-800">
            {SIDEBAR_NAV.map((section, idx) => (
              <div key={idx} className="space-y-1">
                {section.group && (
                  <p className="text-[10px] font-bold text-slate-500 px-3 tracking-wider uppercase mb-1.5">
                    {section.group}
                  </p>
                )}
                {section.items.map((item) => {
                  const Icon = item.icon
                  const badgeClass = getBadgeClass(item)

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

                      {typeof item.count === 'number' && (
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${badgeClass}`}>
                          {item.count}
                        </span>
                      )}
                    </Link>
                  )
                })}
              </div>
            ))}
          </div>

          {/* Sidebar Footer */}
          <div className="p-3 border-t border-white/10 space-y-1">
            <Link
              href="/feed"
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
                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition"
              >
                <LogOut className="w-3.5 h-3.5" /> Sign Out
              </button>
            </form>
          </div>
        </div>
      </aside>

      {/* Main Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between gap-4 sticky top-0 z-40">
          <div className="flex items-center gap-3">
            <form action="/admin/products" method="GET">
              <input
                type="text"
                name="q"
                placeholder="Search users, orders, hardware listings..."
                className="w-72 sm:w-96 text-xs bg-slate-50 border border-slate-200 px-3.5 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
              />
            </form>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2.5 pl-3 border-l border-slate-200">
              <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs shadow-sm">
                {profile?.full_name?.[0] || 'A'}
              </div>
              <div className="text-left hidden sm:block">
                <p className="text-xs font-bold text-slate-900 leading-tight">
                  {profile?.full_name || 'Admin'}
                </p>
                <p className="text-[10px] text-blue-600 font-semibold uppercase tracking-wider">
                  Super Admin
                </p>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 p-6 md:p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}