import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Navbar } from "@/components/Navbar";
import { ProductImageGallery } from "@/components/storefront/ProductImageGallery";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  ShieldCheck,
  MapPin,
  ChevronRight,
  ShieldAlert,
  ArrowLeft,
  ArrowRight,
  Package,
} from "lucide-react";
import { BuyingRequestModal } from "@/components/products/BuyingRequestModal";
import { AddToCartButton } from "@/components/cart/AddToCartButton";
import { CompareButton } from "@/components/CompareButton";
import { ProductViewTracker } from "@/components/products/ProductViewTracker";
import { getSponsoredProducts } from "@/lib/ads/getSponsoredProducts";
import { AdProductCardWrapper } from "@/components/storefront/AdProductCardWrapper";
import { AdImpressionTracker } from "@/components/storefront/AdImpressionTracker";
import { ShareButton } from "@/components/storefront/ShareButton";
import type { Metadata } from "next";

export const revalidate = 60;

function resolveFirstImage(images: any): string | null {
  if (!images) return null;
  if (Array.isArray(images)) return images[0] || null;
  if (typeof images === "string") {
    try {
      const parsed = JSON.parse(images);
      if (Array.isArray(parsed)) return parsed[0] || null;
    } catch {
      return images.startsWith("http") ? images : null;
    }
  }
  return null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();

  const { data: product } = await supabase
    .from("products")
    .select("*, profiles!products_seller_id_fkey(business_name, district)")
    .eq("id", id)
    .maybeSingle();

  if (!product) {
    return {
      title: "Device Not Found | BenchTech",
    };
  }

  const sellerName = product.profiles?.business_name || "Verified Vendor";
  const location = product.profiles?.district || "Abuja";
  const formattedPrice = `₦${Number(product.price).toLocaleString()}`;
  const title = `${product.title} - ${formattedPrice} | BenchTech`;
  const description = `Buy ${
    product.condition?.replace("_", " ") || "inspected"
  } ${product.title} in ${location}, Abuja for ${formattedPrice} from ${sellerName}. Safe escrow and physical inspection available.`;

  return {
    title,
    description,
    alternates: {
      canonical: `https://shopbenchtech.com/products/${id}`,
    },
    openGraph: {
      title,
      description,
      url: `https://shopbenchtech.com/products/${id}`,
      type: "article",
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
      card: "summary_large_image",
      title,
      description,
      images: product.images?.[0] ? [product.images[0]] : [],
    },
  };
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  // 1. Fetch product with wildcards to avoid schema cache column errors
  let { data: product, error } = await supabase
    .from("products")
    .select("*, profiles!products_seller_id_fkey(*)")
    .eq("id", id)
    .maybeSingle();

  // Bulletproof fallback: If joined relation errors, fetch product and profile separately
  if (error || !product) {
    const { data: fallbackProduct } = await supabase
      .from("products")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (fallbackProduct) {
      product = fallbackProduct;
      error = null;

      if (fallbackProduct.seller_id) {
        const { data: sellerData } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", fallbackProduct.seller_id)
          .maybeSingle();
        product.profiles = sellerData;
      }
    }
  }

  if (!product) {
    notFound();
  }

  // 2. Fetch alternative products and deduplicate strictly by ID
  const sponsoredCandidates = await getSponsoredProducts({ limit: 8 });

  const seenIds = new Set<string>();
  const uniqueAlternatives: any[] = [];

  for (const ad of sponsoredCandidates || []) {
    const candidateId = ad?.product?.id;
    if (candidateId && candidateId !== id && !seenIds.has(candidateId)) {
      seenIds.add(candidateId);
      uniqueAlternatives.push(ad);
      if (uniqueAlternatives.length >= 4) break;
    }
  }

  const seller = product.profiles;
  const isVerified = seller?.tech_trust_status === "verified";

  // Resolve Seller Profile Picture
  const sellerAvatar =
    seller?.avatar_url ||
    seller?.profile_image ||
    seller?.logo_url ||
    seller?.photo_url ||
    seller?.image ||
    null;

  // 3. Dynamic Specifications Engine (Parses JSON specs and direct table columns)
  let parsedSpecs: Record<string, any> = {};
  if (product.specs) {
    if (typeof product.specs === "object") {
      parsedSpecs = { ...product.specs };
    } else if (typeof product.specs === "string") {
      try {
        parsedSpecs = JSON.parse(product.specs);
      } catch {
        // ignore malformed string
      }
    }
  }

  const specList: { label: string; value: string }[] = [];
  const addSpec = (label: string, val: any) => {
    if (val !== undefined && val !== null && val !== "" && val !== "N/A") {
      specList.push({ label, value: String(val) });
    }
  };

  addSpec("Brand", product.brand);
  addSpec("Model", product.model || parsedSpecs.model);
  addSpec("Condition", product.condition ? product.condition.replace(/_/g, " ") : "Used");
  addSpec("Processor", product.processor || parsedSpecs.processor);
  addSpec("RAM", product.ram || parsedSpecs.ram);
  addSpec("Storage", product.storage || parsedSpecs.storage);
  addSpec(
    "Battery Health",
    product.battery_health
      ? `${product.battery_health}%`
      : parsedSpecs.battery_health
      ? String(parsedSpecs.battery_health).includes("%")
        ? parsedSpecs.battery_health
        : `${parsedSpecs.battery_health}%`
      : null
  );
  addSpec("Screen Size", product.screen_size || parsedSpecs.screen_size);
  addSpec("Color", product.color || parsedSpecs.color);
  addSpec("Operating System", product.os || parsedSpecs.os || parsedSpecs.operating_system);
  addSpec("Graphics / GPU", product.gpu || parsedSpecs.gpu || parsedSpecs.graphics);
  addSpec("Warranty", product.warranty || parsedSpecs.warranty);
  addSpec("Accessories Included", product.accessories || parsedSpecs.accessories);

  // Catch any custom fields added during listing creation
  const standardKeys = new Set([
    "brand", "model", "condition", "processor", "ram", "storage",
    "battery_health", "screen_size", "color", "os", "operating_system",
    "gpu", "graphics", "warranty", "accessories"
  ]);

  Object.entries(parsedSpecs).forEach(([k, v]) => {
    if (!standardKeys.has(k.toLowerCase()) && v !== undefined && v !== null && v !== "") {
      const formattedLabel = k
        .replace(/_/g, " ")
        .replace(/\b\w/g, (char) => char.toUpperCase());
      addSpec(formattedLabel, v);
    }
  });

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      <ProductViewTracker productId={id} />

      <Navbar />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 md:py-10 space-y-8 md:space-y-12">
        {/* Breadcrumbs */}
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

        {/* 2-Column Responsive Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          {/* Left Column: Image Gallery & Full Specifications */}
          <div className="lg:col-span-7 space-y-6 min-w-0">
            <Card className="rounded-3xl border-slate-200/80 dark:border-slate-800/80 shadow-xs overflow-hidden">
              <CardContent className="p-2 sm:p-4">
                <ProductImageGallery
                  images={product.images || []}
                  title={product.title}
                />
              </CardContent>
            </Card>

            {/* Specifications Card */}
            <Card className="rounded-3xl border-slate-200/80 dark:border-slate-800/80 shadow-xs">
              <CardContent className="p-5 sm:p-7 space-y-5">
                <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                  Device Specifications
                </h3>

                <div className="divide-y divide-slate-100 dark:divide-slate-800/80 text-xs sm:text-sm">
                  {specList.map((spec) => (
                    <div key={spec.label} className="py-3 flex justify-between items-center">
                      <span className="text-slate-500 dark:text-slate-400 font-medium">
                        {spec.label}
                      </span>
                      <span className="font-bold text-slate-900 dark:text-slate-100 capitalize">
                        {spec.value}
                      </span>
                    </div>
                  ))}
                </div>

                {product.description && (
                  <div className="pt-5 border-t border-slate-100 dark:border-slate-800 space-y-2">
                    <p className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                      Seller Notes &amp; Description
                    </p>
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                      {product.description}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Pricing, Checkout & Merchant Profile */}
          <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-24 min-w-0">
            <Card className="rounded-3xl border-slate-200/80 dark:border-slate-800/80 shadow-xs">
              <CardContent className="p-5 sm:p-7 space-y-6">
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

                {/* Verified Merchant Profile with Avatar Photo */}
                {seller && (
                  <Link
                    href={`/sellers/${seller.id}`}
                    className="group flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60 hover:border-blue-500 dark:hover:border-blue-400 hover:bg-blue-50/40 dark:hover:bg-slate-800 transition"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 flex items-center justify-center font-bold text-blue-600 dark:text-blue-300 shadow-2xs text-sm overflow-hidden shrink-0">
                        {sellerAvatar ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={sellerAvatar}
                            alt={seller.business_name || "Seller"}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          seller.business_name ? seller.business_name[0].toUpperCase() : "S"
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition">
                            {seller.business_name || seller.full_name || "BenchTech Seller"}
                          </span>
                          {isVerified && (
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                          )}
                        </div>
                        <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          <MapPin className="w-3 h-3 text-slate-400 dark:text-slate-500" />
                          <span>{seller.district ? `${seller.district}, Abuja` : "Abuja, NG"}</span>
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 dark:text-slate-500 group-hover:text-blue-600 dark:group-hover:text-blue-400 group-hover:translate-x-0.5 transition" />
                  </Link>
                )}

                {/* Actions: Request to Buy, Add to Cart, Compare, Share */}
                <div className="space-y-3 pt-1">
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

                  <div className="grid grid-cols-3 gap-2 [&>div]:w-full [&_button]:w-full [&_button]:h-11 [&_button]:text-xs [&_button]:font-bold [&_button]:rounded-xl [&_button]:border [&_button]:border-slate-200 dark:[&_button]:border-slate-700 [&_button]:bg-white dark:[&_button]:bg-slate-800 [&_button]:text-slate-800 dark:[&_button]:text-slate-100 hover:[&_button]:bg-slate-100 dark:hover:[&_button]:bg-slate-700 transition">
                    <AddToCartButton product={product} />
                    <CompareButton product={product as any} />
                    <ShareButton
                      title={product.title}
                      url={`https://shopbenchtech.com/products/${product.id}`}
                    />
                  </div>
                </div>

                {/* TechTrust Shield */}
                <div className="bg-slate-50 dark:bg-slate-800/40 rounded-2xl p-4 border border-slate-200/60 dark:border-slate-800 space-y-2 text-xs">
                  <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-slate-100">
                    <ShieldAlert className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                    TechTrust Buyer Shield
                  </div>
                  <p className="text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
                    All transactions and settlements are protected by ShopbenchTech. Inspect your device in person upon pickup or delivery before funds are released to the vendor.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Similar Tech Deals (Clean title, deduplicated, no SPONSORED badge) */}
        {uniqueAlternatives.length > 0 && (
          <section className="space-y-4 pt-6 border-t border-slate-200/80 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <h2 className="text-base font-black text-slate-900 dark:text-slate-100">
                    Similar Tech in Abuja
                  </h2>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Verified devices from dealers in Banex, Emab, and Wuse 2.
                </p>
              </div>
              <Link
                href="/products"
                className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
              >
                View Catalog <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
              {uniqueAlternatives.map((ad) => {
                const item = ad.product || ad;
                const firstImg = resolveFirstImage(item.images);

                return (
                  <Card
                    key={item.id}
                    className="group rounded-2xl border-slate-200/90 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-md transition-all flex flex-col justify-between overflow-hidden"
                  >
                    <AdProductCardWrapper
                      campaignId={ad.campaignId}
                      productId={item.id}
                      sellerId={ad.sellerId || item.seller_id}
                      isSponsored={false}
                    >
                      <AdImpressionTracker
                        campaignId={ad.campaignId}
                        productId={item.id}
                        sellerId={ad.sellerId || item.seller_id}
                        isSponsored={false}
                      />
                      <Link
                        href={`/products/${item.id}`}
                        className="flex-1 flex flex-col min-w-0"
                      >
                        <div className="relative w-full aspect-square bg-slate-100/70 dark:bg-slate-800/40 overflow-hidden border-b border-slate-100 dark:border-slate-800 flex items-center justify-center p-3">
                          {firstImg ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={firstImg}
                              alt={item.title}
                              loading="lazy"
                              className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-300"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Package className="w-6 h-6 text-slate-300" />
                            </div>
                          )}
                        </div>

                        <CardContent className="p-3 flex-1 flex flex-col justify-between space-y-1.5">
                          <p className="font-bold text-xs text-slate-900 dark:text-slate-100 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                            {item.title}
                          </p>
                          <div className="flex items-center justify-between pt-1">
                            <span className="text-xs font-black text-slate-900 dark:text-slate-100">
                              ₦{Number(item.price).toLocaleString()}
                            </span>
                            <span className="text-[10px] text-slate-400 capitalize">
                              {item.condition?.replace("_", " ") || "Refurbished"}
                            </span>
                          </div>
                        </CardContent>
                      </Link>
                    </AdProductCardWrapper>
                  </Card>
                );
              })}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}