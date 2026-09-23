import { Phase2WIP } from '@/components/common/Phase2WIP'
import { Star } from 'lucide-react'

export const metadata = { title: 'Customer Reviews | BenchTech Seller' }

export default function SellerReviewsPage() {
  return (
    <main className="flex-1 min-w-0">
      <Phase2WIP
        title="Verified Customer Feedback & Ratings"
        description="Public buyer ratings, inspection verification feedback, and reputation scoring are scheduled for activation in Phase 2."
        icon={Star}
        backHref="/seller"
        backLabel="Back to Seller Hub"
      />
    </main>
  )
}