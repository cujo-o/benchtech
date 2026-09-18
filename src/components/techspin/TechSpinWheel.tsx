'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
  Sparkles,
  Award,
  CheckCircle2,
  Copy,
  ArrowRight,
  RotateCcw,
} from 'lucide-react'

interface Prize {
  id: number
  label: string
  code: string | null
  color: string
}

const PRIZES: Prize[] = [
  { id: 0, label: 'Free Abuja Dispatch', code: 'SPIN-FREEDELIVERY', color: '#2563eb' },
  { id: 1, label: '₦2,000 Voucher', code: 'SPIN-SAVE2K', color: '#4f46e5' },
  { id: 2, label: 'Better Luck Tomorrow', code: null, color: '#64748b' },
  { id: 3, label: '5% Off Laptops', code: 'SPIN-LAPTOP5', color: '#0ea5e9' },
  { id: 4, label: '₦1,000 Off Order', code: 'SPIN-1000', color: '#10b981' },
  { id: 5, label: 'Free Screen Guard', code: 'SPIN-ACCESSPACK', color: '#f59e0b' },
]

export function TechSpinWheel() {
  const [spinning, setSpinning] = useState(false)
  const [rotation, setRotation] = useState(0)
  const [prize, setPrize] = useState<Prize | null>(null)
  const [copied, setCopied] = useState(false)
  const [canSpin, setCanSpin] = useState(true)

  useEffect(() => {
    const lastSpin = localStorage.getItem('benchtech_last_spin')
    if (lastSpin) {
      const hoursSinceLast = (Date.now() - parseInt(lastSpin, 10)) / (1000 * 60 * 60)
      if (hoursSinceLast < 24) {
        setCanSpin(false)
      }
    }
  }, [])

  const spinWheel = () => {
    if (!canSpin || spinning) return

    setSpinning(true)
    setPrize(null)

    const winningIndex = Math.floor(Math.random() * PRIZES.length)
    const segmentAngle = 360 / PRIZES.length
    const extraSpins = 360 * 5
    const targetAngle = extraSpins + (PRIZES.length - winningIndex - 0.5) * segmentAngle
    const finalRotation = rotation + targetAngle

    setRotation(finalRotation)

    setTimeout(() => {
      setSpinning(false)
      setPrize(PRIZES[winningIndex])
      setCanSpin(false)
      localStorage.setItem('benchtech_last_spin', Date.now().toString())
    }, 4000)
  }

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <main className="max-w-4xl mx-auto w-full px-4 py-8 md:py-12 flex-1 flex flex-col items-center justify-center">
      <div className="text-center space-y-2 mb-8">
        <div className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-xs font-bold">
          <Sparkles className="w-3.5 h-3.5" /> BenchTech Daily Rewards
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
          TechSpin Lucky Wheel
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
          Spin once every 24 hours to win Abuja dispatch fee waivers, direct cash discounts, and purchase credits.
        </p>
      </div>

      <div className="relative flex flex-col items-center justify-center">
        <div className="w-0 h-0 border-l-[14px] border-l-transparent border-r-[14px] border-r-transparent border-t-[22px] border-t-amber-500 z-20 -mb-3 drop-shadow-sm" />

        <div
          className="w-72 h-72 sm:w-80 sm:h-80 rounded-full border-8 border-white shadow-2xl relative overflow-hidden bg-slate-900 transition-transform duration-[4000ms] ease-out"
          style={{ transform: `rotate(${rotation}deg)` }}
        >
          {PRIZES.map((item, idx) => {
            const rotationDeg = (360 / PRIZES.length) * idx
            return (
              <div
                key={item.id}
                className="absolute w-full h-full top-0 left-0 flex justify-center text-white origin-center"
                style={{ transform: `rotate(${rotationDeg}deg)` }}
              >
                <div
                  className="w-0 h-0 border-l-[115px] border-l-transparent border-r-[115px] border-r-transparent border-t-[160px] opacity-90"
                  style={{ borderTopColor: item.color }}
                />
                <span
                  className="absolute top-5 text-[11px] font-black uppercase tracking-tight text-white drop-shadow-sm"
                  style={{ transform: 'rotate(0deg)' }}
                >
                  {item.label}
                </span>
              </div>
            )
          })}
        </div>

        <button
          onClick={spinWheel}
          disabled={!canSpin || spinning}
          className={`absolute z-20 w-16 h-16 rounded-full border-4 border-white shadow-xl flex items-center justify-center font-black text-xs uppercase tracking-wider transition ${
            canSpin && !spinning
              ? 'bg-amber-400 hover:bg-amber-500 text-slate-950 scale-105 active:scale-95 cursor-pointer'
              : 'bg-slate-200 text-slate-400 cursor-not-allowed'
          }`}
        >
          {spinning ? '...' : 'SPIN'}
        </button>
      </div>

      {prize && (
        <div className="mt-8 w-full max-w-md bg-white border border-slate-200 rounded-3xl p-6 text-center space-y-4 shadow-sm animate-in fade-in zoom-in-95 duration-300">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
            <Award className="w-6 h-6" />
          </div>

          <div>
            <p className="text-xs uppercase font-bold text-slate-400">Your Reward</p>
            <h3 className="text-xl font-black text-slate-900">{prize.label}</h3>
          </div>

          {prize.code ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-slate-50 border border-dashed border-slate-300 rounded-xl">
                <span className="font-mono font-black text-sm text-blue-600 tracking-wider">
                  {prize.code}
                </span>
                <Button
                  onClick={() => copyCode(prize.code!)}
                  variant="ghost"
                  size="sm"
                  className="h-8 text-xs font-bold text-slate-700 hover:text-blue-600 gap-1.5"
                >
                  {copied ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Copied
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" /> Copy Code
                    </>
                  )}
                </Button>
              </div>
              <p className="text-[11px] text-slate-400">
                Use this promo code during checkout to claim your waiver or discount.
              </p>
              <Link href="/checkout" className="block">
                <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl h-10 gap-2">
                  Use in Checkout <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-xs text-slate-500">
                No prize this round! Come back tomorrow for another guaranteed spin.
              </p>
              <Link href="/deals" className="block">
                <Button variant="outline" className="w-full text-xs font-bold rounded-xl h-10">
                  Explore Deals Instead
                </Button>
              </Link>
            </div>
          )}
        </div>
      )}

      {!canSpin && !prize && (
        <div className="mt-8 flex items-center gap-2 text-xs font-bold text-slate-500 bg-white border border-slate-200/80 px-4 py-2.5 rounded-2xl shadow-sm">
          <RotateCcw className="w-4 h-4 text-blue-600" />
          <span>Daily spin used. Check back in 24 hours for your next spin!</span>
        </div>
      )}
    </main>
  )
}