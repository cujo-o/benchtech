import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import {
  calculateOrderSplit,
  recordOrderPaymentCaptureLedger,
} from '@/lib/finance/calculator'

function getAdminDb() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  return createAdminClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const reference =
    searchParams.get('reference') || searchParams.get('trxref') || ''

  if (!reference) {
    return NextResponse.json(
      { verified: false, message: 'Missing payment reference.' },
      { status: 400 }
    )
  }

  const secretKey = process.env.PAYSTACK_SECRET_KEY
  if (!secretKey) {
    return NextResponse.json(
      { verified: false, message: 'Payment gateway key not configured.' },
      { status: 500 }
    )
  }

  try {
    const paystackRes = await fetch(
      `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
      {
        headers: { Authorization: `Bearer ${secretKey}` },
        cache: 'no-store',
      }
    )
    const paystackData = await paystackRes.json()

    if (!paystackData.status || paystackData.data?.status !== 'success') {
      return NextResponse.json(
        { verified: false, message: 'Transaction not verified by gateway.' },
        { status: 400 }
      )
    }

    const tx = paystackData.data
    const metadata = tx.metadata || {}
    const paidAmountNaira = Number(tx.amount || 0) / 100
    const adminDb = getAdminDb()

    // 1. Handle Seller Pro Plan Subscription
    if (metadata.purpose === 'seller_subscription' && metadata.seller_id) {
      await adminDb
        .from('profiles')
        .update({
          seller_plan: 'pro',
          subscription_tier: 'pro',
          subscription_plan: 'professional',
          updated_at: new Date().toISOString(),
        })
        .eq('id', metadata.seller_id)

      // Credit monthly ₦2,500 ad credit
      const { data: wallet } = await adminDb
        .from('ad_wallets')
        .select('balance')
        .eq('seller_id', metadata.seller_id)
        .maybeSingle()

      await adminDb.from('ad_wallets').upsert(
        {
          seller_id: metadata.seller_id,
          balance: Number(wallet?.balance || 0) + 2500,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'seller_id' }
      )

      return NextResponse.json({
        verified: true,
        purpose: 'seller_subscription',
      })
    }

    // 2. Handle Marketplace Hardware Order
    const { data: existingOrder } = await adminDb
      .from('orders')
      .select('id, order_number')
      .eq('payment_reference', reference)
      .maybeSingle()

    if (existingOrder) {
      return NextResponse.json({
        verified: true,
        orderId: existingOrder.id,
        orderNumber: existingOrder.order_number,
      })
    }

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    const buyerId = metadata.buyer_id || user?.id || null
    const rawItems: any[] = Array.isArray(metadata.items) ? metadata.items : []
    const primaryItem = rawItems[0] || {}
    const primaryProductId =
      primaryItem.id || metadata.product_id || null

    // Fetch full product details + specs from database for all items in cart
    const itemIds = rawItems.map((i) => i.id).filter(Boolean)
    let dbProductsMap = new Map<string, any>()
    if (itemIds.length > 0) {
      const { data: dbProds } = await adminDb
        .from('products')
        .select(
          'id, title, price, brand, model, category, condition, images, specs, seller_id, profiles!products_seller_id_fkey(business_name, full_name, district, seller_plan)'
        )
        .in('id', itemIds)

      for (const p of dbProds || []) {
        dbProductsMap.set(p.id, p)
      }
    }

    const primaryDbProduct = primaryProductId
      ? dbProductsMap.get(primaryProductId)
      : null
    const primarySellerId =
      primaryItem.seller_id ||
      primaryDbProduct?.seller_id ||
      metadata.seller_id ||
      null

    const sellerProfile = Array.isArray(primaryDbProduct?.profiles)
      ? primaryDbProduct.profiles[0]
      : primaryDbProduct?.profiles
    const isProSeller = sellerProfile?.seller_plan === 'pro'

    const enrichedItems = rawItems.map((cartItem) => {
      const dbProd = dbProductsMap.get(cartItem.id)
      const prodSeller = Array.isArray(dbProd?.profiles)
        ? dbProd.profiles[0]
        : dbProd?.profiles
      return {
        id: cartItem.id,
        title: dbProd?.title || cartItem.title || 'Hardware Device',
        price: Number(dbProd?.price || cartItem.price || 0),
        quantity: Number(cartItem.quantity || 1),
        condition: dbProd?.condition || cartItem.condition || 'used',
        brand: dbProd?.brand || cartItem.brand || '',
        model: dbProd?.model || dbProd?.specs?.model || '',
        category: dbProd?.category || 'hardware',
        image:
          (Array.isArray(dbProd?.images) ? dbProd.images[0] : null) ||
          cartItem.image ||
          '',
        specs: dbProd?.specs || cartItem.specs || {},
        seller_id: dbProd?.seller_id || cartItem.seller_id || primarySellerId,
        seller_name:
          prodSeller?.business_name ||
          prodSeller?.full_name ||
          cartItem.seller_name ||
          'Verified Store',
        seller_district: prodSeller?.district || 'Abuja',
      }
    })

    const split = calculateOrderSplit({
      amount: paidAmountNaira,
      isProSeller: Boolean(isProSeller),
      isAttributedAd: false,
    })

    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '')
    const randomSuffix = Math.floor(1000 + Math.random() * 9000)
    const orderNumber = `SB${dateStr}-${randomSuffix}`
    const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString()

    // Core insert
    const { data: createdOrder, error: orderErr } = await adminDb
      .from('orders')
      .insert({
        order_number: orderNumber,
        payment_reference: reference,
        buyer_id: buyerId,
        seller_id: primarySellerId,
        product_id: primaryProductId,
        amount: paidAmountNaira,
        total_amount: paidAmountNaira,
        marketplace_fee: split.marketplaceFee,
        ad_fee: split.adFee,
        seller_payout: split.netSellerPayout,
        status: 'paid',
        order_status: 'paid',
        delivery_status: 'pending',
        payout_status: 'on_hold',
        delivery_area: metadata.delivery_area || 'Abuja',
        delivery_address:
          metadata.delivery_address || metadata.delivery_area || 'Abuja',
        delivery_method: metadata.delivery_method || 'delivery',
        delivery_otp: generatedOtp,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select('id, order_number')
      .single()

    if (orderErr || !createdOrder) {
      return NextResponse.json(
        {
          verified: false,
          message: orderErr?.message || 'Failed to record order.',
        },
        { status: 500 }
      )
    }

    // Store the full multi-item manifest in audit_events (always exists) and order_items column if present
    try {
      await adminDb
        .from('orders')
        .update({
          order_items: enrichedItems,
        } as any)
        .eq('id', createdOrder.id)
    } catch {}

    try {
      await adminDb.from('audit_events').insert({
        actor_id: buyerId,
        action: 'order_checkout_completed',
        target_type: 'order',
        target_id: createdOrder.id,
        result: 'paid',
        metadata: {
          order_number: orderNumber,
          payment_reference: reference,
          buyer_name: metadata.buyer_name,
          buyer_phone: metadata.buyer_phone,
          delivery_address: metadata.delivery_address,
          delivery_area: metadata.delivery_area,
          delivery_method: metadata.delivery_method,
          items: enrichedItems,
        },
      })
    } catch {}

    if (buyerId && primarySellerId) {
      await recordOrderPaymentCaptureLedger({
        orderId: createdOrder.id,
        buyerId,
        sellerId: primarySellerId,
        split,
        paymentReference: reference,
      })
    }

    return NextResponse.json({
      verified: true,
      orderId: createdOrder.id,
      orderNumber: createdOrder.order_number,
    })
  } catch (err: any) {
    return NextResponse.json(
      {
        verified: false,
        message: err?.message || 'Verification failed.',
      },
      { status: 500 }
    )
  }
}