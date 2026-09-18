import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Navbar } from "@/components/Navbar";
import { AddToCartButton } from "@/components/cart/AddToCartButton";
import { SaveButton } from "@/components/SaveButton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { BuyerSidebar } from "@/components/storefront/BuyerSidebar";
import {
  Tag,
  Zap,
  Percent,
  Clock,
  Sparkles,
  ArrowRight,
  Flame,
} from "lucide-react";

export default async function DealsPage() {
  const supabase = await createClient();

  // Fetch gadgets marked as deals or with an original reference price
  const { data: dealProducts } = await supabase
    .from("products")
    .select(
      "*, profiles!products_seller_id_fkey(business_name, tech_trust_status)",
    )
    .eq("status", "published")
    .order("price", { ascending: true })
    .limit(20);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />
      <div className="max-w-[1700px] w-full mx-auto flex flex-1">
        <BuyerSidebar />

        <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-8">
          {/* Promotional Hero Banner */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-700 via-indigo-700 to-slate-950 text-white p-6 sm:p-10 shadow-lg">
            <div className="max-w-xl space-y-4 relative z-10">
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-blue-200">
                <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                Verified Abuja Price Drops
              </div>
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight leading-tight">
                BenchTech Deals &amp; Clearance Hub
              </h1>
              <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                Curated flash discounts, negotiable clearance stocks, and price
                drops from verified computer village dealers across Abuja.
              </p>
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Link href="/techspin">
                  <Button className="bg-amber-400 hover:bg-amber-500 text-slate-950 font-black text-xs px-5 h-10 rounded-xl gap-2 shadow-md">
                    <Sparkles className="w-4 h-4" /> Spin for Extra Voucher
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
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 flex items-center gap-3.5 shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                <Flame className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-black text-slate-900">
                  Up to 30% Off
                </p>
                <p className="text-[11px] text-slate-400">
                  Refurbished flagships
                </p>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 flex items-center gap-3.5 shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-black text-slate-900">
                  24-Hour Drops
                </p>
                <p className="text-[11px] text-slate-400">
                  Limited vendor slots
                </p>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 flex items-center gap-3.5 shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <Tag className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-black text-slate-900">
                  Direct Delivery
                </p>
                <p className="text-[11px] text-slate-400">
                  Abuja same-day dispatch
                </p>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 flex items-center gap-3.5 shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-black text-slate-900">
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
                <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <Tag className="w-4 h-4 text-blue-600" /> Current Promotional
                  Listings
                </h2>
                <p className="text-xs text-slate-500">
                  Live prices discounted by sellers
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {dealProducts && dealProducts.length > 0 ? (
                dealProducts.map((item) => {
                  const estimatedOriginal = Math.round(
                    Number(item.price) * 1.15,
                  );
                  return (
                    <div key={item.id} className="relative group">
                      <SaveButton product={item} />
                      <Link
                        href={`/products/${item.id}`}
                        className="block h-full"
                      >
                        <Card className="h-full border border-slate-200/80 rounded-2xl overflow-hidden hover:shadow-md transition bg-white flex flex-col justify-between">
                          <div className="aspect-[4/3] bg-slate-50 relative overflow-hidden p-3 flex items-center justify-center">
                            {item.images?.[0] ? (
                              <img
                                src={item.images[0]}
                                alt={item.title}
                                className="max-h-full object-contain group-hover:scale-105 transition duration-300"
                              />
                            ) : (
                              <div className="text-xs text-slate-400">
                                No Image
                              </div>
                            )}

                            <Badge className="absolute top-2.5 left-2.5 bg-red-600 text-white border-none text-[10px] font-black uppercase">
                              HOT DEAL
                            </Badge>
                          </div>

                          <CardContent className="p-3.5 flex-1 flex flex-col justify-between space-y-2">
                            <div>
                              <h3 className="font-bold text-xs text-slate-900 group-hover:text-blue-600 transition line-clamp-1">
                                {item.title}
                              </h3>
                              <p className="text-[11px] text-slate-400 uppercase tracking-wider mt-0.5">
                                {item.brand || "Device"}
                              </p>
                            </div>

                            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                              <div>
                                <p className="text-sm font-black text-blue-600">
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
                    </div>
                  );
                })
              ) : (
                <div className="col-span-full p-12 text-center bg-white rounded-2xl border border-slate-200">
                  <p className="text-xs text-slate-500">
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
