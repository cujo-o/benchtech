import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { confirmOrderDelivery } from "@/app/actions/orderProtection";
import {
  CheckCircle2,
  Clock,
  ShieldCheck,
  AlertTriangle,
  Package,
  Truck,
  MapPin,
  ArrowRight,
  Store,
  ChevronRight,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect(`/login?next=/orders/${id}`);

  const { data: order } = await supabase
    .from("orders")
    .select("*, product:products(*), seller:profiles!orders_seller_id_fkey(*)")
    .eq("id", id)
    .single();

  if (!order) notFound();

  const isBuyer = order.buyer_id === user.id;
  const isSeller = order.seller_id === user.id;

  // Compute Buyer Protection Countdown
  let daysRemaining = 0;
  let isProtectionActive = false;
  if (order.protection_ends_at) {
    const end = new Date(order.protection_ends_at).getTime();
    const now = Date.now();
    const diff = end - now;
    if (diff > 0) {
      daysRemaining = Math.ceil(diff / (1000 * 60 * 60 * 24));
      isProtectionActive = true;
    }
  }

  const isDelivered =
    order.delivery_status === "verified" || order.order_status === "delivered";

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Order Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-400">
                Order Reference:
              </span>
              <h1 className="text-base sm:text-lg font-black">
                {order.order_number || order.id.slice(0, 12)}
              </h1>
              <Badge className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 text-[10px] font-bold">
                {order.payment_status === "verified" ? "Paid" : order.status}
              </Badge>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Placed on{" "}
              {new Date(order.created_at).toLocaleDateString("en-NG", {
                dateStyle: "medium",
              })}
            </p>
          </div>

          <div className="text-right">
            <span className="text-[10px] font-bold text-slate-400 uppercase block">
              Total Amount
            </span>
            <span className="text-xl font-black text-blue-600 dark:text-blue-400">
              ₦{Number(order.total_amount || order.amount).toLocaleString()}
            </span>
          </div>
        </div>

        {/* Fulfillment Progress Stepper */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-6">
          <h2 className="text-xs font-black uppercase tracking-wider text-slate-400">
            Order Delivery Progress
          </h2>

          <div className="grid grid-cols-4 gap-2 text-center relative">
            <div className="space-y-1.5 flex flex-col items-center">
              <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <span className="text-[11px] font-bold">Placed</span>
            </div>

            <div className="space-y-1.5 flex flex-col items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center shadow-xs ${
                  order.order_status !== "created" &&
                  order.order_status !== "awaiting_payment"
                    ? "bg-emerald-600 text-white"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-400"
                }`}
              >
                <Package className="w-4 h-4" />
              </div>
              <span className="text-[11px] font-bold">Preparing</span>
            </div>

            <div className="space-y-1.5 flex flex-col items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center shadow-xs ${
                  order.delivery_status === "dispatched" || isDelivered
                    ? "bg-emerald-600 text-white"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-400"
                }`}
              >
                <Truck className="w-4 h-4" />
              </div>
              <span className="text-[11px] font-bold">Dispatched</span>
            </div>

            <div className="space-y-1.5 flex flex-col items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center shadow-xs ${
                  isDelivered
                    ? "bg-emerald-600 text-white"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-400"
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <span className="text-[11px] font-bold">Delivered</span>
            </div>
          </div>

          {/* Delivery Confirmation Trigger */}
          {!isDelivered && isBuyer && (
            <div className="p-4 rounded-2xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <Store className="w-5 h-5 text-blue-600 shrink-0" />
                <div>
                  <p className="text-xs font-bold text-blue-950 dark:text-blue-200">
                    Device Inspection &amp; Meetup
                  </p>
                  <p className="text-[11px] text-blue-700 dark:text-blue-300">
                    Inspect device hardware and condition before confirming
                    physical receipt.
                  </p>
                </div>
              </div>
              <form
                action={async () => {
                  "use server";
                  await confirmOrderDelivery(order.id);
                }}
              >
                <Button
                  type="submit"
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl h-10 px-4 cursor-pointer shadow-xs"
                >
                  Confirm I Received This Order
                </Button>
              </form>
            </div>
          )}
        </div>

        {/* Buyer Protection Countdown Banner */}
        {isProtectionActive && (
          <div className="bg-linear-to-r from-blue-900 to-indigo-950 text-white p-6 rounded-3xl border border-blue-800/80 shadow-md space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
                  <h3 className="font-black text-sm">
                    You are in the Buyer Protection Period
                  </h3>
                </div>
                <p className="text-xs text-blue-200 leading-relaxed">
                  You have {daysRemaining} days remaining to inspect your gadget
                  and ensure all specs match. Funds are safely secured in
                  TechTrust escrow.
                </p>
              </div>
              <Badge className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-black">
                {daysRemaining} Days Left
              </Badge>
            </div>

            <div className="pt-2 border-t border-white/10 flex flex-wrap items-center justify-between gap-3">
              <span className="text-[11px] text-blue-200">
                Delivered:{" "}
                {order.delivery_verified_at
                  ? new Date(order.delivery_verified_at).toLocaleDateString(
                      "en-NG",
                    )
                  : "Today"}{" "}
                • Protection ends:{" "}
                {order.protection_ends_at
                  ? new Date(order.protection_ends_at).toLocaleDateString(
                      "en-NG",
                    )
                  : "N/A"}
              </span>
              <div className="flex items-center gap-2">
                <Link href={`/orders/${order.id}/dispute`}>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-red-400 text-red-300 hover:bg-red-950/40 text-xs font-bold rounded-xl h-8"
                  >
                    Report an Issue
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Refund Tracker Link Banner (Visual 8: Screen 8) */}
        {order.order_status === "refunded" && (
          <div className="p-4 rounded-3xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <p className="text-xs font-bold text-emerald-950 dark:text-emerald-200">
                  Refund Approved &amp; Processing
                </p>
                <p className="text-[11px] text-emerald-800 dark:text-emerald-300">
                  Your payment of ₦
                  {Number(order.total_amount || order.amount).toLocaleString()}{" "}
                  is being returned to your original payment method.
                </p>
              </div>
            </div>
            <Link href={`/refunds/${order.id}`}>
              <Button
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl h-9"
              >
                View Refund Tracker →
              </Button>
            </Link>
          </div>
        )}

        {/* Product Card & Vendor Information */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
            Item Purchased
          </h3>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 overflow-hidden flex items-center justify-center shrink-0 border border-slate-200 dark:border-slate-700">
              {order.product?.images?.[0] ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={order.product.images[0]}
                  alt={order.product.title}
                  className="w-full h-full object-contain p-1"
                />
              ) : (
                <Package className="w-6 h-6 text-slate-400" />
              )}
            </div>

            <div className="min-w-0 flex-1">
              <h4 className="text-sm font-black truncate">
                {order.product?.title || "Gadget Item"}
              </h4>
              <p className="text-xs font-black text-blue-600 dark:text-blue-400 mt-0.5">
                ₦{Number(order.amount).toLocaleString()}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Sold by:{" "}
                <span className="font-bold text-slate-700 dark:text-slate-300">
                  {order.seller?.business_name || "Verified Vendor"}
                </span>{" "}
                ({order.seller?.district || "Abuja"})
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
