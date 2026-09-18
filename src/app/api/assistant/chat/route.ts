import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const { messages } = await request.json()
    const apiKey = process.env.GEMINI_API_KEY

    if (!apiKey) {
      return NextResponse.json(
        { message: 'GEMINI_API_KEY is not configured in Vercel environment variables.' },
        { status: 500 }
      )
    }

    const supabase = await createClient()

    // 1. Fetch live active inventory from Abuja dealers
    const { data: inventory } = await supabase
      .from('products')
      .select('id, title, brand, price, condition, specs, images, location')
      .eq('status', 'published')
      .limit(30)

    const systemPrompt = `
You are BenchTech AI, an expert gadget consultant based in Abuja, Nigeria.
You help buyers find the perfect laptop, phone, gaming console, or tech hardware for their specific budget and workflow.

Current Store Inventory (Live listings in Abuja):
${JSON.stringify(inventory || [])}

Rules:
1. Speak in a helpful, conversational, grounded tone (referencing Abuja locations like Banex Plaza, Emab, Wuse 2, Maitama, Gwarinpa, battery health for Nigerian power situations, value for money in Naira ₦).
2. Recommend 1 to 3 items from the inventory ONLY when they match the user's needs.
3. If an item matches, cite why its specs (RAM, CPU, GPU, Storage, Battery) match what the user is asking.
4. If no inventory item matches closely, give honest market advice for Abuja tech hubs and suggest realistic alternatives or what specs they should look out for.
5. You MUST return your response as a JSON object with this exact structure:
{
  "message": "Your conversational answer in markdown format",
  "recommendedProductIds": ["id1", "id2"]
}
If no inventory items match, return "recommendedProductIds": [].
`

    // 2. Clean and sanitize conversation history
    const filteredMessages = (messages || []).filter((m: any) => {
      if (!m.content || typeof m.content !== 'string') return false
      if (m.content.startsWith('⚠️')) return false
      return true
    })

    while (filteredMessages.length > 0 && filteredMessages[0].role !== 'user') {
      filteredMessages.shift()
    }

    if (filteredMessages.length === 0) {
      return NextResponse.json({
        reply: "Hello! What kind of gadget are you looking for today? Tell me your budget or preferred specs!",
        products: [],
      })
    }

    // Ensure turns strictly alternate (user -> model -> user -> model)
    const contents: any[] = []
    for (const msg of filteredMessages) {
      const role = msg.role === 'user' ? 'user' : 'model'
      const lastItem = contents[contents.length - 1]

      if (lastItem && lastItem.role === role) {
        lastItem.parts[0].text += `\n${msg.content}`
      } else {
        contents.push({
          role,
          parts: [{ text: msg.content }],
        })
      }
    }

    const payload = {
      system_instruction: {
        parts: [{ text: systemPrompt }],
      },
      contents,
      generationConfig: {
        temperature: 0.7,
        responseMimeType: 'application/json',
      },
    }

    // 3. Call Gemini 3.6 Flash
    const modelName = 'gemini-3.6-flash'
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }
    )

    if (!response.ok) {
      const errJson = await response.json().catch(() => null)
      const errorMsg =
        errJson?.error?.message ||
        `Gemini API returned status ${response.status} (${response.statusText})`
      return NextResponse.json({ message: errorMsg }, { status: response.status })
    }

    const geminiData = await response.json()
    const rawText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text

    if (!rawText) {
      return NextResponse.json(
        { message: 'AI returned an empty response. Please try again.' },
        { status: 502 }
      )
    }

    // 4. Parse response JSON
    let parsed: any = { message: rawText, recommendedProductIds: [] }
    try {
      const cleanJson = rawText.replace(/```json/gi, '').replace(/```/g, '').trim()
      parsed = JSON.parse(cleanJson)
    } catch {
      parsed = { message: rawText, recommendedProductIds: [] }
    }

    const recommendedProducts = (inventory || []).filter((p) =>
      parsed.recommendedProductIds?.includes(p.id)
    )

    return NextResponse.json({
      reply: parsed.message || rawText,
      products: recommendedProducts,
    })
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || 'An unexpected server error occurred.' },
      { status: 500 }
    )
  }
}