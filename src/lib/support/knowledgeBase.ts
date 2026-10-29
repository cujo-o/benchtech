export interface KnowledgeArticle {
  id: string
  title: string
  category:
    | 'account'
    | 'orders_payments'
    | 'delivery'
    | 'returns_refunds'
    | 'seller_verification'
    | 'policies_fees'
  owner: string
  version: string
  lastReviewed: string
  summary: string
  content: string[]
  keywords: string[]
}

export const SUPPORT_OPERATING_HOURS = {
  aiAvailability: '24/7 Automated Assistance (Instant)',
  humanSupportHours: 'Monday – Saturday, 8:00 AM – 6:00 PM WAT (Abuja)',
  supportEmail: 'admin@shopbenchtech.com',
}

export const OPERATIONAL_QUEUES = [
  {
    id: 'customer_order_support',
    label: 'Customer & Order Support',
    description: 'Account questions, general enquiries, order guidance, and eligible cancellations.',
  },
  {
    id: 'delivery_operations',
    label: 'Delivery & Courier Operations',
    description: 'Failed collection, dispatch delays, missing parcels, and handover OTP exceptions.',
  },
  {
    id: 'payments_disputes',
    label: 'Payments & Financial Disputes',
    description: 'Payment verification, escrow holds, refund investigations, and payout settlements.',
  },
  {
    id: 'seller_support',
    label: 'Seller & Store Support',
    description: 'One-time KYC/KYB onboarding, per-listing verification, stock, and order preparation.',
  },
  {
    id: 'trust_safety',
    label: 'Trust, Safety & Serious Complaints',
    description: 'Account compromise, counterfeit/stolen hardware reports, and off-platform fraud attempts.',
  },
] as const

export const PRIORITY_SLA_HOURS: Record<'P1' | 'P2' | 'P3' | 'P4', { label: string; hours: number; desc: string }> = {
  P1: {
    label: 'P1 — Critical',
    hours: 2,
    desc: 'Account compromise, unauthorized payment, or critical security incident.',
  },
  P2: {
    label: 'P2 — High',
    hours: 8,
    desc: 'Disputed delivery, damaged hardware on arrival, missing parcel, or held payout error.',
  },
  P3: {
    label: 'P3 — Standard',
    hours: 24,
    desc: 'Routine refund status check, ordinary delivery delay, or seller document review.',
  },
  P4: {
    label: 'P4 — Low',
    hours: 48,
    desc: 'General platform how-to, specification inquiry, or feature guidance.',
  },
}

