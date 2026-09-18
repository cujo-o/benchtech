'use client'

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus, Trash2, Check, Disc, RefreshCw } from 'lucide-react'

export default function AdminTechSpinPage() {
  const [prizes, setPrizes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [newLabel, setNewLabel] = useState('')
  const [newCode, setNewCode] = useState('')
  const [newColor, setNewColor] = useState('#2563eb')

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const fetchPrizes = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('techspin_prizes')
      .select('*')
      .order('created_at', { ascending: true })
    if (data) setPrizes(data)
    setLoading(false)
  }

  useEffect(() => {
    fetchPrizes()
  }, [])

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newLabel.trim()) return

    await supabase.from('techspin_prizes').insert({
      label: newLabel,
      code: newCode.trim() ? newCode.trim().toUpperCase() : null,
      color: newColor,
      is_active: true,
    })

    setNewLabel('')
    setNewCode('')
    fetchPrizes()
  }

  const handleDelete = async (id: string) => {
    await supabase.from('techspin_prizes').delete().eq('id', id)
    fetchPrizes()
  }

  const handleToggle = async (id: string, current: boolean) => {
    await supabase.from('techspin_prizes').update({ is_active: !current }).eq('id', id)
    fetchPrizes()
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <Disc className="w-5 h-5 text-blue-600" /> TechSpin Wheel Manager
          </h1>
          <p className="text-xs text-slate-500">
            Control the exact rewards, voucher codes, and segment colors displayed on the buyer lucky wheel.
          </p>
        </div>
        <Button onClick={fetchPrizes} variant="outline" size="sm" className="text-xs font-bold gap-1.5">
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </Button>
      </div>

      {/* Add New Prize Form */}
      <form onSubmit={handleAdd} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">Add New Wheel Reward</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <Label className="text-xs font-bold text-slate-600">Reward Title</Label>
            <Input
              required
              placeholder="e.g. ₦3,000 Off Gadgets"
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              className="text-xs h-9 mt-1 rounded-xl"
            />
          </div>
          <div>
            <Label className="text-xs font-bold text-slate-600">Promo Code (Leave blank for no code)</Label>
            <Input
              placeholder="e.g. SPIN-3000"
              value={newCode}
              onChange={(e) => setNewCode(e.target.value)}
              className="text-xs h-9 mt-1 rounded-xl"
            />
          </div>
          <div>
            <Label className="text-xs font-bold text-slate-600">Segment Color</Label>
            <div className="flex items-center gap-2 mt-1">
              <input
                type="color"
                value={newColor}
                onChange={(e) => setNewColor(e.target.value)}
                className="w-10 h-9 p-0.5 rounded-lg border border-slate-200 cursor-pointer"
              />
              <Button type="submit" size="sm" className="flex-1 bg-blue-600 hover:bg-blue-700 text-xs font-bold h-9 rounded-xl gap-1">
                <Plus className="w-3.5 h-3.5" /> Add Reward
              </Button>
            </div>
          </div>
        </div>
      </form>

      {/* Prize Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="divide-y divide-slate-100">
          {prizes.map((p) => (
            <div key={p.id} className="p-3.5 px-4 flex items-center justify-between text-xs">
              <div className="flex items-center gap-3">
                <span className="w-5 h-5 rounded-full border border-slate-200 shadow-xs" style={{ backgroundColor: p.color }} />
                <div>
                  <p className="font-bold text-slate-900">{p.label}</p>
                  <p className="text-[11px] font-mono text-slate-400">
                    {p.code ? `Code: ${p.code}` : 'No code (Better luck / merchandise)'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleToggle(p.id, p.is_active)}
                  className={`px-2.5 py-1 rounded-full font-bold text-[10px] transition ${
                    p.is_active ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {p.is_active ? 'Active' : 'Disabled'}
                </button>

                <button
                  onClick={() => handleDelete(p.id)}
                  className="p-1.5 text-slate-400 hover:text-red-600 transition"
                  title="Delete prize"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}