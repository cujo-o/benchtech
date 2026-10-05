'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { getAIBuildRecommendation } from './actions'
import {
  Sparkles,
  X,
  Loader2,
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
  const [budget, setBudget] = useState<number>(750000)
  const [devicePref, setDevicePref] = useState('Laptop-first Setup')
  const [powerPriority, setPowerPriority] = useState('High (Include UPS / Inverter Power)')
  const [customNotes, setCustomNotes] = useState('')

  async function handleGenerate() {
    if (!budget || budget < 50000) {
      alert('Please enter a budget of at least ₦50,000.')
      return
    }

    setLoading(true)
    try {
      // Direct Server Action call (no REST route, no 404s)
      const data = await getAIBuildRecommendation({
        useCase,
        budget,
        devicePreference: devicePref,
        powerPriority,
        customNotes,
      })

      if (!data.success) {
        alert(data.error || 'Failed to generate recommendation.')
        return
      }

      onApplyRecommendation({
        archetypeTitle: data.archetypeTitle,
        rationale: data.rationale,
        allocatedBudget: data.allocatedBudget,
        selections: data.selections,
      })
      setIsOpen(false)
    } catch (err: any) {
      console.error('Error invoking server action:', err)
      alert(err.message || 'Error connecting to setup generator.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        className="w-full sm:w-auto bg-linear-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-black text-xs rounded-xl h-11 sm:h-10 px-4 gap-2 shadow-md cursor-pointer transition-all active:scale-95"
      >
        <Sparkles className="w-4 h-4 text-amber-300 animate-pulse shrink-0" />
        <span className="truncate">Ask BenchTech AI to Build My Rig</span>
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-xs transition-opacity"
            onClick={() => !loading && setIsOpen(false)}
          />

          {/* Modal Container: Full-width bottom sheet on mobile, rounded card on desktop */}
          <div className="relative w-full sm:max-w-xl bg-white dark:bg-slate-900 border-t sm:border border-slate-200 dark:border-slate-800 rounded-t-3xl sm:rounded-3xl p-5 sm:p-7 shadow-2xl z-10 space-y-4 max-h-[92dvh] overflow-y-auto text-slate-900 dark:text-slate-100 animate-in slide-in-from-bottom-6 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-300 flex items-center justify-center shrink-0">
                  <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-black text-sm sm:text-base truncate">BenchTech AI Setup Architect</h3>
                  <p className="text-[10px] sm:text-[11px] text-slate-400 truncate">
                    Matches your workflow &amp; custom budget to Abuja stock
                  </p>
                </div>
              </div>

              <button
                type="button"
                disabled={loading}
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 1. Use Case Picker */}
            <div className="space-y-1.5">
              <label className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-slate-400 block">
                1. What is your primary workflow?
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {USE_CASES.map((uc) => (
                  <button
                    key={uc.id}
                    type="button"
                    onClick={() => setUseCase(uc.id)}
                    className={`p-2.5 sm:p-3 rounded-2xl border text-left text-xs transition cursor-pointer active:scale-[0.98] ${
                      useCase === uc.id
                        ? 'border-purple-600 bg-purple-50/50 dark:bg-purple-950/40 text-purple-900 dark:text-purple-200 font-bold ring-1 ring-purple-600'
                        : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                    }`}
                  >
                    <div className="font-bold text-[11px] sm:text-xs">{uc.id}</div>
                    <div className="text-[9px] sm:text-[10px] text-slate-400 font-normal">{uc.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Target Budget with Direct Number Input */}
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <label className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-slate-400">
                  2. Target Budget (₦)
                </label>

                <div className="relative">
                  <span className="absolute left-2.5 top-2 text-xs font-black text-slate-400">₦</span>
                  <input
                    type="number"
                    inputMode="numeric"
                    min="50000"
                    step="10000"
                    value={budget || ''}
                    onChange={(e) => setBudget(Math.max(0, Number(e.target.value)))}
                    placeholder="Enter amount..."
                    className="w-32 sm:w-44 pl-6 pr-2.5 py-1.5 text-xs font-black rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              {/* Quick Chip Presets */}
              <div className="flex flex-wrap gap-1.5">
                {BUDGET_CHIPS.map((chip) => (
                  <button
                    key={chip.value}
                    type="button"
                    onClick={() => setBudget(chip.value)}
                    className={`px-2.5 sm:px-3 py-1 rounded-xl text-[11px] font-bold border transition cursor-pointer ${
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
                min="200000"
                max="3000000"
                step="50000"
                value={Math.min(3000000, Math.max(200000, budget))}
                onChange={(e) => setBudget(Number(e.target.value))}
                className="w-full accent-purple-600 cursor-pointer"
              />
            </div>

            {/* 3. Form Factor & Abuja Power Priority */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div className="space-y-1">
                <label className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Form Factor
                </label>
                <select
                  value={devicePref}
                  onChange={(e) => setDevicePref(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold focus:outline-none"
                >
                  <option value="Laptop-first Setup">Laptop-first Setup</option>
                  <option value="Desktop Workstation">Desktop Workstation / Rig</option>
                  <option value="Mac Ecosystem (Apple Silicon)">Mac Ecosystem</option>
                  <option value="Console & TV Setup">Console &amp; Gaming</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider">
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

            {/* 4. Notes */}
            <div className="space-y-1">
              <label className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Specific Notes (Optional)
              </label>
              <input
                type="text"
                value={customNotes}
                onChange={(e) => setCustomNotes(e.target.value)}
                placeholder="e.g. 16GB RAM minimum, prefer Dell or MacBook, 144Hz..."
                className="w-full text-xs p-2.5 sm:p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 placeholder:text-slate-400 focus:outline-none"
              />
            </div>

            {/* Action Button */}
            <Button
              onClick={handleGenerate}
              disabled={loading}
              className="w-full bg-linear-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-black text-xs sm:text-sm h-12 rounded-xl shadow-lg cursor-pointer gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Analyzing Abuja Inventory...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  Generate Recommended Rig →
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </>
  )
}