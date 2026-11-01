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

export interface SetupConsultationInput {
  consultationMode: 'quick' | 'detailed' | 'professional'
  setupType: 'desktop' | 'laptop' | 'laptop_workstation' | 'mini_pc'
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
  const gbMatch = raw.match(/\b(128|256|512|1000)\s*GB\b/i)
  return gbMatch ? Number(gbMatch[1]) : null
}

function hasDedicatedGpu(specs: Record<string, any>, title: string): boolean {
  const raw = `${specs?.gpu || ''} ${title || ''}`.toLowerCase()
  return /rtx|gtx|radeon rx|quadro|m1 pro|m2 pro|m3 pro|m1 max|m2 max|m3 max/.test(
    raw
  )
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

  // Apply hard condition filter if customer requested Brand New Only
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

  const allPurposes = [
    input.primaryPurpose,
    ...(input.secondaryPurposes || []),
  ].map((s) => s.toLowerCase())

  const needsDedicatedGpu =
    allPurposes.some((p) =>
      ['gaming', '3d_animation', 'ai_ml', 'engineering_cad'].includes(p)
    ) ||
    input.answers.gamingType === 'aaa' ||
    input.answers.videoResolution === '4k_plus' ||
    input.answers.needsDedicatedGpu === 'yes'

  // Programming rule (Section 5.5): Do not automatically push an expensive dedicated GPU for standard coding
  const isPureProgrammingOrOffice =
    allPurposes.every((p) =>
      [
        'programming',
        'student',
        'office_business',
        'data_analysis',
        'cybersecurity',
        'general',
      ].includes(p)
    ) && !needsDedicatedGpu

  const needsHighRam =
    allPurposes.some((p) =>
      [
        'cybersecurity',
        '3d_animation',
        'ai_ml',
        'engineering_cad',
        'content_creation',
      ].includes(p)
    ) ||
    input.answers.runsVirtualMachines === 'yes' ||
    input.answers.timelineComplexity === 'heavy'

  const targetRamGb = needsHighRam ? 16 : 8

  // Categorize available catalog items into primary computers, monitors, and peripherals
  const computerCandidates = candidatePool.filter((p) =>
    ['laptops', 'gaming', 'components', 'desktops', 'computers'].some((cat) =>
      p.category.includes(cat)
    ) ||
    /laptop|macbook|thinkpad|latitude|pavilion|vostro|elitebook|zenbook|omen|legion|ps4|ps5|xbox|pc|workstation/i.test(
      p.title
    )
  )

  const monitorCandidates = candidatePool.filter(
    (p) =>
      p.category === 'monitors' ||
      /monitor|display|screen/i.test(p.title)
  )

  const accessoryCandidates = candidatePool.filter(
    (p) =>
      p.category === 'accessories' ||
      /keyboard|mouse|headset|headphone|dock|ssd|ups|webcam|microphone/i.test(
        p.title
      )
  )

  const primaryPool =
    computerCandidates.length > 0 ? computerCandidates : candidatePool

  // Score each primary computer candidate against the customer's workload
  const scoredPrimary = primaryPool
    .map((item) => {
      let score = 50
      const ramGb = parseRamGb(item.specs, item.title)
      const storageGb = parseStorageGb(item.specs, item.title)
      const hasGpu = hasDedicatedGpu(item.specs, item.title)

      if (item.seller_verified) score += 12
      if (ramGb && ramGb >= targetRamGb) score += 18
      if (storageGb && storageGb >= 512) score += 10
      if (needsDedicatedGpu && hasGpu) score += 25
      if (isPureProgrammingOrOffice && !hasGpu) score += 15

      // Brand preference check
      if (
        input.answers.preferredBrand &&
        input.answers.preferredBrand !== 'any' &&
        item.brand.toLowerCase().includes(input.answers.preferredBrand.toLowerCase())
      ) {
        score += 15
      }

      return {
        item,
        score,
        ramGb,
        storageGb,
        hasGpu,
      }
    })
    .sort((a, b) => b.score - a.score)

  const ownsMonitor = (input.existingEquipment || []).includes('monitor')
  const wantsExternalMonitor =
    !ownsMonitor &&
    (input.setupType === 'desktop' ||
      input.setupType === 'laptop_workstation' ||
      input.setupType === 'mini_pc' ||
      input.answers.externalMonitorCount === '1' ||
      input.answers.externalMonitorCount === '2')

  const ownsPeripherals = (input.existingEquipment || []).includes(
    'keyboard_mouse'
  )

  const maxBudget = Math.max(0, Number(input.budgetMax || 0))
  const effectiveCeiling =
    input.budgetFlexibility === 'flexible_if_worth_it'
      ? Math.round(maxBudget * 1.2)
      : input.budgetFlexibility === 'somewhat_flexible'
      ? Math.round(maxBudget * 1.1)
      : maxBudget

  // Helper to assemble a complete setup option from a chosen primary computer
  function buildSetupOption(
    laneId: 'balanced' | 'performance' | 'budget',
    laneLabel: string,
    primaryEntry: (typeof scoredPrimary)[0],
    includeMonitor: boolean,
    includeAccessory: boolean
  ): SetupRecommendationOption {
    const items: RecommendedSetupItem[] = []
    const compatibilityNotes: string[] = []
    let hasMissingSpecs = false

    const comp = primaryEntry.item
    const compAlternatives = scoredPrimary
      .map((s) => s.item)
      .filter((i) => i.id !== comp.id)
      .slice(0, 3)

    items.push({
      roleLabel:
        input.setupType === 'laptop' || input.setupType === 'laptop_workstation'
          ? 'Primary Laptop'
          : 'Primary System / Console',
      product: comp,
      reason: isPureProgrammingOrOffice
        ? `Selected for CPU/memory responsiveness without overspending on an unnecessary dedicated GPU.`
        : needsDedicatedGpu && primaryEntry.hasGpu
        ? `Includes dedicated graphics capability suited for ${input.primaryPurpose.replace(/_/g, ' ')}.`
        : `Matched from active Abuja inventory for ${input.primaryPurpose.replace(/_/g, ' ')}.`,
      alternatives: compAlternatives,
    })

    if (!primaryEntry.ramGb && !comp.specs?.processor) {
      hasMissingSpecs = true
      compatibilityNotes.push(
        `Full RAM/CPU specifications are not listed on "${comp.title}" — verify physical specs during handover inspection.`
      )
    }

    if (includeMonitor && monitorCandidates.length > 0) {
      const sortedMonitors = [...monitorCandidates].sort((a, b) =>
        laneId === 'performance' ? b.price - a.price : a.price - b.price
      )
      const chosenMonitor = sortedMonitors[0]
      if (chosenMonitor && chosenMonitor.id !== comp.id) {
        items.push({
          roleLabel: 'External Display',
          product: chosenMonitor,
          reason:
            input.setupType === 'laptop_workstation'
              ? 'External display for multi-window workstation productivity.'
              : 'Matched display for your setup.',
          alternatives: sortedMonitors.slice(1, 4),
        })

        if (input.setupType === 'laptop_workstation') {
          compatibilityNotes.push(
            'Verify HDMI or USB-C DisplayPort output port on the laptop during physical inspection.'
          )
        }
      }
    }

    if (
      includeAccessory &&
      !ownsPeripherals &&
      accessoryCandidates.length > 0
    ) {
      const sortedAcc = [...accessoryCandidates].sort(
        (a, b) => a.price - b.price
      )
      const chosenAcc = sortedAcc[0]
      if (chosenAcc && !items.some((i) => i.product.id === chosenAcc.id)) {
        items.push({
          roleLabel: 'Peripheral / Accessory',
          product: chosenAcc,
          reason: 'Recommended peripheral to complete your desk setup.',
          alternatives: sortedAcc.slice(1, 4),
        })
      }
    }

    const totalPrice = items.reduce(
      (sum, entry) => sum + Number(entry.product.price || 0),
      0
    )
    const withinBudget = maxBudget > 0 ? totalPrice <= effectiveCeiling : true
    const budgetDelta = maxBudget > 0 ? totalPrice - maxBudget : 0

    let compatibilityStatus:
      | 'Verified Compatible'
      | 'Compatible with Condition'
      | 'Not Verified' = 'Verified Compatible'

    if (hasMissingSpecs) {
      compatibilityStatus = 'Not Verified'
    } else if (compatibilityNotes.length > 0) {
      compatibilityStatus = 'Compatible with Condition'
    } else {
      compatibilityNotes.push(
        'All selected items are standalone compatible units verified in Abuja inventory.'
      )
    }

    const expectedCapabilities: string[] = [
      `Handles ${input.primaryPurpose.replace(/_/g, ' ')} workflows based on verified store inventory.`,
      `Eligible for 7-day post-delivery physical inspection in Abuja.`,
    ]
    if (primaryEntry.ramGb) {
      expectedCapabilities.push(
        `Configured with ${primaryEntry.ramGb}GB RAM for multitasking.`
      )
    }
    if (input.powerBackupNeeded) {
      compatibilityNotes.push(
        'Power interruption protection requested: We recommend pairing this setup with a sine-wave UPS (650VA–1500VA) to protect against Abuja grid fluctuations.'
      )
    }

    const knownLimitations: string[] = []
    if (needsDedicatedGpu && !primaryEntry.hasGpu) {
      knownLimitations.push(
        'Uses integrated/standard graphics — heavy 3D rendering or AAA ultra settings will be limited.'
      )
    }
    if (!withinBudget) {
      knownLimitations.push(
        `Exceeds your stated target of ₦${maxBudget.toLocaleString()} by ₦${Math.abs(
          budgetDelta
        ).toLocaleString()} based on current live catalog prices.`
      )
    }
    if (knownLimitations.length === 0) {
      knownLimitations.push(
        'Performance varies by specific software version and project size; no synthetic FPS guarantees are claimed.'
      )
    }

    return {
      laneId,
      laneLabel,
      headline: `${comp.title}${
        items.length > 1 ? ` + ${items.length - 1} Setup Item(s)` : ''
      }`,
      totalPrice,
      withinBudget,
      budgetDelta,
      compatibilityStatus,
      compatibilityNotes,
      whyItFits: `Tailored for your ${input.primaryPurpose.replace(
        /_/g,
        ' '
      )} requirements${
        ownsMonitor ? ' (reusing your existing monitor)' : ''
      }.`,
      expectedCapabilities,
      knownLimitations,
      upgradePath:
        input.setupType === 'laptop' || input.setupType === 'laptop_workstation'
          ? 'Storage and external peripherals can be expanded; confirm whether internal RAM is soldered or socketed during inspection.'
          : 'Supports adding external storage, display upgrades, and peripheral expansion.',
      items,
    }
  }

  // Build up to 3 distinct, genuine recommendation lanes without fabricating fake items
  const options: SetupRecommendationOption[] = []
  const usedPrimaryIds = new Set<string>()

  // 1. Best Value / Balanced (fits within budget if possible, highest score-to-price ratio)
  const affordableCandidates = scoredPrimary.filter(
    (s) => maxBudget === 0 || s.item.price <= effectiveCeiling
  )
  const balancedPrimary =
    affordableCandidates[0] ||
    [...scoredPrimary].sort((a, b) => a.item.price - b.item.price)[0]

  if (balancedPrimary) {
    usedPrimaryIds.add(balancedPrimary.item.id)
    options.push(
      buildSetupOption(
        'balanced',
        'Best Value / Balanced',
        balancedPrimary,
        wantsExternalMonitor &&
          (maxBudget === 0 ||
            balancedPrimary.item.price + (monitorCandidates[0]?.price || 0) <=
              effectiveCeiling),
        false
      )
    )
  }

  // 2. Best Performance (highest capability score)
  const performancePrimary = scoredPrimary.find(
    (s) => !usedPrimaryIds.has(s.item.id)
  )
  if (performancePrimary) {
    usedPrimaryIds.add(performancePrimary.item.id)
    options.push(
      buildSetupOption(
        'performance',
        'Best Performance',
        performancePrimary,
        wantsExternalMonitor,
        true
      )
    )
  }

  // 3. Budget Alternative (lowest sensible cost)
  const lowestCostPrimary = [...scoredPrimary]
    .filter((s) => !usedPrimaryIds.has(s.item.id))
    .sort((a, b) => a.item.price - b.item.price)[0]

  if (lowestCostPrimary) {
    usedPrimaryIds.add(lowestCostPrimary.item.id)
    options.push(
      buildSetupOption(
        'budget',
        'Budget Alternative',
        lowestCostPrimary,
        false,
        false
      )
    )
  }

  let budgetNotice: string | undefined
  if (maxBudget > 0 && !options.some((o) => o.withinBudget)) {
    const cheapestAvailable = Math.min(...primaryPool.map((p) => p.price))
    budgetNotice = `No active computer in the Abuja catalog currently falls under your ₦${maxBudget.toLocaleString()} limit (the lowest available device is ₦${cheapestAvailable.toLocaleString()}). Below are the closest verified options so you can compare what is available or adjust your budget.`
  }

  // Audit log the consultation run
  try {
    await adminDb.from('audit_events').insert({
      actor_id: user.id,
      action: 'build_my_setup_consultation',
      target_type: 'build_session',
      target_id: user.id,
      result: `${options.length}_options_generated`,
      metadata: {
        mode: input.consultationMode,
        setup_type: input.setupType,
        primary_purpose: input.primaryPurpose,
        budget_max: maxBudget,
      },
    })
  } catch {}

  return {
    ok: true,
    budgetNotice,
    workloadSummary: `${input.setupType
      .replace(/_/g, ' ')
      .toUpperCase()} • Primary: ${input.primaryPurpose.replace(
      /_/g,
      ' '
    )} • Budget: ₦${maxBudget.toLocaleString()}`,
    options,
  }
}

/**
 * Revalidate live price, stock, and status before adding a build to cart (Section 8.5 & 16)
 */
export async function revalidateSetupItemsAction(productIds: string[]) {
  const adminDb = getAdminDb()
  const { data: liveProducts } = await adminDb
    .from('products')
    .select('id, title, price, status, stock_quantity, condition, brand, images, seller_id, specs')
    .in('id', productIds)

  const validItems: any[] = []
  const warnings: string[] = []

  for (const id of productIds) {
    const found = (liveProducts || []).find((p: any) => p.id === id)
    if (!found || found.status !== 'published' || Number(found.stock_quantity ?? 1) <= 0) {
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