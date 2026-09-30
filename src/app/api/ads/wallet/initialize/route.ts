import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { amount, redirectPath } = await request.json()
    const topupAmount = Number(amount);

    if (!topupAmount || topupAmount < 1000) {
      return NextResponse.json(
        { error: "Minimum deposit is ₦1,000" },
        { status: 400 },
      );
    }

    const secretKey = process.env.PAYSTACK_SECRET_KEY;
    if (!secretKey) {
      return NextResponse.json(
        { error: "Paystack is not configured" },
        { status: 500 },
      );
    }

    const host = request.headers.get("host") || "shopbenchtech.com";
    const protocol = host.includes("localhost") ? "http" : "https";

    // Initialize transaction with Paystack
    const paystackRes = await fetch(
      "https://api.paystack.co/transaction/initialize",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${secretKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: user.email,
          amount: Math.round(topupAmount * 100), // Paystack accepts Kobo
          callback_url: `${protocol}://${host}${redirectPath || "/seller/wallet"}?wallet_topup=success`,
          metadata: {
            purpose: "ad_wallet_topup",
            seller_id: user.id,
            amount: topupAmount,
          },
        }),
      },
    );

    const data = await paystackRes.json();

    if (!data.status) {
      return NextResponse.json(
        { error: data.message || "Payment initiation failed" },
        { status: 400 },
      );
    }

    return NextResponse.json({
      authorization_url: data.data.authorization_url,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
