import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/Navbar'
import { BuyerSidebar } from '@/components/storefront/BuyerSidebar'
import { ProductImageGallery } from '@/components/storefront/ProductImageGallery'
import { ProductViewTracker } from '@/components/products/ProductViewTracker'
import { BuyingRequestModal } from '@/components/products/BuyingRequestModal'
import { AddToCartButton } from '@/components/cart/AddToCartButton'
import { CompareButton } from '@/components/CompareButton'
import { ShareButton } from '@/components/storefront/ShareButton'
import { formatSpecLabel } from '@/lib/specs/categorySpecs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  ShieldCheck,
  MapPin,
  ArrowLeft,
  Store,
  Lock,
  Truck,
  Cpu,
  CheckCircle2,
  LogIn,
} from 'lucide-react'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

function parseImagesList(images: any): string[] {
  if (!images) return []
  if (Array.isArray(images)) return images.filter(Boolean)
  if (typeof images === 'string') {
    try {
      const parsed = JSON.parse(images)
      if (Array.isArray(parsed)) return parsed.filter(Boolean)
    } catch {
      return images.startsWith('http') ? [images] : []
    }
  }
  return []
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()
  const { data: product } = await supabase
    .from('products')
    .select('title, price, condition, brand')
    .eq('id', id)
    .maybeSingle()

  if (!product) {
    return { title: 'Product Not Found | BenchTech' }
  }

  return {
    title: `${product.title} — ₦${Number(product.price).toLocaleString()} | BenchTech Abuja`,
    description: `Buy ${product.title} (${
      product.condition?.replace(/_/g, ' ') || 'Verified'
    }) in Abuja with 7-day physical inspection protection.`,
  }
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const [
    {
      data: { user },
    },
    { data: product },
  ] = await Promise.all([
    supabase.auth.getUser(),
    supabase
      .from('products')
      .select(
        '*, profiles!products_seller_id_fkey(id, business_name, full_name, district, tech_trust_status, bio)'
      )
      .eq('id', id)
      .maybeSingle(),
  ])

  if (!product) {
    notFound()
  }

  const images = parseImagesList(product.images)
  const sellerProfile = Array.isArray(product.profiles)
    ? product.profiles[0]
    : product.profiles
  const sellerName =
    sellerProfile?.business_name || sellerProfile?.full_name || 'Abuja Store'
  const isVerifiedSeller = sellerProfile?.tech_trust_status === 'verified'
  const district = sellerProfile?.district || product.location || 'Abuja'

  const specEntries = Object.entries(product.specs || {}).filter(
    ([key, val]) =>
      val &&
      typeof val === 'string' &&
      !['ownership_proof_url', 'serial_number', 'product_verification'].includes(
        key
      )
  )

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col">
      <Navbar />
      <ProductViewTracker productId={product.id} />

      <div className="max-w-[1700px] w-full mx-auto flex flex-1">
        {/* Only render BuyerSidebar for signed-in users */}
        {user && <BuyerSidebar />}

        <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-6">
          {/* Back Link: Routes guests back to Landing Page (/), signed-in users back to Feed/Catalog */}
          <div>
            <Link
              href={user ? '/feed' : '/'}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>{user ? 'Back to Marketplace' : 'Back to Home'}</span>
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
            {/* Left 6 Cols: Image Gallery */}
            <div className="lg:col-span-6">
              <ProductImageGallery images={images} title={product.title} />
            </div>

            {/* Right 6 Cols: Pricing, Actions, Specs & Seller Card */}
            <div className="lg:col-span-6 space-y-5">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xs space-y-5">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge className="bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-[10px] font-bold uppercase">
                      {product.brand || product.category || 'Hardware'}
                    </Badge>
                    <Badge
                      variant="outline"
                      className="text-[10px] font-bold capitalize"
                    >
                      {product.condition?.replace(/_/g, ' ') || 'Used'}
                    </Badge>
                    {product.specs?.serial_masked && (
                      <Badge className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-[10px] font-mono font-bold">
                        SN: {product.specs.serial_masked}
                      </Badge>
                    )}
                  </div>

                  <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white leading-snug">
                    {product.title}
                  </h1>

                  <div className="flex items-baseline gap-3 pt-1">
                    <span className="text-2xl sm:text-3xl font-black text-blue-600 dark:text-blue-400">
                      ₦{Number(product.price || 0).toLocaleString()}
                    </span>
                    <span className="text-xs text-slate-400 font-semibold">
                      • {Number(product.stock_quantity || 1)} in stock
                    </span>
                  </div>
                </div>

                {/* Action Buttons: Gated for Non-Signed-In Users, Isolated Hover States for Signed-In Users */}
                {user ? (
                  <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <BuyingRequestModal
                      product={{
                        id: product.id,
                        title: product.title,
                        price: Number(product.price || 0),
                        seller_id: product.seller_id,
                        location: district,
                      }}
                    />

                    {/* 3 Independent Action Buttons (Isolated containers so hover never bleeds across buttons) */}
                    <div className="grid grid-cols-3 gap-2.5">
                      <div className="flex [&>*]:w-full">
                        <AddToCartButton product={product} variant="full" />
                      </div>

                      <div className="flex [&>*]:w-full [&>*]:h-9 [&>*]:rounded-xl">
                        <CompareButton
                          product={{
                            id: product.id,
                            title: product.title,
                            brand: product.brand || '',
                            model: product.model || '',
                            price: Number(product.price || 0),
                            condition: product.condition || 'used',
                            category: product.category || 'hardware',
                            images,
                            specs: product.specs || {},
                          }}
                        />
                      </div>

                      <div className="flex [&>*]:w-full [&>*]:h-9">
                        <ShareButton
                          title={product.title}
                          className="w-full h-9 rounded-xl justify-center"
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 space-y-3">
                    <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                      Sign in to your BenchTech account to purchase this device with 7-day inspection protection, add it to your cart, or compare specifications.
                    </p>
                    <div className="flex items-center gap-2.5">
                      <Link
                        href={`/login?next=/products/${product.id}`}
                        className="flex-1"
                      >
                        <Button className="w-full h-10 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl gap-1.5 cursor-pointer">
                          <LogIn className="w-3.5 h-3.5" />
                          <span>Sign In to Buy</span>
                        </Button>
                      </Link>
                      <Link
                        href={`/register?next=/products/${product.id}`}
                        className="flex-1"
                      >
                        <Button
                          variant="outline"
                          className="w-full h-10 text-xs font-bold rounded-xl border-slate-200 dark:border-slate-700 cursor-pointer"
                        >
                          Create Account
                        </Button>
                      </Link>
                    </div>
                  </div>
                )}

                {/* Protection Highlights */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-300">
                  <div className="flex items-center gap-2">
                    <Lock className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>7-Day Buyer Inspection Escrow</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Truck className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    <span>Same-Day Abuja Courier Dispatch</span>
                  </div>
                </div>
              </div>

              {/* Seller Information Card */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs flex items-center justify-between gap-4">
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-11 h-11 rounded-2xl bg-blue-600 text-white font-black text-sm flex items-center justify-center shrink-0">
                    {sellerName[0]?.toUpperCase() || 'S'}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-black text-sm text-slate-900 dark:text-white truncate">
                        {sellerName}
                      </span>
                      {isVerifiedSeller && (
                        <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3 shrink-0" />
                      <span className="truncate">{district}, Abuja</span>
                    </p>
                  </div>
                </div>

                <Link href={`/sellers/${product.seller_id}`} className="shrink-0">
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs font-bold rounded-xl h-9 px-3.5 border-slate-200 dark:border-slate-700 gap-1.5 cursor-pointer"
                  >
                    <Store className="w-3.5 h-3.5" />
                    <span>Visit Store</span>
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          {/* Hardware Specifications & Description Section */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
              <h2 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
                <Cpu className="w-4 h-4 text-blue-600" />
                <span>Technical Specifications</span>
              </h2>

              {specEntries.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                  {specEntries.map(([key, value]) => (
                    <div
                      key={key}
                      className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800"
                    >
                      <span className="text-[10px] font-bold uppercase text-slate-400 block truncate">
                        {formatSpecLabel(key)}
                      </span>
                      <span className="font-bold text-slate-900 dark:text-white block mt-0.5">
                        {String(value)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400">
                  Standard manufacturer configuration. Inspect physical specifications upon handover.
                </p>
              )}
            </div>

            <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xs space-y-3">
              <h2 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white">
                Condition &amp; Seller Notes
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                {product.description ||
                  'Verified hardware available for physical inspection and delivery in Abuja.'}
              </p>
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-1.5 text-[11px] text-slate-500">
                <p className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Physical inspection before handover OTP release</span>
                </p>
                <p className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>7-day post-delivery buyer protection window</span>
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}