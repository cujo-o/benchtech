"use client";

import { useState, useMemo, useDeferredValue, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { SaveButton } from "@/components/SaveButton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  SlidersHorizontal,
  X,
  ChevronDown,
  ChevronUp,
  Smartphone,
  Laptop,
  Gamepad2,
  Headphones,
  Camera,
  Network,
  Home as HomeIcon,
  Watch,
  Tablet,
  Monitor,
  Grid,
  MapPin,
  Sparkles,
  Package,
  ShieldCheck,
  BatteryCharging,
  Cpu,
  HardDrive,
  ArrowRight,
} from "lucide-react";

const CATEGORIES = [
  { id: "all", label: "All Catalog", icon: Grid },
  { id: "phones", label: "Phones", icon: Smartphone },
  { id: "laptops", label: "Laptops", icon: Laptop },
  { id: "gaming", label: "Gaming", icon: Gamepad2 },
  { id: "tablets", label: "Tablets", icon: Tablet },
  { id: "accessories", label: "Accessories", icon: Headphones },
  { id: "cameras", label: "Cameras", icon: Camera },
  { id: "networking", label: "Networking", icon: Network },
  { id: "monitors", label: "Monitors", icon: Monitor },
  { id: "wearables", label: "Wearables", icon: Watch },
  { id: "smarthome", label: "Smart Home", icon: HomeIcon },
];

const PHONE_BRANDS = [
  "Apple",
  "Samsung",
  "Google",
  "Xiaomi",
  "OnePlus",
  "Tecno",
  "Infinix",
];
const LAPTOP_BRANDS = [
  "Apple",
  "Dell",
  "HP",
  "Lenovo",
  "ASUS",
  "Acer",
  "Microsoft",
];
const GENERAL_BRANDS = [
  "Apple",
  "Samsung",
  "Sony",
  "Dell",
  "HP",
  "Lenovo",
  "Logitech",
  "Canon",
  "LG",
];

const PHONE_STORAGE = ["64GB", "128GB", "256GB", "512GB", "1TB"];
const LAPTOP_RAM = ["8GB", "16GB", "32GB", "64GB+"];
const LAPTOP_STORAGE = ["256GB SSD", "512GB SSD", "1TB SSD", "2TB SSD"];
const PROCESSORS = [
  "Apple M1/M2/M3",
  "Core i5",
  "Core i7",
  "Core i9",
  "Ryzen 5",
  "Ryzen 7",
];
const BATTERY_HEALTH = ["90%+", "85%+", "80%+"];

const CONDITIONS = [
  { id: "brand_new", label: "Brand New (Sealed)" },
  { id: "open_box", label: "Open Box / Mint" },
  { id: "refurbished", label: "Refurbished" },
  { id: "used", label: "Clean Fairly Used" },
];

const ABUJA_HUBS = [
  "Banex Plaza",
  "Emab Plaza",
  "Wuse 2",
  "Garki",
  "CBD",
  "Maitama",
  "Gwarinpa",
  "Apo",
];

const PRICE_BUCKETS = [
  { label: "Under ₦150k", min: 0, max: 150000 },
  { label: "₦150k – ₦350k", min: 150000, max: 350000 },
  { label: "₦350k – ₦750k", min: 350000, max: 750000 },
  { label: "₦750k – ₦1.5M", min: 750000, max: 1500000 },
  { label: "Above ₦1.5M", min: 1500000, max: 999999999 },
];

