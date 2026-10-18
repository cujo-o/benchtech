import { checkNameConsistency } from './provider'

export type AutoVerifyOutcome = {
  approved: boolean
  status: 'verified' | 'under_review' | 'action_required'
  reason: string
  checks: {
    bankNameMatched: boolean
    noDuplicateBank: boolean
    noDuplicatePhone: boolean
    documentsPresent: boolean
    aiDocumentMatch: boolean | null
  }
}

export async function evaluateSellerAutoVerification(params: {
  supabaseAdmin: any
  sellerId: string
  sellerType: 'individual' | 'business'
  fullName: string
  businessName?: string
  idNumber: string
  cacNumber?: string
  phone: string
  accountNumber: string
  accountHolderName: string
  idFrontUrl: string
  selfieUrl: string
  cacCertUrl?: string
}): Promise<AutoVerifyOutcome> {
  const {
    supabaseAdmin,
    sellerId,
    sellerType,
    fullName,
    businessName,
    phone,
    accountNumber,
    accountHolderName,
    idFrontUrl,
    selfieUrl,
    cacCertUrl,
  } = params

  const expectedName = sellerType === 'business' ? businessName || '' : fullName

  // 1. Check Bank Name Match
  const bankNameMatched = checkNameConsistency(expectedName, accountHolderName)

  // 2. Check for Duplicate Bank Account across other sellers
  const { data: dupBank } = await supabaseAdmin
    .from('seller_verifications')
    .select('seller_id')
    .eq('account_number', accountNumber)
    .neq('seller_id', sellerId)
    .limit(1)

  const noDuplicateBank = !dupBank || dupBank.length === 0

  // 3. Check for Duplicate Phone across other sellers
  const { data: dupPhone } = await supabaseAdmin
    .from('seller_verifications')
    .select('seller_id')
    .eq('phone', phone)
    .neq('seller_id', sellerId)
    .limit(1)

  const noDuplicatePhone = !dupPhone || dupPhone.length === 0

  // 4. Verify required document URLs exist
  const documentsPresent =
    sellerType === 'business'
      ? Boolean(idFrontUrl && selfieUrl && cacCertUrl)
      : Boolean(idFrontUrl && selfieUrl)

  // 5. Optional: Automated Document OCR via Gemini API if GEMINI_API_KEY is configured
  let aiDocumentMatch: boolean | null = null
  const geminiKey = process.env.GEMINI_API_KEY

  if (geminiKey && idFrontUrl) {
    try {
      const imgRes = await fetch(idFrontUrl)
      const arrayBuffer = await imgRes.arrayBuffer()
      const base64Img = Buffer.from(arrayBuffer).toString('base64')
      const mimeType = imgRes.headers.get('content-type') || 'image/jpeg'

      const prompt = `Inspect this Nigerian identification document. Does the name on the document match "${fullName}" and is it a clear, valid ID document? Reply strictly with JSON: {"validId": boolean, "nameMatches": boolean, "reason": string}`

      const geminiRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  { text: prompt },
                  { inline_data: { mime_type: mimeType, data: base64Img } },
                ],
              },
            ],
            generationConfig: { responseMimeType: 'application/json' },
          }),
        }
      )

      const geminiData = await geminiRes.json()
      const rawText = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text
      if (rawText) {
        const parsed = JSON.parse(rawText)
        aiDocumentMatch = Boolean(parsed.validId && parsed.nameMatches)
      }
    } catch {
      aiDocumentMatch = null
    }
  }

  const allCoreChecksPass =
    bankNameMatched && noDuplicateBank && noDuplicatePhone && documentsPresent

  // Auto-approve if core checks pass AND (AI document check passed OR auto-approve env flag is enabled)
  const autoApproveEnabled = process.env.AUTO_APPROVE_LOW_RISK_SELLERS === 'true'

  if (allCoreChecksPass && (aiDocumentMatch === true || autoApproveEnabled)) {
    return {
      approved: true,
      status: 'verified',
      reason: 'Automated verification passed all identity, bank, and uniqueness checks.',
      checks: {
        bankNameMatched,
        noDuplicateBank,
        noDuplicatePhone,
        documentsPresent,
        aiDocumentMatch,
      },
    }
  }

  let holdReason = 'Standard manual document review queued.'
  if (!noDuplicateBank) holdReason = 'Flagged: Bank account is linked to another seller.'
  else if (!noDuplicatePhone) holdReason = 'Flagged: Phone number is linked to another seller.'
  else if (!bankNameMatched) holdReason = 'Flagged: Bank account name mismatch.'
  else if (aiDocumentMatch === false) holdReason = 'Flagged: ID document text did not match legal name.'

  return {
    approved: false,
    status: 'under_review',
    reason: holdReason,
    checks: {
      bankNameMatched,
      noDuplicateBank,
      noDuplicatePhone,
      documentsPresent,
      aiDocumentMatch,
    },
  }
}