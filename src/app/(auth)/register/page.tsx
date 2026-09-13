"use client";

import { useState } from "react";
import Link from "next/link";
import { registerBuyer, registerSeller } from "../actions";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import {
  ShoppingBag,
  Store,
  ShieldCheck,
  Zap,
  Tag,
  Truck,
  Loader2,
} from "lucide-react";

export default function RegisterPage() {
  const [role, setRole] = useState<"buyer" | "seller">("buyer");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);

    const formData = new FormData(e.currentTarget);
    const result =
      role === "buyer"
        ? await registerBuyer(formData)
        : await registerSeller(formData);

    if (result?.error) {
      setErrorMessage(result.error);
      setLoading(false);
    }
  }

  async function handleGoogleSignup() {
    setGoogleLoading(true);
    setErrorMessage(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/api/auth/callback`,
      },
    });
    if (error) {
      setErrorMessage(error.message);
      setGoogleLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-100/60 flex items-center justify-center p-4 md:p-8">
      <div className="w-full max-w-4xl">
        {/* Buyer / Seller Mode Toggle */}
        <div className="flex justify-center mb-6">
          <div className="bg-slate-200/70 p-1 rounded-2xl flex gap-1 border border-slate-300/40">
            <button
              type="button"
              onClick={() => setRole("buyer")}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition ${
                role === "buyer"
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <ShoppingBag className="w-4 h-4" />
              Join as a Buyer
            </button>
            <button
              type="button"
              onClick={() => setRole("seller")}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition ${
                role === "seller"
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Store className="w-4 h-4" />
              Join as a Seller
            </button>
          </div>
        </div>

        <Card className="border border-slate-200/80 shadow-2xl shadow-slate-200/60 rounded-3xl overflow-hidden bg-white">
          <div className="grid md:grid-cols-12">
            {/* Left Value Banner */}
            <div className="md:col-span-5 bg-gradient-to-br from-blue-700 via-blue-800 to-indigo-900 text-white p-8 flex flex-col justify-between">
              <div>
                <Link href="/" className="inline-flex items-center gap-2">
                  <div className="bg-white text-blue-700 w-8 h-8 rounded-xl flex items-center justify-center font-extrabold text-base shadow-sm">
                    T
                  </div>
                  <span className="text-xl font-extrabold tracking-tight text-white">
                    BenchTech
                  </span>
                </Link>

                <div className="mt-10 space-y-4">
                  <h2 className="text-2xl font-black leading-tight tracking-tight">
                    {role === "buyer"
                      ? "Find genuine technology in Abuja."
                      : "Scale your gadget store across Nigeria."}
                  </h2>
                  <p className="text-xs text-blue-100/90 leading-relaxed">
                    {role === "buyer"
                      ? "Direct contact with verified vendors, side-by-side spec comparison, and authentic devices."
                      : "Etsy-style streamlined store management, automated buyer enquiries, and TechTrust verification."}
                  </p>

                  <div className="space-y-3 pt-4 border-t border-blue-600/60 text-xs text-blue-100">
                    {role === "buyer" ? (
                      <>
                        <div className="flex items-center gap-2.5">
                          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                          <span>TechTrust verified seller security</span>
                        </div>
                        <div className="flex items-center gap-2.5">
                          <Tag className="w-4 h-4 text-amber-300 shrink-0" />
                          <span>Compare RAM, battery health & storage</span>
                        </div>
                        <div className="flex items-center gap-2.5">
                          <Truck className="w-4 h-4 text-sky-300 shrink-0" />
                          <span>Pickup or door-to-door Abuja delivery</span>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex items-center gap-2.5">
                          <Zap className="w-4 h-4 text-amber-300 shrink-0" />
                          <span>Simple, focused inventory tools</span>
                        </div>
                        <div className="flex items-center gap-2.5">
                          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                          <span>TechTrust badge to increase conversions</span>
                        </div>
                        <div className="flex items-center gap-2.5">
                          <Tag className="w-4 h-4 text-sky-300 shrink-0" />
                          <span>
                            Direct leads via WhatsApp & on-platform inbox
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <p className="text-[11px] text-blue-200/70 pt-6">
                Protected by TechTrust verification and moderation standards.
              </p>
            </div>

            {/* Right Form */}
            <div className="md:col-span-7 p-8 md:p-10">
              <div className="max-w-md mx-auto">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">
                      {role === "buyer"
                        ? "Create Buyer Account"
                        : "Register Tech Store"}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Already registered?{" "}
                      <Link
                        href="/login"
                        className="text-blue-600 font-bold hover:underline"
                      >
                        Log in
                      </Link>
                    </p>
                  </div>
                </div>

                {/* Google Button */}
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleGoogleSignup}
                  disabled={googleLoading}
                  className="w-full h-11 border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs flex items-center justify-center gap-3 rounded-xl shadow-sm transition mb-5"
                >
                  {googleLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.03 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                      />
                    </svg>
                  )}
                  Continue with Google
                </Button>

                <div className="relative mb-5">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-200/80" />
                  </div>
                  <div className="relative flex justify-center text-[11px] uppercase">
                    <span className="bg-white px-3 text-slate-400 font-semibold tracking-wider">
                      Or fill details
                    </span>
                  </div>
                </div>

                {errorMessage && (
                  <div className="mb-4 p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200">
                    {errorMessage}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-3.5">
                  {role === "buyer" ? (
                    <div>
                      <Label
                        htmlFor="fullName"
                        className="text-xs font-semibold text-slate-700"
                      >
                        Full Name
                      </Label>
                      <Input
                        id="fullName"
                        name="fullName"
                        placeholder="e.g. Caleb Danladi"
                        required
                        className="mt-1 h-10 bg-slate-50/50 border-slate-200 focus:bg-white rounded-xl text-xs"
                      />
                    </div>
                  ) : (
                    <div>
                      <Label
                        htmlFor="businessName"
                        className="text-xs font-semibold text-slate-700"
                      >
                        Store / Business Name
                      </Label>
                      <Input
                        id="businessName"
                        name="businessName"
                        placeholder="e.g. Banex Gadget Hub"
                        required
                        className="mt-1 h-10 bg-slate-50/50 border-slate-200 focus:bg-white rounded-xl text-xs"
                      />
                    </div>
                  )}

                  <div>
                    <Label
                      htmlFor="email"
                      className="text-xs font-semibold text-slate-700"
                    >
                      Email Address
                    </Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="name@example.com"
                      required
                      className="mt-1 h-10 bg-slate-50/50 border-slate-200 focus:bg-white rounded-xl text-xs"
                    />
                  </div>

                  <div>
                    <Label
                      htmlFor="phone"
                      className="text-xs font-semibold text-slate-700"
                    >
                      Phone Number (WhatsApp)
                    </Label>
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      placeholder="0801 234 5678"
                      required
                      className="mt-1 h-10 bg-slate-50/50 border-slate-200 focus:bg-white rounded-xl text-xs"
                    />
                  </div>

                  <div>
                    <Label
                      htmlFor="password"
                      className="text-xs font-semibold text-slate-700"
                    >
                      Password
                    </Label>
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      placeholder="••••••••"
                      minLength={8}
                      required
                      className="mt-1 h-10 bg-slate-50/50 border-slate-200 focus:bg-white rounded-xl text-xs"
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-600/20 transition mt-2"
                  >
                    {loading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : role === "buyer" ? (
                      "Register as Buyer"
                    ) : (
                      "Create Seller Account"
                    )}
                  </Button>
                </form>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
