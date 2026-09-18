import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const { useCase, budgetMax, priority, preferredBrand } = await request.json()

    const supabase = await createClient()

    // 1. Fetch live published products within budget range
    let query = supabase
      .from('products')
      .select('id, title, brand, price, condition, specs, images, location')
      .eq('status', 'published')

    if (budgetMax && Number(budgetMax) > 0) {
      query = query.lte('price', Number(budgetMax))
    }

    const { data: inventory, error: dbError } = await query.limit(30)

    if (dbError || !inventory || inventory.length === 0) {
      return NextResponse.json(
        { message: 'No devices currently match your budget range in Abuja.' },
        { status: 404 }
      )
    }

    // 2. Query Gemini API with structured prompt
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { message: 'Gemini API key is not configured.' },
        { status: 500 }
      )
    }

    const prompt = `
You are BenchTech AI, a tech hardware advisor in Abuja, Nigeria.
A buyer needs a device recommendation based on these requirements:
- Primary Use Case: ${useCase}
- Max Budget: ₦${Number(budgetMax).toLocaleString()}
- Top Priority: ${priority}
- Preferred Brand: ${preferredBrand || 'Any'}

Here is the current live inventory on BenchTech:
${JSON.stringify(inventory)}

Select the best 1 to 3 matching devices from the inventory.
For each device selected, provide:
1. "productId": exact ID from inventory.
2. "matchScore": a percentage string (e.g. "95%").
3. "verdict": a 2-sentence summary explaining why this exact processor, RAM, or GPU fits their workflow.
4. "pros": 2 key strengths for this user.
5. "tradeoffs": 1 honest caveat (e.g. condition, weight, battery capacity).

Respond ONLY with valid JSON in this exact structure:
{
  "summary": "Brief summary of advice for this buyer",
  "recommendations": [
    {
      "productId": "string",
      "matchScore": "string",
      "verdict": "string",
      "pros": ["string", "string"],
      "tradeoffs": ["string"]
    }
  ]
}
`

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: 'application/json',
          },
        }),
      }
    )

    const geminiData = await response.json()
    const rawText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text

    if (!rawText) {
      return NextResponse.json({ message: 'Failed to generate recommendation.' }, { status: 502 })
    }

    const parsed = JSON.parse(rawText)

    // Hydrate AI recommendations with full product records
    const hydratedRecommendations = parsed.recommendations.map((rec: any) => {
      const product = inventory.find((p) => p.id === rec.productId)
      return {
        ...rec,
        product,
      }
    }).filter((rec: any) => rec.product)

    return NextResponse.json({
      summary: parsed.summary,
      recommendations: hydratedRecommendations,
    })
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Server error' }, { status: 500 })
  }
}