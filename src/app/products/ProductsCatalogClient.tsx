"use client";

import { useState, useMemo, useDeferredValue, useEffect } from "react";
import { createPortal } from "react-dom";
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
  const [mounted, setMounted] = useState(false);
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

  useEffect(() => {
    setMounted(true);
  }, []);

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

  const filterDrawerPortal = (
    <div className="fixed inset-0 z-[9999] flex">
      {/* Dark Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in"
        onClick={() => setDrawerOpen(false)}
      />

      {/* Slide-out Drawer Panel */}
      <div className="relative ml-auto w-84 max-w-[85vw] h-dvh bg-white dark:bg-slate-900 z-[10000] shadow-2xl flex flex-col justify-between border-l border-slate-200 dark:border-slate-800 animate-in slide-in-from-right duration-200">
        {/* Drawer Header */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <span className="font-black text-sm text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
              <SlidersHorizontal className="w-4 h-4 text-blue-600" /> Filter
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

        {/* Drawer Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs text-slate-700 dark:text-slate-300 [scrollbar-width:thin]">
          {/* Verified Toggle */}
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 rounded-xl flex items-center justify-between">
            <label className="flex items-center gap-2.5 cursor-pointer font-bold text-emerald-950 dark:text-emerald-200 w-full">
              <input
                type="checkbox"
                checked={verifiedOnly}
                onChange={(e) => setVerifiedOnly(e.target.checked)}
                className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
              />
              <span className="flex items-center gap-1.5 text-xs">
                <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                Verified Dealers Only
              </span>
            </label>
          </div>

          {/* Price Range */}
          <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
            <button
              onClick={() => toggleSection("price")}
              className="w-full flex items-center justify-between font-bold text-slate-900 dark:text-slate-100 mb-2"
            >
              <span>Price Budget</span>
              {openSections.price ? (
                <ChevronUp className="w-4 h-4 text-slate-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-slate-400" />
              )}
            </button>
            {openSections.price && (
              <div className="space-y-1">
                {PRICE_BUCKETS.map((b, i) => {
                  const isSelected =
                    selectedPriceRange?.min === b.min &&
                    selectedPriceRange?.max === b.max;
                  return (
                    <label
                      key={i}
                      className="flex items-center gap-2 cursor-pointer py-1 hover:text-blue-600 dark:hover:text-blue-400 transition"
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
          <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
            <button
              onClick={() => toggleSection("brand")}
              className="w-full flex items-center justify-between font-bold text-slate-900 dark:text-slate-100 mb-2"
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
              <div className="grid grid-cols-2 gap-1.5">
                {activeBrands.map((brand) => (
                  <label
                    key={brand}
                    className="flex items-center gap-2 cursor-pointer py-0.5 hover:text-blue-600 dark:hover:text-blue-400 transition"
                  >
                    <input
                      type="checkbox"
                      checked={selectedBrands.includes(brand)}
                      onChange={() =>
                        toggleItem(selectedBrands, setSelectedBrands, brand)
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

          {/* Condition */}
          <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
            <button
              onClick={() => toggleSection("condition")}
              className="w-full flex items-center justify-between font-bold text-slate-900 dark:text-slate-100 mb-2"
            >
              <span>Condition</span>
              {openSections.condition ? (
                <ChevronUp className="w-4 h-4 text-slate-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-slate-400" />
              )}
            </button>
            {openSections.condition && (
              <div className="space-y-1">
                {CONDITIONS.map((c) => (
                  <label
                    key={c.id}
                    className="flex items-center gap-2 cursor-pointer py-1 hover:text-blue-600 dark:hover:text-blue-400 transition"
                  >
                    <input
                      type="checkbox"
                      checked={selectedConditions.includes(c.id)}
                      onChange={() =>
                        toggleItem(selectedConditions, setSelectedConditions, c.id)
                      }
                      className="w-3.5 h-3.5 rounded text-blue-600"
                    />
                    <span
                      className={
                        selectedConditions.includes(c.id)
                          ? "font-bold text-blue-600 dark:text-blue-400"
                          : "text-slate-600 dark:text-slate-400"
                      }
                    >
                      {c.label}
                    </span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Hub Location */}
          <div>
            <button
              onClick={() => toggleSection("hub")}
              className="w-full flex items-center justify-between font-bold text-slate-900 dark:text-slate-100 mb-2"
            >
              <span>Abuja Hub Location</span>
              {openSections.hub ? (
                <ChevronUp className="w-4 h-4 text-slate-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-slate-400" />
              )}
            </button>
            {openSections.hub && (
              <div className="grid grid-cols-2 gap-1">
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
        <div className="p-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 flex items-center gap-2 shrink-0">
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
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      <main className="p-2 sm:p-4 lg:p-6 space-y-3 max-w-[1550px] mx-auto w-full">
        {/* 1. Category Bar Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none -mx-1 px-1">
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
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all ${
                  isSelected
                    ? "bg-blue-600 text-white shadow-xs"
                    : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
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
        <div className="bg-white dark:bg-slate-900 px-3 py-2 sm:p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-slate-100 truncate">
              {filteredProducts.length}{" "}
              {filteredProducts.length === 1 ? "Item" : "Items"}
            </span>
            <span className="text-[11px] sm:text-xs text-slate-400 hidden min-[380px]:inline">
              in Abuja
            </span>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <select
              value={sortBy}
              onChange={(e: any) => setSortBy(e.target.value)}
              aria-label="Sort options"
              className="h-8 sm:h-9 px-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-[11px] sm:text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none"
            >
              <option value="featured">Featured</option>
              <option value="newest">Newest</option>
              <option value="price_low">Price: Low</option>
              <option value="price_high">Price: High</option>
            </select>

            <Button
              size="sm"
              onClick={() => setDrawerOpen(true)}
              className="h-8 sm:h-9 px-2.5 sm:px-3 rounded-xl bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-white text-white dark:text-slate-950 font-bold text-xs gap-1.5 shadow-2xs cursor-pointer border border-transparent dark:border-slate-700"
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
              Active:
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

            <button
              onClick={clearAllFilters}
              className="text-[11px] font-bold text-red-600 dark:text-red-400 hover:underline ml-1"
            >
              Reset All
            </button>
          </div>
        )}

        {/* 4. Product Cards Grid: Enforced 2 Columns on Mobile */}
        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-2 sm:gap-3.5">
            {filteredProducts.map((item) => {
              const isFeatured =
                item.is_featured &&
                item.featured_until &&
                new Date(item.featured_until) > new Date();

              return (
                <div
                  key={item.id}
                  className="relative group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden hover:shadow-md transition flex flex-col justify-between"
                >
                  {/* Floating Badges & Save Action */}
                  <div className="absolute top-1.5 inset-x-1.5 flex items-start justify-between z-10 pointer-events-none">
                    <div className="flex flex-col gap-1 items-start max-w-[70%]">
                      {isFeatured && (
                        <span className="bg-blue-600 text-white text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded shadow-xs flex items-center gap-0.5">
                          <Sparkles className="w-2 h-2" /> Featured
                        </span>
                      )}
                      <span className="bg-slate-950/80 text-white text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded backdrop-blur-xs truncate max-w-full">
                        {item.condition?.replace("_", " ") || "Refurbished"}
                      </span>
                    </div>

                    <div className="pointer-events-auto shrink-0">
                      <SaveButton product={item} />
                    </div>
                  </div>

                  {/* Card Content Link */}
                  <Link href={`/products/${item.id}`} className="flex-1 flex flex-col">
                    {/* Consistent Aspect-Square Image Box */}
                    <div className="aspect-square bg-slate-100/70 dark:bg-slate-800/40 p-2.5 sm:p-4 flex items-center justify-center relative overflow-hidden border-b border-slate-100 dark:border-slate-800/80">
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
                        <Package className="w-7 h-7 text-slate-400" />
                      )}
                    </div>

                    {/* Compact Mobile Metadata */}
                    <div className="p-2 sm:p-3 flex-1 flex flex-col justify-between space-y-1.5">
                      <div>
                        <div className="flex items-center justify-between text-[9px] sm:text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                          <span className="truncate max-w-[65px] sm:max-w-[85px]">
                            {item.brand || "Device"}
                          </span>
                          {item.profiles?.district && (
                            <span className="flex items-center gap-0.5 normal-case font-medium text-slate-500 truncate max-w-[65px]">
                              <MapPin className="w-2.5 h-2.5 shrink-0" />
                              {item.profiles.district.split(" ")[0]}
                            </span>
                          )}
                        </div>

                        <h3 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-1 mt-0.5 leading-snug">
                          {item.title}
                        </h3>
                      </div>

                      <div className="pt-1.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                        <p className="text-xs sm:text-sm font-black text-slate-900 dark:text-slate-100">
                          ₦{Number(item.price).toLocaleString()}
                        </p>
                        <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 flex items-center gap-0.5">
                          Inspect <ArrowRight className="w-2.5 h-2.5" />
                        </span>
                      </div>
                    </div>
                  </Link>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-2">
            <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
              No devices found matching active filters
            </p>
            <Button
              size="sm"
              onClick={clearAllFilters}
              variant="outline"
              className="text-xs font-bold rounded-xl mt-1 border-slate-200 dark:border-slate-700"
            >
              Clear Filters
            </Button>
          </div>
        )}

        {/* 5. Portal Filter Drawer */}
        {drawerOpen && mounted ? createPortal(filterDrawerPortal, document.body) : null}
      </main>
    </div>
  );
}