'use client'

import { Check, Clock, PackageCheck, Truck, CheckCircle2, XCircle } from 'lucide-react'

const STEPS = [
  { key: 'new_request', label: 'Requested', icon: Clock },
  { key: 'confirmed', label: 'Confirmed', icon: Check },
  { key: 'ready_for_pickup', label: 'Ready', icon: PackageCheck },
  { key: 'dispatched', label: 'Dispatched', icon: Truck },
  { key: 'completed', label: 'Completed', icon: CheckCircle2 },
]

export function OrderStatusTracker({ currentStatus }: { currentStatus: string }) {
  if (currentStatus === 'cancelled') {
    return (
      <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 text-xs font-bold rounded-xl border border-red-200">
        <XCircle className="w-4 h-4" /> This order request has been cancelled[cite: 1].
      </div>
    )
  }

  const activeIndex = STEPS.findIndex((s) => s.key === currentStatus)

  return (
    <div className="w-full py-4">
      <div className="flex items-center justify-between relative">
        {/* Background Track Line */}
        <div className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-slate-100 w-full z-0" />
        <div
          className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-blue-600 transition-all duration-300 z-0"
          style={{ width: `${Math.max(0, (activeIndex / (STEPS.length - 1)) * 100)}%` }}
        />

        {STEPS.map((step, idx) => {
          const isDone = idx <= activeIndex
          const isCurrent = idx === activeIndex
          const Icon = step.icon

          return (
            <div key={step.key} className="flex flex-col items-center relative z-10">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center border-2 transition ${
                  isCurrent
                    ? 'bg-blue-600 border-blue-600 text-white ring-4 ring-blue-100'
                    : isDone
                    ? 'bg-blue-600 border-blue-600 text-white'
                    : 'bg-white border-slate-200 text-slate-400'
                }`}
              >
                <Icon className="w-4 h-4" />
              </div>
              <span
                className={`text-[11px] font-bold mt-2 ${
                  isCurrent ? 'text-blue-600' : isDone ? 'text-slate-800' : 'text-slate-400'
                }`}
              >
                {step.label}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}