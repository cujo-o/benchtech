import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface RequestPayload {
  useCase: string
  budget: number
  devicePreference: string
  powerPriority: string
  customNotes?: string
}

export async function POST(request: Request) {
  try {
    const payload: RequestPayload = await request.json()
    const { useCase, budget, devicePreference, powerPriority, customNotes } = payload

    const supabase = await createClient()

    // 1. Fetch available Abuja hardware inventory
    const { data: products } = await supabase
      .from('products')
      .select('id, title, price, category, brand, condition, specs, profiles(business_name, district)')
      .eq('status', 'published')
      .order('price', { ascending: true })
      .limit(100)

    const catalog = products || []

    const apiKey =
      process.env.GEMINI_API_KEY ||
      process.env.GOOGLE_GENERATIVE_AI_API_KEY ||
      process.env.GOOGLE_AI_API_KEY

    // If Gemini API Key exists, query Gemini Flash for structured setup selection
    if (apiKey && catalog.length > 0) {
      try {
        const prompt = `
You are an expert PC and tech hardware architect in Abuja, Nigeria for "ShopbenchTech".
A customer wants a custom hardware bundle based on this questionnaire:
- Primary Use Case: ${useCase}
- Total Target Budget: ₦${budget.toLocaleString()}
- Form Factor Preference: ${devicePreference}
- Abuja Power/NEPA Resilience: ${powerPriority} (If high, prioritize UPS/Inverter/Power bank in power slot)
- Specific Buyer Notes: ${customNotes || 'None'}

Here is the current live Abuja catalog (JSON list of products with id, title, price, category):
${JSON.stringify(
  catalog.map((p) => ({
    id: p.id,
    title: p.title,
    price: p.price,
    category: p.category,
    brand: p.brand,
  }))
)}

Select the optimal 4 components from this catalog matching the 4 slots:
1. "machine" (Laptops, Desktops, Consoles, Phones)
2. "display" (Monitors, Screens, Tablets)
3. "peripherals" (Keyboards, Mice, Audio, Headsets)
4. "power" (UPS, Power station, Inverter, Docks, MiFi)

Make sure the sum of prices stays close to or under ₦${budget.toLocaleString()}.

Respond ONLY with valid raw JSON (no markdown formatting, no code fences):
{
  "archetypeTitle": "<Catchy name for this custom rig>",
  "rationale": "<2-3 sentence explanation addressing their workflow, Abuja power reality, and value>",
  "allocatedBudget": ${budget},
  "selections": {
    "machine": "<id of chosen product or null>",
    "display": "<id of chosen product or null>",
    "peripherals": "<id of chosen product or null>",
    "power": "<id of chosen product or null>"
  }
}
`

        const geminiRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: { responseMimeType: 'application/json', temperature: 0.2 },
            }),
          }
        )

        const geminiData = await geminiRes.json()
        const rawJsonText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text

        if (rawJsonText) {
          const parsed = JSON.parse(rawJsonText)
          return NextResponse.json({ success: true, ...parsed })
        }
      } catch (err) {
        console.warn('Gemini recommendation fallback to heuristic engine:', err)
      }
    }

    // 2. Intelligent Heuristic Matcher (Fallback if Gemini is offline or unkeyed)
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

    // Allocate rough percentages: 60% machine, 20% display, 10% peripherals, 10% power
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
      archetypeTitle: `${useCase.toUpperCase()} Workstation Rig`,
      rationale: `Selected matching verified Abuja stock optimized for ${useCase} within your ₦${budget.toLocaleString()} target. Balances compute performance with peripheral usability.`,
      allocatedBudget: budget,
      selections: {
        machine: chosenMachine?.id || null,
        display: chosenDisplay?.id || null,
        peripherals: chosenPeripheral?.id || null,
        power: chosenPower?.id || null,
      },
    })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to generate recommendation' },
      { status: 500 }
    )
  }
}