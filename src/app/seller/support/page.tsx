import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
  ShieldCheck,
  Mail,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react'

export default function SellerSupportPage() {
  const faqs = [
    {
      q: 'Do I need to re-verify my seller account every time I post a product?',
      a: 'No. Seller identity, business CAC, address, and bank verification are completed once during onboarding. Once approved, you can publish listings anytime without repeating seller verification.',
    },
    {
      q: 'How does per-product verification work?',
      a: 'Each hardware listing includes category-specific specifications and a device IMEI or serial number check to prevent duplicate listings. High-value items can also include optional ownership proof.',
    },
    {
      q: 'When are order payouts released to my bank account?',
      a: 'When an order is delivered and verified via the buyer handover OTP, funds enter the standard buyer inspection window and are then released to your linked Nigerian bank account.',
    },
  ]

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xs">
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
          Seller Help &amp; Support
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Guidelines on one-time seller verification, hardware grading, and order settlements.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 space-y-2.5 shadow-xs">
          <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <Mail className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-black text-slate-900 dark:text-white">
            Email Support Desk
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Contact our operations team regarding payouts, orders, or account verification.
          </p>
          <a href="mailto:admin@shopbenchtech.com" className="inline-block pt-1">
            <Button
              size="sm"
              variant="outline"
              className="text-xs font-bold h-9 rounded-xl gap-1.5 border-slate-200 dark:border-slate-700"
            >
              <span>admin@shopbenchtech.com</span>
              <ExternalLink className="w-3 h-3" />
            </Button>
          </a>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 space-y-2.5 shadow-xs">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-black text-slate-900 dark:text-white">
            Verification Status
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Review your one-time Individual or Registered Business verification status.
          </p>
          <Link href="/seller/onboarding" className="inline-block pt-1">
            <Button
              size="sm"
              variant="outline"
              className="text-xs font-bold h-9 rounded-xl border-slate-200 dark:border-slate-700"
            >
              View Verification Status
            </Button>
          </Link>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
        <h2 className="text-sm font-black text-slate-900 dark:text-white">
          Listing Standards
        </h2>
        <ul className="space-y-2.5 text-xs text-slate-600 dark:text-slate-300">
          <li className="flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span>
              <strong>Accurate Condition Grading:</strong> Clearly state whether an item is Brand New, Open Box, Foreign Used, or Direct Used.
            </span>
          </li>
          <li className="flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span>
              <strong>Real Hardware Photos:</strong> Upload photos of the actual item rather than generic marketing renders.
            </span>
          </li>
          <li className="flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span>
              <strong>On-Platform Transactions:</strong> Do not place phone numbers or external chat links inside product titles or descriptions.
            </span>
          </li>
        </ul>
      </div>

      <div className="space-y-3">
        <h2 className="text-sm font-black text-slate-900 dark:text-white">
          Frequently Asked Questions
        </h2>
        {faqs.map((faq, idx) => (
          <div
            key={idx}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-1 text-xs"
          >
            <p className="font-bold text-slate-900 dark:text-white">{faq.q}</p>
            <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
              {faq.a}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}