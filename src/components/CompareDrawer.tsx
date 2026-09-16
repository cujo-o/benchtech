'use client'

import Link from 'next/link'
import { useCompareStore } from '@/lib/store/useCompareStore'
import { Button } from '@/components/ui/button'
import { Scale, X } from 'lucide-react'

export function CompareDrawer() {
  const { items, removeItem, clearCompare } = useCompareStore()

  if (items.length === 0) return null

  // Pass active IDs in query string for shareability & server loading
  const compareUrl = `/compare?ids=${items.map((i) => i.id).join(',')}`

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 bg-slate-900/95 backdrop-blur-md text-white px-5 py-3 rounded-2xl shadow-2xl border border-slate-700 flex items-center gap-4 max-w-xl w-full mx-4">
      <div className="flex items-center gap-2">
        <Scale className="w-5 h-5 text-blue-400" />
        <span className="text-xs font-bold">{items.length} / 4 Selected</span>
      </div>

      <div className="flex-1 flex gap-2 overflow-x-auto py-1">
        {items.map((item) => (
          <div
            key={item.id}
            className="flex items-center gap-1.5 bg-slate-800 px-2.5 py-1 rounded-lg text-xs shrink-0 border border-slate-700"
          >
            <span className="truncate max-w-[100px]">{item.title}</span>
            <button
              onClick={() => removeItem(item.id)}
              className="hover:text-red-400 transition"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={clearCompare}
          className="text-[11px] text-slate-400 hover:text-white underline"
        >
          Clear
        </button>
        <Link href={compareUrl}>
          <Button size="sm" className="bg-blue-600 hover:bg-blue-500 text-xs font-bold rounded-xl">
            Compare Specs
          </Button>
        </Link>
      </div>
    </div>
  )
}