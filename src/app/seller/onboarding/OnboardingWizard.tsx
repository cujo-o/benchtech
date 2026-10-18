'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { NIGERIAN_BANKS } from '@/lib/verification/provider'
import {
  verifySellerBankAction,
  saveOnboardingDraftAction,
  submitSellerOnboardingAction,
} from './actions'
import {
  User,
  Building2,
  ShieldCheck,
  MapPin,
  Landmark,
  FileText,
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  Upload,
  Camera,
  ArrowLeft,
  ArrowRight,
  Loader2,
  Edit3,
} from 'lucide-react'

type SellerType = 'individual' | 'business'

const INDIVIDUAL_STEPS = [
  { id: 1, label: 'Personal', title: 'Personal Information', desc: 'Provide your legal name and contact information.' },
  { id: 2, label: 'Identity', title: 'Identity Verification', desc: 'Verify your government-issued ID and selfie.' },
  { id: 3, label: 'Address', title: 'Address Verification', desc: 'Provide and verify your current residential address.' },
  { id: 4, label: 'Bank', title: 'Bank Verification', desc: 'Link your personal bank account for order payouts.' },
  { id: 5, label: 'Review', title: 'Review & Submit', desc: 'Confirm your details and submit for verification.' },
]

const BUSINESS_STEPS = [
  { id: 1, label: 'Business', title: 'Business Information', desc: 'Enter your registered company details.' },
  { id: 2, label: 'Owner', title: 'Owner / Representative', desc: 'Verify the business owner or authorized representative.' },
  { id: 3, label: 'Identity', title: 'Owner Identity Verification', desc: 'Upload the representative government ID and selfie.' },
  { id: 4, label: 'Documents', title: 'Business Documents', desc: 'Upload your CAC certificate and tax documents.' },
  { id: 5, label: 'Address', title: 'Business Address', desc: 'Provide your registered operating address.' },
  { id: 6, label: 'Bank', title: 'Business Bank Verification', desc: 'Link your corporate bank account for payouts.' },
  { id: 7, label: 'Review', title: 'Review & Submit', desc: 'Confirm all business details and submit for approval.' },
]

