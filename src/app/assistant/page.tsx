'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Navbar } from '@/components/Navbar'
import { Button } from '@/components/ui/button'
import { AddToCartButton } from '@/components/cart/AddToCartButton'
import { CompareButton } from '@/components/CompareButton'
import {
  Bot,
  Sparkles,
  ArrowRight,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Cpu,
  RefreshCw,
} from 'lucide-react'

export default function FindMyTechPage() {
  const [useCase, setUseCase] = useState('Software Engineering / Coding')
  const [budgetMax, setBudgetMax] = useState('650000')
  const [priority, setPriority] = useState('Performance & RAM')
  const [preferredBrand, setPreferredBrand] = useState('Any')

  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const res = await fetch('/api/assistant/find-my-tech', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          useCase,
          budgetMax: Number(budgetMax),
          priority,
          preferredBrand,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Recommendation failed')
      setResult(data)
    } catch (err: any) {
      setError(err.message || 'Failed to get recommendation')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      <main className="max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 md:py-12 space-y-8">
        {/* Hero */}
        <div className="text-center space-y-2 max-w-xl mx-auto">
          <div className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-xs font-bold">
            <Bot className="w-3.5 h-3.5" /> BenchTech Intelligent Match
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            Find My Tech AI
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Tell the AI your workflow and budget. We evaluate available inventory across Abuja to recommend the best hardware fit.
          </p>
        </div>

        {/* Questionnaire Form */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Use Case */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">What is your main workflow?</label>
                <select
                  value={useCase}
                  onChange={(e) => setUseCase(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-xl border border-slate-200 bg-white text-xs font-medium focus:outline-none focus:border-blue-600"
                >
                  <option value="Software Engineering / Coding">Software Engineering / Coding</option>
                  <option value="Video Editing & 3D Animation">Video Editing &amp; 3D Animation</option>
                  <option value="Graphic Design & Creative Arts">Graphic Design &amp; Creative Arts</option>
                  <option value="University Student / General Purpose">University Student / General Purpose</option>
                  <option value="Corporate / Data Analysis">Corporate / Data Analysis</option>
                  <option value="Competitive Gaming">Competitive Gaming</option>
                </select>
              </div>

              {/* Budget Slider/Input */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-slate-700">Maximum Budget</label>
                  <span className="text-xs font-black text-blue-600">
                    ₦{Number(budgetMax).toLocaleString()}
                  </span>
                </div>
                <input
                  type="range"
                  min="150000"
                  max="2500000"
                  step="25000"
                  value={budgetMax}
                  onChange={(e) => setBudgetMax(e.target.value)}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
              </div>

              {/* Hardware Priority */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Top Hardware Priority</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-xl border border-slate-200 bg-white text-xs font-medium focus:outline-none focus:border-blue-600"
                >
                  <option value="Performance & RAM">Maximum Raw Performance &amp; RAM</option>
                  <option value="All-day Battery Life">All-day Battery Endurance</option>
                  <option value="Lightweight Portability">Lightweight Portability</option>
                  <option value="Color-Accurate Display">Color-Accurate Display</option>
                  <option value="Best Value for Money">Maximum Value per Naira</option>
                </select>
              </div>

              {/* Brand Preference */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Brand Preference</label>
                <select
                  value={preferredBrand}
                  onChange={(e) => setPreferredBrand(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-xl border border-slate-200 bg-white text-xs font-medium focus:outline-none focus:border-blue-600"
                >
                  <option value="Any">No Preference (Best Spec Wins)</option>
                  <option value="Apple">Apple</option>
                  <option value="Dell">Dell</option>
                  <option value="HP">HP</option>
                  <option value="Lenovo">Lenovo</option>
                  <option value="Asus">Asus</option>
                </select>
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-sm gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Analyzing Abuja Inventory...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" /> Run AI Match
                </>
              )}
            </Button>
          </form>
        </div>

        {/* Error Notification */}
        {error && (
          <div className="p-4 bg-red-50 text-red-700 text-xs rounded-2xl flex items-center gap-2 border border-red-100">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Recommendation Results */}
        {result && (
          <div className="space-y-6">
            <div className="p-4 bg-blue-50/70 border border-blue-100 rounded-2xl">
              <p className="text-xs font-medium text-slate-800 leading-relaxed">
                <span className="font-bold text-blue-900">AI Analysis: </span>
                {result.summary}
              </p>
            </div>

            <div className="space-y-4">
              {result.recommendations.map((rec: any) => (
                <div
                  key={rec.productId}
                  className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm flex flex-col md:flex-row items-start gap-6"
                >
                  {/* Product Image */}
                  <div className="w-full md:w-44 aspect-square bg-slate-50 rounded-2xl overflow-hidden shrink-0 border border-slate-100 p-2 flex items-center justify-center">
                    {rec.product.images?.[0] ? (
                      <img
                        src={rec.product.images[0]}
                        alt={rec.product.title}
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <Cpu className="w-8 h-8 text-slate-300" />
                    )}
                  </div>

                  {/* Body */}
                  <div className="flex-1 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider block">
                          {rec.product.brand || 'Device'}
                        </span>
                        <h3 className="text-base font-black text-slate-900">
                          {rec.product.title}
                        </h3>
                      </div>
                      <span className="bg-emerald-50 text-emerald-700 text-xs font-black px-2.5 py-1 rounded-full border border-emerald-100">
                        {rec.matchScore} Match
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed">
                      {rec.verdict}
                    </p>

                    {/* Pros & Tradeoffs */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-[11px]">
                      <div className="space-y-1">
                        <span className="font-bold text-slate-700">Highlights:</span>
                        {rec.pros.map((p: string, idx: number) => (
                          <div key={idx} className="flex items-center gap-1.5 text-slate-600">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span>{p}</span>
                          </div>
                        ))}
                      </div>
                      <div className="space-y-1">
                        <span className="font-bold text-slate-700">Caveat:</span>
                        {rec.tradeoffs.map((t: string, idx: number) => (
                          <div key={idx} className="flex items-center gap-1.5 text-slate-500">
                            <AlertCircle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                            <span>{t}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Pricing & Actions */}
                    <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                      <p className="text-base font-black text-slate-900">
                        ₦{Number(rec.product.price).toLocaleString()}
                      </p>

                      <div className="flex items-center gap-2">
                        <CompareButton product={rec.product} />
                        <AddToCartButton product={rec.product} />
                        <Link href={`/products/${rec.product.id}`}>
                          <Button variant="ghost" size="sm" className="text-xs font-bold text-slate-600 h-9">
                            View Listing <ArrowRight className="w-3.5 h-3.5 ml-1" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}