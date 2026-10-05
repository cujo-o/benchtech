'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Sparkles,
  X,
  Loader2,
  Cpu,
  Laptop,
  Monitor,
  Zap,
  Check,
  ChevronRight,
  Layers,
} from 'lucide-react'

interface AIBuildAssistantModalProps {
  onApplyRecommendation: (result: {
    archetypeTitle: string
    rationale: string
    allocatedBudget: number
    selections: Record<string, string | null>
  }) => void
}

const USE_CASES = [
  { id: 'Software Engineering & DevOps', desc: 'Docker, compiling, multi-tasking' },
  { id: 'Video Editing & 3D Rendering', desc: '4K Premiere, After Effects, Blender' },
  { id: 'Competitive Gaming', desc: 'High FPS, 144Hz monitors, low latency' },
  { id: 'Student & Academic Productivity', desc: 'Portability, research, long battery' },
  { id: 'Crypto & Multi-Display Trading', desc: 'Real-time charts, multiple screens' },
  { id: 'Office & Remote WFH', desc: 'Zoom, documents, power reliability' },
]

const BUDGET_CHIPS = [
  { label: '₦400k Entry', value: 400000 },
  { label: '₦750k Balanced', value: 750000 },
  { label: '₦1.2M Pro', value: 1200000 },
  { label: '₦2M+ Flagship', value: 2000000 },
]

export function AIBuildAssistantModal({ onApplyRecommendation }: AIBuildAssistantModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  // Questionnaire state
  const [useCase, setUseCase] = useState(USE_CASES[0].id)
  const [budget, setBudget] = useState(750000)
  const [devicePref, setDevicePref] = useState('Laptop-first Workstation')
  const [powerPriority, setPowerPriority] = useState('High (Include UPS / Inverter Power)')
  const [customNotes, setCustomNotes] = useState('')

  async function handleGenerate() {
    setLoading(true)
    try {
      const res = await fetch('/api/build/ai-recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          useCase,
          budget,
          devicePreference: devicePref,
          powerPriority,
          customNotes,
        }),
      })

      const data = await res.json()
      if (data.success) {
        onApplyRecommendation({
          archetypeTitle: data.archetypeTitle,
          rationale: data.rationale,
          allocatedBudget: data.allocatedBudget || budget,
          selections: data.selections || {},
        })
        setIsOpen(false)
      } else {
        alert(data.error || 'Failed to generate recommendations.')
      }
    } catch {
      alert('Network error connecting to AI Setup Architect.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        className="bg-linear-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-black text-xs rounded-xl h-10 px-4 gap-2 shadow-md cursor-pointer transition-all hover:scale-[1.02]"
      >
        <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
        <span>Ask BenchTech AI to Build My Rig</span>
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs animate-in fade-in"
            onClick={() => !loading && setIsOpen(false)}
          />

          <div className="relative w-full max-w-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-7 shadow-2xl z-10 space-y-5 max-h-[90vh] overflow-y-auto text-slate-900 dark:text-slate-100 animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3.5">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-300 flex items-center justify-center font-black">
                  <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <h3 className="font-black text-base">BenchTech AI Setup Architect</h3>
                  <p className="text-[11px] text-slate-400">
                    Matches your workflow &amp; budget to verified Abuja listings
                  </p>
                </div>
              </div>

              <button
                type="button"
                disabled={loading}
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Step 1: Use Case */}
            <div className="space-y-2">
              <label className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                1. What is your primary work or use case?
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {USE_CASES.map((uc) => (
                  <button
                    key={uc.id}
                    type="button"
                    onClick={() => setUseCase(uc.id)}
                    className={`p-3 rounded-2xl border text-left text-xs transition cursor-pointer ${
                      useCase === uc.id
                        ? 'border-purple-600 bg-purple-50/50 dark:bg-purple-950/40 text-purple-900 dark:text-purple-200 font-bold ring-1 ring-purple-600'
                        : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                    }`}
                  >
                    <div className="font-bold">{uc.id}</div>
                    <div className="text-[10px] text-slate-400 font-normal">{uc.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Step 2: Target Budget in Naira */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                  2. Total Budget Target
                </label>
                <span className="text-sm font-black text-blue-600 dark:text-blue-400">
                  ₦{budget.toLocaleString()}
                </span>
              </div>

              <div className="flex flex-wrap gap-2">
                {BUDGET_CHIPS.map((chip) => (
                  <button
                    key={chip.value}
                    type="button"
                    onClick={() => setBudget(chip.value)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer ${
                      budget === chip.value
                        ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-transparent'
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {chip.label}
                  </button>
                ))}
              </div>

              <input
                type="range"
                min="300000"
                max="3000000"
                step="50000"
                value={budget}
                onChange={(e) => setBudget(Number(e.target.value))}
                className="w-full accent-purple-600 cursor-pointer mt-1"
              />
            </div>

            {/* Step 3: Form Factor & Abuja Power Priority */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Hardware Form Factor
                </label>
                <select
                  value={devicePref}
                  onChange={(e) => setDevicePref(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold focus:outline-none"
                >
                  <option value="Laptop-first Workstation">Laptop-first Setup</option>
                  <option value="Desktop Rig">Desktop Workstation / Rig</option>
                  <option value="Mac Ecosystem (Apple Silicon)">Mac Ecosystem</option>
                  <option value="Console & TV Setup">Console &amp; Gaming</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Abuja Outage Priority (Power)
                </label>
                <select
                  value={powerPriority}
                  onChange={(e) => setPowerPriority(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold focus:outline-none"
                >
                  <option value="High (Include UPS / Inverter Power)">High (Reserve UPS/Backup)</option>
                  <option value="Standard (Focus on Laptop Battery)">Standard (Laptop Battery)</option>
                  <option value="Low (Already have Inverter)">Low (Home Inverter Present)</option>
                </select>
              </div>
            </div>

            {/* Step 4: Specific Hardware Notes */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Specific Specifications or Preferences (Optional)
              </label>
              <input
                type="text"
                value={customNotes}
                onChange={(e) => setCustomNotes(e.target.value)}
                placeholder="e.g. Needs 16GB RAM minimum, prefer Dell or MacBook, 144Hz screen..."
                className="w-full text-xs p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 placeholder:text-slate-400 focus:outline-none"
              />
            </div>

            {/* Action CTA */}
            <Button
              onClick={handleGenerate}
              disabled={loading}
              className="w-full bg-linear-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-black text-xs sm:text-sm h-12 rounded-2xl shadow-lg cursor-pointer gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Analyzing Abuja Inventory &amp; Building Rig...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  Generate Recommended Rig Setup →
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </>
  )
}