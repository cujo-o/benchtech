import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Navbar } from "@/components/Navbar";
import { ProductImageGallery } from "@/components/storefront/ProductImageGallery";
import { Badge } from "@/components/ui/badge";
import {
  ShieldCheck,
  MapPin,
  ChevronRight,
  ShieldAlert,
  ArrowLeft,
} from "lucide-react";
import { BuyingRequestModal } from "@/components/products/BuyingRequestModal";
import { AddToCartButton } from "@/components/cart/AddToCartButton";
import { CompareButton } from "@/components/CompareButton";
import { ProductViewTracker } from "@/components/products/ProductViewTracker";
import type { Metadata } from 'next';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()

  const { data: product } = await supabase
    .from('products')
    .select('*, profiles!products_seller_id_fkey(business_name, district)')
    .eq('id', id)
    .maybeSingle()

  if (!product) {
    return {
      title: 'Device Not Found',
    }
  }

  const sellerName = product.profiles?.business_name || 'Verified Vendor'
  const location = product.profiles?.district || 'Abuja'
  const formattedPrice = `₦${Number(product.price).toLocaleString()}`
  const title = `${product.title} - ${formattedPrice}`
  const description = `Buy ${product.condition?.replace('_', ' ') || 'clean'} ${product.title} in ${location}, Abuja for ${formattedPrice} from ${sellerName}. Safe in-person inspection available.`

  return {
    title,
    description,
    alternates: {
      canonical: `/products/${id}`,
    },
    openGraph: {
      title: `${title} | BenchTech Abuja`,
      description,
      url: `https://shopbenchtech.com/products/${id}`,
      type: 'article',
      images: product.images?.[0]
        ? [
            {
              url: product.images[0],
              width: 800,
              height: 800,
              alt: product.title,
            },
          ]
        : [],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: product.images?.[0] ? [product.images[0]] : [],
    },
  }
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: product, error } = await supabase
    .from("products")
    .select("*, profiles!products_seller_id_fkey(*)")
    .eq("id", id)
    .single();

  if (error || !product) {
    notFound();
  }

  const seller = product.profiles;
  const isVerified = seller?.tech_trust_status === "verified";

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      {/* Background Analytics Tracker */}
      <ProductViewTracker productId={id} />

      <Navbar />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 md:py-10 space-y-6 md:space-y-8">
        {/* Breadcrumb / Back Link */}
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
          <Link
            href="/products"
            className="hover:text-blue-600 dark:hover:text-blue-400 flex items-center gap-1 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Products
          </Link>
          <span className="text-slate-300 dark:text-slate-700">/</span>
          <span className="capitalize">{product.category || "Hardware"}</span>
          <span className="text-slate-300 dark:text-slate-700">/</span>
          <span className="text-slate-800 dark:text-slate-200 truncate max-w-[200px] sm:max-w-xs">
            {product.title}
          </span>
        </div>

        {/* Responsive 2-Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          {/* Left Column: Image Gallery & Specifications (7 Cols) */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 p-2 sm:p-4 shadow-xs overflow-hidden">
              <ProductImageGallery
                images={product.images || []}
                title={product.title}
              />
            </div>

            {/* Specifications Card */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 p-5 sm:p-7 space-y-5 shadow-xs">
              <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                Device Specifications
              </h3>

              <div className="divide-y divide-slate-100 dark:divide-slate-800/80 text-xs sm:text-sm">
                <div className="py-3 flex justify-between items-center">
                  <span className="text-slate-500 dark:text-slate-400 font-medium">Brand</span>
                  <span className="font-bold text-slate-900 dark:text-slate-100 uppercase">
                    {product.brand || "N/A"}
                  </span>
                </div>
                <div className="py-3 flex justify-between items-center">
                  <span className="text-slate-500 dark:text-slate-400 font-medium">Condition</span>
                  <span className="font-bold text-slate-900 dark:text-slate-100 capitalize">
                    {product.condition?.replace("_", " ") || "Refurbished"}
                  </span>
                </div>
                {product.specs?.processor && (
                  <div className="py-3 flex justify-between items-center">
                    <span className="text-slate-500 dark:text-slate-400 font-medium">
                      Processor
                    </span>
                    <span className="font-bold text-slate-900 dark:text-slate-100">
                      {product.specs.processor}
                    </span>
                  </div>
                )}
                {product.specs?.ram && (
                  <div className="py-3 flex justify-between items-center">
                    <span className="text-slate-500 dark:text-slate-400 font-medium">RAM</span>
                    <span className="font-bold text-slate-900 dark:text-slate-100">
                      {product.specs.ram}
                    </span>
                  </div>
                )}
                {product.specs?.storage && (
                  <div className="py-3 flex justify-between items-center">
                    <span className="text-slate-500 dark:text-slate-400 font-medium">Storage</span>
                    <span className="font-bold text-slate-900 dark:text-slate-100">
                      {product.specs.storage}
                    </span>
                  </div>
                )}
                {product.specs?.battery_health && (
                  <div className="py-3 flex justify-between items-center">
                    <span className="text-slate-500 dark:text-slate-400 font-medium">
                      Battery Health
                    </span>
                    <span className="font-bold text-slate-900 dark:text-slate-100">
                      {product.specs.battery_health}
                    </span>
                  </div>
                )}
              </div>

              {product.description && (
                <div className="pt-5 border-t border-slate-100 dark:border-slate-800 space-y-2">
                  <p className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                    Seller Notes
                  </p>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                    {product.description}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Pricing, CTAs & Seller Card (5 Cols) */}
          <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-24">
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 p-5 sm:p-7 space-y-6 shadow-xs">
              <div>
                <Badge className="bg-blue-50 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 border border-blue-200/50 dark:border-blue-900/50 text-[10px] font-bold uppercase mb-2.5">
                  {product.category || "Tech Listing"}
                </Badge>
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight leading-snug">
                  {product.title}
                </h1>
                <p className="text-2xl sm:text-3xl font-black text-blue-600 dark:text-blue-400 mt-2">
                  ₦{Number(product.price).toLocaleString()}
                </p>
              </div>

              {/* Clickable Seller Profile Card */}
              {seller && (
                <Link
                  href={`/sellers/${seller.id}`}
                  className="group flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60 hover:border-blue-500 dark:hover:border-blue-400 hover:bg-blue-50/40 dark:hover:bg-slate-800 transition"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 flex items-center justify-center font-bold text-blue-600 dark:text-blue-300 shadow-2xs text-sm">
                      {seller.business_name
                        ? seller.business_name[0].toUpperCase()
                        : "S"}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition">
                          {seller.business_name ||
                            seller.full_name ||
                            "BenchTech Seller"}
                        </span>
                        {isVerified && (
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        <MapPin className="w-3 h-3 text-slate-400 dark:text-slate-500" />
                        <span>
                          {seller.district
                            ? `${seller.district}, Abuja`
                            : "Abuja, NG"}
                        </span>
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 dark:text-slate-500 group-hover:text-blue-600 dark:group-hover:text-blue-400 group-hover:translate-x-0.5 transition" />
                </Link>
              )}

              {/* Action Buttons Section */}
              <div className="space-y-3 pt-1">
                {/* Primary Fulfillment Request Modal */}
                <div className="w-full [&>button]:w-full [&>button]:h-12 [&>button]:text-sm [&>button]:font-bold [&>button]:rounded-xl [&>button]:shadow-xs">
                  <BuyingRequestModal
                    product={{
                      id: product.id,
                      title: product.title,
                      price: product.price,
                      seller_id: product.seller_id,
                      location: product.location,
                    }}
                  />
                </div>

                {/* Instant Actions Grid: Cart & Compare (Enforcing Theme Contrast) */}
                <div className="grid grid-cols-2 gap-2.5 [&>div]:w-full [&_button]:w-full [&_button]:h-11 [&_button]:text-xs [&_button]:font-bold [&_button]:rounded-xl [&_button]:border [&_button]:border-slate-200 dark:[&_button]:border-slate-700 [&_button]:bg-white dark:[&_button]:bg-slate-800 [&_button]:text-slate-800 dark:[&_button]:text-slate-100 hover:[&_button]:bg-slate-100 dark:hover:[&_button]:bg-slate-700 transition">
                  <AddToCartButton product={product} />
                  <CompareButton product={product as any} />
                </div>
              </div>

              {/* Trust & Safe Delivery Guarantee */}
              <div className="bg-slate-50 dark:bg-slate-800/40 rounded-2xl p-4 border border-slate-200/60 dark:border-slate-800 space-y-2 text-xs">
                <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-slate-100">
                  <ShieldAlert className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                  TechTrust Buyer Shield
                </div>
                <p className="text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
                  All transactions and payouts are verified by ShopbenchTech[cite: 20]. Inspect your device upon receipt with buyer protection before final payout release[cite: 20, 21].
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}