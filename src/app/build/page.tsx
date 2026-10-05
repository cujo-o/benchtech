import { createClient } from "@/lib/supabase/server";
import { Navbar } from "@/components/Navbar";
import { BuildSetupClient } from "./BuildSetupClient";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Build My Setup | BenchTech Abuja",
  description:
    "Assemble and configure your dream workstation, gaming rig, or student desk setup with real, inspected gadgets in Abuja.",
  alternates: {
    canonical: "https://shopbenchtech.com/build",
  },
};

export default async function BuildSetupPage() {
  const supabase = await createClient();

  // Fetch published marketplace hardware across all relevant builder categories
  const { data: products } = await supabase
    .from("products")
    .select("*, profiles!products_seller_id_fkey(business_name, district, tech_trust_status)")
    .eq("status", "published")
    .order("price", { ascending: true })
    .limit(100);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col transition-colors">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 w-full flex-1">
        <BuildSetupClient initialProducts={products || []} />
      </main>
    </div>
  );
}