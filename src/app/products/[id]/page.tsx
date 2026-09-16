import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Navbar } from "@/components/Navbar";
import { ProductImageGallery } from "@/components/storefront/ProductImageGallery";
import { EnquiryFormModal } from "@/components/EnquiryFormModal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ShieldCheck,
  MapPin,
  Phone,
  ChevronRight,
  ShieldAlert,
  ArrowLeft,
} from "lucide-react";
import { BuyingRequestModal } from "@/components/products/BuyingRequestModal";
import { AddToCartButton } from "@/components/cart/AddToCartButton";
import { CompareButton } from "@/components/CompareButton";

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

  const formattedWhatsApp = seller?.phone
    ? seller.phone.replace(/[^0-9]/g, "").replace(/^0/, "234")
    : null;

  const whatsappMessage = encodeURIComponent(
    `Hello ${seller?.business_name || "Vendor"}, I found your listing for "${product.title}" on BenchTech Abuja and I am interested in purchasing.`,
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <main className="max-w-6xl mx-auto px-4 py-6 md:py-10 space-y-8">
        {/* Breadcrumb / Back */}
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
          <Link
            href="/products"
            className="hover:text-blue-600 flex items-center gap-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Products
          </Link>
          <span>/</span>
          <span className="capitalize">{product.category || "Hardware"}</span>
          <span>/</span>
          <span className="text-slate-900 truncate max-w-xs">
            {product.title}
          </span>
        </div>

        {/* Balanced 2-Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Image Gallery & Description (7 Cols) */}
          <div className="lg:col-span-7 space-y-6">
            <ProductImageGallery
              images={product.images || []}
              title={product.title}
            />

            {/* Specifications Card */}
            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 space-y-4 shadow-sm">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Device Specifications
              </h3>

              <div className="divide-y divide-slate-100 text-xs">
                <div className="py-2.5 flex justify-between">
                  <span className="text-slate-400 font-medium">Brand</span>
                  <span className="font-bold text-slate-800 uppercase">
                    {product.brand || "N/A"}
                  </span>
                </div>
                <div className="py-2.5 flex justify-between">
                  <span className="text-slate-400 font-medium">Condition</span>
                  <span className="font-bold text-slate-800 capitalize">
                    {product.condition?.replace("_", " ") || "Refurbished"}
                  </span>
                </div>
                {product.specs?.processor && (
                  <div className="py-2.5 flex justify-between">
                    <span className="text-slate-400 font-medium">
                      Processor
                    </span>
                    <span className="font-bold text-slate-800">
                      {product.specs.processor}
                    </span>
                  </div>
                )}
                {product.specs?.ram && (
                  <div className="py-2.5 flex justify-between">
                    <span className="text-slate-400 font-medium">RAM</span>
                    <span className="font-bold text-slate-800">
                      {product.specs.ram}
                    </span>
                  </div>
                )}
                {product.specs?.storage && (
                  <div className="py-2.5 flex justify-between">
                    <span className="text-slate-400 font-medium">Storage</span>
                    <span className="font-bold text-slate-800">
                      {product.specs.storage}
                    </span>
                  </div>
                )}
                {product.specs?.battery_health && (
                  <div className="py-2.5 flex justify-between">
                    <span className="text-slate-400 font-medium">
                      Battery Health
                    </span>
                    <span className="font-bold text-slate-800">
                      {product.specs.battery_health}
                    </span>
                  </div>
                )}
              </div>

              {product.description && (
                <div className="pt-4 border-t border-slate-100 space-y-1.5">
                  <p className="text-xs font-bold text-slate-900">
                    Seller Notes
                  </p>
                  <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">
                    {product.description}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Pricing, CTAs & Clickable Seller Card (5 Cols) */}
          <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-24">
            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 space-y-6 shadow-sm">
              <div>
                <Badge className="bg-blue-50 text-blue-700 border-none text-[10px] font-bold uppercase mb-2">
                  {product.category || "Tech Listing"}
                </Badge>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight leading-snug">
                  {product.title}
                </h1>
                <p className="text-3xl font-black text-blue-600 mt-2">
                  ₦{Number(product.price).toLocaleString()}
                </p>
              </div>

              {/* Clickable Seller Profile Card */}
              {seller && (
                <Link
                  href={`/sellers/${seller.id}`}
                  className="group flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 hover:border-blue-500 hover:bg-blue-50/40 transition"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-white border border-slate-200 flex items-center justify-center font-bold text-blue-600 shadow-sm text-sm">
                      {seller.business_name
                        ? seller.business_name[0].toUpperCase()
                        : "S"}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-xs text-slate-900 group-hover:text-blue-600 transition">
                          {seller.business_name ||
                            seller.full_name ||
                            "BenchTech Seller"}
                        </span>
                        {isVerified && (
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-0.5">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        <span>
                          {seller.district
                            ? `${seller.district}, Abuja`
                            : "Abuja, NG"}
                        </span>
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition" />
                </Link>
              )}

              {/* Action Buttons */}
              <div className="space-y-3">
                {/* Instant Actions Grid: Cart & Compare */}
                <div className="grid grid-cols-2 gap-2.5">
                  <AddToCartButton product={product} />
                  // ✅ Correct: passes the database product directly
                  <CompareButton product={product as any} />
                </div>

                {/* Primary Fulfillment Request Modal */}
                <BuyingRequestModal
                  product={{
                    id: product.id,
                    title: product.title,
                    price: product.price,
                    seller_id: product.seller_id,
                    location: product.location,
                  }}
                />

                {/* WhatsApp Direct Link */}
                {formattedWhatsApp && (
                  <a
                    href={`https://wa.me/${formattedWhatsApp}?text=${whatsappMessage}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full block"
                  >
                    <Button
                      variant="outline"
                      className="w-full border-slate-200 text-slate-700 hover:text-emerald-700 hover:bg-emerald-50 hover:border-emerald-200 font-bold h-11 text-xs rounded-xl shadow-sm gap-2"
                    >
                      <Phone className="w-4 h-4 text-emerald-600" /> Chat on
                      WhatsApp
                    </Button>
                  </a>
                )}

                {/* Technical / Condition Enquiry Modal */}
                <EnquiryFormModal
                  productId={product.id}
                  sellerId={seller?.id ?? ""}
                  productTitle={product.title}
                />
              </div>

              {/* Trust & Inspection Guarantee */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-2 text-slate-600 text-xs">
                <div className="flex items-center gap-2 font-bold text-slate-900">
                  <ShieldAlert className="w-4 h-4 text-blue-600" />
                  TechTrust Buyer Shield
                </div>
                <p className="text-[11px] leading-relaxed text-slate-500">
                  Inspect the physical device in a secure location in Abuja
                  before finalizing payments. Never send deposit funds without
                  mutual agreement.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
