import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const reference = searchParams.get('reference') || searchParams.get('trxref')
    const secretKey = process.env.PAYSTACK_SECRET_KEY

    if (!reference || !secretKey) {
      return NextResponse.json({ message: 'Missing reference or secret key' }, { status: 400 })
    }

    // 1. Verify directly with Paystack
    const res = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: {
        Authorization: `Bearer ${secretKey}`,
      },
    })

    const data = await res.json()

    if (!data.status || data.data.status !== 'success') {
      return NextResponse.json({ message: 'Transaction unverified or failed' }, { status: 400 })
    }

    const txData = data.data
    const metadata = txData.metadata || {}

    // 2. Activate Pro Seller Plan
    if (metadata.purpose === 'seller_subscription') {
      const sellerId = metadata.seller_id

      if (sellerId) {
        await supabaseAdmin
          .from('profiles')
          .update({
            seller_plan: 'pro',
            subscription_tier: 'pro',
            listing_credits: 25,
            promotional_balance: 2500,
          })
          .eq('id', sellerId)
      }
    }

    return NextResponse.json({ verified: true, plan: 'pro' }, { status: 200 })
  } catch (err: any) {
    return NextResponse.json({ message: err.message || 'Verification error' }, { status: 500 })
  }
}