export interface PlanDetails {
  id: 'free' | 'standard' | 'professional'
  name: string
  price: number // in NGN
  maxListings: number
  maxImages: number
  promoCredits: number
  features: string[]
}

export const SELLER_PLANS: Record<string, PlanDetails> = {
  free: {
    id: 'free',
    name: 'Free',
    price: 0,
    maxListings: 5,
    maxImages: 10,
    promoCredits: 0,
    features: [
      'Up to 5 active listings',
      '10 images per listing',
      'Standard marketplace visibility',
      'Buyer enquiries & store profile',
      'TechTrust verification eligible',
    ],
  },
  standard: {
    id: 'standard',
    name: 'Standard',
    price: 5000,
    maxListings: 25,
    maxImages: 15,
    promoCredits: 2000,
    features: [
      'Up to 25 active listings',
      '15 images per listing',
      '₦2,000 promotional credits',
      'Priority support',
      'Featured store badge allowance',
    ],
  },
  professional: {
    id: 'professional',
    name: 'Professional',
    price: 10000,
    maxListings: 100,
    maxImages: 20,
    promoCredits: 5000,
    features: [
      'Up to 100 active listings',
      '20 images per listing',
      '₦5,000 promotional credits',
      'Top-tier priority support',
      'Maximum visibility in Abuja searches',
    ],
  },
}