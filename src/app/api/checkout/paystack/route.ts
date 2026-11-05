import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'

async function getOrigin() {
  const h = await headers()
  const host = h.get('x-forwarded-host') || h.get('host')
  const proto = h.get('x-forwarded-proto') || 'https'
  if (host) return `${proto}://${host}`
  return process.env.NEXT_PUBLIC_SITE_URL || 'https://shopbenchtech.com'
}

export async function POST(request: Request) {
  try {
    const secretKey = process.env.PAYSTACK_SECRET_KEY
    if (!secretKey) {
      return NextResponse.json(
        { error: 'Paystack secret key is not configured.' },
        { status: 500 }
      )
    }

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    const body = await request.json()
    const amountNaira = Number(body.amount || 0)
    const email = (body.email || user?.email || '').trim()
    const incomingMetadata = body.metadata || {}

    if (!email || amountNaira <= 0) {
      return NextResponse.json(
        { error: 'Valid email and amount are required.' },
        { status: 400 }
      )
    }

    const origin = await getOrigin()
    const callbackUrl =
      body.callbackUrl || `${origin}/checkout/success`

    const paystackRes = await fetch(
      'https://api.paystack.co/transaction/initialize',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${secretKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          amount: Math.round(amountNaira * 100),
          callback_url: callbackUrl,
          metadata: {
            ...incomingMetadata,
            buyer_id: incomingMetadata.buyer_id || user?.id || null,
            items: Array.isArray(incomingMetadata.items)
              ? incomingMetadata.items
              : [],
          },
        }),
      }
    )

    const paystackData = await paystackRes.json()
    if (!paystackData.status || !paystackData.data?.authorization_url) {
      return NextResponse.json(
        {
          error:
            paystackData.message || 'Could not initialize Paystack checkout.',
        },
        { status: 400 }
      )
    }

    return NextResponse.json({
      authorization_url: paystackData.data.authorization_url,
      reference: paystackData.data.reference,
    })
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Checkout initialization error.' },
      { status: 500 }
    )
  }
}