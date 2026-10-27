import Link from 'next/link'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  MapPin,
  ShieldCheck,
  Crown,
  Edit3,
  Package,
  Truck,
  RotateCcw,
  ExternalLink,
} from 'lucide-react'

export const dynamic = 'force-dynamic'

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

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle()

  const isPro =
    profile?.seller_plan === 'pro' ||
    profile?.subscription_tier === 'pro' ||
    profile?.subscription_plan === 'professional'

  const { data: products } = await supabase
    .from('products')
    .select('*')
    .eq('seller_id', user.id)
    .eq('status', 'published')
    .order('created_at', { ascending: false })

  const publishedProducts = products || []
  const storeName = profile?.business_name || profile?.full_name || 'Vendor Store'

  async function updateStorefrontAction(formData: FormData): Promise<void> {
    'use server'
    const serverSupabase = await createClient()
    const {
      data: { user: authUser },
    } = await serverSupabase.auth.getUser()

    if (!authUser) return

    const business_name = ((formData.get('business_name') as string) || '').trim()
    const bio = ((formData.get('bio') as string) || '').trim()
    const district = ((formData.get('district') as string) || 'Abuja').trim()
    const pickup_policy = ((formData.get('pickup_policy') as string) || '').trim()
    const delivery_policy = ((formData.get('delivery_policy') as string) || '').trim()

    await serverSupabase
      .from('profiles')
      .update({
        business_name,
        bio,
        description: bio,
        district,
        pickup_policy,
        delivery_policy,
        updated_at: new Date().toISOString(),
      })
      .eq('id', authUser.id)

    revalidatePath('/seller/store')
    revalidatePath(`/sellers/${authUser.id}`)
    revalidatePath('/sellers')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              My Storefront &amp; Branding
            </h1>
            <Badge className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-bold">
              {isPro ? 'Pro Storefront' : 'Standard Storefront'}
            </Badge>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Preview and customize your public hardware storefront in Abuja.
          </p>
        </div>

        <Link href={`/sellers/${user.id}`} target="_blank">
          <Button
            size="sm"
            variant="outline"
            className="text-xs font-bold rounded-xl h-9 px-4 border-slate-200 dark:border-slate-700 gap-1.5 cursor-pointer"
          >
            <span>View Public Link</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Button>
        </Link>
      </div>

      {/* Live Storefront Preview */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 sm:p-7 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-blue-600 text-white flex items-center justify-center text-2xl font-black overflow-hidden shrink-0">
              {profile?.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={profile.avatar_url}
                  alt={storeName}
                  className="w-full h-full object-cover"
                />
              ) : (
                storeName[0]?.toUpperCase() || 'S'
              )}
            </div>

            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
                  {storeName}
                </h2>
                {profile?.tech_trust_status === 'verified' && (
                  <Badge className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-[10px] font-bold flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" /> Verified Seller
                  </Badge>
                )}
                {isPro && (
                  <Badge className="bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300 text-[10px] font-bold flex items-center gap-1">
                    <Crown className="w-3 h-3" /> Pro
                  </Badge>
                )}
              </div>

              <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span>{profile?.district || 'Abuja'}</span>
              </p>
            </div>
          </div>

          <div className="text-left sm:text-right">
            <span className="text-[10px] font-bold uppercase text-slate-400 block">
              Published Stock
            </span>
            <span className="text-base font-black text-slate-900 dark:text-white">
              {publishedProducts.length} Active {publishedProducts.length === 1 ? 'Item' : 'Items'}
            </span>
          </div>
        </div>

        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
          {profile?.bio ||
            profile?.description ||
            'Verified electronics store on BenchTech Abuja. Every order includes physical inspection before settlement release.'}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-start gap-2.5">
            <Truck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-slate-900 dark:text-white block">
                Abuja Delivery Policy
              </span>
              <span className="text-slate-500 dark:text-slate-400">
                {profile?.delivery_policy ||
                  'Same-day Abuja courier delivery or verified store pickup.'}
              </span>
            </div>
          </div>

          <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-start gap-2.5">
            <RotateCcw className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-slate-900 dark:text-white block">
                Inspection &amp; Warranty Policy
              </span>
              <span className="text-slate-500 dark:text-slate-400">
                {profile?.pickup_policy ||
                  'Physical inspection upon handover + 7-day buyer protection window.'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Storefront Editor Form */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 sm:p-7 shadow-xs space-y-5">
        <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
          <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Edit3 className="w-4 h-4 text-blue-600" />
            Update Storefront Information
          </h3>
        </div>

        <form action={updateStorefrontAction} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                Store / Business Name
              </label>
              <input
                name="business_name"
                defaultValue={profile?.business_name || profile?.full_name || ''}
                required
                className="w-full h-10 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-medium"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                Abuja District
              </label>
              <input
                name="district"
                defaultValue={profile?.district || 'Wuse 2, Abuja'}
                required
                className="w-full h-10 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-medium"
              />
            </div>
          </div>

          <div>
            <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
              Store Bio / Overview
            </label>
            <textarea
              name="bio"
              defaultValue={profile?.bio || profile?.description || ''}
              rows={3}
              placeholder="Describe the hardware you specialize in..."
              className="w-full p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-medium"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                Delivery Policy
              </label>
              <input
                name="delivery_policy"
                defaultValue={profile?.delivery_policy || ''}
                placeholder="e.g. Same-day Abuja courier dispatch"
                className="w-full h-10 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-medium"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                Inspection / Warranty Policy
              </label>
              <input
                name="pickup_policy"
                defaultValue={profile?.pickup_policy || ''}
                placeholder="e.g. 7-day inspection protection + store warranty"
                className="w-full h-10 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-medium"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs h-10 px-6 rounded-xl cursor-pointer"
            >
              Save Storefront Changes
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}