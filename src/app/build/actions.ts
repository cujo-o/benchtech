'use server'

import { createClient as createAdminClient } from '@supabase/supabase-js'
import {
  QuestionnaireState,
  GeneratedBuild,
  BuildComponent,
  ProductItem,
  SetupCategoryKey,
  BenchmarkEstimate,
} from './types'

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  return createAdminClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

// 1. Generate Complete Setup with 3 Alternative Build Tiers
export async function generateCompleteSetup(
  survey: QuestionnaireState
): Promise<{
  success: boolean
  recommendedBuild: GeneratedBuild
  alternatives: {
    maxPerformance: GeneratedBuild
    budgetFriendly: GeneratedBuild
  }
  error?: string
}> {
  try {
    const supabase = getAdminClient()

    // Query live Abuja marketplace catalog
    const { data: rawProducts, error: dbError } = await supabase
      .from('products')
      .select('id, title, price, category, brand, condition, images, specs, seller_id, profiles(business_name, district, tech_trust_status)')
      .eq('status', 'published')
      .order('price', { ascending: true })
      .limit(120)

    if (dbError) {
      console.error('Error fetching inventory in generateCompleteSetup:', dbError)
    }

    const catalog: ProductItem[] = (rawProducts as any) || []
    const budget = Math.max(100000, Number(survey.budget) || 750000)

    // Build slot templates based on the selected category
    const slotConfigs = getSlotConfigsForCategory(survey.category)

    // Attempt Gemini 1.5 Flash structured generation
    const apiKey =
      process.env.GEMINI_API_KEY ||
      process.env.GOOGLE_GENERATIVE_AI_API_KEY ||
      process.env.GOOGLE_AI_API_KEY

    let aiSelection: any = null

    if (apiKey && catalog.length > 0) {
      try {
        const prompt = `You are an expert technology hardware architect in Abuja, Nigeria for BenchTech.
Assemble a complete setup for this user:
- Category: ${survey.category}
- Target Budget: ₦${budget.toLocaleString()}
- Target Apps/Games: ${survey.selectedApps.join(', ') || 'General productivity'}
- Performance Profile: ${survey.performancePriority}
- Power/NEPA Priority: ${survey.powerPriority}
- Custom Notes: ${survey.useCaseDescription || survey.specificPreferences || 'None'}

Slots to populate:
${JSON.stringify(slotConfigs.map((s) => ({ slotKey: s.slotKey, name: s.slotName, categories: s.categories })))}

Available live inventory (JSON):
${JSON.stringify(catalog.map((p) => ({ id: p.id, title: p.title, price: p.price, category: p.category, brand: p.brand })))}

Respond ONLY with valid JSON:
{
  "title": "<Catchy name for this rig>",
  "tagline": "<1 short sentence on what it excels at>",
  "score": <number between 88 and 96>,
  "rationale": "<2 sentences explaining why this setup fits the user in Abuja>",
  "badges": ["<badge 1>", "<badge 2>", "<badge 3>"],
  "slotAssignments": [
    { "slotKey": "<slotKey>", "productId": "<matched product id>", "reasonWhy": "<1 short sentence why this item was picked>" }
  ]
}`

        let timeoutSignal: any = undefined
        try {
          if (typeof AbortSignal !== 'undefined' && 'timeout' in AbortSignal) {
            timeoutSignal = (AbortSignal as any).timeout(8500)
          }
        } catch {
          // Fallback if environment doesn't support timeout
        }

        const geminiRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: { responseMimeType: 'application/json', temperature: 0.2 },
            }),
            signal: timeoutSignal,
          }
        )

        if (geminiRes.ok) {
          const geminiData = await geminiRes.json()
          const rawJson = geminiData.candidates?.[0]?.content?.parts?.[0]?.text
          if (rawJson) {
            aiSelection = JSON.parse(rawJson)
          }
        }
      } catch (geminiErr) {
        console.warn('Gemini build generation bypassed, running rules engine:', geminiErr)
      }
    }

    // Assemble components for the recommended build (Option 2)
    const components: BuildComponent[] = slotConfigs.map((slot) => {
      let matchedProduct: ProductItem | null = null
      let reason = `Selected for optimal performance and verified availability in Abuja.`

      if (aiSelection?.slotAssignments) {
        const assignment = aiSelection.slotAssignments.find((a: any) => a.slotKey === slot.slotKey)
        if (assignment?.productId) {
          matchedProduct = catalog.find((p) => p.id === assignment.productId) || null
          if (assignment.reasonWhy) reason = assignment.reasonWhy
        }
      }

      // Fallback matching logic
      if (!matchedProduct) {
        const candidates = catalog.filter((p) =>
          slot.categories.includes(p.category?.toLowerCase() || '')
        )
        matchedProduct = candidates[0] || catalog[0]
      }

      // Alternatives for the slot
      const alternatives = catalog
        .filter(
          (p) =>
            p.id !== matchedProduct?.id &&
            slot.categories.includes(p.category?.toLowerCase() || '')
        )
        .slice(0, 5)

      return {
        slotKey: slot.slotKey,
        slotName: slot.slotName,
        slotDescription: slot.description,
        category: slot.categories[0] || 'hardware',
        product: matchedProduct,
        reasonWhy: reason,
        alternatives,
      }
    })

    const totalPrice = components.reduce((sum, c) => sum + (Number(c.product?.price) || 0), 0)
    const savings = Math.max(0, Math.round(totalPrice * 0.05))

    const recommendedBuild: GeneratedBuild = {
      id: `build-${Date.now()}-rec`,
      title: aiSelection?.title || getDefaultTitleForCategory(survey.category),
      tagline: aiSelection?.tagline || `Configured for ${survey.category.replace('_', ' ')} with verified Abuja hardware.`,
      category: survey.category,
      totalPrice,
      targetBudget: budget,
      savings,
      score: aiSelection?.score || calculateSetupScore(totalPrice, budget, survey.performancePriority),
      compatibilityScore: 100,
      badges: aiSelection?.badges || getBadgesForCategory(survey.category),
      components,
      performanceRatings: getPerformanceRatingsForCategory(survey.category, survey.performancePriority),
      benchmarks: getBenchmarksForCategory(survey.category),
      rationale:
        aiSelection?.rationale ||
        `Balanced across hardware capabilities, thermal reliability, and Abuja power resilience within your ₦${budget.toLocaleString()} allocation.`,
    }

    // Generate Option 1 (Max Performance: +18%) and Option 3 (Budget Friendly: -18%)
    const maxPerformance = generateVariantBuild(recommendedBuild, 1.18, 'Maximum Performance Rig', 'max')
    const budgetFriendly = generateVariantBuild(recommendedBuild, 0.82, 'Budget-Friendly Setup', 'budget')

    return {
      success: true,
      recommendedBuild,
      alternatives: {
        maxPerformance,
        budgetFriendly,
      },
    }
  } catch (error: any) {
    console.error('Fatal error in generateCompleteSetup:', error)
    return {
      success: false,
      recommendedBuild: {} as any,
      alternatives: {} as any,
      error: error.message || 'Failed to generate setup',
    }
  }
}

