import { createClient as createAdminClient } from '@supabase/supabase-js'

export interface OrderFinancialSplit {
  grossAmount: number
  marketplaceCommissionRate: number
  marketplaceFee: number
  adFeeRate: number
  adFee: number
  netSellerPayout: number
}

export function calculateOrderSplit(params: {
  amount: number
  isProSeller: boolean
  isAttributedAd: boolean
  standardCommissionRate?: number
  promoteAdFeeRate?: number
}): OrderFinancialSplit {
  const grossAmount = Math.max(0, Number(params.amount) || 0)
  
  // 5.0% for Pro sellers, 7.0% for Standard sellers
  const commissionRate = params.isProSeller ? 5.0 : (params.standardCommissionRate ?? 7.0)
  const marketplaceFee = Math.round((grossAmount * commissionRate) / 100)

  // 2.5% Pay-When-You-Sell fee if buyer came via an attributed ad
  const adFeeRate = params.isAttributedAd ? (params.promoteAdFeeRate ?? 2.5) : 0
  const adFee = Math.round((grossAmount * adFeeRate) / 100)

  const netSellerPayout = Math.max(0, grossAmount - marketplaceFee - adFee)

  return {
    grossAmount,
    marketplaceCommissionRate: commissionRate,
    marketplaceFee,
    adFeeRate,
    adFee,
    netSellerPayout,
  }
}

/**
 * Record immutable debit/credit journal entries for order escrow capture
 */
export async function recordOrderPaymentCaptureLedger(params: {
  orderId: string
  buyerId: string
  sellerId: string
  split: OrderFinancialSplit
  paymentReference: string
}) {
  const supabase = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  )

  const { orderId, buyerId, sellerId, split, paymentReference } = params

  const entries = [
    // 1. Debit Escrow Holding Account with Gross Buyer Funds
    {
      order_id: orderId,
      buyer_id: buyerId,
      seller_id: sellerId,
      transaction_type: 'payment_captured',
      account: 'escrow_holding',
      entry_type: 'debit',
      amount: split.grossAmount,
      idempotency_key: `capture_escrow_debit_${orderId}_${paymentReference}`,
      reference: paymentReference,
    },
    // 2. Credit Platform Revenue (Marketplace Commission)
    {
      order_id: orderId,
      buyer_id: buyerId,
      seller_id: sellerId,
      transaction_type: 'marketplace_fee',
      account: 'platform_revenue',
      entry_type: 'credit',
      amount: split.marketplaceFee,
      idempotency_key: `capture_platform_fee_${orderId}_${paymentReference}`,
      reference: paymentReference,
    },
    // 3. Credit Ad Revenue (if attributed)
    ...(split.adFee > 0
      ? [
          {
            order_id: orderId,
            buyer_id: buyerId,
            seller_id: sellerId,
            transaction_type: 'ad_fee',
            account: 'ad_revenue',
            entry_type: 'credit',
            amount: split.adFee,
            idempotency_key: `capture_ad_fee_${orderId}_${paymentReference}`,
            reference: paymentReference,
          },
        ]
      : []),
    // 4. Credit Seller Payable (Net proceeds held in escrow)
    {
      order_id: orderId,
      buyer_id: buyerId,
      seller_id: sellerId,
      transaction_type: 'seller_payable',
      account: 'seller_payable',
      entry_type: 'credit',
      amount: split.netSellerPayout,
      idempotency_key: `capture_seller_payable_${orderId}_${paymentReference}`,
      reference: paymentReference,
    },
  ]

  const { error } = await supabase.from('financial_ledger').insert(entries)
  if (error && !error.message.includes('duplicate key')) {
    console.error('Failed to post ledger capture entries:', error)
  }
}