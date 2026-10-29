import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import {
  APPROVED_KNOWLEDGE_BASE,
  SUPPORT_OPERATING_HOURS,
} from '@/lib/support/knowledgeBase'
import {
  getOrderStatusTool,
  getProductDetailsTool,
} from '@/app/help/actions'

function getAdminDb() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  return createAdminClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const messages: Array<{ role: string; content: string }> =
      body.messages || []
    const latestUserMessage =
      messages[messages.length - 1]?.content?.trim() || ''

    if (!latestUserMessage) {
      return NextResponse.json(
        { error: 'Message content is required.' },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    const adminDb = getAdminDb()

    // 1. Fetch only the authenticated user's own recent orders (Narrowly Scoped)
    let userOrdersSummary = 'Customer is not signed in.'
    let verifiedOrdersList: any[] = []

    if (user) {
      const { data: myOrders } = await adminDb
        .from('orders')
        .select(
          'id, order_number, payment_reference, total_amount, amount, order_status, delivery_status, payout_status, delivery_otp, delivery_exception, created_at, product:products(title)'
        )
        .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
        .order('created_at', { ascending: false })
        .limit(5)

      verifiedOrdersList = myOrders || []
      if (verifiedOrdersList.length > 0) {
        userOrdersSummary = verifiedOrdersList
          .map(
            (o: any) =>
              `- Order Ref: ${
                o.order_number || o.payment_reference || o.id.slice(0, 8)
              } | Item: ${o.product?.title || 'Hardware'} | Amount: ₦${Number(
                o.total_amount || o.amount || 0
              ).toLocaleString()} | Order Status: ${
                o.order_status || 'paid'
              } | Delivery Status: ${
                o.delivery_status || 'pending'
              } | Exception: ${o.delivery_exception || 'None'}`
          )
          .join('\n')
      } else {
        userOrdersSummary =
          'Authenticated customer has 0 orders on record.'
      }
    }

    // 2. If user mentioned a specific Order ID/Ref, run the ownership-checked tool
    let specificOrderLookupResult: any = null
    const orderRefMatch = latestUserMessage.match(
      /\b(ORD-[A-Z0-9-]+|TKT-[0-9]+|[0-9a-f]{8})\b/i
    )
    if (orderRefMatch) {
      specificOrderLookupResult = await getOrderStatusTool(orderRefMatch[1])
    }

    // 3. Search matching Knowledge Base articles
    const qLower = latestUserMessage.toLowerCase()
    const matchingArticles = APPROVED_KNOWLEDGE_BASE.filter(
      (art) =>
        art.keywords.some((kw) => qLower.includes(kw)) ||
        art.title.toLowerCase().includes(qLower)
    )
    const kbContext = (
      matchingArticles.length > 0 ? matchingArticles : APPROVED_KNOWLEDGE_BASE
    )
      .map(
        (a) =>
          `[${a.title} (v${a.version})]:\n${a.content.join('\n')}`
      )
      .join('\n\n')

    // 4. Search matching Catalog Products if asking about specs/prices
    const productSearch = await getProductDetailsTool(latestUserMessage)
    const catalogContext =
      productSearch.products && productSearch.products.length > 0
        ? productSearch.products
            .map(
              (p: any) =>
                `- ${p.title} (${p.condition}): ₦${p.price.toLocaleString()} | Store: ${
                  p.sellerName
                } (${p.district}) | Specs: ${JSON.stringify(p.specs)}`
            )
            .join('\n')
        : 'No specific catalog products matched this query.'

    // 5. Call Gemini with strict grounding & truth rules if GEMINI_API_KEY is configured
    const geminiKey = process.env.GEMINI_API_KEY
    if (geminiKey) {
      try {
        const systemInstruction = `You are the BenchTech Customer Support & Operations Assistant in Abuja, Nigeria.
Follow these strict operating rules:
1. TRUTH & ACCURACY OVER CONFIDENCE: Use ONLY the Approved Knowledge Base, the Authenticated Customer's Verified Orders, and the Live Catalog provided below. Never invent tracking events, delivery dates, refund approvals, or policies.
2. OPERATING HOURS: State clearly when relevant that AI assistance is available 24/7, while Human Support Desk hours are ${SUPPORT_OPERATING_HOURS.humanSupportHours}.
3. SENSITIVE ACTIONS: You cannot approve refunds, release escrow funds, or override KYC checks. If a problem requires investigation (missing parcel, disputed delivery, payment issue, account compromise), advise the user to click "Create Support Ticket" or "Escalate to Human Queue" right below the chat.
4. CONCISE & DIRECT: Write in clear, direct paragraphs or bullet points without filler or emojis.

APPROVED KNOWLEDGE BASE:
${kbContext}

AUTHENTICATED CUSTOMER VERIFIED ORDERS:
${userOrdersSummary}

SPECIFIC ORDER LOOKUP RESULT:
${specificOrderLookupResult ? JSON.stringify(specificOrderLookupResult) : 'None requested'}

LIVE CATALOG SEARCH:
${catalogContext}`

        const geminiRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              systemInstruction: { parts: [{ text: systemInstruction }] },
              contents: messages.slice(-6).map((m) => ({
                role: m.role === 'assistant' ? 'model' : 'user',
                parts: [{ text: m.content }],
              })),
              generationConfig: {
                temperature: 0.15,
                maxOutputTokens: 500,
              },
            }),
          }
        )

        const geminiData = await geminiRes.json()
        const aiText =
          geminiData?.candidates?.[0]?.content?.parts?.[0]?.text?.trim()

        if (aiText) {
          return NextResponse.json({
            reply: aiText,
            verifiedOrder: specificOrderLookupResult?.order || null,
            suggestedCategory:
              /refund|payment|escrow/.test(qLower)
                ? 'payment_refund'
                : /delivery|courier|late|missing|otp/.test(qLower)
                ? 'delivery_issue'
                : /seller|kyc|cac|verify/.test(qLower)
                ? 'seller_verification'
                : 'general_enquiry',
          })
        }
      } catch {
        // Fall through to deterministic verified fallback (Test E)
      }
    }

    // 6. Deterministic, Zero-Hallucination Fallback (Test E: Outage-Resilient)
    let fallbackReply = ''

    if (specificOrderLookupResult) {
      if (specificOrderLookupResult.ok && specificOrderLookupResult.order) {
        const o = specificOrderLookupResult.order
        fallbackReply = `Verified Order #${o.reference} (${o.itemTitle}):\n• Current Status: ${o.currentHeadline}\n• Delivery Status: ${o.deliveryStatus}\n• Amount: ₦${o.amount.toLocaleString()}\n\nIf you need human investigation on this order, click "Escalate to Support Queue" below to open a tracked ticket.`
      } else {
        fallbackReply = specificOrderLookupResult.error
      }
    } else if (matchingArticles.length > 0) {
      const topArticle = matchingArticles[0]
      fallbackReply = `${topArticle.title}:\n${topArticle.content.join(
        '\n'
      )}\n\nHuman Support Hours: ${
        SUPPORT_OPERATING_HOURS.humanSupportHours
      }. If your issue requires investigation, use the "Open Support Ticket" tab to route a case to our operations team.`
    } else if (verifiedOrdersList.length > 0 && /order|delivery|status|track/.test(qLower)) {
      const latest = verifiedOrdersList[0]
      const ref =
        latest.order_number || latest.payment_reference || latest.id.slice(0, 8)
      fallbackReply = `Your most recent order on record is #${ref} (${
        latest.product?.title || 'Hardware Order'
      }):\n• Order Status: ${latest.order_status || 'paid'}\n• Delivery Status: ${
        latest.delivery_status || 'pending'
      }\n\nYou can inspect full stage history in the "Order & Refund Lookup" panel or open a ticket if you need staff assistance.`
    } else {
      fallbackReply = `I can help you check your verified order status, look up refund eligibility, explain seller verification rules, or open a tracked support ticket.\n\n• AI Assistant: Available 24/7\n• Human Support Desk: ${SUPPORT_OPERATING_HOURS.humanSupportHours}\n\nSelect a topic below or open a support ticket if your case requires staff investigation.`
    }

    return NextResponse.json({
      reply: fallbackReply,
      verifiedOrder: specificOrderLookupResult?.order || null,
      suggestedCategory: 'general_enquiry',
    })
  } catch {
    return NextResponse.json(
      {
        reply:
          'Live assistant service is temporarily unavailable. You can still check verified order statuses or submit a tracked support ticket directly on this page.',
      },
      { status: 200 }
    )
  }
}