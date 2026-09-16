import { Navbar } from "@/components/Navbar";
import { BuyerSidebar } from "@/components/storefront/BuyerSidebar";
import { SavedItemsContent } from "@/components/storefront/SavedItemsContent";

export default function SavedItemsPage() {
  return (
    <div className="min-h-screen bg-slate-100/60 flex flex-col">
      <Navbar />

      <div className="max-w-[1700px] w-full mx-auto flex flex-1">
        <BuyerSidebar />

        <main className="flex-1 min-w-0 p-6 md:p-8 space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Saved Items & Wishlist
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Products you have bookmarked for quick comparison and future
              purchase in Abuja.
            </p>
          </div>

          <SavedItemsContent />
        </main>
      </div>
    </div>
  );
}