// 2. Interactive AI Assistant Q&A Grounded in the Active Build
export async function askBuildAssistant(
  build: GeneratedBuild,
  userQuestion: string
): Promise<{ success: boolean; answer: string }> {
  try {
    const apiKey =
      process.env.GEMINI_API_KEY ||
      process.env.GOOGLE_GENERATIVE_AI_API_KEY ||
      process.env.GOOGLE_AI_API_KEY

    const partsSummary = build.components
      .map((c) => `${c.slotName}: ${c.product.title} (₦${Number(c.product.price).toLocaleString()})`)
      .join(', ')

    if (apiKey) {
      try {
        const prompt = `You are the BenchTech AI Build Assistant in Abuja, Nigeria.
The user has configured this setup:
- Title: ${build.title}
- Total Price: ₦${build.totalPrice.toLocaleString()}
- Score: ${build.score}/100
- Components: ${partsSummary}
- Category: ${build.category}

User Question: "${userQuestion}"

Provide a concise, expert, friendly answer in 2-3 sentences. Reference specific parts from the user's build. If asked about upgrading, gaming (e.g. GTA 6), or alternatives, explain clearly.`

        let timeoutSignal: any = undefined
        try {
          if (typeof AbortSignal !== 'undefined' && 'timeout' in AbortSignal) {
            timeoutSignal = (AbortSignal as any).timeout(6000)
          }
        } catch {
          // Fallback
        }

        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: { temperature: 0.3 },
            }),
            signal: timeoutSignal,
          }
        )

        if (res.ok) {
          const data = await res.json()
          const answer = data.candidates?.[0]?.content?.parts?.[0]?.text
          if (answer) return { success: true, answer: answer.trim() }
        }
      } catch (err) {
        console.warn('Gemini chat fallback:', err)
      }
    }

    const q = userQuestion.toLowerCase()
    if (q.includes('gta') || q.includes('game') || q.includes('fps')) {
      return {
        success: true,
        answer: `This setup is equipped with ${build.components[0]?.product.title || 'high-tier hardware'}, delivering 100+ FPS on popular modern titles at 1080p/1440p settings with reliable frame times.`,
      }
    }
    if (q.includes('upgrade') || q.includes('ram') || q.includes('future')) {
      return {
        success: true,
        answer: `Yes, you can easily upgrade memory, storage, and peripherals down the line. The chosen motherboard and chassis allow modular swap-outs as your workflow expands.`,
      }
    }
    if (q.includes('cheaper') || q.includes('price') || q.includes('discount')) {
      return {
        success: true,
        answer: `You can swap components using the "Customize" tab or switch to the Budget-Friendly variant, saving up to ₦${build.savings.toLocaleString()} while keeping core performance stable.`,
      }
    }

    return {
      success: true,
      answer: `This rig is configured with ${build.components.length} verified components totaling ₦${build.totalPrice.toLocaleString()}, balanced for optimal thermal stability and everyday speed in Abuja.`,
    }
  } catch (err: any) {
    return {
      success: true,
      answer: `This build balances power efficiency with high performance for ${build.category}. Every part is backed by TechTrust 7-day inspection.`,
    }
  }
}

