'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function updateBankAccount(formData: {
  bankName: string
  accountNumber: string
  accountName: string
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { success: false, error: 'Unauthorized' }

  if (!formData.bankName || !formData.accountNumber || !formData.accountName) {
    return { success: false, error: 'Please provide all bank account details' }
  }

  const { error } = await supabase
    .from('profiles')
    .update({
      bank_name: formData.bankName,
      account_number: formData.accountNumber,
      account_name: formData.accountName,
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id)

  if (error) return { success: false, error: error.message }

  revalidatePath('/seller/wallet')
  return { success: true }
}

export async function requestPayout(formData: { amount: number; notes?: string }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { success: false, error: 'Unauthorized' }

  const amount = Number(formData.amount)
  if (!amount || amount < 2000) {
    return { success: false, error: 'Minimum withdrawal amount is ₦2,000' }
  }

  // 1. Fetch profile & check available balance
  const { data: profile } = await supabase
    .from('profiles')
    .select('available_payout, bank_name, account_number, account_name')
    .eq('id', user.id)
    .single()

  if (!profile?.bank_name || !profile?.account_number) {
    return { success: false, error: 'Please add your Nigerian bank account details first' }
  }

  const currentAvailable = Number(profile.available_payout || 0)
  if (currentAvailable < amount) {
    return { success: false, error: 'Insufficient available payout balance' }
  }

  // 2. Deduct from available payout & create a withdrawal request
  const { error: profileError } = await supabase
    .from('profiles')
    .update({
      available_payout: currentAvailable - amount,
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id)

  if (profileError) return { success: false, error: profileError.message }

  // 3. Log into payout_requests table
  await supabase.from('payout_requests').insert({
    seller_id: user.id,
    amount,
    bank_name: profile.bank_name,
    account_number: profile.account_number,
    account_name: profile.account_name,
    status: 'pending',
  })

  revalidatePath('/seller/wallet')
  return { success: true }
}