export function ProductsCatalogClient({
  initialProducts,
}: {
  initialProducts: any[];
}) {
  const searchParams = useSearchParams();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>(
    searchParams.get("category") || "all"
  );
  const [searchQuery] = useState<string>(searchParams.get("q") || "");

  const deferredSearch = useDeferredValue(searchQuery);

  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [selectedRam, setSelectedRam] = useState<string[]>([]);
  const [selectedStorage, setSelectedStorage] = useState<string[]>([]);
  const [selectedProcessors, setSelectedProcessors] = useState<string[]>([]);
  const [selectedBatteryHealth, setSelectedBatteryHealth] = useState<string[]>([]);
  const [selectedConditions, setSelectedConditions] = useState<string[]>([]);
  const [selectedHubs, setSelectedHubs] = useState<string[]>([]);
  const [selectedPriceRange, setSelectedPriceRange] = useState<{
    min: number;
    max: number;
    label: string;
  } | null>(null);
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [sortBy, setSortBy] = useState<
    "featured" | "newest" | "price_low" | "price_high"
  >("featured");

  const [openSections, setOpenSections] = useState({
    price: true,
    brand: true,
    specs: true,
    condition: true,
    hub: false,
  });

  // Lock background scroll when mobile filter drawer is open
  useEffect(() => {
    if (drawerOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [drawerOpen]);

  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const activeBrands = useMemo(() => {
    if (selectedCategory === "phones") return PHONE_BRANDS;
    if (selectedCategory === "laptops") return LAPTOP_BRANDS;
    return GENERAL_BRANDS;
  }, [selectedCategory]);

  const filteredProducts = useMemo(() => {
    const q = deferredSearch.trim().toLowerCase();

    return initialProducts
      .filter((item) => {
        if (
          selectedCategory !== "all" &&
          item.category?.toLowerCase() !== selectedCategory.toLowerCase()
        ) {
          return false;
        }

        if (q) {
          const matchTitle = item.title?.toLowerCase().includes(q);
          const matchBrand = item.brand?.toLowerCase().includes(q);
          const matchDesc = item.description?.toLowerCase().includes(q);
          if (!matchTitle && !matchBrand && !matchDesc) return false;
        }

        if (
          selectedBrands.length > 0 &&
          !selectedBrands.some(
            (b) => item.brand?.toLowerCase() === b.toLowerCase()
          )
        ) {
          return false;
        }

        if (
          selectedConditions.length > 0 &&
          !selectedConditions.includes(item.condition)
        ) {
          return false;
        }

        if (selectedHubs.length > 0) {
          const district = item.profiles?.district || "";
          if (
            !selectedHubs.some((h) =>
              district.toLowerCase().includes(h.toLowerCase())
            )
          ) {
            return false;
          }
        }

        if (selectedPriceRange) {
          const price = Number(item.price) || 0;
          if (
            price < selectedPriceRange.min ||
            price > selectedPriceRange.max
          ) {
            return false;
          }
        }

        if (verifiedOnly && item.profiles?.tech_trust_status !== "verified") {
          return false;
        }

        if (selectedRam.length > 0) {
          const itemRam = item.specs?.ram || "";
          const content =
            `${item.title} ${item.description} ${itemRam}`.toUpperCase();
          if (
            !selectedRam.some((r) =>
              content.includes(r.replace("+", "").toUpperCase())
            )
          ) {
            return false;
          }
        }

        if (selectedStorage.length > 0) {
          const itemStorage = item.specs?.storage || "";
          const content =
            `${item.title} ${item.description} ${itemStorage}`.toUpperCase();
          if (
            !selectedStorage.some((s) =>
              content.includes(s.replace(" SSD", "").toUpperCase())
            )
          ) {
            return false;
          }
        }

        if (selectedProcessors.length > 0) {
          const itemProc = item.specs?.processor || "";
          const content =
            `${item.title} ${item.description} ${itemProc}`.toLowerCase();
          if (
            !selectedProcessors.some((p) =>
              content.includes(p.toLowerCase().replace("apple ", ""))
            )
          ) {
            return false;
          }
        }

        if (selectedBatteryHealth.length > 0) {
          const healthNum = parseInt(item.specs?.battery_health || "0");
          const meetsThreshold = selectedBatteryHealth.some((threshold) => {
            const min = parseInt(threshold);
            return healthNum >= min;
          });
          if (!meetsThreshold && item.specs?.battery_health) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === "price_low") return Number(a.price) - Number(b.price);
        if (sortBy === "price_high") return Number(b.price) - Number(a.price);
        if (sortBy === "newest")
          return (
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );
        return (b.is_featured ? 1 : 0) - (a.is_featured ? 1 : 0);
      });
  }, [
    initialProducts,
    selectedCategory,
    deferredSearch,
    selectedBrands,
    selectedConditions,
    selectedHubs,
    selectedPriceRange,
    verifiedOnly,
    selectedRam,
    selectedStorage,
    selectedProcessors,
    selectedBatteryHealth,
    sortBy,
  ]);

  const activeFilterCount =
    (selectedCategory !== "all" ? 1 : 0) +
    selectedBrands.length +
    selectedConditions.length +
    selectedHubs.length +
    selectedRam.length +
    selectedStorage.length +
    selectedProcessors.length +
    selectedBatteryHealth.length +
    (selectedPriceRange ? 1 : 0) +
    (verifiedOnly ? 1 : 0);

  const clearAllFilters = () => {
    setSelectedBrands([]);
    setSelectedRam([]);
    setSelectedStorage([]);
    setSelectedProcessors([]);
    setSelectedBatteryHealth([]);
    setSelectedConditions([]);
    setSelectedHubs([]);
    setSelectedPriceRange(null);
    setVerifiedOnly(false);
  };

  const toggleItem = (
    list: string[],
    setList: (val: string[]) => void,
    item: string
  ) => {
    if (list.includes(item)) {
      setList(list.filter((x) => x !== item));
    } else {
      setList([...list, item]);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      <main className="p-3 sm:p-5 lg:p-6 space-y-4 max-w-[1550px] mx-auto w-full">
        {/* 1. Category Bar Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none -mx-1 px-1">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => {
                  setSelectedCategory(cat.id);
                  clearAllFilters();
                }}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold shrink-0 transition-all shadow-2xs ${
                  isSelected
                    ? "bg-blue-600 text-white shadow-sm"
                    : "bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                }`}
              >
                <Icon
                  className={`w-3.5 h-3.5 ${
                    isSelected
                      ? "text-white"
                      : "text-slate-500 dark:text-slate-400"
                  }`}
                />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* 2. Top Toolbar */}
        <div className="bg-white dark:bg-slate-900 p-3 sm:p-4 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-slate-100">
              {filteredProducts.length}{" "}
              {filteredProducts.length === 1 ? "Device" : "Devices"}
            </span>
            <span className="text-xs text-slate-400 dark:text-slate-500">
              available in Abuja
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
              <span className="hidden sm:inline font-bold">Sort:</span>
              <select
                value={sortBy}
                onChange={(e: any) => setSortBy(e.target.value)}
                className="h-9 px-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="featured">Featured First</option>
                <option value="newest">Newest Listed</option>
                <option value="price_low">Price: Low to High</option>
                <option value="price_high">Price: High to Low</option>
              </select>
            </div>

            <Button
              size="sm"
              onClick={() => setDrawerOpen(true)}
              className="h-9 px-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white font-bold text-xs gap-2 shadow-2xs cursor-pointer border border-transparent dark:border-slate-700"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Filters</span>
              {activeFilterCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-blue-600 text-white text-[9px] font-black flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </Button>
          </div>
        </div>

        {/* 3. Active Filters Bar */}
        {activeFilterCount > 0 && (
          <div className="flex items-center flex-wrap gap-1.5 pt-0.5">
            <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 mr-1">
              Active filters:
            </span>

            {verifiedOnly && (
              <Badge className="bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-[10px] font-bold gap-1 pl-2 pr-1.5 py-0.5 rounded-lg">
                Verified Only
                <X
                  className="w-3 h-3 cursor-pointer hover:text-emerald-900 dark:hover:text-emerald-100"
                  onClick={() => setVerifiedOnly(false)}
                />
              </Badge>
            )}

            {selectedPriceRange && (
              <Badge className="bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-[10px] font-bold gap-1 pl-2 pr-1.5 py-0.5 rounded-lg">
                {selectedPriceRange.label}
                <X
                  className="w-3 h-3 cursor-pointer hover:text-blue-900 dark:hover:text-blue-100"
                  onClick={() => setSelectedPriceRange(null)}
                />
              </Badge>
            )}

            {selectedBrands.map((b) => (
              <Badge
                key={b}
                className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-[10px] font-bold gap-1 pl-2 pr-1.5 py-0.5 rounded-lg"
              >
                {b}
                <X
                  className="w-3 h-3 cursor-pointer hover:text-red-600 dark:hover:text-red-400"
                  onClick={() =>
                    toggleItem(selectedBrands, setSelectedBrands, b)
                  }
                />
              </Badge>
            ))}

            {selectedRam.map((r) => (
              <Badge
                key={r}
                className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-[10px] font-bold gap-1 pl-2 pr-1.5 py-0.5 rounded-lg"
              >
                {r} RAM
                <X
                  className="w-3 h-3 cursor-pointer hover:text-red-600 dark:hover:text-red-400"
                  onClick={() => toggleItem(selectedRam, setSelectedRam, r)}
                />
              </Badge>
            ))}

            {selectedStorage.map((s) => (
              <Badge
                key={s}
                className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-[10px] font-bold gap-1 pl-2 pr-1.5 py-0.5 rounded-lg"
              >
                {s}
                <X
                  className="w-3 h-3 cursor-pointer hover:text-red-600 dark:hover:text-red-400"
                  onClick={() =>
                    toggleItem(selectedStorage, setSelectedStorage, s)
                  }
                />
              </Badge>
            ))}

            {selectedConditions.map((c) => (
              <Badge
                key={c}
                className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-[10px] font-bold gap-1 pl-2 pr-1.5 py-0.5 rounded-lg capitalize"
              >
                {c.replace("_", " ")}
                <X
                  className="w-3 h-3 cursor-pointer hover:text-red-600 dark:hover:text-red-400"
                  onClick={() =>
                    toggleItem(selectedConditions, setSelectedConditions, c)
                  }
                />
              </Badge>
            ))}

            <button
              onClick={clearAllFilters}
              className="text-[11px] font-bold text-red-600 dark:text-red-400 hover:underline ml-1"
            >
              Reset All
            </button>
          </div>
        )}

        {/* 4. Product Cards Grid */}
        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-3 sm:gap-4.5">
            {filteredProducts.map((item) => {
              const isFeatured =
                item.is_featured &&
                item.featured_until &&
                new Date(item.featured_until) > new Date();

              return (
                <div
                  key={item.id}
                  className="relative group bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800/90 rounded-2xl overflow-hidden hover:shadow-lg hover:border-blue-500/50 dark:hover:border-blue-500/50 transition-all duration-200 flex flex-col justify-between"
                >
                  {/* Top Floating Overlay: Save Button & Badges */}
                  <div className="absolute top-2.5 inset-x-2.5 flex items-center justify-between z-20 pointer-events-none">
                    <div className="flex flex-col gap-1 items-start">
                      {isFeatured && (
                        <span className="bg-blue-600 text-white text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md shadow-xs flex items-center gap-1">
                          <Sparkles className="w-2.5 h-2.5" /> Featured
                        </span>
                      )}
                      <span className="bg-slate-900/80 dark:bg-slate-950/90 text-white text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md backdrop-blur-xs">
                        {item.condition?.replace("_", " ") || "Refurbished"}
                      </span>
                    </div>

                    <div className="pointer-events-auto">
                      <SaveButton product={item} />
                    </div>
                  </div>

                  {/* Card Clickable Target */}
                  <Link href={`/products/${item.id}`} className="flex-1 flex flex-col">
                    {/* Consistent Aspect-Ratio Image Container */}
                    <div className="aspect-[4/3] bg-slate-50 dark:bg-slate-800/40 p-4 flex items-center justify-center border-b border-slate-100 dark:border-slate-800/80 relative">
                      {item.images?.[0] ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={item.images[0]}
                          alt={item.title}
                          loading="lazy"
                          decoding="async"
                          className="max-h-full max-w-full object-contain group-hover:scale-104 transition duration-300"
                        />
                      ) : (
                        <Package className="w-8 h-8 text-slate-300 dark:text-slate-600" />
                      )}
                    </div>

                    {/* Metadata Body */}
                    <div className="p-3.5 flex-1 flex flex-col justify-between space-y-2.5">
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">
                          <span className="truncate max-w-[100px]">
                            {item.brand || "Device"}
                          </span>
                          {item.profiles?.district && (
                            <span className="flex items-center gap-1 text-[10px] normal-case text-slate-500 dark:text-slate-400">
                              <MapPin className="w-3 h-3 text-slate-400" />
                              <span className="truncate max-w-[80px]">
                                {item.profiles.district.split(" ")[0]}
                              </span>
                            </span>
                          )}
                        </div>

                        <h3 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2 leading-snug">
                          {item.title}
                        </h3>
                      </div>

                      {/* Price & Action Row */}
                      <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                        <p className="text-sm sm:text-base font-black text-slate-900 dark:text-slate-100">
                          ₦{Number(item.price).toLocaleString()}
                        </p>
                        <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400 flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
                          Inspect <ArrowRight className="w-3 h-3" />
                        </span>
                      </div>
                    </div>
                  </Link>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-16 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
              <SlidersHorizontal className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-black text-slate-800 dark:text-slate-200">
                No gadgets found matching your filters
              </p>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Try loosening your budget range, changing storage capacity, or
                clearing filters.
              </p>
            </div>
            <Button
              size="sm"
              onClick={clearAllFilters}
              variant="outline"
              className="text-xs font-bold rounded-xl mt-2 border-slate-200 dark:border-slate-700"
            >
              Clear Active Filters
            </Button>
          </div>
        )}

        {/* 5. SLIDE-OUT FILTER DRAWER */}
        {drawerOpen && (
          <div className="fixed inset-0 z-50 flex">
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in"
              onClick={() => setDrawerOpen(false)}
            />

            {/* Drawer Container with h-dvh */}
            <div className="relative ml-auto w-96 max-w-[85vw] h-dvh bg-white dark:bg-slate-900 z-10 shadow-2xl flex flex-col justify-between border-l border-slate-200 dark:border-slate-800 animate-in slide-in-from-right duration-200">
              {/* Drawer Header */}
              <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <span className="font-black text-sm text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                    <SlidersHorizontal className="w-4 h-4 text-blue-600" /> Filter
                    Catalogue
                  </span>
                  {activeFilterCount > 0 && (
                    <Badge className="bg-blue-600 text-white text-[9px] font-black px-1.5 py-0.2 rounded-full">
                      {activeFilterCount}
                    </Badge>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {activeFilterCount > 0 && (
                    <button
                      type="button"
                      onClick={clearAllFilters}
                      className="text-[11px] font-bold text-red-600 dark:text-red-400 hover:underline mr-1"
                    >
                      Reset
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setDrawerOpen(false)}
                    className="p-1.5 text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Drawer Body */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5 text-xs text-slate-700 dark:text-slate-300 [scrollbar-width:thin]">
                {/* Verified Filter */}
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 rounded-2xl flex items-center justify-between">
                  <label className="flex items-center gap-2.5 cursor-pointer font-bold text-emerald-950 dark:text-emerald-200 w-full">
                    <input
                      type="checkbox"
                      checked={verifiedOnly}
                      onChange={(e) => setVerifiedOnly(e.target.checked)}
                      className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      Verified Dealers Only
                    </span>
                  </label>
                </div>

                {/* Price Range */}
                <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
                  <button
                    onClick={() => toggleSection("price")}
                    className="w-full flex items-center justify-between font-bold text-slate-900 dark:text-slate-100 mb-2.5"
                  >
                    <span>Price Budget (Naira)</span>
                    {openSections.price ? (
                      <ChevronUp className="w-4 h-4 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    )}
                  </button>
                  {openSections.price && (
                    <div className="space-y-1.5 pl-0.5">
                      {PRICE_BUCKETS.map((b, i) => {
                        const isSelected =
                          selectedPriceRange?.min === b.min &&
                          selectedPriceRange?.max === b.max;
                        return (
                          <label
                            key={i}
                            className="flex items-center gap-2.5 cursor-pointer py-1 hover:text-blue-600 dark:hover:text-blue-400 transition"
                          >
                            <input
                              type="radio"
                              name="price_bucket"
                              checked={isSelected}
                              onChange={() =>
                                setSelectedPriceRange(isSelected ? null : b)
                              }
                              onClick={() => {
                                if (isSelected) setSelectedPriceRange(null);
                              }}
                              className="w-3.5 h-3.5 text-blue-600"
                            />
                            <span
                              className={
                                isSelected
                                  ? "font-bold text-blue-600 dark:text-blue-400"
                                  : "text-slate-600 dark:text-slate-400"
                              }
                            >
                              {b.label}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Brands */}
                <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
                  <button
                    onClick={() => toggleSection("brand")}
                    className="w-full flex items-center justify-between font-bold text-slate-900 dark:text-slate-100 mb-2.5"
                  >
                    <span className="capitalize">
                      {selectedCategory !== "all"
                        ? `${selectedCategory} Brands`
                        : "Brands"}
                    </span>
                    {openSections.brand ? (
                      <ChevronUp className="w-4 h-4 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    )}
                  </button>
                  {openSections.brand && (
                    <div className="grid grid-cols-2 gap-2 pl-0.5">
                      {activeBrands.map((brand) => (
                        <label
                          key={brand}
                          className="flex items-center gap-2 cursor-pointer py-0.5 hover:text-blue-600 dark:hover:text-blue-400 transition"
                        >
                          <input
                            type="checkbox"
                            checked={selectedBrands.includes(brand)}
                            onChange={() =>
                              toggleItem(
                                selectedBrands,
                                setSelectedBrands,
                                brand
                              )
                            }
                            className="w-3.5 h-3.5 rounded text-blue-600"
                          />
                          <span
                            className={
                              selectedBrands.includes(brand)
                                ? "font-bold text-blue-600 dark:text-blue-400"
                                : "text-slate-600 dark:text-slate-400"
                            }
                          >
                            {brand}
                          </span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>

                {/* Hub Locations */}
                <div>
                  <button
                    onClick={() => toggleSection("hub")}
                    className="w-full flex items-center justify-between font-bold text-slate-900 dark:text-slate-100 mb-2.5"
                  >
                    <span>Abuja Hub Location</span>
                    {openSections.hub ? (
                      <ChevronUp className="w-4 h-4 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    )}
                  </button>
                  {openSections.hub && (
                    <div className="grid grid-cols-2 gap-1.5 pl-0.5">
                      {ABUJA_HUBS.map((hub) => (
                        <label
                          key={hub}
                          className="flex items-center gap-2 cursor-pointer py-0.5 hover:text-blue-600 dark:hover:text-blue-400 transition"
                        >
                          <input
                            type="checkbox"
                            checked={selectedHubs.includes(hub)}
                            onChange={() =>
                              toggleItem(selectedHubs, setSelectedHubs, hub)
                            }
                            className="w-3.5 h-3.5 rounded text-blue-600"
                          />
                          <span
                            className={
                              selectedHubs.includes(hub)
                                ? "font-bold text-blue-600 dark:text-blue-400"
                                : "text-slate-600 dark:text-slate-400"
                            }
                          >
                            {hub}
                          </span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Drawer Footer */}
              <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 flex items-center gap-2 shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearAllFilters}
                  className="w-1/3 text-xs font-bold rounded-xl h-10 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200"
                >
                  Reset
                </Button>
                <Button
                  size="sm"
                  onClick={() => setDrawerOpen(false)}
                  className="w-2/3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl h-10 shadow-xs cursor-pointer"
                >
                  Show ({filteredProducts.length})
                </Button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}