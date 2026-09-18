import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const { messages } = await request.json()
    const apiKey = process.env.GEMINI_API_KEY

    if (!apiKey) {
      return NextResponse.json(
        { message: 'Gemini API key is not configured in environment variables.' },
        { status: 500 }
      )
    }

    const supabase = await createClient()

    // 1. Fetch live active inventory from Abuja dealers
    const { data: inventory } = await supabase
      .from('products')
      .select('id, title, brand, price, condition, specs, images, location')
      .eq('status', 'published')
      .limit(25)

    const systemInstruction = `
You are BenchTech AI, an expert gadget consultant based in Abuja, Nigeria. 
You help buyers find the perfect laptop, phone, gaming console, or tech hardware for their specific budget and workflow.

Current Store Inventory:
${JSON.stringify(inventory || [])}

Rules:
1. Speak in a helpful, conversational, grounded tone (Nigerian tech ecosystem context, e.g. banex plaza, good battery for power backups, value for money in Naira).
2. Recommend 1 to 3 items from the inventory ONLY when relevant.
3. If an item matches, cite why its specs (RAM, CPU, GPU, Battery) match what the user is asking.
4. Output your response in this exact JSON structure:
{
  "message": "Your conversational answer in markdown format",
  "recommendedProductIds": ["id1", "id2"]
}
If no specific products match, return "recommendedProductIds": [].
`

    // Format conversation history for Gemini
    const contents = [
      { role: 'user', parts: [{ text: systemInstruction }] },
      ...messages.map((m: any) => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.content }],
      })),
    ]

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents,
          generationConfig: {
            responseMimeType: 'application/json',
          },
        }),
      }
    )

    const geminiData = await response.json()
    const rawText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text

    if (!rawText) {
      return NextResponse.json(
        { message: 'Unable to generate recommendation at this moment.' },
        { status: 502 }
      )
    }

    const parsed = JSON.parse(rawText)

    // Hydrate the recommended products
    const recommendedProducts = (inventory || []).filter((p) =>
      parsed.recommendedProductIds?.includes(p.id)
    )

    return NextResponse.json({
      reply: parsed.message,
      products: recommendedProducts,
    })
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || 'Server error occurred' },
      { status: 500 }
    )
  }
}