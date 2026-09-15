import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const rawBody = await request.text()
    const signature = request.headers.get('x-paystack-signature')
    const secretKey = process.env.PAYSTACK_SECRET_KEY

    if (!secretKey || !signature) {
      return NextResponse.json({ message: 'Configuration error' }, { status: 400 })
    }

    // Verify HMAC SHA512 Signature
    const hash = crypto
      .createHmac('sha512', secretKey)
      .update(rawBody)
      .digest('hex')

    if (hash !== signature) {
      return NextResponse.json({ message: 'Invalid signature' }, { status: 401 })
    }

    const event = JSON.parse(rawBody)

    if (event.event === 'charge.success') {
      const data = event.data
      const meta = data.metadata

      if (meta?.purpose === 'seller_subscription' && meta?.seller_id) {
        const supabase = await createClient()

        // 1. Calculate 30-day billing expiration
        const expiresAt = new Date()
        expiresAt.setDate(expiresAt.getDate() + 30)

        // 2. Upgrade Seller Profile & Quotas
        await supabase
          .from('profiles')
          .update({
            subscription_plan: meta.plan_key,
            max_listings: meta.max_listings,
            max_images_per_listing: meta.max_images,
            promotional_credits: meta.promo_credits,
            subscription_expires_at: expiresAt.toISOString(),
          })
          .eq('id', meta.seller_id)

        // 3. Mark payment record successful
        await supabase
          .from('payment_records')
          .update({
            status: 'successful',
            channel: data.channel,
            updated_at: new Date().toISOString(),
          })
          .eq('paystack_reference', data.reference)
      }
    }

    return NextResponse.json({ received: true }, { status: 200 })
  } catch (error: any) {
    console.error('Webhook processing failed:', error)
    return NextResponse.json({ message: 'Internal error' }, { status: 500 })
  }
}