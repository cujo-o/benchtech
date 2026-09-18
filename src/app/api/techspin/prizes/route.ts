import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: prizes, error } = await supabase
      .from('techspin_prizes')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: true })

    if (error || !prizes || prizes.length === 0) {
      return NextResponse.json({
        prizes: [
          { id: '1', label: 'Free Abuja Dispatch', code: 'SPIN-FREEDELIVERY', color: '#2563eb' },
          { id: '2', label: '₦2,000 Voucher', code: 'SPIN-SAVE2K', color: '#4f46e5' },
          { id: '3', label: 'Better Luck Tomorrow', code: null, color: '#64748b' },
          { id: '4', label: '5% Off Laptops', code: 'SPIN-LAPTOP5', color: '#0ea5e9' },
          { id: '5', label: '₦1,000 Off Order', code: 'SPIN-1000', color: '#10b981' },
          { id: '6', label: 'Free Screen Guard', code: 'SPIN-ACCESSPACK', color: '#f59e0b' },
        ],
      })
    }

    return NextResponse.json({ prizes })
  } catch (err: any) {
    return NextResponse.json({ message: err.message }, { status: 500 })
  }
}