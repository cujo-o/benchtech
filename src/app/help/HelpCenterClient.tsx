'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  HelpCircle,
  Search,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  MapPin,
  MessageCircle,
  PhoneCall,
  AlertTriangle,
  ArrowRight,
  Store,
  Sparkles,
  CheckCircle2,
} from 'lucide-react'

interface FAQItem {
  q: string
  a: string
  category: 'safety' | 'buying' | 'selling' | 'account'
}

const FAQS: FAQItem[] = [
  {
    category: 'safety',
    q: 'How does physical inspection work before payment?',
    a: 'BenchTech enforces a strict inspect-first policy. Connect with the verified vendor through the platform and arrange to meet at their store (e.g. Banex Plaza, Emab Plaza, or Wuse 2). Test the battery health, screen, ports, and IMEI before handing over funds.',
  },
  {
    category: 'safety',
    q: 'Should I send an advance deposit to secure a gadget?',
    a: 'Never send advance booking deposits without inspecting the physical item. Verified BenchTech merchants maintain physical inventory at their registered plaza locations and will hold items for scheduled in-person visits.',
  },
  {
    category: 'buying',
    q: "How does the 'Request a Gadget' sourcing board work?",
    a: "If you cannot find your exact device or target specifications, use 'Request a Gadget' to broadcast your budget and preferred plaza. Verified Abuja dealers with matching stock will respond with live quotes.",
  },
  {
    category: 'buying',
    q: 'What is TechTrust verification on seller listings?',
    a: 'Sellers with the TechTrust Verified shield have uploaded verified government identification, business registration, or physical plaza booth credentials verified by our local Abuja operations team.',
  },
  {
    category: 'selling',
    q: 'How much does it cost to sell on BenchTech?',
    a: 'On the Free tier, listing gadgets is pay-as-you-sell with standard 10% commission. On the Pro Plan (₦5,000/month), vendors get 25 included listing credits, reduced 5% commission, and ₦2,500 promotional boost credits.',
  },
  {
    category: 'selling',
    q: 'How do I earn the Verified Merchant badge for my plaza store?',
    a: "Go to your Seller Hub, navigate to 'Store Verification', and upload your CAC certificate or photo ID along with your plaza shop number in Wuse 2 or Banex. Verification completes within 24 hours.",
  },
]

