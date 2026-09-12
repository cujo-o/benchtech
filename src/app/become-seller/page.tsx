// src/app/become-seller/page.tsx
import { redirect } from 'next/navigation'

export default function BecomeSellerRedirect() {
  redirect('/seller/onboarding')
}