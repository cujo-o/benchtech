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

const OFF_PLATFORM_PATTERN =
  /(\b0[789][01]\d{8}\b|\b234[789][01]\d{8}\b|wa\.me|whatsapp)/i

export async function createProductListingAction(payload: {
  title: string
  category: string
  brand: string
  model: string
  condition: string
  price: number
  quantity: number
  description: string
  images: string[]
  serialOrImei: string
  ownershipProofUrl?: string
  warrantyInfo?: string
  repairHistory?: string
  specs: Record<string, string>
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Please sign in to publish a listing.' }
  }

  const title = (payload.title || '').trim()
  const description = (payload.description || '').trim()
  const price = Number(payload.price || 0)
  const serialClean = (payload.serialOrImei || '').trim().toUpperCase()

  if (!title || price <= 0) {
    return { error: 'Please provide a valid product title and price.' }
  }

  if (!payload.images || payload.images.length === 0) {
    return { error: 'Please upload at least one real photo of the device.' }
  }

  // Prevent off-platform phone numbers or WhatsApp links in public fields
  if (OFF_PLATFORM_PATTERN.test(`${title} ${description}`)) {
    return {
      error:
        'Please remove phone numbers or external chat links from the title and description. All orders are processed through BenchTech.',
    }
  }

  const adminDb = getAdminDb()

  // Check for duplicate IMEI / Serial Number on active listings
  if (serialClean && serialClean.length >= 5) {
    const { data: existingProducts } = await adminDb
      .from('products')
      .select('id, title, specs')
      .eq('status', 'published')

    const isDuplicateSerial = (existingProducts || []).some((p: any) => {
      const existingSerial = (
        p.specs?.serial_number ||
        p.specs?.imei ||
        ''
      )
        .toString()
        .trim()
        .toUpperCase()
      return existingSerial && existingSerial === serialClean
    })

    if (isDuplicateSerial) {
      return {
        error:
          'This IMEI or Serial Number is already registered on another active listing. Duplicate device listings are not permitted.',
      }
    }
  }

  const { data: sellerProfile } = await adminDb
    .from('profiles')
    .select('district, tech_trust_status')
    .eq('id', user.id)
    .maybeSingle()

  // Merge product verification metadata into structured specs
  const mergedSpecs: Record<string, string> = {
    ...payload.specs,
  }
  if (payload.model) mergedSpecs.model = payload.model
  if (payload.warrantyInfo) mergedSpecs.warranty = payload.warrantyInfo
  if (payload.repairHistory) mergedSpecs.repair_history = payload.repairHistory
  if (serialClean) {
    // Store masked serial for public display and keep full reference for verification
    mergedSpecs.serial_masked =
      serialClean.length > 4
        ? `${'*'.repeat(serialClean.length - 4)}${serialClean.slice(-4)}`
        : serialClean
    mergedSpecs.serial_number = serialClean
  }
  if (payload.ownershipProofUrl) {
    mergedSpecs.ownership_proof_url = payload.ownershipProofUrl
    mergedSpecs.product_verification = 'evidence_submitted'
  }

  const { data: inserted, error: insertError } = await adminDb
    .from('products')
    .insert({
      seller_id: user.id,
      title,
      category: payload.category.toLowerCase(),
      brand: payload.brand.trim() || 'Generic',
      model: payload.model.trim() || null,
      condition: payload.condition,
      price,
      stock_quantity: Math.max(1, Number(payload.quantity) || 1),
      description,
      images: payload.images,
      specs: mergedSpecs,
      location: sellerProfile?.district || 'Abuja',
      status: 'published',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select('id')
    .single()

  if (insertError) {
    return { error: insertError.message }
  }

  // Record audit trail for product verification & high-value monitoring
  try {
    await adminDb.from('audit_events').insert({
      actor_id: user.id,
      action: 'seller_created_product_listing',
      target_type: 'product',
      target_id: inserted.id,
      result: price >= 800000 ? 'high_value_flagged' : 'published',
      metadata: {
        category: payload.category,
        price,
        has_serial: Boolean(serialClean),
        has_ownership_proof: Boolean(payload.ownershipProofUrl),
      },
    })
  } catch {}

  revalidatePath('/seller/listings')
  revalidatePath('/seller/dashboard')
  revalidatePath('/seller/store')
  revalidatePath('/products')
  revalidatePath('/feed')

  return { success: true, id: inserted.id }
}

export async function toggleSellerListingStatus(
  productId: string,
  nextStatus: 'published' | 'sold' | 'hidden'
): Promise<void> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return

  const adminDb = getAdminDb()
  await adminDb
    .from('products')
    .update({
      status: nextStatus,
      updated_at: new Date().toISOString(),
    })
    .eq('id', productId)
    .eq('seller_id', user.id)

  revalidatePath('/seller/listings')
  revalidatePath('/seller/dashboard')
  revalidatePath('/seller/store')
  revalidatePath('/products')
  revalidatePath('/feed')
}

export async function deleteSellerListing(productId: string): Promise<void> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return

  const adminDb = getAdminDb()
  await adminDb
    .from('products')
    .delete()
    .eq('id', productId)
    .eq('seller_id', user.id)

  revalidatePath('/seller/listings')
  revalidatePath('/seller/dashboard')
  revalidatePath('/seller/store')
  revalidatePath('/products')
  revalidatePath('/feed')
}

// Compatibility exports for any legacy callers
export const deleteListing = deleteSellerListing
export async function markAsSold(productId: string): Promise<void> {
  await toggleSellerListingStatus(productId, 'sold')
}