export function HelpCenterClient() {
  const [searchQuery, setSearchQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState<'all' | 'safety' | 'buying' | 'selling'>('all')
  const [openIndices, setOpenIndices] = useState<number[]>([0])
  const [reportSubmitted, setReportSubmitted] = useState(false)

  const toggleFAQ = (index: number) => {
    setOpenIndices((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    )
  }

  const filteredFAQs = FAQS.filter((faq) => {
    const matchesCat = activeCategory === 'all' || faq.category === activeCategory
    const matchesSearch =
      faq.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.a.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCat && matchesSearch
  })

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8 max-w-5xl mx-auto w-full">
      {/* Hero Header */}
      <div className="text-center space-y-3 py-4 sm:py-6">
        <Badge className="bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full">
          Support &amp; Safety Hub
        </Badge>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
          How can we help you?
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
          Inspection guidelines, merchant verification protocols, and customer care in Abuja.
        </p>

        {/* Search Bar */}
        <div className="relative max-w-lg mx-auto pt-2">
          <Search className="w-4 h-4 text-slate-400 absolute left-4 top-5 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search questions (e.g. Banex inspection, TechTrust, returns)..."
            className="w-full text-xs h-12 pl-11 pr-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-2xs focus:outline-none focus:border-blue-600"
          />
        </div>
      </div>

      {/* 3 Quick Action Channels */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <a
          href="https://wa.me/2348000000000?text=Hello%20BenchTech%20Support,%20I%20need%20help%20with%20a%20listing"
          target="_blank"
          rel="noopener noreferrer"
          className="group"
        >
          <Card className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 hover:border-emerald-500 transition shadow-2xs space-y-2">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center">
              <MessageCircle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-black text-slate-900 dark:text-slate-100 group-hover:text-emerald-600 transition">
                WhatsApp Support
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Instant chat with our Abuja desk</p>
            </div>
          </Card>
        </a>

        <a href="tel:+2348000000000" className="group">
          <Card className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 hover:border-blue-500 transition shadow-2xs space-y-2">
            <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center">
              <PhoneCall className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-black text-slate-900 dark:text-slate-100 group-hover:text-blue-600 transition">
                Phone Support
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Mon–Sat, 8:00 AM – 7:00 PM</p>
            </div>
          </Card>
        </a>

        <Link href="/requests/new" className="group">
          <Card className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 hover:border-purple-500 transition shadow-2xs space-y-2">
            <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-black text-slate-900 dark:text-slate-100 group-hover:text-purple-600 transition">
                Request a Gadget
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Broadcast specs to Banex vendors</p>
            </div>
          </Card>
        </Link>
      </div>

      {/* FAQs Section */}
      <div className="space-y-4">
        {/* Category Filter Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {[
            { id: 'all', label: 'All FAQs' },
            { id: 'safety', label: 'Safety & Inspection' },
            { id: 'buying', label: 'Buying & Orders' },
            { id: 'selling', label: 'Selling & Pro Hub' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id as any)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition shrink-0 ${
                activeCategory === cat.id
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* FAQ Accordion List */}
        <div className="space-y-2.5">
          {filteredFAQs.map((faq, idx) => {
            const isOpen = openIndices.includes(idx)
            return (
              <Card
                key={idx}
                className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-2xs"
              >
                <button
                  type="button"
                  onClick={() => toggleFAQ(idx)}
                  className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-3 font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100 hover:text-blue-600 transition"
                >
                  <span>{faq.q}</span>
                  {isOpen ? (
                    <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                  )}
                </button>
                {isOpen && (
                  <div className="px-4 sm:px-5 pb-4 text-xs text-slate-600 dark:text-slate-400 leading-relaxed border-t border-slate-100 dark:border-slate-800 pt-3">
                    {faq.a}
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      </div>

      {/* Safety Protocol Banner */}
      <div className="bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-3xl p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5 text-amber-700" />
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-black text-amber-950 dark:text-amber-200">
              The BenchTech Safe Pickup Guarantee
            </h4>
            <p className="text-[11px] text-amber-900/80 dark:text-amber-300 mt-0.5 leading-relaxed">
              Always inspect serial numbers, battery health, and Apple ID / Google locks at a public location or registered shop inside Banex Plaza or Emab Plaza before paying.
            </p>
          </div>
        </div>
      </div>

      {/* Report a Problem Form (Anchor Target) */}
      <div id="report" className="pt-2">
        <Card className="rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 space-y-4 shadow-2xs">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-red-50 dark:bg-red-950/60 text-red-600 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-slate-100">
                Report a Problem or Suspicious Vendor
              </h3>
              <p className="text-[11px] text-slate-400">
                Our Abuja trust &amp; safety team reviews all incident submissions.
              </p>
            </div>
          </div>

          {reportSubmitted ? (
            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl text-center space-y-1 text-emerald-900 dark:text-emerald-200 text-xs">
              <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
              <p className="font-bold">Report Received</p>
              <p className="text-[11px] text-emerald-700 dark:text-emerald-300">
                Thank you for helping keep the marketplace safe. We will investigate immediately.
              </p>
            </div>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault()
                setReportSubmitted(true)
              }}
              className="space-y-3 text-xs"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  placeholder="Your Name"
                  required
                  className="w-full h-10 px-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-600"
                />
                <input
                  placeholder="Your Phone / WhatsApp"
                  required
                  className="w-full h-10 px-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-600"
                />
              </div>
              <textarea
                rows={3}
                required
                placeholder="Describe the issue (e.g. incorrect specs on listing, unverified vendor requested advance payment, etc.)..."
                className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-600 resize-none"
              />
              <Button
                type="submit"
                className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs h-10 px-5 rounded-xl shadow-xs"
              >
                Submit Incident Report
              </Button>
            </form>
          )}
        </Card>
      </div>
    </div>
  )
}