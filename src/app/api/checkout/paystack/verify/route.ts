import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceRoleKey) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  }

  return createClient(url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const reference = searchParams.get('reference') || searchParams.get('trxref')
    const secretKey = process.env.PAYSTACK_SECRET_KEY

    if (!reference || !secretKey) {
      return NextResponse.json(
        { message: 'Missing transaction reference or Paystack secret key' },
        { status: 400 }
      )
    }

    const supabaseAdmin = getSupabaseAdmin()

    // 1. Verify directly with Paystack API
    const res = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: {
        Authorization: `Bearer ${secretKey}`,
      },
      cache: 'no-store',
    })

    const data = await res.json()

    if (!data.status || data.data.status !== 'success') {
      return NextResponse.json(
        { message: 'Transaction unverified or payment failed' },
        { status: 400 }
      )
    }

    const txData = data.data
    const metadata = txData.metadata || {}

    // 2. Flow A: Activate Pro Seller Subscription Plan
    if (metadata.purpose === 'seller_subscription') {
      const sellerId = metadata.seller_id

      if (sellerId) {
        const { error: updateError } = await supabaseAdmin
          .from('profiles')
          .update({
            seller_plan: 'pro',
            subscription_tier: 'pro',
            listing_credits: 25,
            promotional_balance: 2500,
          })
          .eq('id', sellerId)

        if (updateError) throw updateError
      }

      return NextResponse.json({ verified: true, plan: 'pro' }, { status: 200 })
    }

    // Flow C: Ad Promotion Wallet Top-Up
    if (metadata.purpose === 'ad_wallet_topup') {
      const sellerId = metadata.seller_id
      const topupAmount = Number(metadata.amount)

      if (sellerId && topupAmount > 0) {
        // Upsert wallet balance
        const { data: existingWallet } = await supabaseAdmin
          .from('ad_wallets')
          .select('balance')
          .eq('seller_id', sellerId)
          .maybeSingle()

        if (existingWallet) {
          await supabaseAdmin
            .from('ad_wallets')
            .update({
              balance: Number(existingWallet.balance || 0) + topupAmount,
              updated_at: new Date().toISOString(),
            })
            .eq('seller_id', sellerId)
        } else {
          await supabaseAdmin.from('ad_wallets').insert({
            seller_id: sellerId,
            balance: topupAmount,
            total_spent: 0,
          })
        }
      }

      return NextResponse.json({ verified: true, purpose: 'ad_wallet_topup', amount: topupAmount }, { status: 200 })
    }

    // 3. Flow B: Marketplace Product Order Checkout & Commission/Ad Settlement
    const orderAmount = Number(txData.amount) / 100 // Convert Paystack kobo to Naira

    // Fetch dynamic platform pricing & attribution settings from Supabase
    const { data: settings } = await supabaseAdmin
      .from('platform_settings')
      .select('*')
      .eq('id', 'global_config')
      .maybeSingle()

    const standardCommissionRate = (Number(settings?.marketplace_commission_rate) || 7.0) / 100
    const promoteRate = (Number(settings?.promote_product_rate) || 2.5) / 100
    const attributionWindowDays = Number(settings?.attribution_window_days) || 7

    // Calculate Standard Marketplace Commission (7%)
    const marketplaceCommission = Number((orderAmount * standardCommissionRate).toFixed(2))

    // Check for Promotional Attribution (2.5% Shopbench Ads fee)
    const cookies = request.headers.get('cookie') || ''
    const productId = metadata.product_id
    let promotionFee = 0
    let isAttributed = false

    if (productId) {
      const attrCookieMatch = cookies.match(new RegExp(`bt_attr_${productId}=([^;]+)`))
      if (attrCookieMatch) {
        try {
          const attrData = JSON.parse(decodeURIComponent(attrCookieMatch[1]))
          const isWithinWindow =
            Date.now() - Number(attrData.timestamp || 0) <=
            attributionWindowDays * 24 * 60 * 60 * 1000

          if (isWithinWindow && attrData.campaignId) {
            promotionFee = Number((orderAmount * promoteRate).toFixed(2))
            isAttributed = true

            // Insert attribution transaction record
            await supabaseAdmin.from('ad_attributions').insert({
              campaign_id: attrData.campaignId,
              product_id: productId,
              seller_id: attrData.sellerId || metadata.seller_id,
              order_id: reference,
              ad_event_id: attrData.adEventId || null,
              gmv_amount: orderAmount,
              ad_fee_percentage: promoteRate * 100,
              ad_fee_charged: promotionFee,
              settled: true,
            })
          }
        } catch (e) {
          console.error('Failed to parse ad attribution cookie:', e)
        }
      }
    }

    // Final Net Payout to Seller
    const finalSellerPayout = Number(
      (orderAmount - marketplaceCommission - promotionFee).toFixed(2)
    )

    // Update order status if order_id exists
    if (metadata.order_id) {
      await supabaseAdmin
        .from('orders')
        .update({
          status: 'paid',
          marketplace_fee: marketplaceCommission,
          ad_fee: promotionFee,
          seller_payout: finalSellerPayout,
          payment_reference: reference,
        })
        .eq('id', metadata.order_id)
    }

    const response = NextResponse.json(
      {
        verified: true,
        type: 'order_checkout',
        reference,
        orderAmount,
        marketplaceCommission,
        promotionFee,
        finalSellerPayout,
        isAttributed,
      },
      { status: 200 }
    )

    // Clear attribution cookie after successful settlement
    if (isAttributed && productId) {
      response.cookies.delete(`bt_attr_${productId}`)
    }

    return response
  } catch (err: any) {
    return NextResponse.json(
      { message: err.message || 'Payment verification failed' },
      { status: 500 }
    )
  }
}

// Allow frontend checkout modal to invoke verification via POST as well
export async function POST(request: Request) {
  return GET(request)
}

