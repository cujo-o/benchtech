'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

function getAdminDb() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  return createAdminClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

export async function createBuyerDeviceRequestAction(formData: FormData) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Please sign in to broadcast a device request.' }
  }

  const title = ((formData.get('title') as string) || '').trim()
  const category = ((formData.get('category') as string) || 'phones').trim()
  const condition = ((formData.get('condition') as string) || 'any').trim()
  const budget = Number(formData.get('budget') || 0)
  const preferredDistrict = (
    (formData.get('preferredDistrict') as string) || 'All Abuja'
  ).trim()
  const specsNotes = ((formData.get('specsNotes') as string) || '').trim()

  if (!title || budget <= 0) {
    return {
      error: 'Please enter the device title/specs and your target budget.',
    }
  }

  const adminDb = getAdminDb()
  const { data: buyerProfile } = await adminDb
    .from('profiles')
    .select('full_name, business_name, phone, district')
    .eq('id', user.id)
    .maybeSingle()

  const requestId = crypto.randomUUID()
  const now = new Date().toISOString()

  const { error } = await adminDb.from('audit_events').insert({
    id: requestId,
    actor_id: user.id,
    action: 'buyer_device_request',
    target_type: 'device_request',
    target_id: requestId,
    result: 'open',
    metadata: {
      request_id: requestId,
      buyer_id: user.id,
      buyer_name:
        buyerProfile?.full_name ||
        buyerProfile?.business_name ||
        user.email?.split('@')[0] ||
        'Abuja Buyer',
      buyer_district: buyerProfile?.district || 'Abuja',
      title,
      category,
      condition,
      budget,
      preferred_district: preferredDistrict,
      specs_notes: specsNotes,
      created_at: now,
    },
  })

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/requests/new')
  revalidatePath('/seller/enquiries')
  revalidatePath('/admin/requests')

  return { success: true, requestId }
}

export async function sellerRespondToDeviceRequestAction(formData: FormData) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Please sign in as a seller to respond.' }
  }

  const requestId = ((formData.get('requestId') as string) || '').trim()
  const buyerId = ((formData.get('buyerId') as string) || '').trim()
  const offeredPrice = Number(formData.get('offeredPrice') || 0)
  const productId = ((formData.get('productId') as string) || '').trim()
  const condition = ((formData.get('condition') as string) || 'uk_used').trim()
  const note = ((formData.get('note') as string) || '').trim()

  if (!requestId || offeredPrice <= 0) {
    return { error: 'Please enter your offered price for this device.' }
  }

  const adminDb = getAdminDb()
  const { data: sellerProfile } = await adminDb
    .from('profiles')
    .select('id, business_name, full_name, district, tech_trust_status, avatar_url')
    .eq('id', user.id)
    .maybeSingle()

  let linkedProductTitle: string | null = null
  if (productId) {
    const { data: prod } = await adminDb
      .from('products')
      .select('title')
      .eq('id', productId)
      .maybeSingle()
    linkedProductTitle = prod?.title || null
  }

  const storeName =
    sellerProfile?.business_name || sellerProfile?.full_name || 'Abuja Seller'

  const { error } = await adminDb.from('audit_events').insert({
    actor_id: user.id,
    action: 'seller_fulfilled_device_request',
    target_type: 'device_request',
    target_id: requestId,
    result: 'available',
    metadata: {
      request_id: requestId,
      buyer_id: buyerId,
      seller_id: user.id,
      seller_name: storeName,
      seller_district: sellerProfile?.district || 'Abuja',
      seller_verified: sellerProfile?.tech_trust_status === 'verified',
      offered_price: offeredPrice,
      condition,
      product_id: productId || null,
      product_title: linkedProductTitle,
      note:
        note ||
        `We have this device available in stock at our ${
          sellerProfile?.district || 'Abuja'
        } store for physical inspection.`,
      responded_at: new Date().toISOString(),
    },
  })

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/seller/enquiries')
  revalidatePath('/requests/new')
  revalidatePath('/admin/requests')

  return { success: true }
}

export async function closeBuyerDeviceRequestAction(requestId: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user || !requestId) return { error: 'Unauthorized' }

  const adminDb = getAdminDb()
  await adminDb
    .from('audit_events')
    .update({ result: 'closed' })
    .eq('id', requestId)
    .eq('actor_id', user.id)

  revalidatePath('/requests/new')
  revalidatePath('/seller/enquiries')
  return { success: true }
}

export async function sellerReplyToProductEnquiryAction(formData: FormData) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: 'Unauthorized' }

  const enquiryId = ((formData.get('enquiryId') as string) || '').trim()
  const replyText = ((formData.get('replyText') as string) || '').trim()

  if (!enquiryId || !replyText) {
    return { error: 'Reply message cannot be empty.' }
  }

  const adminDb = getAdminDb()

  // Update enquiry status and store seller reply
  await adminDb
    .from('enquiries')
    .update({
      status: 'replied',
      updated_at: new Date().toISOString(),
    })
    .eq('id', enquiryId)
    .eq('seller_id', user.id)

  try {
    await adminDb.from('enquiry_replies').insert({
      enquiry_id: enquiryId,
      sender_id: user.id,
      message: replyText,
    })
  } catch {}

  await adminDb.from('audit_events').insert({
    actor_id: user.id,
    action: 'seller_replied_product_enquiry',
    target_type: 'enquiry',
    target_id: enquiryId,
    result: 'replied',
    metadata: {
      enquiry_id: enquiryId,
      seller_id: user.id,
      reply_text: replyText,
      replied_at: new Date().toISOString(),
    },
  })

  revalidatePath('/seller/enquiries')
  revalidatePath('/requests/new')
  return { success: true }
}