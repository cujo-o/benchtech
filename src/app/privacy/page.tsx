import Link from 'next/link'
import { Navbar } from '@/components/Navbar'
import { ShieldCheck, Lock, Mail, ArrowLeft } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy | BenchTech Abuja',
  description:
    'Official Privacy Policy and Google OAuth Data Collection & Usage Disclosure for BenchTech (shopbenchtech.com).',
}

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col">
      <Navbar />

      <main className="max-w-4xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8 text-xs sm:text-sm leading-relaxed">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-blue-600"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to BenchTech
        </Link>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-10 shadow-xs space-y-6">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-5 space-y-2">
            <div className="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 font-bold text-xs">
              <Lock className="w-4 h-4" /> Official Privacy &amp; Data Protection Policy
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              BenchTech Privacy Policy
            </h1>
            <p className="text-xs text-slate-400">
              Last Updated: October 27, 2026 • Website: https://shopbenchtech.com
            </p>
          </div>

          <section className="space-y-2">
            <h2 className="text-base font-black text-slate-900 dark:text-white">
              1. Overview &amp; Scope
            </h2>
            <p className="text-slate-600 dark:text-slate-300">
              BenchTech Technologies (&quot;BenchTech&quot;, &quot;we&quot;, &quot;our&quot;, or &quot;us&quot;) operates the BenchTech online electronics marketplace at <code>https://shopbenchtech.com</code>. This Privacy Policy explains what personal data we collect from buyers, sellers, and couriers, how we use and protect that data, and how we comply with Google OAuth API policies and the Nigeria Data Protection Act (NDPA).
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-black text-slate-900 dark:text-white">
              2. Data We Collect (Including Google Sign-In Data)
            </h2>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-600 dark:text-slate-300">
              <li>
                <strong>Google OAuth User Data:</strong> When you choose &quot;Continue with Google&quot;, we collect your basic Google profile details: your full name, email address, and profile picture URL (<code>openid</code>, <code>email</code>, and <code>profile</code> scopes). We do not request access to your contacts, Gmail messages, Google Drive, or calendar.
              </li>
              <li>
                <strong>Account &amp; Order Data:</strong> Phone numbers, Abuja delivery addresses, order references, handover OTP codes, and customer support messages.
              </li>
              <li>
                <strong>Seller Verification Data (KYC/KYB):</strong> For registered sellers, we collect legal identity documents (NIN/Passport/Driver&apos;s License), live selfie photos, CAC corporate documents, residential/business address proofs, and Nigerian bank account details for payout verification.
              </li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-black text-slate-900 dark:text-white">
              3. How We Use Your Data
            </h2>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-600 dark:text-slate-300">
              <li>Creating and authenticating your buyer, seller, or deliverer account.</li>
              <li>Processing electronics purchases, holding buyer funds in escrow during the 7-day inspection window, and disbursing net payouts to verified sellers.</li>
              <li>Verifying seller identities once at onboarding and preventing duplicate or fraudulent hardware listings.</li>
              <li>Providing customer support, order status lookups, and security notifications via <code>admin@shopbenchtech.com</code>.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-black text-slate-900 dark:text-white">
              4. Data Sharing, Security &amp; Google Limited Use Compliance
            </h2>
            <p className="text-slate-600 dark:text-slate-300">
              BenchTech&apos;s use and transfer of information received from Google APIs to any other app adheres to the Google API Services User Data Policy, including the Limited Use requirements. We never sell user data to third parties or use Google OAuth data for third-party advertising. Data is encrypted in transit (HTTPS/TLS) and at rest, with strict Row-Level Security and private storage buckets for verification documents.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-black text-slate-900 dark:text-white">
              5. Data Retention, Access &amp; Deletion
            </h2>
            <p className="text-slate-600 dark:text-slate-300">
              We retain account and transaction records only as long as your account is active or as required for financial audit compliance. You may update your details in <Link href="/settings" className="text-blue-600 underline">Account Settings</Link> or request full erasure of your account and personal data at any time by contacting us at:
            </p>
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 flex flex-wrap items-center gap-4 text-xs font-bold">
              <span className="flex items-center gap-1.5">
                <Mail className="w-4 h-4 text-blue-600" /> admin@shopbenchtech.com
              </span>
              <span>•</span>
              <span>benchtech44@gmail.com</span>
              <span>•</span>
              <span>Abuja, FCT, Nigeria</span>
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}