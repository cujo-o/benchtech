import Link from 'next/link'
import { Navbar } from '@/components/Navbar'
import { FileText, ArrowLeft } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Terms of Service | BenchTech Abuja',
  description: 'Marketplace Terms of Service, Buyer Inspection Rules, and Seller Verification Policies on BenchTech.',
}

export default function TermsOfServicePage() {
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
              <FileText className="w-4 h-4" /> Marketplace Terms &amp; Operating Rules
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              BenchTech Terms of Service
            </h1>
            <p className="text-xs text-slate-400">
              Effective Date: October 27, 2026 • BenchTech Technologies (Abuja, Nigeria)
            </p>
          </div>

          <section className="space-y-2">
            <h2 className="text-base font-black text-slate-900 dark:text-white">
              1. Marketplace Role &amp; One-Time Seller Verification
            </h2>
            <p className="text-slate-600 dark:text-slate-300">
              BenchTech provides an electronics marketplace connecting buyers and verified merchants in Abuja. Sellers must complete one-time Individual KYC or Registered Business KYB onboarding (identity, address, CAC where applicable, and bank account name matching) before selling. Each individual hardware listing must include accurate technical specifications and a valid device serial or IMEI number.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-black text-slate-900 dark:text-white">
              2. Escrow, Handover OTP &amp; 7-Day Buyer Inspection Window
            </h2>
            <p className="text-slate-600 dark:text-slate-300">
              Buyer payments are held in escrow until physical delivery is confirmed via the buyer&apos;s 6-digit handover OTP code. Following verified delivery, orders enter a 7-day inspection window during which buyers may report undisclosed hardware defects before net proceeds are released to the seller.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-black text-slate-900 dark:text-white">
              3. Prohibition of Off-Platform Transactions
            </h2>
            <p className="text-slate-600 dark:text-slate-300">
              Attempting to move buyers off BenchTech or embedding phone numbers/external payment links in product descriptions is strictly prohibited and triggers account restriction or suspension.
            </p>
          </section>
        </div>
      </main>
    </div>
  )
}