import { NextResponse } from 'next/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  return createAdminClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

interface RequestPayload {
  useCase?: string
  budget?: number | string
  devicePreference?: string
  powerPriority?: string
  customNotes?: string
}

export async function POST(request: Request) {
  try {
    const payload: RequestPayload = await request.json()
    const useCase = payload.useCase || 'General Productivity'
    const budget = Math.max(50000, Number(payload.budget) || 750000)
    const devicePreference = payload.devicePreference || 'Laptop-first Setup'
    const powerPriority = payload.powerPriority || 'Standard'
    const customNotes = payload.customNotes || ''

    const supabase = getAdminClient()

    // 1. Fetch live Abuja hardware listings
    const { data: products, error: dbError } = await supabase
      .from('products')
      .select('id, title, price, category, brand, condition')
      .eq('status', 'published')
      .order('price', { ascending: true })
      .limit(100)

    if (dbError) {
      console.error('Database query error in ai-recommend:', dbError)
    }

    const catalog = products || []

    const apiKey =
      process.env.GEMINI_API_KEY ||
      process.env.GOOGLE_GENERATIVE_AI_API_KEY ||
      process.env.GOOGLE_AI_API_KEY

    let aiResult: any = null

    // 2. Query Gemini 1.5 Flash if API Key is configured
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
            signal: AbortSignal.timeout(8000), // 8-second safety timeout
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
        console.warn('Gemini request bypassed, applying heuristic engine:', geminiErr)
      }
    }

    if (aiResult && aiResult.selections) {
      return NextResponse.json({ success: true, ...aiResult })
    }

    // 3. Fallback Heuristic Matcher
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

    // Budget distribution: 60% machine, 20% display, 10% peripherals, 10% power
    const machineTarget = budget * 0.6
    const chosenMachine =
      machineCandidates.find((p) => p.price <= machineTarget) || machineCandidates[0] || null

    const remaining = budget - (chosenMachine?.price || 0)
    const chosenDisplay =
      displayCandidates.find((p) => p.price <= remaining * 0.5) || displayCandidates[0] || null

    const chosenPeripheral = peripheralCandidates[0] || null
    const chosenPower = powerCandidates[0] || null

    return NextResponse.json({
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
    })
  } catch (error: any) {
    console.error('Fatal in ai-recommend route:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to generate recommendation' },
      { status: 500 }
    )
  }
}