import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { amount, email, metadata } = await request.json()
    const secretKey = process.env.PAYSTACK_SECRET_KEY

    if (!secretKey) {
      return NextResponse.json({ message: 'Paystack Secret Key is missing' }, { status: 500 })
    }

    const koboAmount = Math.round(Number(amount) * 100)

    // Detect domain
    const host = request.headers.get('x-forwarded-host') || request.headers.get('host')
    const proto = request.headers.get('x-forwarded-proto') || 'https'
    const origin =
      request.headers.get('origin') ||
      (host ? `${proto}://${host}` : null) ||
      process.env.NEXT_PUBLIC_APP_URL ||
      'https://shopbenchtech.com'

    // Route subscriptions to seller portal and item purchases to orders
    const isSubscription = metadata?.purpose === 'seller_subscription'
    const callbackPath = isSubscription ? '/seller/subscription' : '/orders'
    const callbackUrl = `${origin.replace(/\/$/, '')}${callbackPath}`

    const response = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${secretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        amount: koboAmount,
        callback_url: callbackUrl,
        metadata: {
          purpose: isSubscription ? 'seller_subscription' : 'marketplace_checkout',
          ...metadata,
        },
      }),
    })

    const data = await response.json()

    if (!data.status) {
      return NextResponse.json(
        { message: data.message || 'Payment initialization failed' },
        { status: 400 }
      )
    }

    return NextResponse.json({ authorization_url: data.data.authorization_url }, { status: 200 })
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Server error' }, { status: 500 })
  }
}