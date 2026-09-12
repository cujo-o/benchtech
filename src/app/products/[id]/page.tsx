import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, MessageCircle, MapPin, Truck, Store } from "lucide-react";
import { CompareButton } from "@/components/CompareButton";
import { EnquiryFormModal } from "@/components/EnquiryFormModal";

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: product } = await supabase
    .from("products")
    .select(
      "*, profiles!products_seller_id_fkey(business_name, phone, address, city, tech_trust_status, avatar_url, bio)",
    )
    .eq("id", id)
    .single();

  // Format phone number for WhatsApp deep-link
  const rawPhone = product.profiles?.phone || "";
  const cleanPhone = rawPhone.replace(/\D/g, "").replace(/^0/, "234");
  const message = encodeURIComponent(
    `Hello ${product.profiles?.business_name || "Seller"}, I saw your listing for "${product.title}" on TechMart (₦${Number(product.price).toLocaleString()}). Is this still available?`,
  );
  const whatsappUrl = `https://wa.me/${cleanPhone}?text=${message}`;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      <main className="max-w-6xl w-full mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          {/* Media Gallery */}
          <div className="md:col-span-7 space-y-4">
            <div className="aspect-[4/3] bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
              {product.images?.[0] ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={product.images[0]}
                  alt={product.title}
                  className="w-full h-full object-contain p-4"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-400">
                  No Image Available
                </div>
              )}
            </div>

            {product.images?.length > 1 && (
              <div className="grid grid-cols-4 gap-3">
                {product.images.map((img: string, idx: number) => (
                  <div
                    key={idx}
                    className="aspect-square bg-white rounded-lg border border-slate-200 overflow-hidden"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={img}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Details & Actions */}
          <div className="md:col-span-5 space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge
                  variant="secondary"
                  className="capitalize text-xs font-semibold"
                >
                  {product.condition.replace("_", " ")}
                </Badge>
                <Badge variant="outline" className="text-xs capitalize">
                  {product.category}
                </Badge>
              </div>
              <h1 className="text-2xl font-bold text-slate-900">
                {product.title}
              </h1>
              <p className="text-3xl font-black text-slate-900 mt-3">
                ₦{Number(product.price).toLocaleString()}
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 space-y-4 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center">
                  {product.profiles?.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={product.profiles.avatar_url}
                      alt="Seller Avatar"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="font-bold text-slate-500 text-sm">
                      {product.profiles?.business_name?.[0] || "S"}
                    </span>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-bold text-sm text-slate-900 truncate">
                      {product.profiles?.business_name || "Tech Vendor"}
                    </h3>
                    {product.profiles?.tech_trust_status === "verified" && (
                      <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[9px] px-1.5 py-0">
                        Verified
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3 h-3 text-slate-400" />{" "}
                    {product.profiles?.city || product.location || "Abuja"}
                  </p>
                </div>
              </div>

              {product.profiles?.bio && (
                <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100 leading-relaxed">
                  &ldquo;{product.profiles.bio}&rdquo;
                </p>
              )}

              <div className="space-y-2 pt-1">
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block"
                >
                  <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white gap-2 font-semibold h-11 text-xs">
                    <MessageCircle className="w-4 h-4" /> Contact Seller on
                    WhatsApp
                  </Button>
                </a>

                <EnquiryFormModal
                  productId={product.id}
                  sellerId={product.seller_id}
                  productTitle={product.title}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 space-y-4">
          <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-3">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider text-xs">
              Device Specifications
            </h2>
            <div className="divide-y divide-slate-100 text-sm">
              <div className="py-2 flex justify-between">
                <span className="text-slate-500">Brand</span>
                <span className="font-medium text-slate-800">
                  {product.brand}
                </span>
              </div>
              <div className="py-2 flex justify-between">
                <span className="text-slate-500">Model</span>
                <span className="font-medium text-slate-800">
                  {product.model}
                </span>
              </div>
              {product.specs &&
                Object.entries(product.specs).map(([key, val]) => (
                  <div
                    key={key}
                    className="py-2 flex justify-between capitalize"
                  >
                    <span className="text-slate-500">
                      {key.replace("_", " ")}
                    </span>
                    <span className="font-medium text-slate-800">
                      {String(val)}
                    </span>
                  </div>
                ))}
            </div>
          </div>

          <div className="bg-slate-100/70 p-4 rounded-xl text-xs text-slate-600 space-y-2">
            <div className="flex items-center gap-2 font-semibold text-slate-800">
              <Truck className="w-4 h-4 text-blue-600" /> Delivery & Inspection
            </div>
            <p>
              Arrange physical inspection or delivery within Abuja directly with
              the vendor prior to payment.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
