'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { verifyBankAccountWithProvider, NIGERIAN_BANKS } from '@/lib/verification/provider'
import { evaluateSellerAutoVerification } from '@/lib/verification/autoVerify'

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  return createAdminClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

export async function verifySellerBankAction(input: {
  accountNumber: string
  bankCode: string
  expectedName: string
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { ok: false, error: 'Authentication required.' }
  }

  const bank = NIGERIAN_BANKS.find((b) => b.code === input.bankCode)
  const bankName = bank?.name || 'Selected Bank'

  const result = await verifyBankAccountWithProvider({
    accountNumber: input.accountNumber,
    bankCode: input.bankCode,
    bankName,
    expectedHolderName: input.expectedName,
  })

  if (result.status !== 'verified') {
    return {
      ok: false,
      error: result.message,
      resolvedName: result.resolvedAccountName,
    }
  }

  return {
    ok: true,
    accountName: result.resolvedAccountName || input.expectedName,
    accountNumber: result.accountNumber,
    bankName: result.bankName,
    bankCode: input.bankCode,
  }
}

export async function saveOnboardingDraftAction(payload: Record<string, any>) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { ok: false, error: 'Unauthorized' }

  const admin = getAdminClient()
  await admin
    .from('profiles')
    .update({
      onboarding_data: payload,
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id)

  return { ok: true }
}

export async function submitSellerOnboardingAction(payload: {
  sellerType: 'individual' | 'business'
  // Personal / Representative
  fullName: string
  dob: string
  phone: string
  email: string
  repRole?: string
  // Identity
  idType: string
  idNumber: string
  idFrontUrl: string
  idBackUrl: string
  selfieUrl: string
  // Business
  businessName?: string
  cacNumber?: string
  tinNumber?: string
  businessPhone?: string
  businessEmail?: string
  cacCertUrl?: string
  tinCertUrl?: string
  otherDocUrl?: string
  // Address
  streetAddress: string
  city: string
  state: string
  postalCode: string
  addressProofType: string
  addressProofUrl: string
  // Bank
  bankName: string
  bankCode: string
  accountNumber: string
  accountHolderName: string
  bankVerified: boolean
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { ok: false, error: 'You must be signed in to submit verification.' }
  }

  // Server-side validation
  if (!payload.fullName || !payload.phone || !payload.idNumber || !payload.streetAddress) {
    return { ok: false, error: 'Please complete all required personal, identity, and address fields.' }
  }

  if (!payload.bankVerified || !payload.accountNumber || !payload.bankName) {
    return { ok: false, error: 'Please verify your payout bank account before submitting.' }
  }

  if (payload.sellerType === 'business' && (!payload.businessName || !payload.cacNumber)) {
    return { ok: false, error: 'Business name and CAC registration number are required.' }
  }

  const maskedId =
    payload.idNumber.length > 4
      ? `${'*'.repeat(payload.idNumber.length - 4)}${payload.idNumber.slice(-4)}`
      : payload.idNumber

  const admin = getAdminClient()
  const displayStoreName =
    payload.sellerType === 'business' ? payload.businessName! : payload.fullName


    const autoCheck = await evaluateSellerAutoVerification({
    supabaseAdmin: admin,
    sellerId: user.id,
    sellerType: payload.sellerType,
    fullName: payload.fullName,
    businessName: payload.businessName,
    idNumber: payload.idNumber,
    cacNumber: payload.cacNumber,
    phone: payload.phone,
    accountNumber: payload.accountNumber,
    accountHolderName: payload.accountHolderName,
    idFrontUrl: payload.idFrontUrl,
    selfieUrl: payload.selfieUrl,
    cacCertUrl: payload.cacCertUrl,
  })

  const finalStatus = autoCheck.approved ? 'verified' : 'under_review'
  const finalTechTrust = autoCheck.approved ? 'verified' : 'pending'

  // 1. Upsert into seller_verifications
  await admin.from('seller_verifications').upsert(
    {
      seller_id: user.id,
      seller_type: payload.sellerType,
      status: 'under_review',
      legal_name: payload.fullName,
      date_of_birth: payload.dob,
      phone: payload.phone,
      email: payload.email,
      representative_role: payload.repRole || null,
      id_type: payload.idType,
      id_number_masked: maskedId,
      id_front_url: payload.idFrontUrl,
      id_back_url: payload.idBackUrl,
      selfie_url: payload.selfieUrl,
      business_name: payload.businessName || null,
      cac_number: payload.cacNumber || null,
      tin_number: payload.tinNumber || null,
      business_phone: payload.businessPhone || null,
      business_email: payload.businessEmail || null,
      cac_cert_url: payload.cacCertUrl || null,
      tin_cert_url: payload.tinCertUrl || null,
      other_doc_url: payload.otherDocUrl || null,
      street_address: payload.streetAddress,
      city: payload.city,
      state: payload.state,
      postal_code: payload.postalCode,
      address_proof_type: payload.addressProofType,
      address_proof_url: payload.addressProofUrl,
      bank_name: payload.bankName,
      bank_code: payload.bankCode,
      account_number: payload.accountNumber,
      account_holder_name: payload.accountHolderName,
      bank_name_matched: true,
      submitted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'seller_id' }
  )

  // 2. Sync to profiles table
  await admin
    .from('profiles')
    .update({
      full_name: payload.fullName,
      business_name: displayStoreName,
      phone: payload.phone,
      district: payload.city || 'Abuja',
      seller_type: payload.sellerType,
      verification_state: 'under_review',
      tech_trust_status: 'pending',
      cac_number: payload.cacNumber || null,
      tin_number: payload.tinNumber || null,
      street_address: payload.streetAddress,
      city: payload.city,
      state: payload.state,
      postal_code: payload.postalCode,
      bank_name: payload.bankName,
      bank_code: payload.bankCode,
      account_number: payload.accountNumber,
      account_name: payload.accountHolderName,
      bank_verified: true,
      onboarding_data: payload,
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id)

  // 3. Record append-only audit event
  await admin.from('audit_events').insert({
    actor_id: user.id,
    action: 'seller_verification_submitted',
    target_type: 'seller_verification',
    target_id: user.id,
    result: 'under_review',
    metadata: {
      seller_type: payload.sellerType,
      id_type: payload.idType,
      bank_verified: true,
    },
  })

  revalidatePath('/seller/onboarding')
  revalidatePath('/seller')
  revalidatePath('/admin/verifications')

  return { ok: true }
}