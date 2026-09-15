import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: Request) {
  try {
    const rawBody = await request.text()
    const signature = request.headers.get('x-paystack-signature')
    const secretKey = process.env.PAYSTACK_SECRET_KEY

    if (!secretKey || !signature) {
      return NextResponse.json({ message: 'Missing secret key or signature' }, { status: 400 })
    }

    // 1. Verify HMAC SHA512 Signature (Section 30)
    const hash = crypto
      .createHmac('sha512', secretKey)
      .update(rawBody)
      .digest('hex')

    if (hash !== signature) {
      return NextResponse.json({ message: 'Invalid signature' }, { status: 401 })
    }

    const event = JSON.parse(rawBody)

    // 2. Handle successful charge
    if (event.event === 'charge.success') {
      const data = event.data
      const meta = data.metadata

      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

      if (!supabaseUrl || !serviceRoleKey) {
        console.error('Missing SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_URL')
        return NextResponse.json({ message: 'Server configuration error' }, { status: 500 })
      }

      // Initialize admin client to write updates without active user cookies
      const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
        auth: { persistSession: false },
      })

      // 3. Duplicate event / Idempotency protection (Section 30)
      const { data: existingPayment } = await supabaseAdmin
        .from('payment_records')
        .select('status')
        .eq('paystack_reference', data.reference)
        .single()

      if (existingPayment?.status === 'successful') {
        return NextResponse.json(
          { received: true, message: 'Transaction already processed' },
          { status: 200 }
        )
      }

      if (meta?.purpose === 'seller_subscription' && meta?.seller_id) {
        // Calculate 30-day billing expiration
        const expiresAt = new Date()
        expiresAt.setDate(expiresAt.getDate() + 30)

        // Fetch profile to accumulate promotional credits
        const { data: profile } = await supabaseAdmin
          .from('profiles')
          .select('promotional_credits')
          .eq('id', meta.seller_id)
          .single()

        const currentCredits = profile?.promotional_credits || 0
        const additionalCredits = Number(meta.promo_credits || 0)

        // Upgrade Seller Profile & Quotas
        const { error: profileError } = await supabaseAdmin
          .from('profiles')
          .update({
            subscription_plan: meta.plan_key,
            max_listings: Number(meta.max_listings) || 5,
            max_images_per_listing: Number(meta.max_images) || 10,
            promotional_credits: currentCredits + additionalCredits,
            subscription_expires_at: expiresAt.toISOString(),
          })
          .eq('id', meta.seller_id)

        if (profileError) {
          console.error('Failed to update seller profile:', profileError)
          return NextResponse.json({ message: 'Profile update failed' }, { status: 500 })
        }

        // Upsert payment audit record
        await supabaseAdmin.from('payment_records').upsert(
          {
            paystack_reference: data.reference,
            user_id: meta.seller_id,
            payment_purpose: 'seller_subscription',
            plan_tier: meta.plan_key,
            amount: data.amount / 100, // Convert Kobo back to NGN
            currency: data.currency || 'NGN',
            status: 'successful',
            channel: data.channel,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'paystack_reference' }
        )
      }
    }

    return NextResponse.json({ received: true }, { status: 200 })
  } catch (error: any) {
    console.error('Webhook processing failed:', error)
    return NextResponse.json({ message: error.message || 'Internal error' }, { status: 500 })
  }
}