export const APPROVED_KNOWLEDGE_BASE: KnowledgeArticle[] = [
  {
    id: 'kb-order-lifecycle',
    title: 'Order Lifecycle, Handover OTP & 7-Day Buyer Inspection',
    category: 'orders_payments',
    owner: 'BenchTech Operations',
    version: '1.2',
    lastReviewed: '2026-10-25',
    summary:
      'How orders progress from payment capture through courier dispatch, OTP handover, and the 7-day buyer protection window.',
    content: [
      '1. Order Placed & Payment Captured: Buyer funds are held securely in escrow when checkout completes via Paystack.',
      '2. Seller Preparation & Dispatch: The seller prepares the hardware and assigns a courier or marks the item ready for collection.',
      '3. Courier Handover & Buyer OTP: Upon delivery in Abuja, the buyer inspects the physical device and provides their 6-digit handover OTP to the courier to confirm receipt.',
      '4. 7-Day Inspection Hold: After delivery is verified, net proceeds remain in inspection hold for 7 days so the buyer can verify battery health and hardware stability.',
      '5. Important Rule: Delivery or collection stages are never assumed from elapsed time—every stage must be confirmed by system records.',
    ],
    keywords: ['order', 'status', 'track', 'otp', 'escrow', 'inspection', '7-day', 'payment'],
  },
  {
    id: 'kb-cancellations-refunds',
    title: 'Cancellations, Returns, Refunds & Dispute Arbitration',
    category: 'returns_refunds',
    owner: 'Payments & Disputes Team',
    version: '1.1',
    lastReviewed: '2026-10-25',
    summary:
      'Rules for cancelling an unshipped order, reporting hardware defects during the inspection window, and receiving refunds.',
    content: [
      '1. Pre-Dispatch Cancellation: Buyers can cancel an order automatically if the item has not yet been dispatched by the seller or claimed by a courier.',
      '2. Disputed Delivery or Defective Hardware: If a device arrives damaged, locked, or with mismatched specifications, the buyer can reject it at handover or open a dispute within the 7-day protection window.',
      '3. Refund Processing: Approved refunds are authorized by the Payments & Disputes team and returned to the buyer. AI assistants cannot approve refunds or promise compensation without staff authorization.',
    ],
    keywords: ['refund', 'cancel', 'return', 'dispute', 'money back', 'defective', 'damaged', 'wrong item'],
  },
  {
    id: 'kb-seller-verification',
    title: 'One-Time Seller Verification vs. Per-Product Verification',
    category: 'seller_verification',
    owner: 'Trust & Compliance Desk',
    version: '1.0',
    lastReviewed: '2026-10-25',
    summary:
      'Sellers complete KYC/KYB once at onboarding and only submit device-specific proof (IMEI/serial) when listing new hardware.',
    content: [
      '1. One-Time Seller Onboarding: Individual Sellers (Personal Info, Government ID + Selfie, Residential Address, Personal Bank Match) and Registered Businesses (CAC, TIN, Representative ID, Business Address, Corporate Bank Match) verify once.',
      '2. No Repeat KYC for Listings: Once your seller account is Verified, you never repeat identity or bank onboarding when posting new products.',
      '3. Per-Product Evidence: Each phone, laptop, or console listing requires accurate specs, real hardware photos, and a unique IMEI or Serial Number (only the last 4 digits are shown publicly).',
    ],
    keywords: ['seller', 'verify', 'verification', 'kyc', 'cac', 'nin', 'bank', 'listing', 'imei', 'serial'],
  },
  {
    id: 'kb-delivery-operations',
    title: 'Abuja Delivery Procedures & Exception Handling',
    category: 'delivery',
    owner: 'Logistics & Courier Operations',
    version: '1.0',
    lastReviewed: '2026-10-25',
    summary:
      'How Abuja dispatch works across Wuse 2, Banex, Gwarinpa, Maitama, and what happens if collection or delivery fails.',
    content: [
      '1. Authorized Couriers: Only users granted Deliverer access by Admin can claim delivery runs and verify buyer handover OTPs.',
      '2. Delivery Exceptions: If a buyer is unreachable, requests a reschedule, or rejects a device on physical inspection, the courier logs a formal Delivery Exception.',
      '3. Failed Collection / Missing Parcel: Any overdue dispatch or missing parcel is routed to the Delivery Operations queue (Priority P2) for immediate investigation.',
    ],
    keywords: ['delivery', 'courier', 'dispatch', 'late', 'delay', 'missing', 'pickup', 'banex', 'abuja'],
  },
  {
    id: 'kb-account-security',
    title: 'Account Login, Google Sign-In & Password Recovery',
    category: 'account',
    owner: 'Platform Engineering',
    version: '1.0',
    lastReviewed: '2026-10-25',
    summary:
      'Signing in with email or Google OAuth, resetting passwords via admin@shopbenchtech.com, and reporting compromised accounts.',
    content: [
      '1. Password Recovery: Use the Forgot Password page or Account Settings (/settings) to receive a reset link sent from admin@shopbenchtech.com.',
      '2. Google Sign-In: Buyers and sellers can sign in or register using Google OAuth. New sellers are routed to /seller/onboarding to complete one-time verification.',
      '3. Account Compromise (P1 Critical): If you suspect unauthorized access to your account or payout bank details, open a Trust & Safety ticket immediately.',
    ],
    keywords: ['login', 'password', 'reset', 'google', 'account', 'hacked', 'compromised', 'settings', 'theme'],
  },
  {
    id: 'kb-fees-commissions',
    title: 'Marketplace Fees, Pro Seller Plan & Payout Settlement',
    category: 'policies_fees',
    owner: 'Finance & Operations',
    version: '1.0',
    lastReviewed: '2026-10-25',
    summary:
      'Standard vs. Pro seller commission rates, Pay-When-You-Sell ad fees, and Nigerian bank payout timelines.',
    content: [
      '1. Commission Rates: Standard sellers pay 7% marketplace commission on completed sales. Pro Sellers (₦5,000/month) pay a reduced 5% commission.',
      '2. Promotions: Pay-When-You-Sell promotions charge 2.5% only when an attributed order is completed. Sponsored Search campaigns use prepaid click credits.',
      '3. Bank Settlements: Once available funds are withdrawn from the Seller Wallet, disbursements are settled to your verified Nigerian bank account within 24 business hours.',
    ],
    keywords: ['fee', 'commission', 'pro', 'payout', 'withdraw', 'bank', 'wallet', 'ads', 'sponsored'],
  },
]