'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createBrowserClient } from '@supabase/ssr'
import { Navbar } from '@/components/Navbar'
import { BuyerSidebar } from '@/components/storefront/BuyerSidebar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  Sparkles,
  Phone,
  User,
  MapPin,
  Tag,
  ArrowRight,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
} from 'lucide-react'

const CATEGORIES = [
  'Phones',
  'Laptops',
  'Gaming',
  'Tablets',
  'Accessories',
  'Cameras',
  'Networking',
  'Monitors',
  'Wearables',
]

const ABUJA_HUBS = [
  'All Abuja',
  'Banex Plaza (Wuse 2)',
  'Emab Plaza (Wuse 2)',
  'Central Business District (CBD)',
  'Garki',
  'Gwarinpa',
  'Maitama',
  'Apo',
]

export default function NewProductRequestPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('Phones')
  const [budget, setBudget] = useState('')
  const [condition, setCondition] = useState('any')
  const [hub, setHub] = useState('All Abuja')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [notes, setNotes] = useState('')

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!title.trim() || !budget.trim() || !phone.trim() || !name.trim()) {
      setError('Please provide device title, budget, your name, and a reachable phone number.')
      return
    }

    setLoading(true)

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      const { error: insertError } = await supabase.from('product_requests').insert({
        buyer_id: user?.id || null,
        buyer_name: name.trim(),
        buyer_phone: phone.trim(),
        title: title.trim(),
        category,
        budget: Number(budget.replace(/[^0-9]/g, '')),
        preferred_condition: condition,
        preferred_hub: hub,
        additional_notes: notes.trim(),
        status: 'open',
      })

      if (insertError) throw insertError

      setSuccess(true)
    } catch (err: any) {
      setError(err.message || 'Failed to submit request.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      <div className="max-w-[1700px] w-full mx-auto flex flex-1">
        <BuyerSidebar />

        <main className="flex-1 min-w-0 p-3 sm:p-6 lg:p-8 flex items-center justify-center">
          <div className="max-w-xl w-full space-y-5">
            {success ? (
              <Card className="rounded-3xl border border-emerald-200 bg-white p-6 sm:p-8 text-center space-y-4 shadow-xs">
                <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto animate-bounce" />
                <div className="space-y-1">
                  <h2 className="text-xl font-black text-slate-900">Request Broadcasted to Abuja Sellers!</h2>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Verified tech dealers across Banex and Wuse 2 with matching inventory will be alerted and can contact you with verified quotes[cite: 9].
                  </p>
                </div>
                <div className="pt-2 flex justify-center gap-2">
                  <Button
                    onClick={() => {
                      setSuccess(false)
                      setTitle('')
                      setBudget('')
                      setNotes('')
                    }}
                    variant="outline"
                    className="text-xs font-bold rounded-xl h-9"
                  >
                    Post Another Request
                  </Button>
                  <Link href="/feed">
                    <Button className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl h-9">
                      Return to Feed
                    </Button>
                  </Link>
                </div>
              </Card>
            ) : (
              <Card className="rounded-3xl border border-slate-200/80 bg-white shadow-xs overflow-hidden">
                <CardHeader className="border-b border-slate-100 p-5 sm:p-6">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-black">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <CardTitle className="text-base font-black text-slate-900">
                        Can&apos;t Find Your Exact Gadget?
                      </CardTitle>
                      <CardDescription className="text-xs text-slate-500">
                        Broadcast your target specs and budget to verified Abuja dealers[cite: 9].
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="p-5 sm:p-6">
                  {error && (
                    <div className="p-3 mb-4 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                      <span>{error}</span>
                    </div>
                  )}

                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-1 text-xs">
                      <label className="font-bold text-slate-700">
                        Gadget Title &amp; Target Specs <span className="text-red-500">*</span>
                      </label>
                      <input
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="e.g. MacBook Pro M1 16GB 512GB Space Gray"
                        required
                        className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-slate-50/50 text-xs font-medium focus:border-blue-600 focus:bg-white outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div className="space-y-1">
                        <label className="font-bold text-slate-700">Category</label>
                        <select
                          value={category}
                          onChange={(e) => setCategory(e.target.value)}
                          className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-slate-50/50 text-xs font-medium outline-none focus:border-blue-600"
                        >
                          {CATEGORIES.map((c) => (
                            <option key={c} value={c}>
                              {c}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="font-bold text-slate-700">
                          Target Budget (₦) <span className="text-red-500">*</span>
                        </label>
                        <input
                          value={budget}
                          onChange={(e) => setBudget(e.target.value)}
                          placeholder="e.g. 450,000"
                          required
                          className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-slate-50/50 text-xs font-medium outline-none focus:border-blue-600"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div className="space-y-1">
                        <label className="font-bold text-slate-700">Condition Preference</label>
                        <select
                          value={condition}
                          onChange={(e) => setCondition(e.target.value)}
                          className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-slate-50/50 text-xs font-medium outline-none focus:border-blue-600"
                        >
                          <option value="any">Any Working Condition</option>
                          <option value="brand_new">Brand New (Sealed)</option>
                          <option value="open_box">Open Box / Mint</option>
                          <option value="used">Clean Fairly Used</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="font-bold text-slate-700">Preferred Pickup Plaza / Hub</label>
                        <select
                          value={hub}
                          onChange={(e) => setHub(e.target.value)}
                          className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-slate-50/50 text-xs font-medium outline-none focus:border-blue-600"
                        >
                          {ABUJA_HUBS.map((h) => (
                            <option key={h} value={h}>
                              {h}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs border-t border-slate-100 pt-3">
                      <div className="space-y-1">
                        <label className="font-bold text-slate-700">
                          Your Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="e.g. Samuel"
                          required
                          className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-slate-50/50 text-xs font-medium outline-none"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="font-bold text-slate-700">
                          WhatsApp / Call Phone <span className="text-red-500">*</span>
                        </label>
                        <input
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="080 1234 5678"
                          required
                          className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-slate-50/50 text-xs font-medium outline-none"
                        />
                      </div>
                    </div>

                    <div className="space-y-1 text-xs">
                      <label className="font-bold text-slate-700">Additional Specifications / Urgency</label>
                      <textarea
                        rows={2}
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="e.g. Prefer battery health above 85%. Ready to inspect in Banex this Friday."
                        className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-xs font-medium outline-none resize-none"
                      />
                    </div>

                    <Button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs h-10 rounded-xl gap-2 shadow-xs"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" /> Broadcasting to Vendors...
                        </>
                      ) : (
                        <>
                          Broadcast Request to Abuja Dealers <ArrowRight className="w-3.5 h-3.5" />
                        </>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}