export function OnboardingWizard({
  user,
  profile,
  verification,
  initialState,
}: {
  user: { id: string; email: string }
  profile: any
  verification: any
  initialState: string
}) {
  const router = useRouter()
  const savedDraft = profile?.onboarding_data || {}

  const [viewState, setViewState] = useState<string>(initialState)
  const [sellerType, setSellerType] = useState<SellerType | null>(
    verification?.seller_type || savedDraft.sellerType || profile?.seller_type || null
  )
  const [step, setStep] = useState<number>(1)
  const [loading, setLoading] = useState(false)
  const [uploadingField, setUploadingField] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // Form State
  const [fullName, setFullName] = useState<string>(
    verification?.legal_name || savedDraft.fullName || profile?.full_name || ''
  )
  const [dob, setDob] = useState<string>(verification?.date_of_birth || savedDraft.dob || '')
  const [phone, setPhone] = useState<string>(
    verification?.phone || savedDraft.phone || profile?.phone || ''
  )
  const [email, setEmail] = useState<string>(
    verification?.email || savedDraft.email || user.email || ''
  )
  const [repRole, setRepRole] = useState<string>(
    verification?.representative_role || savedDraft.repRole || 'Director / Owner'
  )

  // Identity
  const [idType, setIdType] = useState<string>(
    verification?.id_type || savedDraft.idType || 'NIN (National Identification Number)'
  )
  const [idNumber, setIdNumber] = useState<string>(savedDraft.idNumber || '')
  const [idFrontUrl, setIdFrontUrl] = useState<string>(
    verification?.id_front_url || savedDraft.idFrontUrl || ''
  )
  const [idBackUrl, setIdBackUrl] = useState<string>(
    verification?.id_back_url || savedDraft.idBackUrl || ''
  )
  const [selfieUrl, setSelfieUrl] = useState<string>(
    verification?.selfie_url || savedDraft.selfieUrl || ''
  )

  // Business Details
  const [businessName, setBusinessName] = useState<string>(
    verification?.business_name || savedDraft.businessName || profile?.business_name || ''
  )
  const [cacNumber, setCacNumber] = useState<string>(
    verification?.cac_number || savedDraft.cacNumber || profile?.cac_number || ''
  )
  const [tinNumber, setTinNumber] = useState<string>(
    verification?.tin_number || savedDraft.tinNumber || profile?.tin_number || ''
  )
  const [businessPhone, setBusinessPhone] = useState<string>(
    verification?.business_phone || savedDraft.businessPhone || profile?.phone || ''
  )
  const [businessEmail, setBusinessEmail] = useState<string>(
    verification?.business_email || savedDraft.businessEmail || user.email || ''
  )
  const [cacCertUrl, setCacCertUrl] = useState<string>(
    verification?.cac_cert_url || savedDraft.cacCertUrl || ''
  )
  const [tinCertUrl, setTinCertUrl] = useState<string>(
    verification?.tin_cert_url || savedDraft.tinCertUrl || ''
  )
  const [otherDocUrl, setOtherDocUrl] = useState<string>(
    verification?.other_doc_url || savedDraft.otherDocUrl || ''
  )

  // Address
  const [streetAddress, setStreetAddress] = useState<string>(
    verification?.street_address || savedDraft.streetAddress || profile?.street_address || ''
  )
  const [city, setCity] = useState<string>(
    verification?.city || savedDraft.city || profile?.district || 'Abuja'
  )
  const [stateName, setStateName] = useState<string>(
    verification?.state || savedDraft.state || 'FCT - Abuja'
  )
  const [postalCode, setPostalCode] = useState<string>(
    verification?.postal_code || savedDraft.postalCode || ''
  )
  const [addressProofType, setAddressProofType] = useState<string>(
    verification?.address_proof_type || savedDraft.addressProofType || 'Utility Bill'
  )
  const [addressProofUrl, setAddressProofUrl] = useState<string>(
    verification?.address_proof_url || savedDraft.addressProofUrl || ''
  )

  // Bank
  const [bankCode, setBankCode] = useState<string>(
    verification?.bank_code || savedDraft.bankCode || '044'
  )
  const [accountNumber, setAccountNumber] = useState<string>(
    verification?.account_number || savedDraft.accountNumber || profile?.account_number || ''
  )
  const [accountHolderName, setAccountHolderName] = useState<string>(
    verification?.account_holder_name || savedDraft.accountHolderName || ''
  )
  const [bankVerified, setBankVerified] = useState<boolean>(
    verification?.bank_name_matched || savedDraft.bankVerified || false
  )
  const [bankVerifying, setBankVerifying] = useState<boolean>(false)
  const [confirmedDeclaration, setConfirmedDeclaration] = useState<boolean>(false)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    fieldKey: string,
    setter: (url: string) => void
  ) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingField(fieldKey)
    setErrorMsg(null)

    try {
      const ext = file.name.split('.').pop() || 'jpg'
      const filePath = `verifications/${user.id}/${fieldKey}-${Date.now()}.${ext}`

      const { error: uploadError } = await supabase.storage
        .from('products')
        .upload(filePath, file, { upsert: true })

      if (uploadError) throw uploadError

      const { data: publicUrlData } = supabase.storage.from('products').getPublicUrl(filePath)
      setter(publicUrlData.publicUrl)
    } catch (err: any) {
      setErrorMsg(err?.message || 'File upload failed. Please try another file.')
    } finally {
      setUploadingField(null)
    }
  }

  const getDraftPayload = () => ({
    sellerType,
    fullName,
    dob,
    phone,
    email,
    repRole,
    idType,
    idNumber,
    idFrontUrl,
    idBackUrl,
    selfieUrl,
    businessName,
    cacNumber,
    tinNumber,
    businessPhone,
    businessEmail,
    cacCertUrl,
    tinCertUrl,
    otherDocUrl,
    streetAddress,
    city,
    state: stateName,
    postalCode,
    addressProofType,
    addressProofUrl,
    bankCode,
    bankName: NIGERIAN_BANKS.find((b) => b.code === bankCode)?.name || 'Access Bank',
    accountNumber,
    accountHolderName,
    bankVerified,
  })

  const handleVerifyBank = async () => {
    setErrorMsg(null)
    const expectedName = sellerType === 'business' ? businessName : fullName

    if (!expectedName) {
      setErrorMsg(
        sellerType === 'business'
          ? 'Please enter your registered Business Name in Step 1 first.'
          : 'Please enter your Full Name in Step 1 first.'
      )
      return
    }

    if (accountNumber.replace(/\D/g, '').length !== 10) {
      setErrorMsg('Please enter a valid 10-digit NUBAN account number.')
      return
    }

    setBankVerifying(true)
    const res = await verifySellerBankAction({
      accountNumber,
      bankCode,
      expectedName,
    })
    setBankVerifying(false)

    if (!res.ok) {
      setBankVerified(false)
      setErrorMsg(res.error || 'Bank verification failed.')
      return
    }

    setAccountHolderName(res.accountName || expectedName)
    setBankVerified(true)
  }

  const validateCurrentStep = (): boolean => {
    setErrorMsg(null)

    if (sellerType === 'individual') {
      if (step === 1 && (!fullName.trim() || !dob || !phone.trim() || !email.trim())) {
        setErrorMsg('Please fill in your full legal name, date of birth, phone, and email.')
        return false
      }
      if (step === 2 && (!idNumber.trim() || !idFrontUrl || !selfieUrl)) {
        setErrorMsg('Please enter your ID number, upload the front of your ID, and provide a selfie.')
        return false
      }
      if (step === 3 && (!streetAddress.trim() || !city.trim() || !stateName.trim())) {
        setErrorMsg('Please enter your residential street address, city, and state.')
        return false
      }
      if (step === 4 && !bankVerified) {
        setErrorMsg('Please click "Verify" to confirm your bank account matches your identity.')
        return false
      }
    }

    if (sellerType === 'business') {
      if (step === 1 && (!businessName.trim() || !cacNumber.trim() || !businessPhone.trim() || !businessEmail.trim())) {
        setErrorMsg('Please provide your registered business name, CAC number, phone, and email.')
        return false
      }
      if (step === 2 && (!fullName.trim() || !dob || !phone.trim() || !email.trim())) {
        setErrorMsg('Please complete all representative details.')
        return false
      }
      if (step === 3 && (!idNumber.trim() || !idFrontUrl || !selfieUrl)) {
        setErrorMsg('Please provide the representative ID number, ID document, and selfie.')
        return false
      }
      if (step === 4 && !cacCertUrl) {
        setErrorMsg('Please upload your CAC Registration Certificate.')
        return false
      }
      if (step === 5 && (!streetAddress.trim() || !city.trim() || !stateName.trim())) {
        setErrorMsg('Please enter your registered business address.')
        return false
      }
      if (step === 6 && !bankVerified) {
        setErrorMsg('Please verify your business bank account before continuing.')
        return false
      }
    }

    return true
  }

  const handleNextStep = async () => {
    if (!validateCurrentStep()) return
    await saveOnboardingDraftAction(getDraftPayload())
    setStep((prev) => prev + 1)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleFinalSubmit = async () => {
    if (!confirmedDeclaration) {
      setErrorMsg('Please check the confirmation box to submit your verification.')
      return
    }

    setLoading(true)
    setErrorMsg(null)

    const payload = getDraftPayload()
    const res = await submitSellerOnboardingAction({
      ...payload,
      sellerType: sellerType!,
    })

    setLoading(false)

    if (!res.ok) {
      setErrorMsg(res.error || 'Submission failed.')
      return
    }

    setViewState('under_review')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  /* =========================================================================
     SCREEN 8 & 9: POST-SUBMISSION STATUS VIEWS (One-Time Verification Rule)
     ========================================================================= */
  if (viewState === 'verified') {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-slate-900 dark:text-white">Verified Seller</h1>
              <Badge className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-[10px] font-bold">
                Approved
              </Badge>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Your one-time seller verification is complete. You can list products at any time without repeating this onboarding process.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-800 text-xs flex items-center gap-2 font-bold">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> Identity Verified
          </div>
          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-800 text-xs flex items-center gap-2 font-bold">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> Address Verified
          </div>
          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-800 text-xs flex items-center gap-2 font-bold">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> Bank Verified
          </div>
          {sellerType === 'business' && (
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-800 text-xs flex items-center gap-2 font-bold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> Business Verified
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <Link href="/seller">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl h-10 px-5 cursor-pointer">
              Go to Seller Dashboard
            </Button>
          </Link>
          <Link href="/seller/listings/new">
            <Button variant="outline" className="text-xs font-bold rounded-xl h-10 px-5 border-slate-200 dark:border-slate-700 cursor-pointer">
              Create New Listing
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  if (viewState === 'under_review' || viewState === 'pending') {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex items-start gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h1 className="text-xl font-black text-slate-900 dark:text-white">
              Verification in Progress
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Our team and automated systems are verifying your submission. This typically takes 24 to 48 hours.
            </p>
          </div>
        </div>

        <div className="space-y-2.5 text-xs">
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-800">
            <span className="font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Identity Verification
            </span>
            <span className="text-emerald-600 font-bold">Submitted</span>
          </div>
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-800">
            <span className="font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Address Verification
            </span>
            <span className="text-emerald-600 font-bold">Submitted</span>
          </div>
          {sellerType === 'business' && (
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-800">
              <span className="font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Business KYB &amp; CAC Documents
              </span>
              <span className="text-emerald-600 font-bold">Submitted</span>
            </div>
          )}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-800">
            <span className="font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Bank Account Match
            </span>
            <span className="text-emerald-600 font-bold">Verified</span>
          </div>
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900">
            <span className="font-bold flex items-center gap-2 text-amber-900 dark:text-amber-200">
              <Clock className="w-4 h-4 text-amber-600" /> Final Compliance Review
            </span>
            <span className="text-amber-700 dark:text-amber-300 font-bold">In Review (24–48h)</span>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2">
          <Link href="/feed">
            <Button variant="outline" className="text-xs font-bold rounded-xl h-10 border-slate-200 dark:border-slate-700">
              Return to Marketplace
            </Button>
          </Link>
          <button
            type="button"
            onClick={() => setViewState('draft')}
            className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
          >
            Update Submitted Documents
          </button>
        </div>
      </div>
    )
  }

  if (viewState === 'action_required') {
    return (
      <div className="bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-800 rounded-3xl p-6 sm:p-8 shadow-xs space-y-5">
        <div className="flex items-start gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-amber-100 dark:bg-amber-950 text-amber-600 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h1 className="text-lg font-black text-slate-900 dark:text-white">Action Required</h1>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              {verification?.action_required_note ||
                profile?.verification_feedback ||
                'Additional clarity or a clearer document upload is required to complete your verification.'}
            </p>
          </div>
        </div>
        <Button
          onClick={() => setViewState('draft')}
          className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl h-10 px-5 cursor-pointer"
        >
          Update Details &amp; Resubmit
        </Button>
      </div>
    )
  }

  if (viewState === 'rejected') {
    return (
      <div className="bg-white dark:bg-slate-900 border border-red-300 dark:border-red-900 rounded-3xl p-6 sm:p-8 shadow-xs space-y-5">
        <div className="flex items-start gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-red-100 dark:bg-red-950 text-red-600 flex items-center justify-center shrink-0">
            <XCircle className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h1 className="text-lg font-black text-slate-900 dark:text-white">Verification Not Approved</h1>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              {verification?.rejection_reason ||
                'Your seller verification application could not be approved at this time.'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/help">
            <Button className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl h-10 px-5">
              Contact Support
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  /* =========================================================================
     STEP 0: CHOOSE SELLER TYPE (Individual vs Registered Business)
     ========================================================================= */
  if (!sellerType) {
    return (
      <div className="space-y-6">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xs space-y-2">
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            Seller Verification &amp; Onboarding
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Select how you operate to begin your one-time seller verification.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Individual Seller Card */}
          <button
            type="button"
            onClick={() => {
              setSellerType('individual')
              setStep(1)
            }}
            className="text-left bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 hover:border-blue-600 dark:hover:border-blue-500 rounded-3xl p-6 transition flex flex-col justify-between space-y-6 group cursor-pointer shadow-xs"
          >
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
                <User className="w-6 h-6" />
              </div>
              <div className="space-y-1.5">
                <h2 className="text-lg font-black text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition">
                  Individual Seller
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  For individuals selling personal devices or operating under their own legal identity.
                </p>
              </div>
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1.5 text-[11px] text-slate-600 dark:text-slate-400">
                <p className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" /> Personal Information &amp; Government ID
                </p>
                <p className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" /> Residential Address Verification
                </p>
                <p className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" /> Personal Bank Account Matching
                </p>
              </div>
            </div>

            <div className="w-full py-2.5 px-4 rounded-xl bg-blue-600 text-white font-bold text-xs flex items-center justify-center gap-1.5">
              <span>Continue as Individual</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </button>

          {/* Registered Business Card */}
          <button
            type="button"
            onClick={() => {
              setSellerType('business')
              setStep(1)
            }}
            className="text-left bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 hover:border-purple-600 dark:hover:border-purple-500 rounded-3xl p-6 transition flex flex-col justify-between space-y-6 group cursor-pointer shadow-xs"
          >
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-purple-600 text-white flex items-center justify-center shadow-xs">
                <Building2 className="w-6 h-6" />
              </div>
              <div className="space-y-1.5">
                <h2 className="text-lg font-black text-slate-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition">
                  Registered Business Seller
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  For registered companies and stores selling technology products.
                </p>
              </div>
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1.5 text-[11px] text-slate-600 dark:text-slate-400">
                <p className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-purple-600 shrink-0" /> CAC Registration &amp; TIN Details
                </p>
                <p className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-purple-600 shrink-0" /> Owner / Representative Identity
                </p>
                <p className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-purple-600 shrink-0" /> Business Address &amp; Corporate Bank Account
                </p>
              </div>
            </div>

            <div className="w-full py-2.5 px-4 rounded-xl bg-purple-600 text-white font-bold text-xs flex items-center justify-center gap-1.5">
              <span>Continue as Registered Business</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </button>
        </div>
      </div>
    )
  }

  const stepsList = sellerType === 'individual' ? INDIVIDUAL_STEPS : BUSINESS_STEPS
  const currentStepMeta = stepsList.find((s) => s.id === step) || stepsList[0]

  return (
    <div className="space-y-6">
      {/* Top Bar & Stepper Progress */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xs space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => {
                if (step > 1) setStep(step - 1)
                else setSellerType(null)
              }}
              className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white transition cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                  {currentStepMeta.title}
                </h1>
                <Badge className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-bold">
                  {sellerType === 'individual' ? 'Individual Seller' : 'Registered Business'}
                </Badge>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">{currentStepMeta.desc}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setSellerType(null)}
            className="text-[11px] font-bold text-slate-400 hover:text-blue-600 transition cursor-pointer"
          >
            Switch Account Type
          </button>
        </div>

        {/* Horizontal Stepper */}
        <div
          className={`grid gap-1.5 ${
            sellerType === 'individual' ? 'grid-cols-5' : 'grid-cols-7'
          }`}
        >
          {stepsList.map((s) => {
            const isCompleted = step > s.id
            const isCurrent = step === s.id
            return (
              <div key={s.id} className="text-center space-y-1">
                <div
                  className={`w-7 h-7 mx-auto rounded-full flex items-center justify-center text-xs font-black transition ${
                    isCompleted
                      ? 'bg-emerald-600 text-white'
                      : isCurrent
                      ? 'bg-blue-600 text-white ring-4 ring-blue-600/15'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                  }`}
                >
                  {isCompleted ? '✓' : s.id}
                </div>
                <span
                  className={`block text-[10px] font-bold truncate ${
                    isCurrent
                      ? 'text-blue-600 dark:text-blue-400'
                      : isCompleted
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-slate-400'
                  }`}
                >
                  {s.label}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Error Alert */}
      {errorMsg && (
        <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-xs font-semibold text-red-700 dark:text-red-300 flex items-center gap-2.5">
          <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Main Step Form Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-7 shadow-xs space-y-6">
        {/* ===============================================================
            BUSINESS STEP 1: BUSINESS INFORMATION
            =============================================================== */}
        {sellerType === 'business' && step === 1 && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Business Name (as on CAC)
              </label>
              <input
                type="text"
                value={businessName}
                onChange={(e) => {
                  setBusinessName(e.target.value)
                  setBankVerified(false)
                }}
                placeholder="e.g. BenchTech Technologies Ltd"
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  CAC Registration Number
                </label>
                <input
                  type="text"
                  value={cacNumber}
                  onChange={(e) => setCacNumber(e.target.value)}
                  placeholder="e.g. RC 1234567"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Tax Identification Number (TIN)
                </label>
                <input
                  type="text"
                  value={tinNumber}
                  onChange={(e) => setTinNumber(e.target.value)}
                  placeholder="e.g. 12345678-0001"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Business Phone Number
                </label>
                <input
                  type="tel"
                  value={businessPhone}
                  onChange={(e) => setBusinessPhone(e.target.value)}
                  placeholder="080 9876 5432"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Business Email Address
                </label>
                <input
                  type="email"
                  value={businessEmail}
                  onChange={(e) => setBusinessEmail(e.target.value)}
                  placeholder="business@domain.com"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* ===============================================================
            PERSONAL / OWNER REPRESENTATIVE INFORMATION
            (Individual Step 1 OR Business Step 2)
            =============================================================== */}
        {((sellerType === 'individual' && step === 1) ||
          (sellerType === 'business' && step === 2)) && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Full Name (as on Government ID)
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => {
                  setFullName(e.target.value)
                  if (sellerType === 'individual') setBankVerified(false)
                }}
                placeholder="John Adewale"
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Date of Birth
                </label>
                <input
                  type="date"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {sellerType === 'business' ? (
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Role in Business
                  </label>
                  <select
                    value={repRole}
                    onChange={(e) => setRepRole(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Director / Owner">Director / Owner</option>
                    <option value="Partner / Shareholder">Partner / Shareholder</option>
                    <option value="Authorized Representative">Authorized Representative</option>
                  </select>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="080 1234 5678"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {sellerType === 'business' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Representative Phone Number
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="080 1234 5678"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}

              <div className={sellerType === 'individual' ? 'sm:col-span-2' : ''}>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="john@example.com"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* ===============================================================
            IDENTITY VERIFICATION
            (Individual Step 2 OR Business Step 3)
            =============================================================== */}
        {((sellerType === 'individual' && step === 2) ||
          (sellerType === 'business' && step === 3)) && (
          <div className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Select ID Type
                </label>
                <select
                  value={idType}
                  onChange={(e) => setIdType(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="NIN (National Identification Number)">
                    NIN (National Identification Number)
                  </option>
                  <option value="National ID Card">National ID Card</option>
                  <option value="Driver's License">Driver&apos;s License</option>
                  <option value="International Passport">International Passport</option>
                  <option value="Voter's Card (PVC)">Voter&apos;s Card (PVC)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Enter ID Number
                </label>
                <input
                  type="text"
                  value={idNumber}
                  onChange={(e) => setIdNumber(e.target.value)}
                  placeholder="1234 5678 9012"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-medium font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Upload Front & Back of ID */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                Upload ID Document
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-blue-500 rounded-2xl p-4 flex flex-col items-center justify-center gap-2 cursor-pointer transition bg-slate-50/50 dark:bg-slate-800/30">
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    className="hidden"
                    onChange={(e) => handleFileUpload(e, 'id_front', setIdFrontUrl)}
                  />
                  {uploadingField === 'id_front' ? (
                    <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                  ) : idFrontUrl ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  ) : (
                    <Upload className="w-5 h-5 text-slate-400" />
                  )}
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    {idFrontUrl ? 'Front of ID Uploaded' : 'Upload Front of ID'}
                  </span>
                  <span className="text-[10px] text-slate-400">JPG, PNG or PDF</span>
                </label>

                <label className="border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-blue-500 rounded-2xl p-4 flex flex-col items-center justify-center gap-2 cursor-pointer transition bg-slate-50/50 dark:bg-slate-800/30">
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    className="hidden"
                    onChange={(e) => handleFileUpload(e, 'id_back', setIdBackUrl)}
                  />
                  {uploadingField === 'id_back' ? (
                    <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                  ) : idBackUrl ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  ) : (
                    <Upload className="w-5 h-5 text-slate-400" />
                  )}
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    {idBackUrl ? 'Back of ID Uploaded' : 'Upload Back of ID (Optional)'}
                  </span>
                  <span className="text-[10px] text-slate-400">JPG, PNG or PDF</span>
                </label>
              </div>
            </div>

            {/* Selfie & Verification Criteria */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800">
              <label className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 rounded-2xl p-4 flex flex-col items-center justify-center gap-2 cursor-pointer transition bg-white dark:bg-slate-900">
                <input
                  type="file"
                  accept="image/*"
                  capture="user"
                  className="hidden"
                  onChange={(e) => handleFileUpload(e, 'selfie', setSelfieUrl)}
                />
                {uploadingField === 'selfie' ? (
                  <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                ) : selfieUrl ? (
                  <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                ) : (
                  <Camera className="w-6 h-6 text-blue-600" />
                )}
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  {selfieUrl ? 'Selfie Captured' : 'Take or Upload a Selfie'}
                </span>
                <span className="text-[10px] text-slate-400">Clear, well-lit face photo</span>
              </label>

              <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                <p className="font-bold text-slate-900 dark:text-white mb-2">We will verify:</p>
                <p className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> Your ID document is valid
                </p>
                <p className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> Your face matches your ID
                </p>
                <p className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> Liveness check passes
                </p>
                <p className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> Information is accurate
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ===============================================================
            BUSINESS STEP 4: BUSINESS DOCUMENTS
            =============================================================== */}
        {sellerType === 'business' && step === 4 && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4">
              <div className="space-y-0.5">
                <p className="text-xs font-bold text-slate-900 dark:text-white">
                  Upload CAC Certificate (Required)
                </p>
                <p className="text-[11px] text-slate-400">
                  Certificate of Incorporation or Business Name Registration (PDF, JPG, PNG)
                </p>
              </div>
              <label className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold cursor-pointer shrink-0 transition">
                <input
                  type="file"
                  accept="image/*,.pdf"
                  className="hidden"
                  onChange={(e) => handleFileUpload(e, 'cac_cert', setCacCertUrl)}
                />
                {uploadingField === 'cac_cert'
                  ? 'Uploading...'
                  : cacCertUrl
                  ? 'Uploaded ✓'
                  : 'Select File'}
              </label>
            </div>

            <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4">
              <div className="space-y-0.5">
                <p className="text-xs font-bold text-slate-900 dark:text-white">
                  Upload Tax Identification Certificate (TIN)
                </p>
                <p className="text-[11px] text-slate-400">
                  FIRS or JTB TIN document (PDF, JPG, PNG)
                </p>
              </div>
              <label className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-slate-200 text-xs font-bold cursor-pointer shrink-0 transition">
                <input
                  type="file"
                  accept="image/*,.pdf"
                  className="hidden"
                  onChange={(e) => handleFileUpload(e, 'tin_cert', setTinCertUrl)}
                />
                {uploadingField === 'tin_cert'
                  ? 'Uploading...'
                  : tinCertUrl
                  ? 'Uploaded ✓'
                  : 'Select File'}
              </label>
            </div>

            <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4">
              <div className="space-y-0.5">
                <p className="text-xs font-bold text-slate-900 dark:text-white">
                  Other Documents (Optional)
                </p>
                <p className="text-[11px] text-slate-400">
                  Trade license, distributor authorization, or plaza permit
                </p>
              </div>
              <label className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-slate-200 text-xs font-bold cursor-pointer shrink-0 transition">
                <input
                  type="file"
                  accept="image/*,.pdf"
                  className="hidden"
                  onChange={(e) => handleFileUpload(e, 'other_doc', setOtherDocUrl)}
                />
                {uploadingField === 'other_doc'
                  ? 'Uploading...'
                  : otherDocUrl
                  ? 'Uploaded ✓'
                  : 'Select File'}
              </label>
            </div>
          </div>
        )}

        {/* ===============================================================
            ADDRESS VERIFICATION
            (Individual Step 3 OR Business Step 5)
            =============================================================== */}
        {((sellerType === 'individual' && step === 3) ||
          (sellerType === 'business' && step === 5)) && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                {sellerType === 'business'
                  ? 'Business Address (as on CAC)'
                  : 'Residential Street Address'}
              </label>
              <input
                type="text"
                value={streetAddress}
                onChange={(e) => setStreetAddress(e.target.value)}
                placeholder="Plot 123, Aminu Kano Crescent, Wuse 2"
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  City / District
                </label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Abuja"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  State
                </label>
                <select
                  value={stateName}
                  onChange={(e) => setStateName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="FCT - Abuja">FCT - Abuja</option>
                  <option value="Lagos">Lagos</option>
                  <option value="Rivers">Rivers</option>
                  <option value="Kano">Kano</option>
                  <option value="Oyo">Oyo</option>
                  <option value="Kaduna">Kaduna</option>
                  <option value="Other">Other State</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Postal Code (Optional)
                </label>
                <input
                  type="text"
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  placeholder="900001"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Proof of Address Upload */}
            <div className="pt-2 space-y-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Upload Proof of Address (Recommended)
              </label>
              <div className="grid grid-cols-3 gap-2.5">
                {(sellerType === 'business'
                  ? ['Utility Bill', 'Lease Agreement', 'CAC Address Page']
                  : ['Utility Bill', 'Bank Statement', 'Letter from Authority']
                ).map((docType) => (
                  <button
                    key={docType}
                    type="button"
                    onClick={() => setAddressProofType(docType)}
                    className={`p-3 rounded-xl border text-center text-xs font-bold transition cursor-pointer ${
                      addressProofType === docType
                        ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400'
                        : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <FileText className="w-4 h-4 mx-auto mb-1" />
                    <span className="block text-[11px]">{docType}</span>
                  </button>
                ))}
              </div>

              <label className="mt-2 border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-blue-500 rounded-2xl p-4 flex items-center justify-between cursor-pointer transition bg-slate-50/50 dark:bg-slate-800/30">
                <input
                  type="file"
                  accept="image/*,.pdf"
                  className="hidden"
                  onChange={(e) => handleFileUpload(e, 'address_proof', setAddressProofUrl)}
                />
                <div className="text-xs">
                  <p className="font-bold text-slate-800 dark:text-slate-200">
                    {addressProofUrl
                      ? `${addressProofType} Uploaded ✓`
                      : `Upload ${addressProofType} (PDF, JPG, PNG)`}
                  </p>
                  <p className="text-[10px] text-slate-400">
                    Your full street address is kept private and never shown publicly.
                  </p>
                </div>
                <span className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold">
                  {uploadingField === 'address_proof' ? 'Uploading...' : 'Browse'}
                </span>
              </label>
            </div>
          </div>
        )}

        {/* ===============================================================
            BANK VERIFICATION
            (Individual Step 4 OR Business Step 6)
            =============================================================== */}
        {((sellerType === 'individual' && step === 4) ||
          (sellerType === 'business' && step === 6)) && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Account Holder Name
              </label>
              <input
                type="text"
                disabled
                value={sellerType === 'business' ? businessName : fullName}
                className="w-full bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-600 dark:text-slate-300"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                Must match your verified {sellerType === 'business' ? 'business' : 'ID'} name.
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Bank Name
              </label>
              <select
                value={bankCode}
                onChange={(e) => {
                  setBankCode(e.target.value)
                  setBankVerified(false)
                }}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {NIGERIAN_BANKS.map((bank) => (
                  <option key={bank.code} value={bank.code}>
                    {bank.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Account Number
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  maxLength={10}
                  value={accountNumber}
                  onChange={(e) => {
                    setAccountNumber(e.target.value.replace(/\D/g, ''))
                    setBankVerified(false)
                  }}
                  placeholder="0123456789"
                  className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <Button
                  type="button"
                  onClick={handleVerifyBank}
                  disabled={bankVerifying}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-5 rounded-xl cursor-pointer"
                >
                  {bankVerifying ? 'Verifying...' : 'Verify'}
                </Button>
              </div>
            </div>

            {bankVerified && (
              <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 space-y-1.5 text-xs">
                <div className="flex items-center gap-2 font-black text-emerald-800 dark:text-emerald-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Bank account verified successfully</span>
                </div>
                <div className="pl-6 space-y-0.5 text-[11px] text-emerald-900 dark:text-emerald-300">
                  <p>
                    Account Name: <strong>{accountHolderName}</strong>
                  </p>
                  <p>
                    Account Number: <strong>{accountNumber}</strong>
                  </p>
                  <p>
                    Bank:{' '}
                    <strong>
                      {NIGERIAN_BANKS.find((b) => b.code === bankCode)?.name}
                    </strong>
                  </p>
                  <p className="text-emerald-700 dark:text-emerald-400 font-semibold pt-1">
                    {sellerType === 'business'
                      ? 'Matches your registered business name.'
                      : 'This account name matches your identity.'}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ===============================================================
            REVIEW & SUBMIT
            (Individual Step 5 OR Business Step 7)
            =============================================================== */}
        {((sellerType === 'individual' && step === 5) ||
          (sellerType === 'business' && step === 7)) && (
          <div className="space-y-5">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 space-y-2 text-xs">
              <div className="flex items-center justify-between border-b border-slate-200/70 dark:border-slate-700 pb-2">
                <span className="font-black text-slate-900 dark:text-white">
                  {sellerType === 'business' ? 'Business Details' : 'Personal Information'}
                </span>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-blue-600 font-bold flex items-center gap-1 hover:underline cursor-pointer"
                >
                  <Edit3 className="w-3 h-3" /> Edit
                </button>
              </div>

              {sellerType === 'business' ? (
                <div className="grid grid-cols-2 gap-y-1.5 text-[11px]">
                  <span className="text-slate-400">Business Name:</span>
                  <span className="font-bold text-right">{businessName}</span>
                  <span className="text-slate-400">CAC Number:</span>
                  <span className="font-bold text-right">{cacNumber}</span>
                  <span className="text-slate-400">TIN:</span>
                  <span className="font-bold text-right">{tinNumber || '—'}</span>
                  <span className="text-slate-400">Representative:</span>
                  <span className="font-bold text-right">
                    {fullName} ({repRole})
                  </span>
                  <span className="text-slate-400">Address:</span>
                  <span className="font-bold text-right">
                    {streetAddress}, {city}
                  </span>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-y-1.5 text-[11px]">
                  <span className="text-slate-400">Name:</span>
                  <span className="font-bold text-right">{fullName}</span>
                  <span className="text-slate-400">Date of Birth:</span>
                  <span className="font-bold text-right">{dob}</span>
                  <span className="text-slate-400">Phone:</span>
                  <span className="font-bold text-right">{phone}</span>
                  <span className="text-slate-400">Email:</span>
                  <span className="font-bold text-right">{email}</span>
                  <span className="text-slate-400">Address:</span>
                  <span className="font-bold text-right">
                    {streetAddress}, {city}
                  </span>
                </div>
              )}
            </div>

            {/* Verification Check Badges */}
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                <span className="font-bold">Identity Verification ({idType.split(' ')[0]})</span>
                <Badge className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 text-[10px] font-bold">
                  ✓ Ready
                </Badge>
              </div>

              {sellerType === 'business' && (
                <div className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                  <span className="font-bold">Business Documents (CAC)</span>
                  <Badge className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 text-[10px] font-bold">
                    ✓ Ready
                  </Badge>
                </div>
              )}

              <div className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                <span className="font-bold">Address Verification</span>
                <Badge className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 text-[10px] font-bold">
                  ✓ Ready
                </Badge>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                <span className="font-bold">Bank Account ({accountNumber})</span>
                <Badge className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 text-[10px] font-bold">
                  ✓ Verified
                </Badge>
              </div>
            </div>

            {/* Confirmation Checkbox */}
            <label className="flex items-start gap-2.5 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 cursor-pointer text-xs">
              <input
                type="checkbox"
                checked={confirmedDeclaration}
                onChange={(e) => setConfirmedDeclaration(e.target.checked)}
                className="mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-slate-700 dark:text-slate-300 font-medium leading-relaxed">
                {sellerType === 'business'
                  ? 'I confirm that all information provided is accurate and I am authorized to represent this business.'
                  : 'I confirm that all information provided is accurate and belongs to me.'}
              </span>
            </label>
          </div>
        )}

        {/* Navigation Footer */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
          {step > 1 ? (
            <Button
              type="button"
              variant="outline"
              onClick={() => setStep(step - 1)}
              className="rounded-xl text-xs font-bold h-11 px-5 border-slate-200 dark:border-slate-700 cursor-pointer"
            >
              Back
            </Button>
          ) : (
            <div />
          )}

          {step < stepsList.length ? (
            <Button
              type="button"
              onClick={handleNextStep}
              className="flex-1 sm:flex-initial bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl h-11 px-8 cursor-pointer"
            >
              Continue
            </Button>
          ) : (
            <Button
              type="button"
              disabled={loading}
              onClick={handleFinalSubmit}
              className="flex-1 sm:flex-initial bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl h-11 px-8 cursor-pointer"
            >
              {loading ? 'Submitting...' : 'Submit for Verification'}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}