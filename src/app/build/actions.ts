'use server'

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

export type SetupDeviceCategory =
  | 'phone_mobile'
  | 'camera_creator'
  | 'gaming_console'
  | 'peripherals_accessories'
  | 'laptop'
  | 'laptop_workstation'
  | 'desktop'
  | 'multi_device'

export interface SetupConsultationInput {
  consultationMode: 'quick' | 'detailed' | 'professional'
  setupType: SetupDeviceCategory
  primaryPurpose: string
  secondaryPurposes: string[]
  budgetMax: number
  budgetFlexibility: 'fixed' | 'somewhat_flexible' | 'flexible_if_worth_it'
  valuePriority: 'balanced' | 'performance' | 'lowest_cost'
  conditionPreference: 'any' | 'brand_new_only'
  existingEquipment: string[]
  powerBackupNeeded: boolean
  answers: Record<string, any>
}

export interface RecommendedSetupItem {
  roleLabel: string
  product: {
    id: string
    title: string
    price: number
    condition: string
    brand: string
    category: string
    image: string | null
    seller_id: string
    seller_name: string
    seller_verified: boolean
    district: string
    stock_quantity: number
    specs: Record<string, any>
  }
  reason: string
  alternatives: Array<{
    id: string
    title: string
    price: number
    condition: string
    brand: string
    category: string
    image: string | null
    seller_id: string
    seller_name: string
    seller_verified: boolean
    district: string
    stock_quantity: number
    specs: Record<string, any>
  }>
}

export interface SetupRecommendationOption {
  laneId: 'balanced' | 'performance' | 'budget'
  laneLabel: string
  headline: string
  totalPrice: number
  withinBudget: boolean
  budgetDelta: number
  compatibilityStatus:
    | 'Verified Compatible'
    | 'Compatible with Condition'
    | 'Not Verified'
  compatibilityNotes: string[]
  whyItFits: string
  expectedCapabilities: string[]
  knownLimitations: string[]
  upgradePath: string
  items: RecommendedSetupItem[]
}

function resolveFirstImage(images: any): string | null {
  if (!images) return null
  if (Array.isArray(images)) return images[0] || null
  if (typeof images === 'string') {
    try {
      const parsed = JSON.parse(images)
      if (Array.isArray(parsed)) return parsed[0] || null
    } catch {
      return images.startsWith('http') ? images : null
    }
  }
  return null
}

function parseRamGb(specs: Record<string, any>, title: string): number | null {
  const raw = `${specs?.ram || ''} ${title || ''}`
  const m = raw.match(/\b(4|8|12|16|24|32|48|64|128)\s*GB\s*(RAM|DDR|Unified)?\b/i)
  return m ? Number(m[1]) : null
}

function parseStorageGb(specs: Record<string, any>, title: string): number | null {
  const raw = `${specs?.storage || ''} ${title || ''}`
  const tbMatch = raw.match(/\b(1|2|4|8)\s*TB\b/i)
  if (tbMatch) return Number(tbMatch[1]) * 1024
  const gbMatch = raw.match(/\b(64|128|256|512|1000)\s*GB\b/i)
  return gbMatch ? Number(gbMatch[1]) : null
}

