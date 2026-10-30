'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { NIGERIAN_BANKS } from '@/lib/verification/provider'

function getAdminDb() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  return createAdminClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

export async function resolveSellerBankNuban(params: {
  bankName: string
  accountNumber: string
}): Promise<{ resolvedName?: string; error?: string }> {
  const cleanAccount = (params.accountNumber || '').replace(/\D/g, '')
  if (cleanAccount.length !== 10) {
    return { error: 'Account number must be 10 digits.' }
  }

  const matchedBank = NIGERIAN_BANKS.find(
    (b) =>
      b.name.toLowerCase() === params.bankName.toLowerCase() ||
      b.name.toLowerCase().includes(params.bankName.toLowerCase())
  )

  const paystackSecret = process.env.PAYSTACK_SECRET_KEY
  if (!paystackSecret || !matchedBank?.code) {
    return {}
  }

  try {
    const res = await fetch(
      `https://api.paystack.co/bank/resolve?account_number=${cleanAccount}&bank_code=${matchedBank.code}`,
      {
        headers: { Authorization: `Bearer ${paystackSecret}` },
        cache: 'no-store',
      }
    )
    const data = await res.json()
    if (data?.status && data?.data?.account_name) {
      return { resolvedName: data.data.account_name }
    }
  } catch {}

  return {}
}

export async function updateBankAccount(params: {
  bankName: string
  accountNumber: string
  accountName: string
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Please sign in to update bank details.' }
  }

  const cleanBank = (params.bankName || '').trim()
  const cleanAccount = (params.accountNumber || '').replace(/\D/g, '')
  const cleanHolder = (params.accountName || '').trim()

  if (!cleanBank) {
    return { success: false, error: 'Please select a bank from the list.' }
  }

  if (cleanAccount.length !== 10) {
    return {
      success: false,
      error: 'Please enter a valid 10-digit NUBAN account number.',
    }
  }

  if (!cleanHolder || cleanHolder.length < 3) {
    return {
      success: false,
      error: 'Please enter the account holder name.',
    }
  }

  const adminDb = getAdminDb()
  const now = new Date().toISOString()

  const { error } = await adminDb
    .from('profiles')
    .update({
      bank_name: cleanBank,
      account_number: cleanAccount,
      account_name: cleanHolder,
      updated_at: now,
    })
    .eq('id', user.id)

  if (error) {
    return { success: false, error: error.message }
  }

  try {
    await adminDb
      .from('seller_verifications')
      .update({
        bank_name: cleanBank,
        account_number: cleanAccount,
        account_holder_name: cleanHolder,
        updated_at: now,
      })
      .eq('seller_id', user.id)
  } catch {}

  try {
    await adminDb.from('audit_events').insert({
      actor_id: user.id,
      action: 'seller_updated_bank_account',
      target_type: 'profile',
      target_id: user.id,
      result: 'updated',
      metadata: {
        bank_name: cleanBank,
        account_masked: `******${cleanAccount.slice(-4)}`,
        account_name: cleanHolder,
      },
    })
  } catch {}

  revalidatePath('/seller/wallet')
  revalidatePath('/seller/payouts')
  revalidatePath('/admin/payouts')

  return {
    success: true,
    bank: {
      bank_name: cleanBank,
      account_number: cleanAccount,
      account_name: cleanHolder,
    },
  }
}

export async function requestPayout(params: { amount: number }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Please sign in to withdraw funds.' }
  }

  const amount = Math.round(Number(params.amount || 0))
  if (amount < 2000) {
    return {
      success: false,
      error: 'Minimum withdrawal amount is ₦2,000.',
    }
  }

  const adminDb = getAdminDb()
  const { data: profile } = await adminDb
    .from('profiles')
    .select('available_payout, bank_name, account_number, account_name, business_name, full_name')
    .eq('id', user.id)
    .maybeSingle()

  if (!profile?.bank_name || !profile?.account_number) {
    return {
      success: false,
      error: 'Please link a settlement bank account before withdrawing.',
    }
  }

  const currentBalance = Number(profile.available_payout || 0)
  if (amount > currentBalance) {
    return {
      success: false,
      error: `Withdrawal amount exceeds your available balance of ₦${currentBalance.toLocaleString()}.`,
    }
  }

  const remainingBalance = Math.max(0, currentBalance - amount)
  const withdrawalRef = `WD-${Date.now().toString().slice(-8)}`
  const now = new Date().toISOString()

  const { error: updateErr } = await adminDb
    .from('profiles')
    .update({
      available_payout: remainingBalance,
      updated_at: now,
    })
    .eq('id', user.id)

  if (updateErr) {
    return { success: false, error: updateErr.message }
  }

  // Record in financial_ledger (if table exists)
  try {
    await adminDb.from('financial_ledger').insert({
      seller_id: user.id,
      transaction_type: 'seller_payout_withdrawal',
      account: 'seller_payable',
      entry_type: 'debit',
      amount,
      reference: withdrawalRef,
      idempotency_key: `withdrawal_${user.id}_${withdrawalRef}`,
    })
  } catch {}

  // Record in audit_events so Seller Wallet History & Admin Payouts display it
  try {
    await adminDb.from('audit_events').insert({
      actor_id: user.id,
      action: 'seller_requested_bank_withdrawal',
      target_type: 'payout',
      target_id: user.id,
      result: 'processing',
      metadata: {
        reference: withdrawalRef,
        amount,
        remaining_balance: remainingBalance,
        bank_name: profile.bank_name,
        account_number: profile.account_number,
        account_name: profile.account_name || profile.business_name || profile.full_name,
      },
    })
  } catch {}

  revalidatePath('/seller/wallet')
  revalidatePath('/seller/payouts')
  revalidatePath('/seller/dashboard')
  revalidatePath('/admin/payouts')
  revalidatePath('/admin')

  return {
    success: true,
    reference: withdrawalRef,
    remainingBalance,
  }
}