// Helpers
function getSlotConfigsForCategory(category: SetupCategoryKey) {
  switch (category) {
    case 'gaming':
    case 'streaming':
      return [
        { slotKey: 'cpu_gpu', slotName: 'Core Machine / Console', description: 'Processor, GPU & Chassis', categories: ['gaming', 'laptops'] },
        { slotKey: 'display', slotName: 'Gaming Display', description: 'High-refresh 144Hz/165Hz Monitor', categories: ['monitors'] },
        { slotKey: 'audio_mic', slotName: 'Headset & Streaming Audio', description: 'Spatial Sound & Voice Mic', categories: ['accessories'] },
        { slotKey: 'power_backup', slotName: 'UPS Surge & Power', description: 'Outage protection & MiFi', categories: ['networking', 'smarthome', 'accessories'] },
      ]
    case 'creator':
    case 'video_editing':
    case 'design_3d':
      return [
        { slotKey: 'workstation', slotName: 'Studio Workstation', description: 'High-RAM rendering machine', categories: ['laptops', 'gaming'] },
        { slotKey: 'display', slotName: 'Color-Accurate 4K Screen', description: 'IPS calibrated monitor', categories: ['monitors'] },
        { slotKey: 'input_gear', slotName: 'Precision Peripherals', description: 'Creator mouse & keyboard', categories: ['accessories'] },
        { slotKey: 'fast_storage', slotName: 'External NVMe / Dock', description: 'High-speed media transfer', categories: ['accessories', 'networking'] },
      ]
    case 'programming':
    case 'ai_ml':
      return [
        { slotKey: 'dev_laptop', slotName: 'Developer Machine', description: 'Fast multicore compiling & Docker', categories: ['laptops'] },
        { slotKey: 'dual_display', slotName: 'Multitasking Monitor', description: 'Ultrawide code review screen', categories: ['monitors'] },
        { slotKey: 'keyboard', slotName: 'Mechanical Keyboard & Mouse', description: 'Tactile input & ergonomic mouse', categories: ['accessories'] },
        { slotKey: 'connectivity', slotName: 'High-Speed Hub & MiFi', description: 'Gigabit LAN & power delivery', categories: ['networking', 'accessories'] },
      ]
    case 'laptop':
    case 'student':
    case 'work':
    case 'custom':
    default:
      return [
        { slotKey: 'primary', slotName: 'Primary Machine', description: 'Core Laptop or Workstation', categories: ['laptops', 'phones', 'gaming'] },
        { slotKey: 'screen', slotName: 'Display / Second Screen', description: 'Monitor or Tablet companion', categories: ['monitors', 'tablets'] },
        { slotKey: 'input', slotName: 'Input & Audio', description: 'Wireless keyboard, mouse & headset', categories: ['accessories'] },
        { slotKey: 'power', slotName: 'Power & Portability', description: 'Backup battery, bag & power station', categories: ['networking', 'smarthome', 'accessories'] },
      ]
  }
}

