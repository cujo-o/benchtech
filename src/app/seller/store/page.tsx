import Link from 'next/link'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import {
  Store,
  MapPin,
  ShieldCheck,
  Crown,
  ExternalLink,
  Edit3,
  Package,
  Phone,
  Clock,
  Truck,
  RotateCcw,
  Sparkles,
  Camera,
  CheckCircle2,
  Lock,
} from 'lucide-react'

export const metadata = {
  title: 'My Storefront & Branding | BenchTech Seller',
}

export default async function SellerStorePage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login?next=/seller/store')
  }

  // 1. Fetch live seller profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile?.business_name) {
    redirect('/seller/onboarding')
  }

  const isPro =
    profile?.seller_plan === 'pro' ||
    profile?.subscription_tier === 'pro' ||
    profile?.subscription_plan === 'professional'

  // 2. Fetch live published products for this store
  const { data: products } = await supabase
    .from('products')
    .select('*')
    .eq('seller_id', user.id)
    .eq('status', 'published')
    .order('created_at', { ascending: false })

  const publishedProducts = products || []

  // 3. Server Action to update storefront details
  async function updateStorefrontAction(formData: FormData) {
    'use server'
    const serverSupabase = await createClient()
    const {
      data: { user: authUser },
    } = await serverSupabase.auth.getUser()

    if (!authUser) return

    const business_name = formData.get('business_name') as string
    const description = formData.get('description') as string
    const district = formData.get('district') as string
    const phone = formData.get('phone') as string
    const store_banner_url = formData.get('store_banner_url') as string
    const pickup_policy = formData.get('pickup_policy') as string
    const delivery_policy = formData.get('delivery_policy') as string

    await serverSupabase
      .from('profiles')
      .update({
        business_name,
        description,
        district,
        phone,
        store_banner_url: isPro ? store_banner_url : null,
        pickup_policy,
        delivery_policy,
      })
      .eq('id', authUser.id)

    revalidatePath('/seller/store')
  }

  return (
    <div className="space-y-6 sm:space-y-8 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Top Controls Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              My Storefront &amp; Branding
            </h1>
            <Badge
              className={`text-[10px] font-black uppercase ${
                isPro
                  ? 'bg-purple-100 text-purple-800 border-purple-200'
                  : 'bg-slate-100 text-slate-700'
              }`}
            >
              {isPro ? 'Pro Branded Storefront' : 'Standard Profile'}
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Preview and manage your public hardware storefront visible to Abuja buyers.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {!isPro && (
            <Link href="/seller/subscription">
              <Button
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl h-10 gap-1.5 shadow-xs"
              >
                <Crown className="w-3.5 h-3.5 text-amber-400 fill-amber-400" /> Upgrade for Custom Banner
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* =========================================================================
          LIVE STOREFRONT PREVIEW (Buyer-Facing View)
      ========================================================================= */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        {/* Banner Area */}
        <div
          className={`h-40 sm:h-56 w-full relative flex items-end p-6 ${
            profile?.store_banner_url && isPro
              ? 'bg-cover bg-center'
              : 'bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900'
          }`}
          style={
            profile?.store_banner_url && isPro
              ? { backgroundImage: `url(${profile.store_banner_url})` }
              : undefined
          }
        >
          {!isPro && (
            <div className="absolute top-4 right-4 bg-slate-900/80 backdrop-blur-md text-white text-[11px] font-semibold px-3 py-1 rounded-full border border-white/10 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-amber-400" /> Custom Banners require Pro
            </div>
          )}
        </div>

        {/* Store Metadata Row */}
        <div className="px-6 sm:px-8 pb-6 pt-0 relative">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-12 sm:-mt-14 mb-4">
            <div className="flex items-end gap-4">
              {/* Store Avatar Logo */}
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-white border-4 border-white shadow-md flex items-center justify-center text-2xl font-black text-blue-600 overflow-hidden shrink-0">
                {profile?.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={profile.avatar_url}
                    alt={profile.business_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  profile?.business_name?.[0] || 'S'
                )}
              </div>

              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                    {profile?.business_name}
                  </h2>
                  {profile?.tech_trust_status === 'verified' && (
                    <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] font-bold flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" /> TechTrust Verified
                    </Badge>
                  )}
                  {isPro && (
                    <Badge className="bg-purple-50 text-purple-700 border-purple-200 text-[10px] font-bold flex items-center gap-1">
                      <Crown className="w-3.5 h-3.5 text-purple-600" /> Pro Dealer
                    </Badge>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 font-medium">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    {profile?.district || 'Banex Plaza, Wuse 2, Abuja'}
                  </span>
                  {profile?.phone && (
                    <span className="flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      {profile.phone}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500">
                {publishedProducts.length} Active {publishedProducts.length === 1 ? 'Listing' : 'Listings'}
              </span>
            </div>
          </div>

          <p className="text-xs text-slate-600 max-w-3xl leading-relaxed">
            {profile?.description ||
              'Welcome to our verified technology store on BenchTech. We supply quality smartphones, computers, and electronics with walk-in pickup and nationwide dispatch in Abuja.'}
          </p>

          {/* Store Highlights / Policies */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-5 border-t border-slate-100 mt-5 text-xs text-slate-600">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-start gap-2.5">
              <Truck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-slate-900 block">Delivery &amp; Logistics</span>
                <span>{profile?.delivery_policy || 'Same-day Abuja courier dispatch (₦2,500 flat) or Banex pickup.'}</span>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-start gap-2.5">
              <RotateCcw className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-slate-900 block">Inspection &amp; Returns</span>
                <span>{profile?.pickup_policy || 'Physical testing allowed before payment release. 48-hour warranty on defective hardware.'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          STOREFRONT EDITING FORM
      ========================================================================= */}
      <Card className="rounded-3xl border-slate-200/80 bg-white p-6 sm:p-8 shadow-xs space-y-6">
        <div className="border-b border-slate-100 pb-4">
          <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
            <Edit3 className="w-4 h-4 text-blue-600" /> Customize Storefront Details
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Update your public store name, location in Abuja, contact phone, and store policies.
          </p>
        </div>

        <form action={updateStorefrontAction} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs">
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700">Business / Store Name</label>
              <input
                name="business_name"
                defaultValue={profile?.business_name || ''}
                required
                className="w-full h-10 px-3.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-blue-600 font-medium"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-slate-700">Abuja Location / District</label>
              <input
                name="district"
                defaultValue={profile?.district || 'Banex Plaza, Wuse 2'}
                required
                placeholder="e.g. Shop B12, Emab Plaza, Wuse 2"
                className="w-full h-10 px-3.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-blue-600 font-medium"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-slate-700">Vendor Phone Number</label>
              <input
                name="phone"
                defaultValue={profile?.phone || ''}
                placeholder="e.g. 08012345678"
                className="w-full h-10 px-3.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-blue-600 font-medium"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="font-bold text-slate-700">Custom Banner Image URL</label>
                {!isPro && (
                  <span className="text-[10px] font-black uppercase text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded">
                    Pro Only
                  </span>
                )}
              </div>
              <input
                name="store_banner_url"
                defaultValue={profile?.store_banner_url || ''}
                disabled={!isPro}
                placeholder={isPro ? 'https://images.unsplash.com/...' : 'Upgrade to Pro to set custom banners'}
                className={`w-full h-10 px-3.5 rounded-xl border font-medium ${
                  isPro
                    ? 'border-slate-200 bg-white focus:outline-none focus:border-blue-600'
                    : 'border-slate-200 bg-slate-50 text-slate-400 cursor-not-allowed'
                }`}
              />
            </div>
          </div>

          <div className="space-y-1.5 text-xs">
            <label className="font-bold text-slate-700">Store About / Description</label>
            <textarea
              name="description"
              defaultValue={profile?.description || ''}
              rows={3}
              placeholder="Tell buyers about your gadget expertise, device condition grading, and shop history in Abuja..."
              className="w-full p-3 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-blue-600 font-medium resize-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs">
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700">Delivery Policy</label>
              <input
                name="delivery_policy"
                defaultValue={profile?.delivery_policy || ''}
                placeholder="e.g. ₦2,500 dispatch within 3 hours in Abuja."
                className="w-full h-10 px-3.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-blue-600 font-medium"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-slate-700">Physical Pickup / Testing Policy</label>
              <input
                name="pickup_policy"
                defaultValue={profile?.pickup_policy || ''}
                placeholder="e.g. Walk into our shop in Banex Plaza for in-person testing."
                className="w-full h-10 px-3.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-blue-600 font-medium"
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <Button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs h-10 px-6 rounded-xl shadow-xs"
            >
              Save Storefront Changes
            </Button>
          </div>
        </form>
      </Card>

      {/* Published Products Catalogue Preview */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-black text-slate-900">
            Storefront Product Catalogue ({publishedProducts.length})
          </h3>
          <Link href="/seller/listings/new">
            <Button size="sm" variant="outline" className="text-xs font-bold rounded-xl h-9">
              + Add Another Gadget
            </Button>
          </Link>
        </div>

        {publishedProducts.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {publishedProducts.map((item) => (
              <Card
                key={item.id}
                className="rounded-2xl border-slate-200/80 bg-white overflow-hidden shadow-xs flex flex-col justify-between"
              >
                <div className="aspect-[4/3] bg-slate-50 relative p-2 flex items-center justify-center">
                  {item.images?.[0] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.images[0]}
                      alt={item.title}
                      className="max-h-full object-contain"
                    />
                  ) : (
                    <Package className="w-6 h-6 text-slate-300" />
                  )}
                  <Badge className="absolute top-2 left-2 bg-slate-900/80 text-white border-none text-[9px] capitalize">
                    {item.condition?.replace('_', ' ') || 'Good'}
                  </Badge>
                </div>

                <CardContent className="p-3 space-y-1">
                  <p className="font-bold text-xs text-slate-900 truncate">{item.title}</p>
                  <p className="text-xs font-black text-blue-600">
                    ₦{Number(item.price).toLocaleString()}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="rounded-3xl border border-dashed border-slate-200 p-8 text-center bg-white space-y-2">
            <Package className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="text-xs font-bold text-slate-700">No published products on your storefront yet.</p>
            <p className="text-[11px] text-slate-400">
              Devices you publish will be showcased here for buyers visiting your store link.
            </p>
          </Card>
        )}
      </div>
    </div>
  )
}