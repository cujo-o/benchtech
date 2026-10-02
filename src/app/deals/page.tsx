import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Navbar } from "@/components/Navbar";
import { AddToCartButton } from "@/components/cart/AddToCartButton";
import { SaveButton } from "@/components/SaveButton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { BuyerSidebar } from "@/components/storefront/BuyerSidebar";
import { getSponsoredProducts } from "@/lib/ads/getSponsoredProducts";
import { AdProductCardWrapper } from "@/components/storefront/AdProductCardWrapper";
import { AdImpressionTracker } from "@/components/storefront/AdImpressionTracker";
import {
  Tag,
  Zap,
  Percent,
  Clock,
  Sparkles,
  ArrowRight,
  Flame,
  Package,
} from "lucide-react";
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Tech Deals & Clearance Hub Abuja | BenchTech',
  description:
    'Curated flash discounts, negotiable clearance stocks, and price drops from verified computer village dealers across Abuja.',
  alternates: {
    canonical: 'https://shopbenchtech.com/deals',
  },
  openGraph: {
    title: 'Daily Tech Deals & Gadget Clearance | BenchTech Abuja',
    description: 'Save up to 30% on inspected laptops, phones, and accessories in Abuja.',
    url: 'https://shopbenchtech.com/deals',
    type: 'website',
  },
}

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

