"use server";

import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { SELLER_PLANS } from "@/lib/plans";

export async function initiateSubscriptionUpgrade(
  planKey: "standard" | "professional",
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be logged in to upgrade your store." };
  }

  const selectedPlan = SELLER_PLANS[planKey];
  if (!selectedPlan) {
    return { error: "Invalid subscription tier selected." };
  }

  const secretKey = process.env.PAYSTACK_SECRET_KEY;
  if (!secretKey) {
    return { error: "Paystack secret key is missing." };
  }

  const origin = (await headers()).get("origin") || "https://shopbenchtech.com";
  const callbackUrl = `${origin}/seller/subscription?status=verifying`;

  try {
    const res = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secretKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: user.email,
        amount: selectedPlan.price * 100, // Convert NGN to Kobo
        callback_url: callbackUrl,
        metadata: {
          purpose: "seller_subscription",
          plan_key: selectedPlan.id,
          seller_id: user.id,
          max_listings: selectedPlan.maxListings,
          max_images: selectedPlan.maxImages,
          promo_credits: selectedPlan.promoCredits,
        },
      }),
    });

    const payload = await res.json();

    if (!payload.status) {
      return { error: payload.message || "Unable to initialize checkout." };
    }

    // Pre-record pending state
    await supabase.from("payment_records").insert({
      paystack_reference: payload.data.reference,
      user_id: user.id,
      payment_purpose: "seller_subscription",
      plan_tier: selectedPlan.id,
      amount: selectedPlan.price,
      status: "pending",
    });

    return { authorizationUrl: payload.data.authorization_url };
  } catch (err: any) {
    return {
      error: err.message || "Network error connecting to payment gateway.",
    };
  }
}
