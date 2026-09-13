import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  HelpCircle, 
  ShieldCheck, 
  MessageCircle, 
  Mail, 
  Phone, 
  FileText, 
  CheckCircle2, 
  ExternalLink 
} from 'lucide-react'

export default function SellerSupportPage() {
  const faqs = [
    {
      q: 'How does TechTrust verification work?',
      a: 'TechTrust confirms the identity of merchants through valid government-issued IDs (NIN, Drivers License) or CAC business registration certificates. Verified stores get a badge on all listings.',
    },
    {
      q: 'How do buyers contact me about my listings?',
      a: 'Buyers can initiate enquiries either directly through WhatsApp using the phone number set in your Store Settings, or via the on-platform Enquiry modal in your dashboard.',
    },
    {
      q: 'Why are technical specifications required for listings?',
      a: 'BenchTech features a comparison engine. Filling in hardware attributes (like battery health, storage, and RAM) allows buyers to compare items directly.',
    },
    {
      q: 'How do I mark an item as sold?',
      a: 'Go to "Inventory & Listings" in your seller sidebar and click the checkmark icon next to the item. This changes its status to sold and prevents further enquiries.',
    },
  ]

  return (
    <div className="max-w-4xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Seller Help & Support</h1>
        <p className="text-xs text-slate-500 mt-1">
          Find answers to seller FAQs, platform safety guidelines, and support channels.
        </p>
      </div>

      {/* Support Channels */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-slate-200/80 shadow-sm">
          <CardContent className="p-5 space-y-2">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <MessageCircle className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">WhatsApp Support</h3>
            <p className="text-xs text-slate-500">Reach the admin team directly for merchant issues.</p>
            <a
              href="https://wa.me/2347078322733?text=Hello%20BenchTech%20Support,%20I%20need%20assistance%20with%20my%20seller%20account"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block pt-1"
            >
              <Button size="sm" variant="outline" className="text-xs h-8 gap-1.5 border-slate-200 text-slate-700">
                Open Chat <ExternalLink className="w-3 h-3" />
              </Button>
            </a>
          </CardContent>
        </Card>

        <Card className="border-slate-200/80 shadow-sm">
          <CardContent className="p-5 space-y-2">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Mail className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">Email Support</h3>
            <p className="text-xs text-slate-500">Submit requests regarding account changes or disputes.</p>
            <a href="mailto:support@BenchTech.ng" className="inline-block pt-1">
              <Button size="sm" variant="outline" className="text-xs h-8 gap-1.5 border-slate-200 text-slate-700">
                Send Email <ExternalLink className="w-3 h-3" />
              </Button>
            </a>
          </CardContent>
        </Card>

        <Card className="border-slate-200/80 shadow-sm">
          <CardContent className="p-5 space-y-2">
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">TechTrust Centre</h3>
            <p className="text-xs text-slate-500">Submit or review your store identity credentials.</p>
            <Link href="/seller/verify" className="inline-block pt-1">
              <Button size="sm" variant="outline" className="text-xs h-8 border-slate-200 text-slate-700">
                Verify Store
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Safety & Listing Rules */}
      <Card className="border-slate-200/80 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Marketplace Rules & Best Practices</CardTitle>
          <CardDescription className="text-xs">Maintain high conversion rates and vendor rating standing</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3 text-xs text-slate-600">
            <li className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span><strong>Accurate Grading:</strong> Clearly differentiate between Brand New, Open Box, and Fairly Used condition.</span>
            </li>
            <li className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span><strong>Real Hardware Photos:</strong> Upload actual pictures of the device showcasing screen condition and edges rather than stock marketing renders.</span>
            </li>
            <li className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span><strong>In-Person Inspection:</strong> Encourage buyers to run battery diagnostics, IMEI checks, and hardware inspections in safe, public Abuja hubs (e.g. Banex, Wuse 2).</span>
            </li>
          </ul>
        </CardContent>
      </Card>

      {/* Frequently Asked Questions */}
      <div className="space-y-3">
        <h2 className="text-base font-bold text-slate-900">Frequently Asked Questions</h2>
        <div className="space-y-2.5">
          {faqs.map((faq, idx) => (
            <Card key={idx} className="border-slate-200/80 shadow-sm">
              <CardContent className="p-4 space-y-1">
                <p className="text-xs font-bold text-slate-900">{faq.q}</p>
                <p className="text-xs text-slate-500 leading-relaxed">{faq.a}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}