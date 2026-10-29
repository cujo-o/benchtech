import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { Navbar } from '@/components/Navbar'
import { BuyerSidebar } from '@/components/storefront/BuyerSidebar'
import { HelpCenterClient } from './HelpCenterClient'
import { ShieldCheck, Lock, FileText } from 'lucide-react'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Customer Support, Help Center & Privacy Policy | BenchTech Abuja',
  description:
    'BenchTech Customer Support Center, Order & Delivery Lookup, Privacy Policy, Data Collection & Google OAuth User Data Compliance.',
}

function getAdminDb() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  return createAdminClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

export default async function HelpPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const adminDb = getAdminDb()

  let profile: any = null
  let userTickets: any[] = []
  let userOrders: any[] = []

  if (user) {
    const [profileRes, ticketsRes, ordersRes] = await Promise.all([
      adminDb.from('profiles').select('*').eq('id', user.id).maybeSingle(),
      adminDb
        .from('support_tickets')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false }),
      adminDb
        .from('orders')
        .select('id, order_number, payment_reference, total_amount, amount, order_status, delivery_status, created_at, product:products(title)')
        .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
        .order('created_at', { ascending: false })
        .limit(15),
    ])

    profile = profileRes.data
    userOrders = ordersRes.data || []

    const rawTickets = ticketsRes.data || []
    if (rawTickets.length > 0) {
      const ticketIds = rawTickets.map((t: any) => t.id)
      const { data: msgs } = await adminDb
        .from('support_ticket_messages')
        .select('*')
        .in('ticket_id', ticketIds)
        .eq('is_internal_note', false)
        .order('created_at', { ascending: true })

      const msgMap = new Map<string, any[]>()
      for (const m of msgs || []) {
        const list = msgMap.get(m.ticket_id) || []
        list.push(m)
        msgMap.set(m.ticket_id, list)
      }

      userTickets = rawTickets.map((t: any) => ({
        ...t,
        messages: msgMap.get(t.id) || [],
      }))
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col">
      <Navbar />

      <div className="max-w-[1700px] w-full mx-auto flex flex-1">
        <BuyerSidebar />

        <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 space-y-10">
          <HelpCenterClient
            user={user ? { id: user.id, email: user.email || '' } : null}
            profile={profile}
            initialTickets={userTickets}
            initialOrders={userOrders}
          />

          {/* =================================================================
              OFFICIAL BENCHTECH PRIVACY POLICY & GOOGLE OAUTH DATA DISCLOSURE
              (Always rendered in HTML so Google OAuth Verification Crawler passes)
              ================================================================= */}
          <section
            id="privacy-policy"
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6 text-xs leading-relaxed text-slate-600 dark:text-slate-300"
          >
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-2.5">
                <Lock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <div>
                  <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                    BenchTech Privacy Policy, Data Collection &amp; Terms of Service
                  </h2>
                  <p className="text-[11px] text-slate-400">
                    Effective Date: October 2026 • Controller: BenchTech Technologies (shopbenchtech.com) • Abuja, Nigeria
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 text-xs font-bold text-blue-600 dark:text-blue-400">
                <Link href="/privacy" className="hover:underline">
                  Standalone Privacy Policy
                </Link>
                <span>•</span>
                <Link href="/terms" className="hover:underline">
                  Terms of Service
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
                  1. Information We Collect (Including Google OAuth Data)
                </h3>
                <p>
                  When you register or sign in to <strong>BenchTech</strong> (<code>https://shopbenchtech.com</code>) using Google Sign-In (Google OAuth 2.0) or email authentication, we collect only the minimum necessary identity information authorized by you:
                </p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>
                    <strong>Google Account Basic Profile Data:</strong> Your full name, email address, and Google profile avatar URL (via standard <code>openid</code>, <code>email</code>, and <code>profile</code> scopes).
                  </li>
                  <li>
                    <strong>Marketplace &amp; Delivery Data:</strong> Your phone number, Abuja delivery district, street address, order history, and support tickets.
                  </li>
                  <li>
                    <strong>One-Time Seller Verification (KYC/KYB) Data:</strong> For users who register as sellers, we collect government identification documents, CAC business registration certificates, residential/business address proofs, and Nigerian bank account details for payout settlement.
                  </li>
                </ul>

                <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white pt-2">
                  2. How We Use Your Information
                </h3>
                <p>
                  BenchTech uses your personal and Google user data strictly to provide and secure our technology marketplace services:
                </p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>To authenticate your identity and maintain your buyer, seller, or courier session.</li>
                  <li>To process hardware orders, generate 6-digit buyer handover OTP codes, and coordinate courier deliveries across Abuja.</li>
                  <li>To verify seller identities once at onboarding, match payout bank account names, and prevent fraud or duplicate listings.</li>
                  <li>To send transactional account recovery, verification, and order notifications from <code>admin@shopbenchtech.com</code>.</li>
                </ul>
              </div>

              <div className="space-y-3">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
                  3. Data Sharing, Storage &amp; Google API Limited Use Disclosure
                </h3>
                <p>
                  BenchTech&apos;s use and transfer to any other app of information received from Google APIs adheres strictly to the{' '}
                  <strong>Google API Services User Data Policy</strong>, including the Limited Use requirements:
                </p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>
                    <strong>No Sale of Personal Data:</strong> We never sell, rent, or trade your Google user data or personal information to third parties or advertisers.
                  </li>
                  <li>
                    <strong>Restricted Third-Party Sharing:</strong> Data is shared only with authorized infrastructure providers necessary to complete your transactions (such as Paystack for payment processing and bank NUBAN resolution, and Supabase for encrypted database storage).
                  </li>
                  <li>
                    <strong>Security Controls:</strong> All data is transmitted over HTTPS/TLS 1.3 and stored with strict Row-Level Security (RLS) and append-only audit logging. Sensitive seller KYC documents are stored in private buckets and never exposed publicly.
                  </li>
                </ul>

                <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white pt-2">
                  4. Data Retention, Deletion Rights &amp; Contact Information
                </h3>
                <p>
                  In accordance with the Nigeria Data Protection Act (NDPA) and international privacy standards, you have the right to access, update, export, or request the permanent deletion of your account and personal data at any time.
                </p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>
                    <strong>How to Request Data Deletion:</strong> You may update your profile in <Link href="/settings" className="text-blue-600 underline">Account Settings</Link> or request complete account deletion by opening a support ticket on this page or emailing our Data Protection Officer at <strong>admin@shopbenchtech.com</strong> or <strong>benchtech44@gmail.com</strong>.
                  </li>
                </ul>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  )
}