export async function generateAdaptiveSetupRecommendations(
  input: SetupConsultationInput
): Promise<{
  ok: boolean
  error?: string
  budgetNotice?: string
  workloadSummary: string
  options: SetupRecommendationOption[]
}> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return {
      ok: false,
      error: 'Please sign in to generate setup recommendations.',
      workloadSummary: '',
      options: [],
    }
  }

  const adminDb = getAdminDb()
  const { data: rawProducts } = await adminDb
    .from('products')
    .select(
      '*, profiles!products_seller_id_fkey(business_name, full_name, district, tech_trust_status)'
    )
    .eq('status', 'published')
    .order('created_at', { ascending: false })

  const allProducts = (rawProducts || [])
    .filter((p: any) => Number(p.stock_quantity ?? 1) > 0)
    .map((p: any) => {
      const seller = Array.isArray(p.profiles) ? p.profiles[0] : p.profiles
      return {
        id: p.id,
        title: p.title || 'Hardware Item',
        price: Number(p.price || 0),
        condition: p.condition || 'used',
        brand: p.brand || 'Generic',
        category: (p.category || 'hardware').toLowerCase(),
        image: resolveFirstImage(p.images),
        seller_id: p.seller_id,
        seller_name:
          seller?.business_name || seller?.full_name || 'Abuja Vendor',
        seller_verified: seller?.tech_trust_status === 'verified',
        district: seller?.district || p.location || 'Abuja',
        stock_quantity: Number(p.stock_quantity ?? 1),
        specs: p.specs || {},
      }
    })

  const conditionFiltered =
    input.conditionPreference === 'brand_new_only'
      ? allProducts.filter((p) => p.condition === 'brand_new')
      : allProducts

  const candidatePool =
    conditionFiltered.length > 0 ? conditionFiltered : allProducts

  if (candidatePool.length === 0) {
    return {
      ok: false,
      error: 'No active inventory is currently available in the catalog.',
      workloadSummary: '',
      options: [],
    }
  }

  // Categorize live inventory across all hardware types (Phones, Cameras/Osmo, Consoles, Laptops, Monitors, Peripherals)
  const phonePool = candidatePool.filter(
    (p) =>
      p.category === 'phones' ||
      p.category === 'tablets' ||
      /iphone|samsung|galaxy|pixel|ipad|redmi|xiaomi|infinix|tecno/i.test(p.title)
  )

  const cameraPool = candidatePool.filter(
    (p) =>
      p.category === 'cameras' ||
      /camera|osmo|dji|gopro|canon|sony alpha|nikon|asahiflex|lens|gimbal|microphone/i.test(
        p.title
      )
  )

  const consolePool = candidatePool.filter(
    (p) =>
      p.category === 'gaming' ||
      /ps4|ps5|playstation|xbox|nintendo|steam deck|console/i.test(p.title)
  )

  const computerPool = candidatePool.filter(
    (p) =>
      p.category === 'laptops' ||
      p.category === 'components' ||
      /laptop|macbook|thinkpad|latitude|vostro|pavilion|elitebook|zenbook|omen|legion|pc|desktop/i.test(
        p.title
      )
  )

  const monitorPool = candidatePool.filter(
    (p) =>
      p.category === 'monitors' || /monitor|display|screen|hisense/i.test(p.title)
  )

  const peripheralPool = candidatePool.filter(
    (p) =>
      ['accessories', 'monitors', 'networking', 'wearables', 'smart_home'].includes(
        p.category
      ) ||
      /monitor|keyboard|mouse|headset|headphone|earbud|airpods|watch|starlink|router|ssd|dock|ups/i.test(
        p.title
      )
  )

  // Select the primary pool based on the user's chosen setupType
  let primaryCandidates = candidatePool
  let primaryRoleLabel = 'Primary Device'

  if (input.setupType === 'phone_mobile') {
    primaryCandidates = phonePool.length > 0 ? phonePool : candidatePool
    primaryRoleLabel = 'Primary Smartphone / Tablet'
  } else if (input.setupType === 'camera_creator') {
    primaryCandidates =
      cameraPool.length > 0
        ? cameraPool
        : [...cameraPool, ...phonePool].length > 0
        ? [...cameraPool, ...phonePool]
        : candidatePool
    primaryRoleLabel = 'Primary Camera / Creator Device'
  } else if (input.setupType === 'gaming_console') {
    primaryCandidates =
      consolePool.length > 0
        ? consolePool
        : [...consolePool, ...computerPool].length > 0
        ? [...consolePool, ...computerPool]
        : candidatePool
    primaryRoleLabel = 'Primary Gaming Console / Rig'
  } else if (input.setupType === 'peripherals_accessories') {
    primaryCandidates =
      peripheralPool.length > 0 ? peripheralPool : candidatePool
    primaryRoleLabel = 'Primary Display / Peripheral'
  } else if (
    input.setupType === 'laptop' ||
    input.setupType === 'laptop_workstation' ||
    input.setupType === 'desktop'
  ) {
    primaryCandidates = computerPool.length > 0 ? computerPool : candidatePool
    primaryRoleLabel =
      input.setupType === 'desktop' ? 'Primary System' : 'Primary Laptop'
  } else {
    // multi_device: all catalog items eligible
    primaryCandidates = candidatePool
    primaryRoleLabel = 'Lead Hardware Device'
  }

  const customQuery = (input.answers.customNotes || '').trim().toLowerCase()

  const scoredPrimary = primaryCandidates
    .map((item) => {
      let score = 50
      const ramGb = parseRamGb(item.specs, item.title)
      const storageGb = parseStorageGb(item.specs, item.title)

      if (item.seller_verified) score += 12
      if (ramGb && ramGb >= 8) score += 10
      if (storageGb && storageGb >= 128) score += 10

      // Boost if user typed a matching keyword (e.g., "osmo", "asahiflex", "iphone", "hisense", "ps4")
      if (
        customQuery &&
        `${item.title} ${item.brand} ${item.category}`
          .toLowerCase()
          .includes(customQuery)
      ) {
        score += 45
      }

      if (
        input.answers.preferredBrand &&
        input.answers.preferredBrand !== 'any' &&
        item.brand
          .toLowerCase()
          .includes(input.answers.preferredBrand.toLowerCase())
      ) {
        score += 20
      }

      if (input.setupType === 'phone_mobile' && input.answers.mobileOs) {
        if (
          input.answers.mobileOs === 'ios' &&
          /iphone|ipad|apple/i.test(`${item.title} ${item.brand}`)
        ) {
          score += 25
        } else if (
          input.answers.mobileOs === 'android' &&
          !/iphone|ipad|apple/i.test(`${item.title} ${item.brand}`)
        ) {
          score += 25
        }
      }

      return { item, score, ramGb, storageGb }
    })
    .sort((a, b) => b.score - a.score)

  const ownsMonitor = (input.existingEquipment || []).includes('monitor')
  const maxBudget = Math.max(0, Number(input.budgetMax || 0))
  const effectiveCeiling =
    input.budgetFlexibility === 'flexible_if_worth_it'
      ? Math.round(maxBudget * 1.2)
      : input.budgetFlexibility === 'somewhat_flexible'
      ? Math.round(maxBudget * 1.1)
      : maxBudget

  function buildSetupOption(
    laneId: 'balanced' | 'performance' | 'budget',
    laneLabel: string,
    primaryEntry: (typeof scoredPrimary)[0],
    includeCompanion: boolean
  ): SetupRecommendationOption {
    const items: RecommendedSetupItem[] = []
    const compatibilityNotes: string[] = []

    const mainItem = primaryEntry.item
    const alternatives = scoredPrimary
      .map((s) => s.item)
      .filter((i) => i.id !== mainItem.id)
      .slice(0, 4)

    items.push({
      roleLabel: primaryRoleLabel,
      product: mainItem,
      reason: `Matched to your ${input.setupType.replace(
        /_/g,
        ' '
      )} and ${input.primaryPurpose.replace(/_/g, ' ')} requirements.`,
      alternatives,
    })

    // Add a companion item (e.g., Monitor for Console/Laptop Workstation/Multi-Device, or Camera/Phone companion)
    if (includeCompanion) {
      let companionPool: any[] = []
      let companionLabel = 'Companion Device / Peripheral'

      if (
        (input.setupType === 'gaming_console' ||
          input.setupType === 'laptop_workstation' ||
          input.setupType === 'desktop') &&
        !ownsMonitor
      ) {
        companionPool = monitorPool
        companionLabel = 'External Display / Monitor'
      } else if (input.setupType === 'phone_mobile') {
        companionPool = [...cameraPool, ...peripheralPool]
        companionLabel = 'Creator / Audio Companion'
      } else if (input.setupType === 'camera_creator') {
        companionPool = [...phonePool, ...computerPool, ...monitorPool]
        companionLabel = 'Editing / Monitoring Companion'
      } else if (input.setupType === 'multi_device') {
        companionPool = candidatePool.filter(
          (p) => p.category !== mainItem.category
        )
        companionLabel = 'Secondary Setup Device'
      }

      const validCompanions = companionPool.filter(
        (c) => c.id !== mainItem.id
      )
      if (validCompanions.length > 0) {
        const sortedComp = [...validCompanions].sort((a, b) =>
          laneId === 'performance' ? b.price - a.price : a.price - b.price
        )
        const chosenComp = sortedComp[0]
        items.push({
          roleLabel: companionLabel,
          product: chosenComp,
          reason: `Complements ${mainItem.title} to complete your ${input.setupType.replace(
            /_/g,
            ' '
          )} workflow.`,
          alternatives: sortedComp.slice(1, 4),
        })
      }
    }

    const totalPrice = items.reduce(
      (sum, entry) => sum + Number(entry.product.price || 0),
      0
    )
    const withinBudget = maxBudget > 0 ? totalPrice <= effectiveCeiling : true
    const budgetDelta = maxBudget > 0 ? totalPrice - maxBudget : 0

    compatibilityNotes.push(
      'Verified available in Abuja inventory with 7-day physical inspection protection.'
    )

    const expectedCapabilities = [
      `Configured for ${input.primaryPurpose.replace(/_/g, ' ')} workflows.`,
      `Physical inspection and handover OTP verification included upon delivery in Abuja.`,
    ]

    const knownLimitations: string[] = []
    if (!withinBudget) {
      knownLimitations.push(
        `Exceeds your stated budget of ₦${maxBudget.toLocaleString()} by ₦${Math.abs(
          budgetDelta
        ).toLocaleString()} based on current live catalog prices.`
      )
    } else {
      knownLimitations.push(
        'Inspect physical ports, battery health, and included accessories during handover.'
      )
    }

    return {
      laneId,
      laneLabel,
      headline:
        items.length > 1
          ? `${mainItem.title} + ${items[1].product.title}`
          : mainItem.title,
      totalPrice,
      withinBudget,
      budgetDelta,
      compatibilityStatus: 'Verified Compatible',
      compatibilityNotes,
      whyItFits: `Selected from live Abuja store listings for your ${input.setupType.replace(
        /_/g,
        ' '
      )} consultation.`,
      expectedCapabilities,
      knownLimitations,
      upgradePath:
        'You can swap any item above with another live catalog listing or add companion peripherals at any time.',
      items,
    }
  }

  const options: SetupRecommendationOption[] = []
  const usedPrimaryIds = new Set<string>()

  const wantsCompanion =
    input.setupType === 'laptop_workstation' ||
    input.setupType === 'desktop' ||
    input.setupType === 'multi_device' ||
    input.answers.includeCompanion === 'yes'

  // 1. Best Value / Balanced
  const affordable = scoredPrimary.filter(
    (s) => maxBudget === 0 || s.item.price <= effectiveCeiling
  )
  const balancedPrimary =
    affordable[0] ||
    [...scoredPrimary].sort((a, b) => a.item.price - b.item.price)[0]

  if (balancedPrimary) {
    usedPrimaryIds.add(balancedPrimary.item.id)
    options.push(
      buildSetupOption(
        'balanced',
        'Best Value / Balanced',
        balancedPrimary,
        wantsCompanion
      )
    )
  }

  // 2. Best Performance / Multi-Item Bundle
  const perfPrimary =
    scoredPrimary.find((s) => !usedPrimaryIds.has(s.item.id)) ||
    scoredPrimary[0]
  if (perfPrimary && (options.length === 0 || perfPrimary.item.id !== balancedPrimary?.item.id || !wantsCompanion)) {
    usedPrimaryIds.add(perfPrimary.item.id)
    options.push(
      buildSetupOption('performance', 'Complete Bundle / Pro', perfPrimary, true)
    )
  }

  // 3. Budget Alternative
  const budgetPrimary = [...scoredPrimary]
    .filter((s) => !usedPrimaryIds.has(s.item.id))
    .sort((a, b) => a.item.price - b.item.price)[0]

  if (budgetPrimary) {
    usedPrimaryIds.add(budgetPrimary.item.id)
    options.push(
      buildSetupOption('budget', 'Budget Alternative', budgetPrimary, false)
    )
  }

  let budgetNotice: string | undefined
  if (maxBudget > 0 && !options.some((o) => o.withinBudget)) {
    const cheapestAvailable = Math.min(
      ...primaryCandidates.map((p) => p.price)
    )
    budgetNotice = `No active listing in this category is currently priced below ₦${maxBudget.toLocaleString()} (lowest available is ₦${cheapestAvailable.toLocaleString()}). Below are the closest verified options in Abuja.`
  }

  return {
    ok: true,
    budgetNotice,
    workloadSummary: `${input.setupType.replace(/_/g, ' ').toUpperCase()} • ${input.primaryPurpose.replace(/_/g, ' ')}`,
    options,
  }
}

export async function revalidateSetupItemsAction(productIds: string[]) {
  const adminDb = getAdminDb()
  const { data: liveProducts } = await adminDb
    .from('products')
    .select(
      'id, title, price, status, stock_quantity, condition, brand, images, seller_id, specs'
    )
    .in('id', productIds)

  const validItems: any[] = []
  const warnings: string[] = []

  for (const id of productIds) {
    const found = (liveProducts || []).find((p: any) => p.id === id)
    if (
      !found ||
      found.status !== 'published' ||
      Number(found.stock_quantity ?? 1) <= 0
    ) {
      warnings.push(
        `"${found?.title || 'An item'}" is no longer in stock and was excluded.`
      )
      continue
    }
    validItems.push(found)
  }

  return {
    ok: validItems.length > 0,
    validItems,
    warnings,
  }
}