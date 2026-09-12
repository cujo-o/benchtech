import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PackagePlus, Boxes, Eye, ShieldCheck, ArrowUpRight } from 'lucide-react'

export default async function SellerDashboard() {
 // Inside src/app/seller/dashboard/page.tsx
const supabase = await createClient()
const { data: { user } } = await supabase.auth.getUser()

if (!user) {
  redirect('/login?next=/seller/dashboard')
}

const { data: profile } = await supabase
  .from('profiles')
  .select('*')
  .eq('id', user.id)
  .single()

// If user has not set up their store profile yet, redirect to onboarding
if (!profile?.business_name) {
  redirect('/seller/onboarding')
}

  // Fetch products listed by this seller
  const { data: products, count: totalListings } = await supabase
    .from('products')
    .select('*', { count: 'exact' })
    .eq('seller_id', user.id)

  const activeListings = products?.filter((p) => p.status === 'published').length || 0
  const soldListings = products?.filter((p) => p.status === 'sold').length || 0

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Seller Dashboard</h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage your technology catalogue, listing visibility, and orders.
          </p>
        </div>
        <Link href="/seller/listings/new">
          <Button className="bg-blue-600 hover:bg-blue-700 gap-2">
            <PackagePlus className="w-4 h-4" /> Add New Listing
          </Button>
        </Link>
      </div>

      {/* Verification Alert Banner */}
      {profile?.tech_trust_status !== 'verified' && (
        <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700 shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-amber-900">
                {profile?.tech_trust_status === 'pending'
                  ? 'Verification Under Review'
                  : 'Your store is unverified'}
              </p>
              <p className="text-[11px] text-amber-700 mt-0.5">
                {profile?.tech_trust_status === 'pending'
                  ? 'We are reviewing your uploaded documents. Approval usually takes under 24 hours.'
                  : 'Complete TechTrust verification to get the verified badge and boost buyer inquiries.'}
              </p>
            </div>
          </div>
          <Link href="/seller/verify" className="shrink-0">
            <Button
              size="sm"
              variant="outline"
              className="text-xs border-amber-300 text-amber-900 bg-white hover:bg-amber-100 font-bold h-8"
            >
              {profile?.tech_trust_status === 'pending' ? 'Check Status' : 'Verify Store'}
            </Button>
          </Link>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Active Listings</CardTitle>
            <Boxes className="w-4 h-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{activeListings}</div>
            <p className="text-xs text-slate-400 mt-1">Available to buyers</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Items Sold</CardTitle>
            <Eye className="w-4 h-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{soldListings}</div>
            <p className="text-xs text-slate-400 mt-1">Completed transactions</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Subscription Plan</CardTitle>
            <ArrowUpRight className="w-4 h-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600 capitalize">{profile?.subscription_tier || 'Free'}</div>
            <p className="text-xs text-slate-400 mt-1">
              <Link href="/seller/subscription" className="text-blue-600 hover:underline">
                Upgrade for more listings &rarr;
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Listings Preview */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="p-5 border-b border-slate-100 flex justify-between items-center">
          <h2 className="font-semibold text-slate-900">Recent Listings</h2>
          <Link href="/seller/listings" className="text-xs font-semibold text-blue-600 hover:underline">
            View All ({totalListings || 0})
          </Link>
        </div>
        {products && products.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {products.slice(0, 5).map((item) => (
              <div key={item.id} className="p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-slate-100 rounded-lg overflow-hidden shrink-0">
                    {item.images?.[0] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.images[0]} alt={item.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs">No img</div>
                    )}
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-slate-900">{item.title}</p>
                    <p className="text-xs text-slate-500">₦{Number(item.price).toLocaleString()} • {item.condition.replace('_', ' ')}</p>
                  </div>
                </div>
                <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-emerald-50 text-emerald-700 capitalize">
                  {item.status}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center">
            <p className="text-sm text-slate-500">You have no listings yet.</p>
            <Link href="/seller/listings/new">
              <Button size="sm" className="mt-3 bg-blue-600 hover:bg-blue-700">
                Create First Listing
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}