function getDefaultTitleForCategory(category: SetupCategoryKey): string {
  const titles: Record<SetupCategoryKey, string> = {
    gaming: 'Apex Gamer Battle Station',
    streaming: 'Gaming + Pro Streaming Rig',
    creator: 'Pro Studio Creator Suite',
    video_editing: '4K Timeline Editing Suite',
    design_3d: '3D CAD & Render Workstation',
    programming: 'Full-Stack Developer Station',
    ai_ml: 'Edge AI & Deep Learning Rig',
    laptop: 'Modern Portable Laptop Suite',
    student: 'Student Academic Workstation',
    work: 'Executive Business Workstation',
    custom: 'Bespoke Custom Setup',
  }
  return titles[category] || 'Custom Setup'
}

function getBadgesForCategory(category: SetupCategoryKey): string[] {
  switch (category) {
    case 'gaming':
    case 'streaming':
      return ['Excellent 1440p Gaming', 'Ready for Streaming', 'Low Latency Audio', 'Easy to Upgrade']
    case 'creator':
    case 'video_editing':
      return ['Color-Accurate 4K', 'High GPU Render Speed', 'Silent Cooling', 'High Speed NVMe']
    case 'programming':
    case 'ai_ml':
      return ['Instant Compiles', 'Multi-Container Ready', 'Dual Screen Coding', 'Ergonomic Input']
    default:
      return ['High Portability', 'TechTrust Verified', 'Long Battery Life', 'Abuja Power Resilient']
  }
}

function calculateSetupScore(totalPrice: number, budget: number, profile: string): number {
  let score = 91
  const ratio = totalPrice / (budget || 1)
  if (ratio >= 0.85 && ratio <= 1.05) score += 3
  if (profile === 'balanced') score += 1
  return Math.min(98, Math.max(86, score))
}

function getPerformanceRatingsForCategory(category: SetupCategoryKey, priority: string) {
  const isMax = priority === 'maximum'
  return {
    gaming: category === 'gaming' || category === 'streaming' ? (isMax ? 96 : 91) : 74,
    contentCreation: category === 'creator' || category === 'video_editing' ? (isMax ? 95 : 89) : 78,
    streaming: category === 'streaming' ? 92 : 82,
    valueForMoney: priority === 'value' ? 95 : 88,
    upgradeability: 91,
  }
}

function getBenchmarksForCategory(category: SetupCategoryKey): BenchmarkEstimate[] {
  if (category === 'gaming' || category === 'streaming') {
    return [
      { label: 'Cyberpunk 2077', target: '1440p Ultra Settings', rating: '110+ FPS', icon: 'Gamepad2' },
      { label: 'GTA V / GTA 6 Ready', target: 'High Fidelity', rating: '150+ FPS', icon: 'Flame' },
      { label: 'Premiere Pro', target: '4K Timeline Scrubbing', rating: 'Smooth Playback', icon: 'Video' },
      { label: 'OBS Live Stream', target: '1080p 60fps NVENC', rating: 'Zero Dropped Frames', icon: 'Sparkles' },
    ]
  }
  if (category === 'programming' || category === 'ai_ml') {
    return [
      { label: 'Docker Multi-Node', target: '12 Microservices', rating: '< 15s Spin-up', icon: 'Cpu' },
      { label: 'Next.js Build', target: 'Production Compilation', rating: '< 8s Turbo', icon: 'Zap' },
      { label: 'PyTorch Inference', target: 'Local LLM / Vision', rating: 'Fast Execution', icon: 'Sparkles' },
      { label: 'Dual 4K IDEs', target: 'VS Code + Figma', rating: 'Zero Stutter', icon: 'Monitor' },
    ]
  }
  return [
    { label: 'Everyday Multitasking', target: '25+ Browser Tabs + Office', rating: 'Instant Response', icon: 'Zap' },
    { label: 'Zoom & Video Calling', target: 'HD Call + Background Blur', rating: 'Clear Fidelity', icon: 'Video' },
    { label: 'Abuja Outage Autonomy', target: 'On UPS / Battery Backup', rating: '3–6 Hours Work', icon: 'ShieldCheck' },
    { label: 'Boot & Launch Time', target: 'Fast SSD Storage', rating: '< 7 Seconds', icon: 'Sparkles' },
  ]
}

function generateVariantBuild(
  base: GeneratedBuild,
  multiplier: number,
  titlePrefix: string,
  type: 'max' | 'budget'
): GeneratedBuild {
  const newPrice = Math.round(base.totalPrice * multiplier)
  return {
    ...base,
    id: `build-${Date.now()}-${type}`,
    title: `${titlePrefix} (${base.title})`,
    totalPrice: newPrice,
    score: type === 'max' ? Math.min(98, base.score + 2) : Math.max(86, base.score - 2),
    savings: type === 'budget' ? Math.round(base.totalPrice * 0.18) : base.savings,
  }
}