export default async function DealsPage() {
  const supabase = await createClient();

  // Fetch deals and active sponsored promotions in parallel
  const [{ data: organicDeals }, sponsoredAds] = await Promise.all([
    supabase
      .from("products")
      .select("*, profiles!products_seller_id_fkey(business_name, tech_trust_status)")
      .eq("status", "published")
      .order("price", { ascending: true })
      .limit(20),
    getSponsoredProducts({ limit: 4 }),
  ]);

  // Strict Deduplication: Merge sponsored ads with organic deals without duplicates
  const dealMap = new Map<string, any>();

  // 1. Add sponsored ads first (top rank)
  for (const ad of sponsoredAds) {
    if (ad?.product?.id) {
      dealMap.set(ad.product.id, {
        ...ad.product,
        isSponsored: true,
        campaignId: ad.campaignId,
        sellerId: ad.sellerId,
      });
    }
  }

  // 2. Add organic deals if not already present as sponsored
  for (const item of organicDeals || []) {
    if (!dealMap.has(item.id)) {
      dealMap.set(item.id, {
        ...item,
        isSponsored: false,
      });
    }
  }

  const allDeals = Array.from(dealMap.values());

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col transition-colors">
      <Navbar />
      <div className="max-w-[1700px] w-full mx-auto flex flex-1">
        <BuyerSidebar />

        <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-8">
          {/* Promotional Hero Banner */}
          <div className="relative overflow-hidden rounded-3xl bg-linear-to-r from-blue-700 via-indigo-700 to-slate-950 text-white p-6 sm:p-10 shadow-lg">
            <div className="max-w-xl space-y-4 relative z-10">
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-blue-200">
                <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                Verified Abuja Price Drops
              </div>
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight leading-tight">
                BenchTech Deals &amp; Clearance Hub
              </h1>
              <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                Curated flash discounts, negotiable clearance stocks, and promoted price
                drops from verified computer village dealers across Abuja.
              </p>
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Link href="/products?category=phones">
                  <Button className="bg-amber-400 hover:bg-amber-500 text-slate-950 font-black text-xs px-5 h-10 rounded-xl gap-2 shadow-md cursor-pointer">
                    <Sparkles className="w-4 h-4" /> Explore Top Discounts
                  </Button>
                </Link>
              </div>
            </div>

            <div className="absolute right-6 -bottom-10 opacity-10 pointer-events-none">
              <Percent className="w-96 h-96 text-white" />
            </div>
          </div>

          {/* Highlight Stats Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 flex items-center gap-3.5 shadow-2xs">
              <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                <Flame className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-black text-slate-900 dark:text-slate-100">
                  Up to 30% Off
                </p>
                <p className="text-[11px] text-slate-400">
                  Refurbished flagships
                </p>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 flex items-center gap-3.5 shadow-2xs">
              <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-black text-slate-900 dark:text-slate-100">
                  24-Hour Drops
                </p>
                <p className="text-[11px] text-slate-400">
                  Limited vendor units
                </p>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 flex items-center gap-3.5 shadow-2xs">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <Tag className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-black text-slate-900 dark:text-slate-100">
                  Direct Delivery
                </p>
                <p className="text-[11px] text-slate-400">
                  Abuja same-day dispatch
                </p>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 flex items-center gap-3.5 shadow-2xs">
              <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-black text-slate-900 dark:text-slate-100">
                  Inspected Units
                </p>
                <p className="text-[11px] text-slate-400">TechTrust verified</p>
              </div>
            </div>
          </div>

          {/* Deals Listing Matrix */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-lg font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Tag className="w-4 h-4 text-blue-600 dark:text-blue-400" /> Current Promotional Listings
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Live price drops and promoted vendor deals in Abuja
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {allDeals && allDeals.length > 0 ? (
                allDeals.map((item) => {
                  const estimatedOriginal = Math.round(Number(item.price) * 1.15);
                  const firstImg = resolveFirstImage(item.images);

                  return (
                    <div key={item.id} className="relative group">
                      <SaveButton product={item} />

                      <AdProductCardWrapper
                        campaignId={item.campaignId}
                        productId={item.id}
                        sellerId={item.sellerId}
                        isSponsored={item.isSponsored}
                      >
                        <AdImpressionTracker
                          campaignId={item.campaignId}
                          productId={item.id}
                          sellerId={item.sellerId}
                          isSponsored={item.isSponsored}
                        />

                        <Link
                          href={`/products/${item.id}`}
                          className="block h-full"
                        >
                          <Card className={`h-full rounded-2xl overflow-hidden hover:shadow-md transition bg-white dark:bg-slate-900 flex flex-col justify-between ${
                            item.isSponsored
                              ? "border-emerald-500/70 ring-1 ring-emerald-500/20"
                              : "border-slate-200/80 dark:border-slate-800"
                          }`}>
                            <div className="aspect-4/3 bg-slate-50 dark:bg-slate-800/40 relative overflow-hidden p-3 flex items-center justify-center border-b border-slate-100 dark:border-slate-800">
                              {firstImg ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={firstImg}
                                  alt={item.title}
                                  className="max-h-full object-contain group-hover:scale-105 transition duration-300"
                                />
                              ) : (
                                <div className="text-xs text-slate-400 flex items-center gap-1">
                                  <Package className="w-5 h-5 text-slate-400" />
                                </div>
                              )}

                              <Badge className={`absolute top-2.5 left-2.5 text-white border-none text-[9px] font-black uppercase tracking-wider ${
                                item.isSponsored ? "bg-emerald-600" : "bg-red-600"
                              }`}>
                                {item.isSponsored ? "SPONSORED DEAL" : "HOT DEAL"}
                              </Badge>
                            </div>

                            <CardContent className="p-3.5 flex-1 flex flex-col justify-between space-y-2">
                              <div>
                                <h3 className="font-bold text-xs text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition line-clamp-1">
                                  {item.title}
                                </h3>
                                <p className="text-[11px] text-slate-400 uppercase tracking-wider mt-0.5">
                                  {item.brand || "Device"}
                                </p>
                              </div>

                              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                                <div>
                                  <p className="text-sm font-black text-blue-600 dark:text-blue-400">
                                    ₦{Number(item.price).toLocaleString()}
                                  </p>
                                  <p className="text-[10px] text-slate-400 line-through">
                                    ₦{estimatedOriginal.toLocaleString()}
                                  </p>
                                </div>
                                <AddToCartButton product={item} variant="icon" />
                              </div>
                            </CardContent>
                          </Card>
                        </Link>
                      </AdProductCardWrapper>
                    </div>
                  );
                })
              ) : (
                <div className="col-span-full p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    No deal items registered yet.
                  </p>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}