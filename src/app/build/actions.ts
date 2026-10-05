'use server'

import { createClient as createAdminClient } from '@supabase/supabase-js'

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  return createAdminClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

export interface RecommendationInput {
  useCase: string
  budget: number
  devicePreference: string
  powerPriority: string
  customNotes?: string
}

export interface RecommendationResult {
  success: boolean
  archetypeTitle: string
  rationale: string
  allocatedBudget: number
  selections: Record<string, string | null>
  error?: string
}

export async function getAIBuildRecommendation(
  input: RecommendationInput
): Promise<RecommendationResult> {
  try {
    const useCase = input.useCase || 'General Productivity'
    const budget = Math.max(50000, Number(input.budget) || 750000)
    const devicePreference = input.devicePreference || 'Laptop-first Setup'
    const powerPriority = input.powerPriority || 'Standard'
    const customNotes = input.customNotes || ''

    const supabase = getAdminClient()

    // Fetch published marketplace products in Abuja
    const { data: products, error: dbError } = await supabase
      .from('products')
      .select('id, title, price, category, brand, condition')
      .eq('status', 'published')
      .order('price', { ascending: true })
      .limit(100)

    if (dbError) {
      console.error('Database query error in getAIBuildRecommendation:', dbError)
    }

    const catalog = products || []

    const apiKey =
      process.env.GEMINI_API_KEY ||
      process.env.GOOGLE_GENERATIVE_AI_API_KEY ||
      process.env.GOOGLE_AI_API_KEY

    let aiResult: any = null

    // 1. Try Gemini 1.5 Flash if API Key is configured
    if (apiKey && catalog.length > 0) {
      try {
        const prompt = `You are an expert PC and workstation architect in Abuja, Nigeria for BenchTech.
A user wants a custom hardware bundle matching:
- Use Case: ${useCase}
- Exact Target Budget: ₦${budget.toLocaleString()}
- Form Factor: ${devicePreference}
- Abuja Power (NEPA) Priority: ${powerPriority}
- Custom Notes: ${customNotes || 'None'}

Live Abuja catalog:
${JSON.stringify(catalog.map((p) => ({ id: p.id, title: p.title, price: p.price, category: p.category })))}

Select exactly ONE product ID for each slot:
1. "machine" (laptops, phones, gaming)
2. "display" (monitors, tablets)
3. "peripherals" (accessories, headphones, mice, keyboards)
4. "power" (networking, smarthome, power accessories, docks)

Ensure total bundle price is close to or under ₦${budget.toLocaleString()}.

Respond ONLY with raw JSON:
{
  "archetypeTitle": "<Short creative rig name>",
  "rationale": "<2 sentences explaining why this setup fits ${useCase} in Abuja within ₦${budget.toLocaleString()}>",
  "allocatedBudget": ${budget},
  "selections": {
    "machine": "<product id or null>",
    "display": "<product id or null>",
    "peripherals": "<product id or null>",
    "power": "<product id or null>"
  }
}`

        const geminiRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: { responseMimeType: 'application/json', temperature: 0.2 },
            }),
            signal: AbortSignal.timeout(8000),
          }
        )

        if (geminiRes.ok) {
          const geminiData = await geminiRes.json()
          const rawJsonText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text
          if (rawJsonText) {
            aiResult = JSON.parse(rawJsonText)
          }
        }
      } catch (geminiErr) {
        console.warn('Gemini request bypassed, using heuristic engine:', geminiErr)
      }
    }

    if (aiResult && aiResult.selections) {
      return {
        success: true,
        archetypeTitle: aiResult.archetypeTitle || `${useCase} Custom Rig`,
        rationale: aiResult.rationale || `Recommended setup tailored for ${useCase} in Abuja.`,
        allocatedBudget: Number(aiResult.allocatedBudget) || budget,
        selections: aiResult.selections,
      }
    }

    // 2. Resilient Heuristic Fallback Engine
    const machineCandidates = catalog.filter((p) =>
      ['laptops', 'gaming', 'phones'].includes(p.category?.toLowerCase() || '')
    )
    const displayCandidates = catalog.filter((p) =>
      ['monitors', 'tablets'].includes(p.category?.toLowerCase() || '')
    )
    const peripheralCandidates = catalog.filter((p) =>
      ['accessories', 'gaming'].includes(p.category?.toLowerCase() || '')
    )
    const powerCandidates = catalog.filter((p) =>
      ['networking', 'smarthome', 'accessories'].includes(p.category?.toLowerCase() || '')
    )

    const machineTarget = budget * 0.6
    const chosenMachine =
      machineCandidates.find((p) => p.price <= machineTarget) || machineCandidates[0] || null

    const remaining = budget - (chosenMachine?.price || 0)
    const chosenDisplay =
      displayCandidates.find((p) => p.price <= remaining * 0.5) || displayCandidates[0] || null

    const chosenPeripheral = peripheralCandidates[0] || null
    const chosenPower = powerCandidates[0] || null

    return {
      success: true,
      archetypeTitle: `${useCase} Custom Rig`,
      rationale: `Selected matching verified Abuja listings optimized for ${useCase} within your exact ₦${budget.toLocaleString()} budget. Balanced for compute performance and peripheral utility.`,
      allocatedBudget: budget,
      selections: {
        machine: chosenMachine?.id || null,
        display: chosenDisplay?.id || null,
        peripherals: chosenPeripheral?.id || null,
        power: chosenPower?.id || null,
      },
    }
  } catch (error: any) {
    console.error('Error in getAIBuildRecommendation:', error)
    return {
      success: false,
      archetypeTitle: 'Custom Setup',
      rationale: 'Could not generate AI recommendation.',
      allocatedBudget: input.budget || 750000,
      selections: {},
      error: error.message || 'Server error',
    }
  }
}